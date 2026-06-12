import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit3, Check, X, Search, Loader2, Shield, ShieldAlert, Users, ChevronRight, Swords } from 'lucide-react';
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

  // ── Team CRUD ──
  const createTeam = async () => {
    const tempName = `Equipo ${teams.length + 1}`;
    const defaultPokemon = [null, null, null, null, null, null];

    if (user) {
      try {
        const response = await api.post('/api/teams', {
          name: tempName,
          pokemon: defaultPokemon
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
        pokemon: defaultPokemon
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

  // ── Pokémon slot management ──
  const addPokemon = async (slotIndex, pokemon) => {
    const targetTeam = teams.find(t => t.id === selectedTeamId);
    if (!targetTeam) return;

    const newPokemon = [...targetTeam.pokemon];
    newPokemon[slotIndex] = pokemon;

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

  // Derived data
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
            <div className="team-list-items">
              {teams.map(team => (
                <div
                  key={team.id}
                  className={`team-list-item ${selectedTeamId === team.id ? 'active' : ''}`}
                  onClick={() => setSelectedTeamId(team.id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {team.name}
                    </div>
                    <div style={{ display: 'flex', gap: '0.15rem' }}>
                      {team.pokemon.map((p, i) => (
                        <div key={i} style={{ width: '24px', height: '24px', borderRadius: '50%', background: p ? 'transparent' : 'rgba(255,255,255,0.06)', border: p ? 'none' : '1px dashed rgba(255,255,255,0.15)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p && <img src={p.sprite || p.image} alt="" style={{ width: '24px', height: '24px', imageRendering: 'pixelated' }} />}
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
                    <Trash2 size={15} />
                  </button>

                  {/* Confirm Delete */}
                  {confirmDelete === team.id && (
                    <div className="team-confirm-delete" onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize: '0.8rem' }}>¿Eliminar?</span>
                      <button onClick={(e) => { e.stopPropagation(); deleteTeam(team.id); }} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Sí</button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }} style={{ background: 'var(--glass-border)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>No</button>
                    </div>
                  )}
                </div>
              ))}
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
              <div className="glass team-header-card">
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
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {validPokemon.length}/6 Pokémon
                </span>
              </div>

              {/* ── 6 Pokémon Slots ── */}
              <div className="team-slots-grid">
                {teamPokemon.map((poke, i) => (
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
                        <img src={poke.image} alt={poke.name} className="team-slot-img" />
                        <div className="team-slot-info">
                          <span className="team-slot-name">{formatPokemonName(poke.name)}</span>
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {poke.types.map(t => (
                              <span key={t} className="type-badge" style={{ background: `var(--type-${t})`, color: '#000', fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                                {TYPE_ES[t] || t}
                              </span>
                            ))}
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
                ))}
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
    </div>
  );
}
