import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader2, ChevronLeft, ChevronRight, X, Filter } from 'lucide-react';
import { getAllPokemonNames, getPokemonByType } from '../services/pokeApi';
import PokemonModal from '../components/PokemonModal';

const REGIONS = [
  { name: 'Todas las Regiones', min: 1, max: 9999 },
  { name: 'Kanto (Gen 1)', min: 1, max: 151 },
  { name: 'Johto (Gen 2)', min: 152, max: 251 },
  { name: 'Hoenn (Gen 3)', min: 252, max: 386 },
  { name: 'Sinnoh (Gen 4)', min: 387, max: 493 },
  { name: 'Teselia/Unova (Gen 5)', min: 494, max: 649 },
  { name: 'Kalos (Gen 6)', min: 650, max: 721 },
  { name: 'Alola (Gen 7)', min: 722, max: 809 },
  { name: 'Galar (Gen 8)', min: 810, max: 898 },
  { name: 'Paldea (Gen 9)', min: 906, max: 1025 }
];

const TYPES = [
  { id: '', name: 'Todos los tipos' },
  { id: 'normal', name: 'Normal' }, { id: 'fire', name: 'Fuego' },
  { id: 'water', name: 'Agua' }, { id: 'electric', name: 'Eléctrico' },
  { id: 'grass', name: 'Planta' }, { id: 'ice', name: 'Hielo' },
  { id: 'fighting', name: 'Lucha' }, { id: 'poison', name: 'Veneno' },
  { id: 'ground', name: 'Tierra' }, { id: 'flying', name: 'Volador' },
  { id: 'psychic', name: 'Psíquico' }, { id: 'bug', name: 'Bicho' },
  { id: 'rock', name: 'Roca' }, { id: 'ghost', name: 'Fantasma' },
  { id: 'dragon', name: 'Dragón' }, { id: 'dark', name: 'Siniestro' },
  { id: 'steel', name: 'Acero' }, { id: 'fairy', name: 'Hada' }
];

