import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Loader2, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import AbilityModal from '../components/AbilityModal';

const BASE_URL = 'https://pokeapi.co/api/v2';

// Cache global para nombres en español (persiste entre navegaciones)
const esNamesCache = {};
const esFlavorCache = {};

export default function AbilityDex() {
  const [listaMaestra, setListaMaestra] = useState([]);
  const [estaInicializando, setEstaInicializando] = useState(true);

  // Filtros
  const [consultaBusqueda, setConsultaBusqueda] = useState('');
  const [busquedaDebounce, setBusquedaDebounce] = useState('');

  // Paginación
  const [listaFiltrada, setListaFiltrada] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [paginaInput, setPaginaInput] = useState(1);

  // Modal
  const [habilidadSeleccionada, setHabilidadSeleccionada] = useState(null);

  // Para forzar re-render cuando llegan nombres en español
  const [, forceUpdate] = useState(0);

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

  // Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setBusquedaDebounce(consultaBusqueda);
    }, 300);
    return () => clearTimeout(handler);
  }, [consultaBusqueda]);

  // Carga inicial: solo la lista (1 petición, instantánea)
  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/ability?limit=500`);
        const abilities = res.data.results.map((ab, idx) => {
          const parts = ab.url.split('/');
          const id = parseInt(parts[parts.length - 2]);
          return {
            id,
            name: ab.name,
            url: ab.url
          };
        }).filter(a => a.id <= 400); // Filtrar habilidades reales (no placeholders)

        abilities.sort((a, b) => a.id - b.id);

        if (active) {
          setListaMaestra(abilities);
          setEstaInicializando(false);
          // Cargar nombres en español progresivamente en segundo plano
          cargarNombresEs(abilities);
        }
      } catch (err) {
        console.error('Error al cargar la lista de habilidades:', err);
        if (active) setEstaInicializando(false);
      }
    };

    init();
    return () => { active = false; };
  }, []);

  // Cargar nombres en español en segundo plano (por lotes pequeños)
  const cargarNombresEs = async (abilities) => {
    const pendientes = abilities.filter(a => !esNamesCache[a.name]);
    const batchSize = 10;

    for (let i = 0; i < pendientes.length; i += batchSize) {
      const batch = pendientes.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (ab) => {
          if (esNamesCache[ab.name]) return;
          try {
            const res = await axios.get(ab.url);
            esNamesCache[ab.name] = res.data.names.find(n => n.language.name === 'es')?.name || ab.name.replace(/-/g, ' ');
            const flavorEs = res.data.flavor_text_entries.find(e => e.language.name === 'es');
            if (flavorEs) {
              esFlavorCache[ab.name] = flavorEs.flavor_text.replace(/\n/g, ' ').replace(/­/g, '');
            }
          } catch {
            esNamesCache[ab.name] = ab.name.replace(/-/g, ' ');
          }
        })
      );
      // Forzar re-render cada lote para actualizar nombres
      forceUpdate(n => n + 1);
    }
  };

  // Helper: obtener nombre formateado
  const getNombreMostrado = (name) => {
    return esNamesCache[name] || name.replace(/-/g, ' ');
  };

  // Filtrado
  useEffect(() => {
    if (estaInicializando) return;

    let result = [...listaMaestra];

    if (busquedaDebounce.trim()) {
      const q = busquedaDebounce.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      result = result.filter(a => {
        const esN = getNombreMostrado(a.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const enN = a.name.toLowerCase().replace(/-/g, ' ');
        return esN.includes(q) || enN.includes(q);
      });
    }

    setListaFiltrada(result);
    setPagina(0);
  }, [listaMaestra, busquedaDebounce, estaInicializando]);

  // Página actual
  const pokPorPagina = 20;
  const start = pagina * pokPorPagina;
  const habilidadesMostradas = listaFiltrada.slice(start, start + pokPorPagina);
  const totalPages = Math.ceil(listaFiltrada.length / pokPorPagina) || 1;

  return (
    <div className="container" style={{ paddingBottom: '4rem', paddingTop: '2.5rem' }}>

      {/* Filtros */}
      <div className="card glass" style={{ marginBottom: '1.25rem', padding: '1.25rem', background: 'var(--glass-bg)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent)' }}>
          <Sparkles size={20} /> Habilidex — Dex de Habilidades
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', maxWidth: '500px' }}>
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={16} /> Buscar habilidad
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input"
                placeholder="Ej. Intimidación, Levitación..."
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
        </div>
      </div>

      {/* Estado de carga */}
      {estaInicializando && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '4rem', gap: '1rem' }}>
          <Loader2 className="loader" size={48} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando habilidades...</p>
        </div>
      )}

      {/* Sin resultados */}
      {!estaInicializando && habilidadesMostradas.length === 0 && (
        <div className="glass" style={{ padding: '4rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-muted)' }}>No se encontraron habilidades</h2>
          <p>Prueba con otro término de búsqueda.</p>
        </div>
      )}

      {/* Resultados */}
      {!estaInicializando && habilidadesMostradas.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>{listaFiltrada.length} Habilidades encontradas</span>
          </div>

          <div className="ability-grid">
            {habilidadesMostradas.map(ability => (
              <div
                key={ability.id}
                className="ability-card"
                onClick={() => setHabilidadSeleccionada(ability)}
              >
                <div className="ability-card-icon">
                  <Sparkles size={20} />
                </div>
                <div className="ability-card-name">{getNombreMostrado(ability.name)}</div>
                <div className="ability-card-subname">{ability.name.replace(/-/g, ' ')}</div>
                {esFlavorCache[ability.name] && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.6rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {esFlavorCache[ability.name]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Paginación */}
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
                max={totalPages}
                value={paginaInput}
                onChange={(e) => setPaginaInput(e.target.value)}
                onBlur={handlePageSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handlePageSubmit()}
                className="input"
                style={{ width: '70px', textAlign: 'center', padding: '0.5rem' }}
              />
              <span>de {totalPages}</span>
            </div>

            <button
              className="btn btn-outline"
              onClick={() => setPagina(p => p + 1)}
              disabled={(pagina + 1) * pokPorPagina >= listaFiltrada.length}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              Sig <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}

      {/* Modal de habilidad */}
      {habilidadSeleccionada && (
        <AbilityModal
          ability={{
            ...habilidadSeleccionada,
            esName: getNombreMostrado(habilidadSeleccionada.name)
          }}
          onClose={() => setHabilidadSeleccionada(null)}
        />
      )}
    </div>
  );
}
