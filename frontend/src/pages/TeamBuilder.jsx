import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit3, Check, X, Search, Loader2, Shield, ShieldAlert, Users, ChevronRight, ChevronDown, Swords, Folder, FolderOpen } from 'lucide-react';
import { TYPE_ES, EFICACIA_DEFENSIVA } from '../constants/typeData';
import { formatPokemonName, getAllPokemonNames } from '../services/pokeApi';
import api, { useAuth } from '../services/AuthContext';

const STORAGE_KEY = 'nuztracker_teams';

// ── Stat names in Spanish ──
const STAT_NAMES = {
  'hp': 'PS',
  'attack': 'Ataque',
  'defense': 'Defensa',
  'special-attack': 'At. Esp.',
  'special-defense': 'Def. Esp.',
  'speed': 'Velocidad'
};

const STAT_COLORS = {
  'hp': '#ff5555',
  'attack': '#f08030',
  'defense': '#f8d030',
  'special-attack': '#6890f0',
  'special-defense': '#78c850',
  'speed': '#f85888'
};

// ── localStorage helpers ──
function loadTeams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveTeams(teams) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Team type effectiveness calculator ──
function calcTeamTypeChart(pokemonList) {
  const allTypes = Object.keys(EFICACIA_DEFENSIVA);
  const scores = {};
  allTypes.forEach(t => { scores[t] = 0; });

  pokemonList.forEach(poke => {
    if (!poke || !poke.types) return;
    // Calculate this Pokémon's defensive multipliers
    const multipliers = {};
    allTypes.forEach(atkType => { multipliers[atkType] = 1; });

    poke.types.forEach(defType => {
      const data = EFICACIA_DEFENSIVA[defType];
      if (!data) return;
      data.weakness.forEach(t => { multipliers[t] *= 2; });
      data.resistance.forEach(t => { multipliers[t] *= 0.5; });
      data.immune.forEach(t => { multipliers[t] = 0; });
    });

    // Convert multipliers to score contribution per Pokémon:
    //   immune (0x)          → +1  (un pokémon que puede entrar libre)
    //   doble resistencia (¼) → +1  (resiste bien)
    //   resistencia (½)      → +1  (resiste)
    //   neutral (1x)         → 0
    //   debilidad (2x)       → -1  (vulnerable)
    //   doble debilidad (4x) → -2  (críticamente vulnerable)
    allTypes.forEach(atkType => {
      const m = multipliers[atkType];
      if (m === 0) scores[atkType] += 1;
      else if (m < 1) scores[atkType] += 1;
      else if (m >= 4) scores[atkType] -= 2;
      else if (m >= 2) scores[atkType] -= 1;
    });
  });

  const resistant = [];
  const weak = [];

  allTypes.forEach(type => {
    if (scores[type] > 0) resistant.push({ type, value: scores[type] });
    else if (scores[type] < 0) weak.push({ type, value: scores[type] });
  });

  resistant.sort((a, b) => b.value - a.value);
  weak.sort((a, b) => a.value - b.value);

  return { resistant, weak };
}

// ── Average stats calculator ──
function calcAverageStats(pokemonList) {
  const validPokemon = pokemonList.filter(p => p && p.stats);
  if (validPokemon.length === 0) return null;

  const totals = {};
  const statKeys = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

  statKeys.forEach(key => { totals[key] = 0; });

  validPokemon.forEach(poke => {
    poke.stats.forEach(s => {
      if (totals[s.name] !== undefined) totals[s.name] += s.value;
    });
  });

  const averages = statKeys.map(key => ({
    name: key,
    value: Math.round(totals[key] / validPokemon.length)
  }));

  const total = averages.reduce((sum, s) => sum + s.value, 0);

  return { averages, total };
}


