import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader2, ChevronLeft, ChevronRight, X, Filter } from 'lucide-react';
import { getAllPokemonNames, getPokemonByType, formatPokemonName } from '../services/pokeApi';
import PokemonModal from '../components/PokemonModal';

const REGIONS = [
  { name: 'Cualquiera', min: 1, max: 30000 },
  { name: 'Formas Regionales', min: 10001, max: 30000 },
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
  { id: '', name: 'Tipo 1' },
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

const pokemonDetailsCache = {};

export default function Pokedex() {
  const [listaMaestra, setListaMaestra] = useState([]);
  const [cacheTipos, setCacheTipos] = useState({});
  const [estaInicializando, setEstaInicializando] = useState(true);

  // Estado de Filtros
  const [consultaBusqueda, setConsultaBusqueda] = useState('');
  const [busquedaDebounce, setBusquedaDebounce] = useState('');
  const [regionSeleccionada, setRegionSeleccionada] = useState(REGIONS[0]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');
  const [tipoSecundarioSeleccionado, setTipoSecundarioSeleccionado] = useState('');
  const [ordenClasificacion, setOrdenClasificacion] = useState('asc'); // asc / desc

  // Estado de Paginación y Visualización
  const [listaFiltrada, setListaFiltrada] = useState([]);
  const [pokemonMostrados, setPokemonMostrados] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [paginaInput, setPaginaInput] = useState(1);
  const [estaCargando, setEstaCargando] = useState(false);
  const [pokemonSeleccionado, setPokemonSeleccionado] = useState(null);

  useEffect(() => {
    setPaginaInput(pagina + 1);
  }, [pagina]);

  const handlePageSubmit = () => {
    let val = parseInt(paginaInput);
    const maxPages = Math.ceil(listaFiltrada.length / 20) || 1;
    if (!isNaN(val)) {
      setPagina(Math.max(0, Math.min(val - 1, maxPages - 1)));
    } else {
      setPaginaInput(pagina + 1);
    }
  };

  // Debounce para la entrada de búsqueda (evita peticiones excesivas)
  useEffect(() => {
    const handler = setTimeout(() => {
      setBusquedaDebounce(consultaBusqueda);
    }, 300);
    return () => clearTimeout(handler);
  }, [consultaBusqueda]);

  // Carga inicial de todos los nombres (lista maestra)
  useEffect(() => {
    let active = true;
    const initApp = async () => {
      const data = await getAllPokemonNames();
      if (active) {
        setListaMaestra(data);
        setEstaInicializando(false);
      }
    };
    initApp();
    return () => { active = false; };
  }, []);

  // Obtener datos del endpoint de Tipos si no están en caché
  useEffect(() => {
    let active = true;
    const fetchTypes = async () => {
      let updated = false;
      let newCache = { ...cacheTipos };

      if (tipoSeleccionado && !newCache[tipoSeleccionado]) {
        setEstaCargando(true);
        newCache[tipoSeleccionado] = await getPokemonByType(tipoSeleccionado);
        updated = true;
      }
      if (tipoSecundarioSeleccionado && !newCache[tipoSecundarioSeleccionado]) {
        setEstaCargando(true);
        newCache[tipoSecundarioSeleccionado] = await getPokemonByType(tipoSecundarioSeleccionado);
        updated = true;
      }

      if (updated && active) {
        setCacheTipos(newCache);
        setEstaCargando(false);
      }
    };
    fetchTypes();
    return () => { active = false; };
  }, [tipoSeleccionado, tipoSecundarioSeleccionado, cacheTipos]);

  // Lógica principal de filtrado y búsqueda
  useEffect(() => {
    if (estaInicializando) return;
    if (tipoSeleccionado && !cacheTipos[tipoSeleccionado]) return;
    if (tipoSecundarioSeleccionado && !cacheTipos[tipoSecundarioSeleccionado]) return;

    let result = [...listaMaestra];

    // 1. Filtrar Región
    if (regionSeleccionada.name !== 'Cualquiera') {
      result = result.filter(p => p.dexId >= regionSeleccionada.min && p.dexId <= regionSeleccionada.max);
    }


    // 2. Filtrar Tipo Primario
    if (tipoSeleccionado && cacheTipos[tipoSeleccionado]) {
      const allowedNames = cacheTipos[tipoSeleccionado];
      result = result.filter(p => allowedNames.includes(p.name));
    }

    // 2.5 Filtrar Tipo Secundario
    if (tipoSecundarioSeleccionado && cacheTipos[tipoSecundarioSeleccionado]) {
      const allowedNames = cacheTipos[tipoSecundarioSeleccionado];
      result = result.filter(p => allowedNames.includes(p.name));
    }

    // 3. Filtrar Búsqueda Inteligente (Soporta múltiples palabras o nombres especiales type: null, mime)
    if (busquedaDebounce.trim()) {
      // Normalizamos: Quitar acentos, sustituir espacios por guiones o eliminarlos para comparar
      const q = busquedaDebounce.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const qNoSpaces = q.replace(/[^a-z0-9]/g, ''); // Flabebe, tapukoko, mrmime

      result = result.filter(p => {
        const n = p.name.toLowerCase();
        const formattedN = formatPokemonName(p.name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // Si el usuario introduce el ID numérico
        if (p.id.toString() === q) return true;

        // Coincidencia estricta en el string oficial
        if (n.includes(q.replace(/\s+/g, '-'))) return true;

        // Coincidencia flexibilizada (ej: mr mime -> mrmime === mrmime)
        const nNoSpaces = n.replace(/[^a-z0-9]/g, '');
        if (nNoSpaces.includes(qNoSpaces)) return true;

        // Coincidencia en el nombre formateado (ej: dragonite-mega -> Mega Dragonite)
        if (formattedN.includes(q)) return true;
        const formattedNNoSpaces = formattedN.replace(/[^a-z0-9]/g, '');
        if (formattedNNoSpaces.includes(qNoSpaces)) return true;

        return false;
      });
    }

    // 4. Ordenación final: Agrupamos por dexId (Número nacional)
    result.sort((a, b) => {
      if (a.dexId !== b.dexId) {
        return ordenClasificacion === 'asc' ? a.dexId - b.dexId : b.dexId - a.dexId;
      }
      // Si tienen el mismo dexId, el base (ID más bajo) va primero
      return a.id - b.id;
    });

    setListaFiltrada(result);
    setPagina(0);
  }, [listaMaestra, busquedaDebounce, regionSeleccionada, tipoSeleccionado, tipoSecundarioSeleccionado, ordenClasificacion, cacheTipos, estaInicializando]);

  // Renderizado de la página actual (carga de detalles con CACHÉ)
  useEffect(() => {
    let active = true;
    const loadCurrentPage = async () => {
      if (listaFiltrada.length === 0) {
        setPokemonMostrados([]);
        return;
      }
      setEstaCargando(true);

      const start = pagina * 20;
      const slice = listaFiltrada.slice(start, start + 20);

      try {
        const promises = slice.map(async (p) => {
          // Si ya lo tenemos en caché, lo devolvemos directamente
          if (pokemonDetailsCache[p.id]) return pokemonDetailsCache[p.id];
          
          const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${p.id}`);
          const data = res.data;
          // Guardamos en caché para la próxima vez
          pokemonDetailsCache[p.id] = data;
          return data;
        });
        
        const details = await Promise.all(promises);
        if (active) setPokemonMostrados(details);
      } catch (err) {
        console.error("Error loading pagina details", err);
      }
      if (active) setEstaCargando(false);
    };

    if (!estaInicializando) {
      loadCurrentPage();
    }
    return () => { active = false; };
  }, [listaFiltrada, pagina, estaInicializando]);

  // Manejador del cambio de Región en el desplegable
  const handleRegionChange = (e) => {
    const reg = REGIONS.find(r => r.name === e.target.value);
    if (reg) setRegionSeleccionada(reg);
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem', paddingTop: '2.5rem' }}>

      <div className="card glass" style={{ marginBottom: '1.25rem', padding: '1.25rem', background: 'var(--glass-bg)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent)' }}>
          <Filter size={20} /> Filtros de Búsqueda
        </h3>

        <div className="pokedex-filters" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) minmax(150px, 1fr) minmax(150px, 1fr) minmax(150px, 1fr) minmax(150px, 1fr)', gap: '1.5rem', alignItems: 'end' }}>
          <div className="pokedex-filters-search">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={16} /> Pokémon o número
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input"
                placeholder="Ej. Pikachu, 150..."
                value={consultaBusqueda}
                onChange={(e) => setConsultaBusqueda(e.target.value)}
              />
              {consultaBusqueda && (
                <button onClick={() => setConsultaBusqueda('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="form-label">Región Principal</label>
            <select className="input" value={regionSeleccionada.name} onChange={handleRegionChange} style={{ cursor: 'pointer' }}>
              {REGIONS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Tipo 1</label>
            <select className="input" value={tipoSeleccionado} onChange={(e) => setTipoSeleccionado(e.target.value)} style={{ cursor: 'pointer' }}>
              {TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Tipo 2</label>
            <select className="input" value={tipoSecundarioSeleccionado} onChange={(e) => setTipoSecundarioSeleccionado(e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="">Tipo 2</option>
              {TYPES.slice(1).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Ordenación</label>
            <select className="input" value={ordenClasificacion} onChange={(e) => setOrdenClasificacion(e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="asc">Número (Asc)</option>
              <option value="desc">Número (Desc)</option>
            </select>

          </div>
        </div>
      </div>

      {estaCargando && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="loader" size={48} />
        </div>
      )}

      {/* Mensaje de resultados vacíos */}
      {!estaCargando && pokemonMostrados.length === 0 && !estaInicializando && (
        <div className="glass" style={{ padding: '4rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-muted)' }}>No aparecio nada</h2>
          <p>No parece existir ningún Pokémon con la combinación actual de filtros.</p>
        </div>
      )}

      {!estaCargando && pokemonMostrados.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>{listaFiltrada.length} Resultados | Total de Pokédex: <strong>1025</strong></span>
          </div>


          <div className="pokedex-grid">
            {pokemonMostrados.map(pokemon => (
              <div
                key={pokemon.id}
                className={`pokemon-card bg-type-${pokemon.types[0].type.name}`}
                onClick={() => setPokemonSeleccionado({
                  id: pokemon.id,
                  spriteId: pokemon.species.url.split('/').filter(Boolean).pop().padStart(3, '0'),
                  name: formatPokemonName(pokemon.name),
                  image: pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default,
                  types: pokemon.types.map(t => t.type.name),
                  stats: pokemon.stats.map(s => ({ name: s.stat.name, value: s.base_stat })),
                  abilities: pokemon.abilities.map(a => ({ name: a.ability.name, url: a.ability.url, isHidden: a.is_hidden }))
                })}
                style={{
                  background: `linear-gradient(135deg, var(--type-${pokemon.types[0].type.name}) 0%, var(--bg-dark) 100%)`
                }}
              >
                <div className="pokemon-id">#{pokemon.species.url.split('/').filter(Boolean).pop().padStart(3, '0')}</div>
                <img
                  src={pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}
                  alt={pokemon.name}
                  className="pokemon-img"
                  loading="lazy"
                />
                <div className="pokemon-info glass" style={{ background: 'var(--bg-card)', borderRadius: '0', backdropFilter: 'blur(10px)' }}>
                  <h3 style={{ textTransform: 'capitalize' }}>{formatPokemonName(pokemon.name)}</h3>

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

          <div className="pokedex-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginTop: '3rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => setPagina(p => Math.max(0, p - 1))}
              disabled={pagina === 0}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              <ChevronLeft size={20} /> Ant
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
              <span>Página</span>
              <input
                type="number"
                min="1"
                max={Math.ceil(listaFiltrada.length / 20) || 1}
                value={paginaInput}
                onChange={(e) => setPaginaInput(e.target.value)}
                onBlur={handlePageSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handlePageSubmit()}
                className="input"
                style={{ width: '70px', textAlign: 'center', padding: '0.5rem' }}
              />
              <span>de {Math.ceil(listaFiltrada.length / 20) || 1}</span>
            </div>


            <button
              className="btn btn-outline"
              onClick={() => setPagina(p => p + 1)}
              disabled={(pagina + 1) * 20 >= listaFiltrada.length}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              Sig <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}

      {pokemonSeleccionado && (
        <PokemonModal pokemon={pokemonSeleccionado} onClose={() => setPokemonSeleccionado(null)} />
      )}
    </div>
  );
}
