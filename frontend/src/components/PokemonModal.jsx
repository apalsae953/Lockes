import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { X, Info, Shield, Zap, ChevronRight, ChevronLeft, Award, Loader2, Sparkles } from 'lucide-react';
import { getPokemonSpecies, getEvolutionChain, formatPokemonName } from '../services/pokeApi';
import { TYPE_ES, calculateEffectiveness } from '../constants/typeData';

export default function PokemonModal({ pokemon: pokemonInicial, onClose }) {
  const [pokemonActual, setPokemonActual] = useState(pokemonInicial);
  const [description, setDescripcion] = useState('Cargando base de datos de la pokédex...');
  const [cadenaEvolutiva, setCadenaEvolutiva] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [estaCargandoEvolucion, setEstaCargandoEvolucion] = useState(false);
  const [estaCargandoNuevo, setEstaCargandoNuevo] = useState(false);
  const [modalHabilidad, setModalHabilidad] = useState(null);
  const [cargandoHabilidad, setCargandoHabilidad] = useState(false);
  const [nombresHabilidadesEs, setNombresHabilidadesEs] = useState({});

  useEffect(() => {
    if (!pokemonActual.abilities?.length) return;
    let active = true;
    Promise.all(
      pokemonActual.abilities.map(a =>
        axios.get(a.url)
          .then(r => ({ name: a.name, esName: r.data.names.find(n => n.language.name === 'es')?.name || a.name.replace(/-/g, ' ') }))
          .catch(() => ({ name: a.name, esName: a.name.replace(/-/g, ' ') }))
      )
    ).then(results => {
      if (active) setNombresHabilidadesEs(Object.fromEntries(results.map(r => [r.name, r.esName])));
    });
    return () => { active = false; };
  }, [pokemonActual.abilities]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    cargarDetallesPokemon(pokemonActual.id);
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [pokemonActual.id]);

  const cargarDetallesPokemon = async (id) => {

    // Si es un cambio interno, podríamos necesitar cargar los stats básicos también 
    // pero como venimos de la lista, ya los tenemos. 
    // PERO si pinchamos en una evolución que no está en la lista actual, necesitamos sus datos completos.

    getPokemonSpecies(id).then(text => {
      setDescripcion(text);
    }).catch(() => {
      setDescripcion("No se encontró entrada en la Pokédex.");
    });

    setEstaCargandoEvolucion(true);
    getEvolutionChain(id).then(chain => {
      setCadenaEvolutiva(chain);
      setEstaCargandoEvolucion(false);
    }).catch(() => {
      setEstaCargandoEvolucion(false);
    });
  };

  const manejarClicEvolucion = async (id) => {
    if (id === pokemonActual.id.toString()) return;

    setEstaCargandoNuevo(true);
    try {
      const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data = res.data;

      setPokemonActual({
        id: data.id,
        spriteId: data.id.toString().padStart(3, '0'),
        name: formatPokemonName(data.name),
        image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
        types: data.types.map(t => t.type.name),
        stats: data.stats.map(s => ({ name: s.stat.name, value: s.base_stat })),
        abilities: data.abilities.map(a => ({ name: a.ability.name, url: a.ability.url, isHidden: a.is_hidden }))
      });
      setPaginaActual(1);
    } catch (err) {
      console.error("Error navigating to evolution", err);
    }
    setEstaCargandoNuevo(false);
  };

  const mostrarInfoHabilidad = async (ability) => {
    const esName = nombresHabilidadesEs[ability.name] || ability.name.replace(/-/g, ' ');
    setModalHabilidad({ name: ability.name, esName, description: '' });
    setCargandoHabilidad(true);
    try {
      const res = await axios.get(ability.url);
      const esEntry = res.data.flavor_text_entries.find(e => e.language.name === 'es') ||
                      res.data.flavor_text_entries.find(e => e.language.name === 'en');
      setModalHabilidad({
        name: ability.name,
        esName,
        description: esEntry
          ? esEntry.flavor_text.replace(/­/g, '').replace(/\n/g, ' ')
          : 'Sin descripción disponible.'
      });
    } catch {
      setModalHabilidad({ name: ability.name, esName, description: 'Error al cargar la descripción.' });
    }
    setCargandoHabilidad(false);
  };

  const colorPrincipal = `var(--type-${pokemonActual.types[0]})`;

  const efectividad = useMemo(() => {
    return calculateEffectiveness(pokemonActual.types);
  }, [pokemonActual.types]);

  const manejarClicSuperposicion = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose();
    }
  };

  const nombresEstadisticas = {
    'hp': 'PS',
    'attack': 'Ataque',
    'defense': 'Defensa',
    'special-attack': 'Atq. Esp',
    'special-defense': 'Def. Esp',
    'speed': 'Velocidad'
  };

  const renderizarPagina1 = () => (
    <div className="fade-in">
      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', color: colorPrincipal, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Info size={18} /> Entrada de la Pokédex
      </h3>
      <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--text-main)', fontStyle: 'italic', marginBottom: '2rem' }}>
        "{description}"
      </p>

      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Zap size={18} color="var(--primary)" /> Estadísticas Base
      </h3>
      <div className="stats-container">
        {pokemonActual.stats.map(stat => {
          const statPercentage = Math.min((stat.value / 255) * 100, 100);
          const label = nombresEstadisticas[stat.name] || stat.name;

          return (
            <div key={stat.name} className="stat-row">
              <span className="stat-name">{label}</span>
              <span className="stat-value">{stat.value}</span>
              <div className="stat-bar-bg">
                <div
                  className="stat-bar"
                  style={{
                    width: `${statPercentage}%`,
                    backgroundColor: colorPrincipal,
                    boxShadow: `0 0 10px ${colorPrincipal}`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );

  const renderizarPagina2 = () => (
    <div className="fade-in">
      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', color: colorPrincipal, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Shield size={18} /> Debilidades y Resistencias
      </h3>

      <div style={{ display: 'grid', gap: '2rem' }}>
        <div>
          <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', borderLeft: '3px solid var(--primary)', paddingLeft: '0.8rem' }}>DÉBIL CONTRA (Recibe x2 o x4)</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {efectividad.superWeakness.map(t => (
              <span key={t} className="type-badge" style={{ background: `var(--type-${t})`, color: 'black', position: 'relative' }}>
                {TYPE_ES[t]} <span style={{ background: '#ff4444', color: 'white', fontSize: '10px', padding: '0 4px', borderRadius: '4px', marginLeft: '4px' }}>x4</span>
              </span>
            ))}
            {efectividad.weakness.map(t => (
              <span key={t} className="type-badge" style={{ background: `var(--type-${t})`, color: 'black' }}>
                {TYPE_ES[t]}
              </span>
            ))}
            {efectividad.superWeakness.length === 0 && efectividad.weakness.length === 0 && (
              <span style={{ color: 'var(--text-muted)' }}>Sin debilidades destacables</span>
            )}
          </div>
        </div>

        <div>
          <h4 style={{ color: 'var(--accent)', marginBottom: '1rem', borderLeft: '3px solid var(--accent)', paddingLeft: '0.8rem' }}>RESISTENTE CONTRA (Recibe x0.5 o x0.25)</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {efectividad.superResistance.map(t => (
              <span key={t} className="type-badge" style={{ background: `var(--type-${t})`, color: 'black', position: 'relative' }}>
                {TYPE_ES[t]} <span style={{ background: 'var(--primary)', color: 'black', fontSize: '10px', padding: '0 4px', borderRadius: '4px', marginLeft: '4px' }}>x0.25</span>
              </span>
            ))}
            {efectividad.resistance.map(t => (
              <span key={t} className="type-badge" style={{ background: `var(--type-${t})`, color: 'black' }}>
                {TYPE_ES[t]}
              </span>
            ))}
          </div>
        </div>

        {efectividad.immune.length > 0 && (
          <div>
            <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', borderLeft: '3px solid var(--text-muted)', paddingLeft: '0.8rem' }}>INMUNE A (Recibe x0)</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {efectividad.immune.map(t => (
                <span key={t} className="type-badge" style={{ background: `var(--type-${t})`, color: 'black' }}>
                  {TYPE_ES[t]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderizarPagina3 = () => {
    // Para evoluciones ramificadas (Eevee), agrupamos por padre
    const roots = cadenaEvolutiva.filter(e => !e.evolvesFromId);

    const renderChainNode = (pId, depth = 0) => {
      const node = cadenaEvolutiva.find(e => e.id === pId);
      if (!node) return null;

      const children = cadenaEvolutiva.filter(e => e.evolvesFromId === pId);

      return (
        <React.Fragment key={pId}>
          <div
            onClick={() => manejarClicEvolucion(node.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              background: node.id === pokemonActual.id.toString() ? `${colorPrincipal}15` : 'rgba(255,255,255,0.03)',
              padding: '1rem',
              borderRadius: '12px',
              border: node.id === pokemonActual.id.toString() ? `2px solid ${colorPrincipal}` : '1px solid var(--glass-border)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginLeft: `${depth * 20}px`,
              position: 'relative'
            }}
            className="evo-item"
          >
            <img src={node.image} alt={node.name} style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {node.name}
                {node.id === pokemonActual.id.toString() && <Award size={16} color={colorPrincipal} />}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{node.dexId.padStart(3, '0')}</div>

            </div>
            {node.trigger && (
              <div style={{ textAlign: 'right', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', maxWidth: '120px' }}>
                <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{node.trigger}</div>
                <div style={{ color: 'var(--text-main)', fontSize: '0.75rem' }}>{node.level}</div>
              </div>
            )}
          </div>
          {children.map(child => renderChainNode(child.id, depth + 1))}
        </React.Fragment>
      );
    };

    return (
      <div className="fade-in">
        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', color: colorPrincipal, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={18} /> Línea Evolutiva
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {estaCargandoEvolucion ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Buscando evolución...</div>
          ) : roots.map(root => renderChainNode(root.id))}

          {cadenaEvolutiva.length <= 1 && !estaCargandoEvolucion && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Este Pokémon no tiene una línea evolutiva conocida.</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={manejarClicSuperposicion} style={{ zIndex: 99999 }}>
      <div className="modal-content glass pokemon-modal-wrapper" style={{ border: `1px solid ${colorPrincipal}`, height: '650px', display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {estaCargandoNuevo && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <Loader2 className="loader" size={48} />
          </div>
        )}

        {modalHabilidad && (
          <div
            onClick={() => setModalHabilidad(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', borderRadius: 'inherit' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', border: `1px solid ${colorPrincipal}55`, borderRadius: '16px', padding: '2rem', maxWidth: '340px', width: '88%', position: 'relative', boxShadow: `0 20px 60px rgba(0,0,0,0.5)` }}
            >
              <button
                onClick={() => setModalHabilidad(null)}
                style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <Sparkles size={18} color={colorPrincipal} />
                <h3 style={{ margin: 0, textTransform: 'capitalize', color: colorPrincipal, fontSize: '1.2rem' }}>
                  {modalHabilidad.esName}
                </h3>
              </div>
              {cargandoHabilidad ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                  <Loader2 className="loader" size={28} />
                </div>
              ) : (
                <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: 1.65, fontSize: '0.95rem', fontStyle: 'italic' }}>
                  {modalHabilidad.description}
                </p>
              )}
            </div>
          </div>
        )}

        <button className="modal-close" onClick={onClose}><X size={24} /></button>

        <div className="modal-left pokemon-modal-left" style={{
          background: `radial-gradient(circle at center, ${colorPrincipal} 0%, transparent 80%)`,
          position: 'relative',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '0 0 350px'
        }}>
          <div className="pokemon-id" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', opacity: 0.6, fontSize: '1.5rem', fontWeight: 900 }}>
            #{pokemonActual.spriteId}
          </div>
          <img
            src={pokemonActual.image}
            alt={pokemonActual.name}
            style={{ width: '100%', maxWidth: '280px', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.6))', zIndex: 2, position: 'relative' }}
          />
          <div className="pokemon-modal-info">
            <h2 className="pokemon-modal-name" style={{ fontSize: '2.5rem', textTransform: 'capitalize', marginTop: '1.5rem', textAlign: 'center' }}>
              {pokemonActual.name}
            </h2>
            <div className="types-container" style={{ marginTop: '1rem', justifyContent: 'center' }}>
              {pokemonActual.types.map(type => (
                <span key={type} className="type-badge" style={{ background: `var(--type-${type})`, fontSize: '0.9rem', padding: '0.4rem 1rem', color: '#000', fontWeight: 'bold' }}>
                  {TYPE_ES[type] || type}
                </span>
              ))}
            </div>
            {pokemonActual.abilities?.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.45rem', justifyContent: 'center' }}>
                {pokemonActual.abilities.map(ability => (
                  <div key={ability.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.3)', padding: '0.3rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <Sparkles size={11} color={colorPrincipal} />
                    <span style={{ fontSize: '0.78rem', textTransform: 'capitalize', color: 'var(--text-main)' }}>
                      {nombresHabilidadesEs[ability.name] || ability.name.replace(/-/g, ' ')}
                    </span>
                    {ability.isHidden && (
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }} title="Habilidad oculta">◆</span>
                    )}
                    <button
                      onClick={() => mostrarInfoHabilidad(ability)}
                      title="Ver descripción"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: colorPrincipal, padding: '0', display: 'flex', alignItems: 'center' }}
                    >
                      <Info size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-right pokemon-modal-right" style={{ padding: '2.5rem', flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem' }}>
            {paginaActual === 1 && renderizarPagina1()}
            {paginaActual === 2 && renderizarPagina2()}
            {paginaActual === 3 && renderizarPagina3()}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3].map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setPaginaActual(pageNum)}
                  style={{
                    width: '35px',
                    height: '8px',
                    borderRadius: '4px',
                    background: paginaActual === pageNum ? colorPrincipal : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-outline"
                onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                disabled={paginaActual === 1}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                <ChevronLeft size={16} /> Ant.
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setPaginaActual(prev => Math.min(3, prev + 1))}
                disabled={paginaActual === 3}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                Sig. <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .fade-in { animation: fadeInContent 0.4s ease-out; }
        @keyframes fadeInContent {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .evo-item:hover {
            background: rgba(255,255,255,0.1) !important;
            transform: scale(1.02);
        }
        .modal-content::-webkit-scrollbar { width: 6px; }
        .modal-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); borderRadius: 10px; }
      `}} />
    </div>
  );
}