// ══════════════════════════════════════════════════
// ── Pokémon Search Modal ──
// ══════════════════════════════════════════════════
function PokemonSearchModal({ onSelect, onClose, existingIds }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debounced, setDebounced] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Module-level cache for the full Pokémon list
  const pokemonListCache = useRef(null);

  useEffect(() => {
    if (!debounced.trim()) { setResults([]); return; }
    let active = true;

    const search = async () => {
      setLoading(true);
      try {
        const q = debounced.toLowerCase().trim();

        // Cache the full list so we only fetch it once
        if (!pokemonListCache.current) {
          pokemonListCache.current = await getAllPokemonNames();
        }
        const allNames = pokemonListCache.current;

        const qNorm = q.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
        const qNoSpecial = q.replace(/[^a-z0-9]/g, '');

        let matches = allNames.filter(p => {
          const id = p.id;
          const n = p.name.toLowerCase();
          const formattedN = formatPokemonName(p.name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          if (n.includes(qNorm)) return true;
          if (n.replace(/[^a-z0-9]/g, '').includes(qNoSpecial)) return true;
          if (formattedN.includes(qNorm)) return true;
          if (id.toString() === q) return true;
          return false;
        }).slice(0, 12);

        // Fetch details for those matches
        const details = await Promise.all(
          matches.map(async (m) => {
            try {
              const det = await axios.get(`https://pokeapi.co/api/v2/pokemon/${m.id}`);
              return {
                id: det.data.id,
                name: det.data.name,
                types: det.data.types.map(t => t.type.name),
                stats: det.data.stats.map(s => ({ name: s.stat.name, value: s.base_stat })),
                image: det.data.sprites.other['official-artwork'].front_default || det.data.sprites.front_default,
                sprite: det.data.sprites.front_default
              };
            } catch { return null; }
          })
        );

        if (active) setResults(details.filter(Boolean));
      } catch (err) {
        console.error('Search error:', err);
      }
      if (active) setLoading(false);
    };

    search();
    return () => { active = false; };
  }, [debounced]);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 200 }}>
      <div
        className="glass team-search-modal"
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', marginBottom: '1.25rem' }}>
          <Search size={22} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Buscar Pokémon
        </h2>

        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            className="input"
            style={{ paddingLeft: '3rem' }}
            placeholder="Nombre o número (ej: Pikachu, 25...)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          )}
        </div>

        <div className="team-search-results">
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 className="loader" size={36} />
            </div>
          )}

          {!loading && debounced && results.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              No se encontraron Pokémon con esa búsqueda.
            </p>
          )}

          {!loading && results.map(poke => {
            const alreadyInTeam = existingIds.includes(poke.id);
            return (
              <div
                key={poke.id}
                className={`team-search-result-item ${alreadyInTeam ? 'disabled' : ''}`}
                onClick={() => { if (!alreadyInTeam) { onSelect(poke); onClose(); } }}
              >
                <img
                  src={poke.sprite || poke.image}
                  alt={poke.name}
                  style={{ width: '48px', height: '48px', objectFit: 'contain', imageRendering: 'pixelated' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, textTransform: 'capitalize', fontSize: '0.95rem' }}>
                    {formatPokemonName(poke.name)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                    {poke.types.map(t => (
                      <span key={t} className="type-badge" style={{ background: `var(--type-${t})`, color: '#000', fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                        {TYPE_ES[t] || t}
                      </span>
                    ))}
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>
                  #{String(poke.id).padStart(3, '0')}
                </span>
                {alreadyInTeam && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Ya en equipo</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════
// ── Main TeamBuilder Component ──
// ══════════════════════════════════════════════════
export default function TeamBuilder() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [searchSlot, setSearchSlot] = useState(null); // slot index to fill
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [localItems, setLocalItems] = useState({});
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [itemSearchSlot, setItemSearchSlot] = useState(null);
  const nameInputRef = useRef(null);

  // Load teams on mount/auth change
  useEffect(() => {
    const fetchTeams = async () => {
      if (!user) {
        setTeams(loadTeams());
        return;
      }

      setLoadingTeams(true);
      try {
        const localTeams = loadTeams();
        if (localTeams.length > 0) {
          // Sync localStorage teams to server if the server has no teams
          const response = await api.post('/api/teams/sync', { teams: localTeams });
          setTeams(response.data.teams);
          localStorage.removeItem(STORAGE_KEY);
        } else {
          const response = await api.get('/api/teams');
          setTeams(response.data);
        }
      } catch (err) {
        console.error('Error fetching/syncing teams:', err);
        setTeams(loadTeams());
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, [user]);

  // Auto-select the first team
  useEffect(() => {
    if (!selectedTeamId && teams.length > 0) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  const selectedTeam = teams.find(t => t.id === selectedTeamId) || null;

  // Sync localItems state when team changes
  useEffect(() => {
    if (selectedTeam) {
      const items = {};
      selectedTeam.pokemon.forEach((p, idx) => {
        if (p) items[idx] = p.item || '';
      });
      setLocalItems(items);
    }
  }, [selectedTeamId, selectedTeam]);

  // ── Team CRUD ──
  const createTeam = async () => {
    const tempName = `Equipo ${teams.length + 1}`;
    const defaultPokemon = [null, null, null, null, null, null];

    if (user) {
      try {
        const response = await api.post('/api/teams', {
          name: tempName,
          pokemon: defaultPokemon,
          folder: null
        });
        const newTeam = response.data;
        setTeams(prev => [...prev, newTeam]);
        setSelectedTeamId(newTeam.id);
      } catch (err) {
        console.error('Error creating team:', err);
      }
    } else {
      const newTeam = {
        id: generateId(),
        name: tempName,
        pokemon: defaultPokemon,
        folder: null
      };
      setTeams(prev => {
        const updated = [...prev, newTeam];
        saveTeams(updated);
        return updated;
      });
      setSelectedTeamId(newTeam.id);
    }
  };

  const deleteTeam = async (teamId) => {
    if (user) {
      try {
        await api.delete(`/api/teams/${teamId}`);
        setTeams(prev => prev.filter(t => t.id !== teamId));
        if (selectedTeamId === teamId) {
          setSelectedTeamId(teams.find(t => t.id !== teamId)?.id || null);
        }
      } catch (err) {
        console.error('Error deleting team:', err);
      }
    } else {
      setTeams(prev => {
        const updated = prev.filter(t => t.id !== teamId);
        saveTeams(updated);
        if (selectedTeamId === teamId) {
          setSelectedTeamId(updated.find(t => t.id !== teamId)?.id || null);
        }
        return updated;
      });
    }
    setConfirmDelete(null);
  };

  const renameTeam = async () => {
    if (!nameInput.trim()) return;
    const newName = nameInput.trim();

    if (user) {
      try {
        // Optimistic update
        setTeams(prev => prev.map(t => t.id === selectedTeamId ? { ...t, name: newName } : t));
        setEditingName(false);
        await api.put(`/api/teams/${selectedTeamId}`, { name: newName });
      } catch (err) {
        console.error('Error renaming team:', err);
      }
    } else {
      setTeams(prev => {
        const updated = prev.map(t => t.id === selectedTeamId ? { ...t, name: newName } : t);
        saveTeams(updated);
        return updated;
      });
      setEditingName(false);
    }
  };

  const startEditing = () => {
    setNameInput(selectedTeam?.name || '');
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const changeTeamFolder = async (folderName) => {
    if (!selectedTeamId) return;

    if (user) {
      try {
        setTeams(prev => prev.map(t => t.id === selectedTeamId ? { ...t, folder: folderName } : t));
        await api.put(`/api/teams/${selectedTeamId}`, { folder: folderName });
      } catch (err) {
        console.error('Error changing team folder:', err);
      }
    } else {
      setTeams(prev => {
        const updated = prev.map(t => t.id === selectedTeamId ? { ...t, folder: folderName } : t);
        saveTeams(updated);
        return updated;
      });
    }
  };

  const handleFolderChange = (e) => {
    const val = e.target.value;
    if (val === '__new__') {
      const name = prompt('Nombre de la nueva carpeta:');
      if (name && name.trim()) {
        changeTeamFolder(name.trim());
      }
    } else {
      changeTeamFolder(val || null);
    }
  };

  // ── Pokémon slot management ──
  const addPokemon = async (slotIndex, pokemon) => {
    const targetTeam = teams.find(t => t.id === selectedTeamId);
    if (!targetTeam) return;

    const newPokemon = [...targetTeam.pokemon];
    // Preserve item if it already existed in slot (optional, usually null for new)
    newPokemon[slotIndex] = { ...pokemon, item: '' };

    if (user) {
      try {
        // Optimistic update
        setTeams(prev => prev.map(t => {
          if (t.id !== selectedTeamId) return t;
          return { ...t, pokemon: newPokemon };
        }));
        await api.put(`/api/teams/${selectedTeamId}`, { pokemon: newPokemon });
      } catch (err) {
        console.error('Error adding pokemon:', err);
      }
    } else {
      setTeams(prev => {
        const updated = prev.map(t => {
          if (t.id !== selectedTeamId) return t;
          return { ...t, pokemon: newPokemon };
        });
        saveTeams(updated);
        return updated;
      });
    }
  };

  const removePokemon = async (slotIndex) => {
    const targetTeam = teams.find(t => t.id === selectedTeamId);
    if (!targetTeam) return;

    const newPokemon = [...targetTeam.pokemon];
    newPokemon[slotIndex] = null;

    if (user) {
      try {
        // Optimistic update
        setTeams(prev => prev.map(t => {
          if (t.id !== selectedTeamId) return t;
          return { ...t, pokemon: newPokemon };
        }));
        await api.put(`/api/teams/${selectedTeamId}`, { pokemon: newPokemon });
      } catch (err) {
        console.error('Error removing pokemon:', err);
      }
    } else {
      setTeams(prev => {
        const updated = prev.map(t => {
          if (t.id !== selectedTeamId) return t;
          return { ...t, pokemon: newPokemon };
        });
        saveTeams(updated);
        return updated;
      });
    }
  };

  const savePokemonItem = async (slotIndex, itemVal) => {
    const targetTeam = teams.find(t => t.id === selectedTeamId);
    if (!targetTeam) return;

    const currentItem = targetTeam.pokemon[slotIndex]?.item || null;
    
    // Comparación segura
    const currentName = currentItem ? (typeof currentItem === 'object' ? currentItem.name : currentItem) : '';
    const newName = itemVal ? (typeof itemVal === 'object' ? itemVal.name : itemVal) : '';
    
    if (currentName === newName) return;

    const newPokemon = [...targetTeam.pokemon];
    if (newPokemon[slotIndex]) {
      newPokemon[slotIndex] = {
        ...newPokemon[slotIndex],
        item: itemVal
      };
    }

    if (user) {
      try {
        setTeams(prev => prev.map(t => t.id === selectedTeamId ? { ...t, pokemon: newPokemon } : t));
        await api.put(`/api/teams/${selectedTeamId}`, { pokemon: newPokemon });
      } catch (err) {
        console.error('Error saving pokemon item:', err);
      }
    } else {
      setTeams(prev => {
        const updated = prev.map(t => t.id === selectedTeamId ? { ...t, pokemon: newPokemon } : t);
        saveTeams(updated);
        return updated;
      });
    }
  };

  // Derived data
  const folders = [...new Set(teams.map(t => t.folder).filter(Boolean))];
  const uncategorizedTeams = teams.filter(t => !t.folder);
  const teamPokemon = selectedTeam?.pokemon || [null, null, null, null, null, null];
  const validPokemon = teamPokemon.filter(Boolean);
  const existingIds = validPokemon.map(p => p.id);
  const avgStats = calcAverageStats(validPokemon);
  const typeChart = calcTeamTypeChart(validPokemon);

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '6rem' }}>
      {/* ── Page Header ── */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="title-glow" style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>
          <span className="gradient-text">Creador</span> de Equipos
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto' }}>
          Monta tus equipos, analiza sus estadísticas y comprueba sus resistencias y debilidades.
        </p>
      </div>

      <div className="team-builder-layout">
        {/* ════════════════════════════════════════ */}
        {/* ── Sidebar: Team List ── */}
        {/* ════════════════════════════════════════ */}
        <div className="team-list-sidebar glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} /> Mis Equipos
            </h3>
            <button className="btn btn-primary" onClick={createTeam} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <Plus size={16} /> Nuevo
            </button>
          </div>

          {loadingTeams ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 className="loader" size={36} />
            </div>
          ) : teams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.9rem' }}>Aún no tienes equipos.<br />¡Crea tu primer equipo!</p>
            </div>
          ) : (
            <div className="team-list-items" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Renderizar carpetas y sus equipos */}
              {folders.map(folder => {
                const folderTeams = teams.filter(t => t.folder === folder);
                const isCollapsed = collapsedFolders[folder];
                return (
                  <div key={folder} className="team-folder-group" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                      className="team-folder-header"
                      onClick={() => setCollapsedFolders(prev => ({ ...prev, [folder]: !prev[folder] }))}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', cursor: 'pointer', fontWeight: 'bold', color: 'var(--accent)', borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}
                    >
                      {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      {isCollapsed ? <Folder size={16} /> : <FolderOpen size={16} />}
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder}</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>({folderTeams.length})</span>
                    </div>

                    {!isCollapsed && (
                      <div className="team-folder-teams" style={{ paddingLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
                        {folderTeams.map(team => (
                          <div
                            key={team.id}
                            className={`team-list-item ${selectedTeamId === team.id ? 'active' : ''}`}
                            onClick={() => setSelectedTeamId(team.id)}
                            style={{ padding: '0.5rem' }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {team.name}
                              </div>
                              <div style={{ display: 'flex', gap: '0.15rem' }}>
                                {team.pokemon.map((p, idx) => (
                                  <div key={idx} style={{ width: '20px', height: '20px', borderRadius: '50%', background: p ? 'transparent' : 'rgba(255,255,255,0.06)', border: p ? 'none' : '1px dashed rgba(255,255,255,0.15)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {p && <img src={p.sprite || p.image} alt="" style={{ width: '20px', height: '20px', imageRendering: 'pixelated' }} />}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={e => { e.stopPropagation(); setConfirmDelete(team.id); }}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem', borderRadius: '6px', transition: 'all 0.2s' }}
                              className="team-delete-btn"
                              title="Eliminar equipo"
                            >
                              <Trash2 size={14} />
                            </button>

                            {confirmDelete === team.id && (
                              <div className="team-confirm-delete" onClick={e => e.stopPropagation()}>
                                <span style={{ fontSize: '0.75rem' }}>¿Eliminar?</span>
                                <button onClick={(e) => { e.stopPropagation(); deleteTeam(team.id); }} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>Sí</button>
                                <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }} style={{ background: 'var(--glass-border)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>No</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Equipos sin carpeta */}
              {uncategorizedTeams.length > 0 && (
                <div className="team-folder-group" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    className="team-folder-header"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', fontWeight: 'bold', opacity: 0.8, fontSize: '0.9rem' }}
                  >
                    <Folder size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>Sin carpeta</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>({uncategorizedTeams.length})</span>
                  </div>
                  <div className="team-folder-teams" style={{ paddingLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
                    {uncategorizedTeams.map(team => (
                      <div
                        key={team.id}
                        className={`team-list-item ${selectedTeamId === team.id ? 'active' : ''}`}
                        onClick={() => setSelectedTeamId(team.id)}
                        style={{ padding: '0.5rem' }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {team.name}
                          </div>
                          <div style={{ display: 'flex', gap: '0.15rem' }}>
                            {team.pokemon.map((p, idx) => (
                              <div key={idx} style={{ width: '20px', height: '20px', borderRadius: '50%', background: p ? 'transparent' : 'rgba(255,255,255,0.06)', border: p ? 'none' : '1px dashed rgba(255,255,255,0.15)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {p && <img src={p.sprite || p.image} alt="" style={{ width: '20px', height: '20px', imageRendering: 'pixelated' }} />}
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={e => { e.stopPropagation(); setConfirmDelete(team.id); }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem', borderRadius: '6px', transition: 'all 0.2s' }}
                          className="team-delete-btn"
                          title="Eliminar equipo"
                        >
                          <Trash2 size={14} />
                        </button>

                        {confirmDelete === team.id && (
                          <div className="team-confirm-delete" onClick={e => e.stopPropagation()}>
                            <span style={{ fontSize: '0.75rem' }}>¿Eliminar?</span>
                            <button onClick={(e) => { e.stopPropagation(); deleteTeam(team.id); }} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>Sí</button>
                            <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }} style={{ background: 'var(--glass-border)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>No</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════ */}
        {/* ── Main Panel ── */}
        {/* ════════════════════════════════════════ */}
        <div className="team-main-panel">
          {loadingTeams ? (
            <div className="glass" style={{ padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <Loader2 className="loader" size={48} />
              <p style={{ color: 'var(--text-muted)' }}>Cargando tus equipos...</p>
            </div>
          ) : !selectedTeam ? (
            <div className="glass" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
              <Users size={60} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
              <h2 style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Selecciona o crea un equipo</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Pulsa "Nuevo" para empezar a construir tu equipo.</p>
            </div>
          ) : (
            <>
              {/* ── Team Name ── */}
              <div className="glass team-header-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '0.75rem' }}>
                  {editingName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <input
                        ref={nameInputRef}
                        type="text"
                        className="input"
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && renameTeam()}
                        style={{ fontSize: '1.4rem', fontFamily: "'Outfit', sans-serif", fontWeight: 800, padding: '0.5rem 1rem', flex: 1 }}
                        maxLength={40}
                      />
                      <button onClick={renameTeam} style={{ background: 'rgba(34,197,94,0.15)', border: 'none', color: '#22c55e', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
                        <Check size={22} />
                      </button>
                      <button onClick={() => setEditingName(false)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
                        <X size={22} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <h2 style={{ fontSize: '1.6rem', flex: 1 }}>{selectedTeam.name}</h2>
                      <button onClick={startEditing} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', transition: 'all 0.2s' }} className="team-edit-name-btn">
                        <Edit3 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem' }}>
                  {/* Selector de Carpeta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Carpeta:</span>
                    <select
                      value={selectedTeam.folder || ''}
                      onChange={handleFolderChange}
                      className="input"
                      style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem', height: '32px', width: '160px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)' }}
                    >
                      <option value="">Sin carpeta</option>
                      {folders.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                      <option value="__new__" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Nueva carpeta...</option>
                    </select>
                  </div>

                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    {validPokemon.length}/6 Pokémon
                  </span>
                </div>
              </div>

              {/* ── 6 Pokémon Slots ── */}
              <div className="team-slots-grid">
                {teamPokemon.map((poke, i) => {
                  const activeItem = poke && poke.item ? (
                    typeof poke.item === 'object'
                      ? poke.item
                      : {
                          name: poke.item,
                          displayName: COMMON_ITEMS.find(ci => ci.name === poke.item)?.es || poke.item.replace(/-/g, ' '),
                          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${poke.item}.png`
                        }
                  ) : null;
                  return (
                    <div
                      key={i}
                      className={`team-slot glass ${poke ? 'filled' : 'empty'}`}
                      onClick={() => { if (!poke) setSearchSlot(i); }}
                      style={poke ? { background: `linear-gradient(135deg, var(--type-${poke.types[0]}) 0%, var(--bg-dark) 120%)` } : {}}
                    >
                      {poke ? (
                        <>
                          <button
                            className="team-slot-remove"
                            onClick={e => { e.stopPropagation(); removePokemon(i); }}
                            title="Quitar del equipo"
                          >
                            <X size={14} />
                          </button>
                          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <img src={poke.image} alt={poke.name} className="team-slot-img" />
                            {activeItem && activeItem.sprite && (
                              <div
                                title={activeItem.displayName}
                                className="team-slot-item-floating"
                              >
                                <img src={activeItem.sprite} alt="" />
                              </div>
                            )}
                          </div>
                          <div className="team-slot-info">
                            <span className="team-slot-name">{formatPokemonName(poke.name)}</span>
                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '0.75rem' }}>
                              {poke.types.map(t => (
                                <span key={t} className="type-badge" style={{ background: `var(--type-${t})`, color: '#000', fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                                  {TYPE_ES[t] || t}
                                </span>
                              ))}
                            </div>

                            {/* Seccion de objeto */}
                            <div className="pokemon-item-container" onClick={e => e.stopPropagation()}>
                              {activeItem && activeItem.name ? (
                                <div className="equipped-item-badge" onClick={() => setItemSearchSlot(i)}>
                                  <img src={activeItem.sprite} alt="" className="equipped-item-sprite" />
                                  <span className="equipped-item-name">{activeItem.displayName}</span>
                                  <button
                                    onClick={e => { e.stopPropagation(); savePokemonItem(i, null); }}
                                    className="equipped-item-remove-btn"
                                    title="Quitar objeto"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setItemSearchSlot(i)}
                                  className="empty-item-badge"
                                >
                                  <Plus size={12} />
                                  <span>Objeto</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="team-slot-empty-content">
                          <div className="team-slot-plus">
                            <Plus size={28} />
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Añadir</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Average Stats ── */}
              {avgStats && (
                <div className="glass team-stats-card">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '1.2rem' }}>
                    <Swords size={20} color="var(--accent)" />
                    Estadísticas Medias del Equipo
                  </h3>

                  <div className="stats-container" style={{ marginTop: 0 }}>
                    {avgStats.averages.map(stat => (
                      <div className="stat-row" key={stat.name}>
                        <span className="stat-name" style={{ width: '90px' }}>{STAT_NAMES[stat.name]}</span>
                        <span className="stat-value">{stat.value}</span>
                        <div className="stat-bar-bg">
                          <div
                            className="stat-bar"
                            style={{
                              width: `${Math.min(100, (stat.value / 255) * 100)}%`,
                              background: STAT_COLORS[stat.name]
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '1rem', textAlign: 'center', fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                    TOTAL <span style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginLeft: '0.5rem' }}>{avgStats.total}</span>
                  </div>
                </div>
              )}

              {/* ── Type Resistances & Weaknesses ── */}
              {validPokemon.length > 0 && (
                <div className="glass team-type-chart-card">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
                    <Shield size={20} color="var(--accent)" />
                    Relación de Tipos
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Basado en los tipos de los Pokémon de tu equipo, este es:
                  </p>

                  {/* Resistant */}
                  <h4 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.1rem', fontFamily: "'Outfit', sans-serif" }}>
                    Resistente contra...
                  </h4>
                  {typeChart.resistant.length > 0 ? (
                    <div className="team-type-badges-grid">
                      {typeChart.resistant.map(({ type, value }) => (
                        <div
                          key={type}
                          className="team-type-badge"
                          style={{ background: `var(--type-${type})` }}
                        >
                          <span className="team-type-badge-name">{TYPE_ES[type]}</span>
                          <span className="team-type-badge-value">+{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Sin resistencias destacadas</p>
                  )}
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.5rem', marginBottom: '2rem' }}>
                    Un valor mayor positivo indica una gran resistencia general del equipo
                  </p>

                  {/* Weak */}
                  <h4 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.1rem', fontFamily: "'Outfit', sans-serif" }}>
                    Débil contra...
                  </h4>
                  {typeChart.weak.length > 0 ? (
                    <div className="team-type-badges-grid">
                      {typeChart.weak.map(({ type, value }) => (
                        <div
                          key={type}
                          className="team-type-badge weak"
                          style={{ background: `var(--type-${type})` }}
                        >
                          <span className="team-type-badge-name">{TYPE_ES[type]}</span>
                          <span className="team-type-badge-value">{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin debilidades destacadas</p>
                  )}
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.5rem' }}>
                    Un valor menor negativo indica una gran debilidad general del equipo
                  </p>
                </div>
              )}

              {/* Empty state for stats */}
              {validPokemon.length === 0 && (
                <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
                  <Shield size={48} style={{ color: 'var(--text-muted)', opacity: 0.25, marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    Añade Pokémon a tu equipo para ver estadísticas y análisis de tipos.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Search Modal ── */}
      {searchSlot !== null && (
        <PokemonSearchModal
          existingIds={existingIds}
          onSelect={(poke) => addPokemon(searchSlot, poke)}
          onClose={() => setSearchSlot(null)}
        />
      )}

      {/* ── Item Search Modal ── */}
      {itemSearchSlot !== null && (
        <ItemSearchModal
          onSelect={(item) => savePokemonItem(itemSearchSlot, item)}
          onClose={() => setItemSearchSlot(null)}
        />
      )}

      {/* ── Folder Creation Modal ── */}
      <FolderModal
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onCreate={(folderName) => changeTeamFolder(folderName)}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════
// ── Folder Creation Modal Component ──
// ══════════════════════════════════════════════════
function FolderModal({ isOpen, onClose, onCreate }) {
  const [folderName, setFolderName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 300 }}>
      <div className="glass" onClick={e => e.stopPropagation()} style={{ padding: '2rem', width: '320px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
        <button className="modal-close" onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={18} />
        </button>
        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', color: 'var(--accent)', margin: 0 }}>Nueva Carpeta</h3>
        <input
          ref={inputRef}
          type="text"
          className="input"
          placeholder="Nombre de la carpeta..."
          value={folderName}
          onChange={e => setFolderName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && folderName.trim() && (onCreate(folderName.trim()), onClose())}
        />
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            className="btn btn-outline"
            onClick={onClose}
            style={{ flex: 1, padding: '0.5rem' }}
          >
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { if (folderName.trim()) { onCreate(folderName.trim()); onClose(); } }}
            disabled={!folderName.trim()}
            style={{ flex: 1, padding: '0.5rem' }}
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Common Nuzlocke held items list with Spanish/English names for translation ──
const COMMON_ITEMS = [
  // Objetos competitivos comunes
  { name: 'leftovers', es: 'Restos', desc: 'Recupera 1/16 de los PS máximos al final de cada turno.' },
  { name: 'life-orb', es: 'Vidaesfera', desc: 'Potencia los movimientos un 30% a costa de perder un 10% de PS máximos.' },
  { name: 'choice-band', es: 'Cinta Elección', desc: 'Aumenta el Ataque un 50% pero solo permite usar un movimiento.' },
  { name: 'choice-specs', es: 'Gafas Elección', desc: 'Aumenta el Ataque Especial un 50% pero solo permite usar un movimiento.' },
  { name: 'choice-scarf', es: 'Pañuelo Elección', desc: 'Aumenta la Velocidad un 50% pero solo permite usar un movimiento.' },
  { name: 'eviolite', es: 'Mineral Evolutivo', desc: 'Aumenta un 50% la Defensa y Def. Especial de un Pokémon que pueda evolucionar.' },
  { name: 'rocky-helmet', es: 'Casco Dentado', desc: 'Resta 1/6 de los PS máximos al rival que le golpee con un ataque de contacto.' },
  { name: 'focus-sash', es: 'Banda Focus', desc: 'Evita el debilitamiento fulminante dejando 1 PS si el portador tiene el 100% de PS.' },
  { name: 'black-sludge', es: 'Lodo Negro', desc: 'Restaura 1/16 de PS al tipo Veneno. Daña a otros tipos.' },
  { name: 'expert-belt', es: 'Cinturón Experto', desc: 'Potencia los movimientos súper efectivos un 20%.' },
  { name: 'assault-vest', es: 'Chaleco Asalto', desc: 'Aumenta la Defensa Especial un 50% pero impide usar movimientos de estado.' },
  { name: 'light-clay', es: 'Refleluz', desc: 'Prolonga la duración de Reflejo y Pantalla de Luz a 8 turnos.' },
  { name: 'heavy-duty-boots', es: 'Botas de Suela', desc: 'Evita los daños y efectos de las trampa de entrada (Trampa Rocas, Red Viscosa, etc.).' },
  { name: 'air-balloon', es: 'Globo Helio', desc: 'Otorga inmunidad a movimientos de tipo Tierra. Estalla al recibir un golpe.' },
  { name: 'weakness-policy', es: 'Seguro Debilidad', desc: 'Aumenta mucho el Ataque y At. Especial al recibir un golpe súper efectivo.' },
  { name: 'shell-bell', es: 'Campana Concha', desc: 'El portador recupera un 1/8 del daño infligido al oponente.' },
  { name: 'quick-claw', es: 'Garra Rápida', desc: 'Otorga un 20% de probabilidad de atacar en primer lugar dentro de la prioridad.' },
  { name: 'bright-powder', es: 'Polvo Brillo', desc: 'Reduce un 10% la precisión de los movimientos del rival.' },
  { name: 'scope-lens', es: 'Periscopio', desc: 'Aumenta la probabilidad de asestar golpes críticos en un nivel.' },
  { name: 'wide-lens', es: 'Lupa', desc: 'Aumenta un 10% la precisión de los movimientos del portador.' },
  { name: 'zoom-lens', es: 'Telescopio', desc: 'Aumenta la precisión un 20% si el portador ataca después del objetivo.' },
  { name: 'muscle-band', es: 'Cinta Forte', desc: 'Aumenta la potencia de los movimientos físicos un 10%.' },
  { name: 'wise-glasses', es: 'Gafas Especiales', desc: 'Aumenta la potencia de los movimientos especiales un 10%.' },
  { name: 'flame-orb', es: 'Llamasfera', desc: 'Induce quemadura al portador al final del turno.' },
  { name: 'toxic-orb', es: 'Toxisfera', desc: 'Induce envenenamiento grave al portador al final del turno.' },
  { name: 'focus-band', es: 'Cinta Focus', desc: 'Tiene un 10% de probabilidad de evitar el debilitamiento dejando al portador con 1 PS.' },
  { name: 'soothe-bell', es: 'Campana Alivio', desc: 'El portador gana más amistad de lo habitual.' },
  { name: 'amulet-coin', es: 'Moneda Amuleto', desc: 'Duplica las ganancias de dinero en los combates.' },
  { name: 'lucky-egg', es: 'Huevo Suerte', desc: 'Aumenta la experiencia ganada en combate un 50%.' },
  { name: 'exp-share', es: 'Repartir Exp.', desc: 'Comparte parte de la experiencia ganada con el portador.' },

  // Bayas
  { name: 'oran-berry', es: 'Baya Aranja', desc: 'Restaura 10 PS si los PS bajan del 50%.' },
  { name: 'sitrus-berry', es: 'Baya Cidra', desc: 'Restaura un 25% de los PS máximos si los PS bajan del 50%.' },
  { name: 'lum-berry', es: 'Baya Ziula', desc: 'Cura cualquier estado alterado o la confusión en combate.' },
  { name: 'pecha-berry', es: 'Baya Meloc', desc: 'Cura el envenenamiento en combate.' },
  { name: 'cheri-berry', es: 'Baya Zreza', desc: 'Cura la parálisis en combate.' },
  { name: 'chesto-berry', es: 'Baya Atania', desc: 'Despierta al portador del sueño en combate.' },
  { name: 'rawst-berry', es: 'Baya Aspe', desc: 'Cura las quemaduras en combate.' },
  { name: 'aspear-berry', es: 'Baya Perasi', desc: 'Cura la congelación en combate.' },
  { name: 'leppa-berry', es: 'Baya Zanama', desc: 'Restaura 10 PP de un movimiento cuyo PP llegue a 0.' },
  { name: 'persim-berry', es: 'Baya Caqui', desc: 'Cura la confusión en combate.' },
  { name: 'yache-berry', es: 'Baya Pasio', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Hielo.' },
  { name: 'chilan-berry', es: 'Baya Tamar', desc: 'Reduce a la mitad el daño de un ataque de tipo Normal.' },
  { name: 'babiri-berry', es: 'Baya Caoba', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Acero.' },
  { name: 'colbur-berry', es: 'Baya Choca', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Siniestro.' },
  { name: 'payapa-berry', es: 'Baya Payapa', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Psíquico.' },
  { name: 'shuca-berry', es: 'Baya Shuca', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Tierra.' },
  { name: 'coba-berry', es: 'Baya Coba', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Volador.' },
  { name: 'tanga-berry', es: 'Baya Tanga', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Bicho.' },
  { name: 'haban-berry', es: 'Baya Haban', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Dragón.' },
  { name: 'roseli-berry', es: 'Baya Roseli', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Hada.' },
  { name: 'chople-berry', es: 'Baya Pomar', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Lucha.' },
  { name: 'kebia-berry', es: 'Baya Kebia', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Veneno.' },
  { name: 'kasib-berry', es: 'Baya Almeja', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Fantasma.' },
  { name: 'rindo-berry', es: 'Baya Alsem', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Planta.' },
  { name: 'occa-berry', es: 'Baya Oca', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Fuego.' },
  { name: 'passho-berry', es: 'Baya Pasana', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Agua.' },
  { name: 'wacan-berry', es: 'Baya Wacan', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Eléctrico.' },
  { name: 'charti-berry', es: 'Baya Aslac', desc: 'Reduce a la mitad el daño de un ataque súper efectivo de tipo Roca.' },

  // Objetos potenciadores de tipo
  { name: 'charcoal', es: 'Carbón', desc: 'Aumenta la potencia de los movimientos de tipo Fuego un 20%.' },
  { name: 'mystic-water', es: 'Agua Mística', desc: 'Aumenta la potencia de los movimientos de tipo Agua un 20%.' },
  { name: 'miracle-seed', es: 'Semilla Milagro', desc: 'Aumenta la potencia de los movimientos de tipo Planta un 20%.' },
  { name: 'magnet', es: 'Imán', desc: 'Aumenta la potencia de los movimientos de tipo Eléctrico un 20%.' },
  { name: 'never-melt-ice', es: 'Antiderretidor', desc: 'Aumenta la potencia de los movimientos de tipo Hielo un 20%.' },
  { name: 'sharp-beak', es: 'Pico Afilado', desc: 'Aumenta la potencia de los movimientos de tipo Volador un 20%.' },
  { name: 'poison-barb', es: 'Flecha Venenosa', desc: 'Aumenta la potencia de los movimientos de tipo Veneno un 20%.' },
  { name: 'soft-sand', es: 'Arena Fina', desc: 'Aumenta la potencia de los movimientos de tipo Tierra un 20%.' },
  { name: 'spell-tag', es: 'Hechizo', desc: 'Aumenta la potencia de los movimientos de tipo Fantasma un 20%.' },
  { name: 'twisted-spoon', es: 'Cuchara Torcida', desc: 'Aumenta la potencia de los movimientos de tipo Psíquico un 20%.' },
  { name: 'silk-scarf', es: 'Pañuelo Seda', desc: 'Aumenta la potencia de los movimientos de tipo Normal un 20%.' },
  { name: 'silver-powder', es: 'Polvo Plata', desc: 'Aumenta la potencia de los movimientos de tipo Bicho un 20%.' },
  { name: 'dragon-fang', es: 'Colmillo Dragón', desc: 'Aumenta la potencia de los movimientos de tipo Dragón un 20%.' },
  { name: 'black-belt', es: 'Cinturón Negro', desc: 'Aumenta la potencia de los movimientos de tipo Lucha un 20%.' },
  { name: 'black-glasses', es: 'Gafas de Sol', desc: 'Aumenta la potencia de los movimientos de tipo Siniestro un 20%.' },
  { name: 'hard-stone', es: 'Piedra Dura', desc: 'Aumenta la potencia de los movimientos de tipo Roca un 20%.' },
  { name: 'metal-coat', es: 'Revestimiento Metálico', desc: 'Aumenta la potencia de los movimientos de tipo Acero un 20%.' },

  // Piedras y evolutivos comunes
  { name: 'fire-stone', es: 'Piedra Fuego', desc: 'Piedra evolutiva para ciertos Pokémon de tipo Fuego.' },
  { name: 'water-stone', es: 'Piedra Agua', desc: 'Piedra evolutiva para ciertos Pokémon de tipo Agua.' },
  { name: 'thunder-stone', es: 'Piedra Trueno', desc: 'Piedra evolutiva para ciertos Pokémon de tipo Eléctrico.' },
  { name: 'leaf-stone', es: 'Piedra Hoja', desc: 'Piedra evolutiva para ciertos Pokémon de tipo Planta.' },
  { name: 'moon-stone', es: 'Piedra Luna', desc: 'Piedra evolutiva para ciertos Pokémon.' },
  { name: 'sun-stone', es: 'Piedra Solar', desc: 'Piedra evolutiva para ciertos Pokémon.' },
  { name: 'shiny-stone', es: 'Piedra Día', desc: 'Piedra evolutiva para ciertos Pokémon.' },
  { name: 'dusk-stone', es: 'Piedra Noche', desc: 'Piedra evolutiva para ciertos Pokémon.' },
  { name: 'dawn-stone', es: 'Piedra Alba', desc: 'Piedra evolutiva para ciertos Pokémon de género específico.' },
  { name: 'ice-stone', es: 'Piedra Hielo', desc: 'Piedra evolutiva para ciertos Pokémon de tipo Hielo.' },
  { name: 'everstone', es: 'Piedraeterna', desc: 'Evita que el Pokémon portador evolucione.' }
];

// ══════════════════════════════════════════════════
// ── Item Search Modal Component ──
// ══════════════════════════════════════════════════
function ItemSearchModal({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // Filtrar objetos locales instantáneamente en función del query
  const getFilteredItems = () => {
    const qNorm = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    
    if (!qNorm) {
      // Por defecto, devolver los 20 objetos más populares para Nuzlockes
      const popularSlugs = [
        'leftovers', 'life-orb', 'eviolite', 'choice-band', 'choice-specs', 'choice-scarf',
        'rocky-helmet', 'focus-sash', 'assault-vest', 'black-sludge', 'expert-belt',
        'oran-berry', 'sitrus-berry', 'lum-berry', 'chesto-berry', 'quick-claw',
        'lucky-egg', 'amulet-coin', 'exp-share', 'heavy-duty-boots'
      ];
      return COMMON_ITEMS.filter(item => popularSlugs.includes(item.name));
    }

    return COMMON_ITEMS.filter(item => {
      const nameNorm = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const esNorm = item.es.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return nameNorm.includes(qNorm) || esNorm.includes(qNorm);
    });
  };

  const filteredResults = getFilteredItems();

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 200 }}>
      <div className="glass team-search-modal" onClick={e => e.stopPropagation()} style={{ width: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', marginBottom: '1.25rem' }}>
          Buscar Objeto
        </h2>

        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            className="input"
            style={{ paddingLeft: '3rem' }}
            placeholder="Nombre en español o inglés (ej: restos, life orb...)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredResults.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              No se encontraron objetos.
            </p>
          ) : (
            filteredResults.map(item => {
              const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${item.name}.png`;
              return (
                <div
                  key={item.name}
                  className="team-search-result-item"
                  onClick={() => {
                    onSelect({
                      name: item.name,
                      displayName: item.es,
                      sprite: spriteUrl,
                      effect: item.desc || ''
                    });
                    onClose();
                  }}
                  style={{ cursor: 'pointer', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '12px', transition: 'background 0.3s' }}
                >
                  <img
                    src={spriteUrl}
                    alt={item.es}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                    style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{item.es}</span>
                    {item.desc && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
