import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { X, Info, Shield, Zap, ChevronRight, ChevronLeft, Award, Loader2, Sparkles } from 'lucide-react';
import { getPokemonSpecies, getEvolutionChain, formatPokemonName } from '../services/pokeApi';
import { TYPE_ES, calculateEffectiveness } from '../constants/typeData';

export default function PokemonModal({ pokemon: initialPokemon, onClose }) {
  const [currentPokemon, setCurrentPokemon] = useState(initialPokemon);
  const [description, setDescription] = useState('Cargando base de datos de la pokédex...');
  const [evolutionChain, setEvolutionChain] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEvolutionLoading, setIsEvolutionLoading] = useState(false);
  const [isLoadingNew, setIsLoadingNew] = useState(false);
  const [abilityModal, setAbilityModal] = useState(null);
  const [abilityLoading, setAbilityLoading] = useState(false);
  const [abilityNamesEs, setAbilityNamesEs] = useState({});

  useEffect(() => {
    if (!currentPokemon.abilities?.length) return;
    let active = true;
    Promise.all(
      currentPokemon.abilities.map(a =>
        axios.get(a.url)
          .then(r => ({ name: a.name, esName: r.data.names.find(n => n.language.name === 'es')?.name || a.name.replace(/-/g, ' ') }))
          .catch(() => ({ name: a.name, esName: a.name.replace(/-/g, ' ') }))
      )
    ).then(results => {
      if (active) setAbilityNamesEs(Object.fromEntries(results.map(r => [r.name, r.esName])));
    });
    return () => { active = false; };
  }, [currentPokemon.abilities]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    loadPokemonDetails(currentPokemon.id);
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [currentPokemon.id]);

  const loadPokemonDetails = async (id) => {

    // Si es un cambio interno, podríamos necesitar cargar los stats básicos también 
    // pero como venimos de la lista, ya los tenemos. 
    // PERO si pinchamos en una evolución que no está en la lista actual, necesitamos sus datos completos.

    getPokemonSpecies(id).then(text => {
      setDescription(text);
    }).catch(() => {
      setDescription("No se encontró entrada en la Pokédex.");
    });

    setIsEvolutionLoading(true);
    getEvolutionChain(id).then(chain => {
      setEvolutionChain(chain);
      setIsEvolutionLoading(false);
    }).catch(() => {
      setIsEvolutionLoading(false);
    });
  };

  const handleEvolutionClick = async (id) => {
    if (id === currentPokemon.id.toString()) return;

    setIsLoadingNew(true);
    try {
      const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data = res.data;

      setCurrentPokemon({
        id: data.id,
        spriteId: data.id.toString().padStart(3, '0'),
        name: formatPokemonName(data.name),
        image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
        types: data.types.map(t => t.type.name),
        stats: data.stats.map(s => ({ name: s.stat.name, value: s.base_stat })),
        abilities: data.abilities.map(a => ({ name: a.ability.name, url: a.ability.url, isHidden: a.is_hidden }))
      });
      setCurrentPage(1);
    } catch (err) {
      console.error("Error navigating to evolution", err);
    }
    setIsLoadingNew(false);
  };

  const showAbilityInfo = async (ability) => {
    const esName = abilityNamesEs[ability.name] || ability.name.replace(/-/g, ' ');
    setAbilityModal({ name: ability.name, esName, description: '' });
    setAbilityLoading(true);
    try {
      const res = await axios.get(ability.url);
      const esEntry = res.data.flavor_text_entries.find(e => e.language.name === 'es') ||
                      res.data.flavor_text_entries.find(e => e.language.name === 'en');
      setAbilityModal({
        name: ability.name,
        esName,
        description: esEntry
          ? esEntry.flavor_text.replace(/­/g, '').replace(/\n/g, ' ')
          : 'Sin descripción disponible.'
      });
    } catch {
      setAbilityModal({ name: ability.name, esName, description: 'Error al cargar la descripción.' });
    }
    setAbilityLoading(false);
  };

  const primaryColor = `var(--type-${currentPokemon.types[0]})`;

  const effectiveness = useMemo(() => {
    return calculateEffectiveness(currentPokemon.types);
  }, [currentPokemon.types]);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose();
    }
  };

  const statNames = {
    'hp': 'PS',
    'attack': 'Ataque',
    'defense': 'Defensa',
    'special-attack': 'Atq. Esp',
    'special-defense': 'Def. Esp',
    'speed': 'Velocidad'
  };

  const renderPage1 = () => (
    <div className="fade-in">
      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', color: primaryColor, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Info size={18} /> Entrada de la Pokédex
      </h3>
      <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--text-main)', fontStyle: 'italic', marginBottom: '2rem' }}>
        "{description}"
      </p>

      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Zap size={18} color="var(--primary)" /> Estadísticas Base
      </h3>
      <div className="stats-container">
        {currentPokemon.stats.map(stat => {
          const statPercentage = Math.min((stat.value / 255) * 100, 100);
          const label = statNames[stat.name] || stat.name;

          return (
            <div key={stat.name} className="stat-row">
              <span className="stat-name">{label}</span>
              <span className="stat-value">{stat.value}</span>
              <div className="stat-bar-bg">
                <div
                  className="stat-bar"
                  style={{
                    width: `${statPercentage}%`,
                    backgroundColor: primaryColor,
                    boxShadow: `0 0 10px ${primaryColor}`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );

  const renderPage2 = () => (
    <div className="fade-in">
      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', color: primaryColor, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Shield size={18} /> Debilidades y Resistencias
      </h3>

      <div style={{ display: 'grid', gap: '2rem' }}>
        <div>
          <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', borderLeft: '3px solid var(--primary)', paddingLeft: '0.8rem' }}>DÉBIL CONTRA (Recibe x2 o x4)</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {effectiveness.superWeakness.map(t => (
              <span key={t} className="type-badge" style={{ background: `var(--type-${t})`, color: 'black', position: 'relative' }}>
                {TYPE_ES[t]} <span style={{ background: '#ff4444', color: 'white', fontSize: '10px', padding: '0 4px', borderRadius: '4px', marginLeft: '4px' }}>x4</span>
              </span>
            ))}
            {effectiveness.weakness.map(t => (
              <span key={t} className="type-badge" style={{ background: `var(--type-${t})`, color: 'black' }}>
                {TYPE_ES[t]}
              </span>
            ))}
            {effectiveness.superWeakness.length === 0 && effectiveness.weakness.length === 0 && (
              <span style={{ color: 'var(--text-muted)' }}>Sin debilidades destacables</span>
            )}
          </div>
        </div>

        <div>
          <h4 style={{ color: 'var(--accent)', marginBottom: '1rem', borderLeft: '3px solid var(--accent)', paddingLeft: '0.8rem' }}>RESISTENTE CONTRA (Recibe x0.5 o x0.25)</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {effectiveness.superResistance.map(t => (
              <span key={t} className="type-badge" style={{ background: `var(--type-${t})`, color: 'black', position: 'relative' }}>
                {TYPE_ES[t]} <span style={{ background: 'var(--primary)', color: 'black', fontSize: '10px', padding: '0 4px', borderRadius: '4px', marginLeft: '4px' }}>x0.25</span>
              </span>
            ))}
            {effectiveness.resistance.map(t => (
              <span key={t} className="type-badge" style={{ background: `var(--type-${t})`, color: 'black' }}>
                {TYPE_ES[t]}
              </span>
            ))}
          </div>
        </div>

        {effectiveness.immune.length > 0 && (
          <div>
            <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', borderLeft: '3px solid var(--text-muted)', paddingLeft: '0.8rem' }}>INMUNE A (Recibe x0)</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {effectiveness.immune.map(t => (
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

  const renderPage3 = () => {
    // Para evoluciones ramificadas (Eevee), agrupamos por padre
    const roots = evolutionChain.filter(e => !e.evolvesFromId);

    const renderChainNode = (pId, depth = 0) => {
      const node = evolutionChain.find(e => e.id === pId);
      if (!node) return null;

      const children = evolutionChain.filter(e => e.evolvesFromId === pId);

      return (
        <React.Fragment key={pId}>
          <div
            onClick={() => handleEvolutionClick(node.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              background: node.id === currentPokemon.id.toString() ? `${primaryColor}15` : 'rgba(255,255,255,0.03)',
              padding: '1rem',
              borderRadius: '12px',
              border: node.id === currentPokemon.id.toString() ? `2px solid ${primaryColor}` : '1px solid var(--glass-border)',
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
                {node.id === currentPokemon.id.toString() && <Award size={16} color={primaryColor} />}
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
        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', color: primaryColor, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={18} /> Línea Evolutiva
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isEvolutionLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Buscando evolución...</div>
          ) : roots.map(root => renderChainNode(root.id))}

          {evolutionChain.length <= 1 && !isEvolutionLoading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Este Pokémon no tiene una línea evolutiva conocida.</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} style={{ zIndex: 99999 }}>
      <div className="modal-content glass pokemon-modal-wrapper" style={{ border: `1px solid ${primaryColor}`, height: '650px', display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {isLoadingNew && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <Loader2 className="loader" size={48} />
          </div>
        )}

        {abilityModal && (
          <div
            onClick={() => setAbilityModal(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', borderRadius: 'inherit' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', border: `1px solid ${primaryColor}55`, borderRadius: '16px', padding: '2rem', maxWidth: '340px', width: '88%', position: 'relative', boxShadow: `0 20px 60px rgba(0,0,0,0.5)` }}
            >
              <button
                onClick={() => setAbilityModal(null)}
                style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <Sparkles size={18} color={primaryColor} />
                <h3 style={{ margin: 0, textTransform: 'capitalize', color: primaryColor, fontSize: '1.2rem' }}>
                  {abilityModal.esName}
                </h3>
              </div>
              {abilityLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                  <Loader2 className="loader" size={28} />
                </div>
              ) : (
                <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: 1.65, fontSize: '0.95rem', fontStyle: 'italic' }}>
                  {abilityModal.description}
                </p>
              )}
            </div>
          </div>
        )}

        <button className="modal-close" onClick={onClose}><X size={24} /></button>

        <div className="modal-left pokemon-modal-left" style={{
          background: `radial-gradient(circle at center, ${primaryColor} 0%, transparent 80%)`,
          position: 'relative',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '0 0 350px'
        }}>
          <div className="pokemon-id" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', opacity: 0.6, fontSize: '1.5rem', fontWeight: 900 }}>
            #{currentPokemon.spriteId}
          </div>
          <img
            src={currentPokemon.image}
            alt={currentPokemon.name}
            style={{ width: '100%', maxWidth: '280px', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.6))', zIndex: 2, position: 'relative' }}
          />
          <div className="pokemon-modal-info">
            <h2 className="pokemon-modal-name" style={{ fontSize: '2.5rem', textTransform: 'capitalize', marginTop: '1.5rem', textAlign: 'center' }}>
              {currentPokemon.name}
            </h2>
            <div className="types-container" style={{ marginTop: '1rem', justifyContent: 'center' }}>
              {currentPokemon.types.map(type => (
                <span key={type} className="type-badge" style={{ background: `var(--type-${type})`, fontSize: '0.9rem', padding: '0.4rem 1rem', color: '#000', fontWeight: 'bold' }}>
                  {TYPE_ES[type] || type}
                </span>
              ))}
            </div>
            {currentPokemon.abilities?.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.45rem', justifyContent: 'center' }}>
                {currentPokemon.abilities.map(ability => (
                  <div key={ability.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.3)', padding: '0.3rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <Sparkles size={11} color={primaryColor} />
                    <span style={{ fontSize: '0.78rem', textTransform: 'capitalize', color: 'var(--text-main)' }}>
                      {abilityNamesEs[ability.name] || ability.name.replace(/-/g, ' ')}
                    </span>
                    {ability.isHidden && (
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }} title="Habilidad oculta">◆</span>
                    )}
                    <button
                      onClick={() => showAbilityInfo(ability)}
                      title="Ver descripción"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: primaryColor, padding: '0', display: 'flex', alignItems: 'center' }}
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
            {currentPage === 1 && renderPage1()}
            {currentPage === 2 && renderPage2()}
            {currentPage === 3 && renderPage3()}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3].map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    width: '35px',
                    height: '8px',
                    borderRadius: '4px',
                    background: currentPage === pageNum ? primaryColor : 'rgba(255,255,255,0.1)',
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
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                <ChevronLeft size={16} /> Ant.
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setCurrentPage(prev => Math.min(3, prev + 1))}
                disabled={currentPage === 3}
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