export default function Pokedex() {
  const [masterList, setMasterList] = useState([]);
  const [typeCache, setTypeCache] = useState({});
  const [isInitializing, setIsInitializing] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedSecondaryType, setSelectedSecondaryType] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // asc / desc

  // Pagination & Display State
  const [filteredList, setFilteredList] = useState([]);
  const [displayedPokemon, setDisplayedPokemon] = useState([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Initial Fetch of all names
  useEffect(() => {
    let active = true;
    const initApp = async () => {
      const data = await getAllPokemonNames();
      if (active) {
        setMasterList(data);
        setIsInitializing(false);
      }
    };
    initApp();
    return () => { active = false; };
  }, []);

  // Fetch from Type endpoint if not cached
  useEffect(() => {
    let active = true;
    const fetchTypes = async () => {
      let updated = false;
      let newCache = { ...typeCache };

      if (selectedType && !newCache[selectedType]) {
        setIsLoading(true);
        newCache[selectedType] = await getPokemonByType(selectedType);
        updated = true;
      }
      if (selectedSecondaryType && !newCache[selectedSecondaryType]) {
        setIsLoading(true);
        newCache[selectedSecondaryType] = await getPokemonByType(selectedSecondaryType);
        updated = true;
      }

      if (updated && active) {
        setTypeCache(newCache);
        setIsLoading(false);
      }
    };
    fetchTypes();
    return () => { active = false; };
  }, [selectedType, selectedSecondaryType, typeCache]);

  // Main Filtering Logic
  useEffect(() => {
    if (isInitializing) return;
    if (selectedType && !typeCache[selectedType]) return;
    if (selectedSecondaryType && !typeCache[selectedSecondaryType]) return;

    let result = [...masterList];

    // 1. Filtrar Región
    if (selectedRegion.name !== 'Cualquier Region') {
      result = result.filter(p => p.id >= selectedRegion.min && p.id <= selectedRegion.max);
    }

    // 2. Filtrar Tipo Primario
    if (selectedType && typeCache[selectedType]) {
      const allowedNames = typeCache[selectedType];
      result = result.filter(p => allowedNames.includes(p.name));
    }

    // 2.5 Filtrar Tipo Secundario
    if (selectedSecondaryType && typeCache[selectedSecondaryType]) {
      const allowedNames = typeCache[selectedSecondaryType];
      result = result.filter(p => allowedNames.includes(p.name));
    }

    // 3. Filtrar Búsqueda Inteligente (Soporta múltiples palabras o nombres especiales type: null, mime)
    if (debouncedSearch.trim()) {
      // Normalizamos: Quitar acentos, sustituir espacios por guiones o eliminarlos para comparar
      const q = debouncedSearch.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const qNoSpaces = q.replace(/[^a-z0-9]/g, ''); // Flabebe, tapukoko, mrmime

      result = result.filter(p => {
        const n = p.name.toLowerCase();
        // Si el usuario introduce el ID numérico
        if (p.id.toString() === q) return true;

        // Coincidencia estricta en el string oficial
        if (n.includes(q.replace(/\s+/g, '-'))) return true;

        // Coincidencia flexibilizada (ej: mr mime -> mrmime === mrmime)
        const nNoSpaces = n.replace(/[^a-z0-9]/g, '');
        if (nNoSpaces.includes(qNoSpaces)) return true;

        return false;
      });
    }

    // 4. Orden
    result.sort((a, b) => sortOrder === 'asc' ? a.id - b.id : b.id - a.id);

    setFilteredList(result);
    setPage(0);
  }, [masterList, debouncedSearch, selectedRegion, selectedType, selectedSecondaryType, sortOrder, typeCache, isInitializing]);

  // Render Page
  useEffect(() => {
    let active = true;
    const loadCurrentPage = async () => {
      if (filteredList.length === 0) {
        setDisplayedPokemon([]);
        return;
      }
      setIsLoading(true);

      const start = page * 20;
      const slice = filteredList.slice(start, start + 20);

      try {
        const promises = slice.map(async (p) => {
          const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${p.id}`);
          return res.data;
        });
        const details = await Promise.all(promises);
        if (active) setDisplayedPokemon(details);
      } catch (err) {
        console.error("Error loading page details", err);
      }
      if (active) setIsLoading(false);
    };

    if (!isInitializing) {
      loadCurrentPage();
    }
    return () => { active = false; };
  }, [filteredList, page, isInitializing]);

  // Handle dropdown for Region
  const handleRegionChange = (e) => {
    const reg = REGIONS.find(r => r.name === e.target.value);
    if (reg) setSelectedRegion(reg);
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>

      <div className="card glass" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(15, 17, 26, 0.9)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent)' }}>
          <Filter size={20} /> Filtros de Búsqueda
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) minmax(150px, 1fr) minmax(150px, 1fr) minmax(150px, 1fr) minmax(150px, 1fr)', gap: '1.5rem', alignItems: 'end' }}>
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={16} /> Pokémon o número
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input"
                placeholder="Ej. Pikachu, 150..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="form-label">Región Principal</label>
            <select className="input" value={selectedRegion.name} onChange={handleRegionChange} style={{ cursor: 'pointer' }}>
              {REGIONS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Tipo 1</label>
            <select className="input" value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ cursor: 'pointer' }}>
              {TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Tipo 2</label>
            <select className="input" value={selectedSecondaryType} onChange={(e) => setSelectedSecondaryType(e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="">Cualquiera</option>
              {TYPES.slice(1).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Ordenación</label>
            <select className="input" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="asc">001 a 1025 (Asc)</option>
              <option value="desc">1025 a 001 (Desc)</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="loader" size={48} />
        </div>
      )}

      {/* Resultados vacios */}
      {!isLoading && displayedPokemon.length === 0 && !isInitializing && (
        <div className="glass" style={{ padding: '4rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-muted)' }}>Misterio...</h2>
          <p>No parece existir ningún Pokémon con la combinación actual de filtros.</p>
        </div>
      )}

      {!isLoading && displayedPokemon.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', color: 'var(--text-muted)' }}>
            <strong>{filteredList.length}</strong> &nbsp;Pokémon encontrados
          </div>

          <div className="pokedex-grid">
            {displayedPokemon.map(pokemon => (
              <div
                key={pokemon.id}
                className={`pokemon-card bg-type-${pokemon.types[0].type.name}`}
                onClick={() => setSelectedPokemon({
                  id: pokemon.id,
                  spriteId: pokemon.id.toString().padStart(3, '0'),
                  name: pokemon.name.replace('-', ' '),
                  image: pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default,
                  types: pokemon.types.map(t => t.type.name),
                  stats: pokemon.stats.map(s => ({ name: s.stat.name, value: s.base_stat }))
                })}
                style={{
                  background: `linear-gradient(135deg, var(--type-${pokemon.types[0].type.name}) 0%, var(--bg-dark) 100%)`
                }}
              >
                <div className="pokemon-id">#{pokemon.id.toString().padStart(3, '0')}</div>
                <img
                  src={pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}
                  alt={pokemon.name}
                  className="pokemon-img"
                  loading="lazy"
                />
                <div className="pokemon-info glass" style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '0' }}>
                  <h3>{pokemon.name.replace('-', ' ')}</h3>
                  <div className="types-container">
                    {pokemon.types.map(t => {
                      const T_ES = {
                        normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico',
                        grass: 'Planta', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
                        ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
                        rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro',
                        steel: 'Acero', fairy: 'Hada'
                      };
                      return (
                        <span key={t.type.name} className="type-badge" style={{ background: `var(--type-${t.type.name})`, color: 'black' }}>
                          {T_ES[t.type.name] || t.type.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginTop: '3rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              <ChevronLeft size={20} /> Ant
            </button>
            <span style={{ fontWeight: 'bold' }}>
              Página {page + 1} de {Math.ceil(filteredList.length / 20) || 1}
            </span>
            <button
              className="btn btn-outline"
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * 20 >= filteredList.length}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              Sig <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}

      {selectedPokemon && (
        <PokemonModal pokemon={selectedPokemon} onClose={() => setSelectedPokemon(null)} />
      )}
    </div>
  );
}
