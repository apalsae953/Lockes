import React, { useState, useMemo, useRef, useEffect } from 'react';
import { getTypeColor } from '../services/pokeApi';
import { Shield, Sword, X, Zap, Info } from 'lucide-react';

import { TYPE_ES as TIPO_TRADUCCIONES, EFICACIA_DEFENSIVA } from '../constants/typeData';

export default function TablaTipos() {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const detailRef = useRef(null);

  useEffect(() => {
    if (selectedTypes.length > 0 && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedTypes]);

  const tipos = Object.keys(EFICACIA_DEFENSIVA);

  const handleTypeClick = (tipo) => {
    if (selectedTypes.includes(tipo)) {
      setSelectedTypes(selectedTypes.filter(t => t !== tipo));
    } else {
      if (selectedTypes.length < 2) {
        setSelectedTypes([...selectedTypes, tipo]);
      } else {
        setSelectedTypes([tipo]);
      }
    }
  };

  // Calcular eficacia ofensiva dinámicamente
  const eficaciaOfensiva = useMemo(() => {
    const offensiveMap = {};
    tipos.forEach(t => offensiveMap[t] = { superEffective: [], notVeryEffective: [], immune: [] });

    tipos.forEach(defensor => {
      EFICACIA_DEFENSIVA[defensor].weakness.forEach(atacante => {
        if (offensiveMap[atacante]) offensiveMap[atacante].superEffective.push(defensor);
      });
      EFICACIA_DEFENSIVA[defensor].resistance.forEach(atacante => {
        if (offensiveMap[atacante]) offensiveMap[atacante].notVeryEffective.push(defensor);
      });
      EFICACIA_DEFENSIVA[defensor].immune.forEach(atacante => {
        if (offensiveMap[atacante]) offensiveMap[atacante].immune.push(defensor);
      });
    });
    return offensiveMap;
  }, [tipos]);

  // Calcular eficacia defensiva COMBINADA
  const eficaciaCombinada = useMemo(() => {
    if (selectedTypes.length === 0) return null;

    const res = {
      x4: [],
      x2: [],
      x1: [],
      x05: [],
      x025: [],
      x0: []
    };

    tipos.forEach(atacante => {
      let multiplier = 1;

      selectedTypes.forEach(defensor => {
        const data = EFICACIA_DEFENSIVA[defensor];
        if (data.weakness.includes(atacante)) multiplier *= 2;
        if (data.resistance.includes(atacante)) multiplier *= 0.5;
        if (data.immune.includes(atacante)) multiplier *= 0;
      });

      if (multiplier === 4) res.x4.push(atacante);
      else if (multiplier === 2) res.x2.push(atacante);
      else if (multiplier === 1) res.x1.push(atacante);
      else if (multiplier === 0.5) res.x05.push(atacante);
      else if (multiplier === 0.25) res.x025.push(atacante);
      else if (multiplier === 0) res.x0.push(atacante);
    });

    return res;
  }, [selectedTypes, tipos]);

  const TypeBadge = ({ type, small = false }) => (
    <div
      className="type-badge"
      style={{
        backgroundColor: getTypeColor(type),
        padding: small ? '0.2rem 0.6rem' : '0.4rem 1rem',
        fontSize: small ? '0.7rem' : '0.9rem',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        textTransform: 'uppercase',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: 'white',
        letterSpacing: '0.5px'
      }}
    >
      {TIPO_TRADUCCIONES[type] || type}
    </div>
  );

  return (
    <div className="container" style={{ paddingBottom: '6rem', paddingTop: '3rem' }}>
      <header className="tipos-page-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 className="title-glow" style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          Tabla de <span className="gradient-text">Tipos</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
          Selecciona hasta <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>2 tipos</span> para ver sus debilidades y resistencias combinadas. Ideal para analizar defensivamente a tu equipo.
        </p>
      </header>

      <div className="grid grid-6" style={{ gap: '1.5rem' }}>
        {tipos.map(tipo => (
          <div
            key={tipo}
            onClick={() => handleTypeClick(tipo)}
            className={`card glass type-card ${selectedTypes.includes(tipo) ? 'active' : ''}`}
            style={{
              padding: '2rem 1rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              border: selectedTypes.includes(tipo) ? `2px solid ${getTypeColor(tipo)}` : '1px solid var(--glass-border)',
              transform: selectedTypes.includes(tipo) ? 'translateY(-8px) scale(1.05)' : 'none',
              background: selectedTypes.includes(tipo)
                ? `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, ${getTypeColor(tipo)}55 100%)`
                : 'var(--glass-bg)',
              boxShadow: selectedTypes.includes(tipo)
                ? `0 15px 35px -10px ${getTypeColor(tipo)}88`
                : 'var(--glass-shadow)'
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: getTypeColor(tipo),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 20px ${getTypeColor(tipo)}aa`,
                transition: 'transform 0.3s ease'
              }}
            >
              <Zap size={24} color="white" />
            </div>
            <span style={{ fontWeight: '800', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {TIPO_TRADUCCIONES[tipo]}
            </span>
          </div>
        ))}
      </div>

      {selectedTypes.length > 0 && (
        <div
          ref={detailRef}
          className="card glass fade-in tipo-detail-card"
          style={{
            marginTop: '4rem',
            padding: '3rem',
            border: `2px solid ${getTypeColor(selectedTypes[0])}33`,
            display: 'flex',
            flexDirection: 'column',
            gap: '3rem',
            position: 'relative',
            background: `linear-gradient(180deg, var(--glass-bg) 0%, ${getTypeColor(selectedTypes[0])}15 100%)`,
            overflow: 'hidden'
          }}
        >
          <button
            onClick={() => setSelectedTypes([])}
            className="btn-close"
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              padding: '0.5rem',
              borderRadius: '50%',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <X size={20} />
          </button>

          {/* CABECERA SELECCIÓN */}
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              Perfil de {selectedTypes.map((t, idx) => (
                <React.Fragment key={t}>
                  <TypeBadge type={t} />
                  {idx === 0 && selectedTypes.length > 1 && <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>+</span>}
                </React.Fragment>
              ))}
            </h2>
          </div>

          <div className="tipo-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '3rem' }}>

            {/* OFENSIVO UNIFICADO */}
            <div className="effect-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '0.8rem', background: 'var(--primary)', borderRadius: '12px', color: 'black' }}>
                  <Sword size={24} />
                </div>
                <h2 style={{ fontSize: '1.75rem', margin: 0, fontWeight: '800' }}>Atacando</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1rem' }}>Super Eficaz contra (x2)</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {(() => {
                      const allSuper = [...new Set(selectedTypes.flatMap(t => eficaciaOfensiva[t].superEffective))];
                      return allSuper.length > 0 ? (
                        allSuper.map(e => <TypeBadge key={e} type={e} small />)
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Sin coberturas críticas</span>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1rem' }}>Poco Eficaz / Inmune</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {(() => {
                      const allWeak = [...new Set(selectedTypes.flatMap(t => [...eficaciaOfensiva[t].notVeryEffective, ...eficaciaOfensiva[t].immune]))];
                      return allWeak.map(e => <TypeBadge key={e} type={e} small />);
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* DEFENSIVO UNIFICADO */}
            <div className="effect-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '0.8rem', background: 'var(--accent)', borderRadius: '12px', color: 'black' }}>
                  <Shield size={24} />
                </div>
                <h2 style={{ fontSize: '1.75rem', margin: 0, fontWeight: '800' }}>Defensivo</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* DEBILIDADES (x4 y x2) */}
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#ffbb33', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1rem' }}>Débil Contra</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {eficaciaCombinada.x4.map(t => (
                      <div key={t} style={{ position: 'relative' }}>
                        <TypeBadge type={t} small />
                        <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#ff4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', border: '2px solid var(--bg-card)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>x4</span>
                      </div>
                    ))}
                    {eficaciaCombinada.x2.map(t => <TypeBadge key={t} type={t} small />)}
                    {eficaciaCombinada.x4.length === 0 && eficaciaCombinada.x2.length === 0 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Sin debilidades destacables</span>
                    )}
                  </div>
                </div>

                {/* RESISTENCIAS (0, 1/4 y 1/2) */}
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#00C851', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1rem' }}>Resistente A</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {eficaciaCombinada.x0.map(t => (
                      <div key={t} style={{ position: 'relative' }}>
                        <TypeBadge type={t} small />
                        <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#33b5e5', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', border: '2px solid var(--bg-card)' }}>0</span>
                      </div>
                    ))}
                    {eficaciaCombinada.x025.map(t => (
                      <div key={t} style={{ position: 'relative' }}>
                        <TypeBadge type={t} small />
                        <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#007E33', color: 'white', borderRadius: '50%', width: '25px', height: '20px', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', border: '2px solid var(--bg-card)', padding: '0 2px' }}>0,25</span>
                      </div>
                    ))}
                    {eficaciaCombinada.x05.map(t => <TypeBadge key={t} type={t} small />)}

                    {eficaciaCombinada.x0.length === 0 && eficaciaCombinada.x05.length === 0 && eficaciaCombinada.x025.length === 0 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Sin resistencias</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .type-card:hover {
          filter: brightness(1.2);
        }
        .fade-in {
          animation: slideUpFade 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .btn-close:hover {
          background: rgba(255,255,255,0.2) !important;
          transform: scale(1.1);
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .grid-6 {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
        }
        @media (max-width: 1200px) { .grid-6 { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 768px) { .grid-6 { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 480px) { .grid-6 { grid-template-columns: repeat(2, 1fr); } }
      `}} />
    </div>
  );
}

