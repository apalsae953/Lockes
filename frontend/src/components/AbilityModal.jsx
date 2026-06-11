import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Info, Sparkles, Users, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { formatPokemonName } from '../services/pokeApi';

export default function AbilityModal({ ability, onClose }) {
  const [detalles, setDetalles] = useState(null);
  const [estaCargando, setEstaCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    cargarDetalles();
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [ability.url]);

  const cargarDetalles = async () => {
    setEstaCargando(true);
    try {
      const res = await axios.get(ability.url);
      const data = res.data;

      // Nombre en español de España
      const nombreEs = data.names.find(n => n.language.name === 'es')?.name || ability.esName || ability.name.replace(/-/g, ' ');

      // Todas las descripciones flavor_text en español (una por juego), de más reciente a más antigua
      const flavorsEs = data.flavor_text_entries
        .filter(e => e.language.name === 'es')
        .map(e => e.flavor_text.replace(/\n/g, ' ').replace(/º­/g, '').trim());
      // Eliminar duplicados manteniendo el orden
      const flavorsEsUnicos = [...new Set(flavorsEs)];

      // Fallback a inglés si no hay español
      const flavorEn = data.flavor_text_entries.find(e => e.language.name === 'en');
      const descripcionPrincipal = flavorsEsUnicos[0] || flavorEn?.flavor_text?.replace(/\n/g, ' ').replace(/­/g, '') || 'Sin descripción disponible.';

      // Efecto detallado: prioridad español, fallback inglés con nota
      const effectEs = data.effect_entries.find(e => e.language.name === 'es');
      const effectEn = data.effect_entries.find(e => e.language.name === 'en');

      let efectoDetallado = '';
      let efectoCorto = '';
      let efectoEnIngles = false;

      if (effectEs) {
        efectoDetallado = effectEs.effect;
        efectoCorto = effectEs.short_effect || '';
      } else if (effectEn) {
        efectoDetallado = effectEn.effect;
        efectoCorto = effectEn.short_effect || '';
        efectoEnIngles = true;
      } else {
        efectoDetallado = 'Sin información detallada disponible.';
      }

      // Reemplazar $effect_chance con el porcentaje real si existe
      if (data.effect_chance) {
        efectoDetallado = efectoDetallado.replace(/\$effect_chance/g, `${data.effect_chance}%`);
        efectoCorto = efectoCorto.replace(/\$effect_chance/g, `${data.effect_chance}%`);
      }

      // Pokémon que tienen esta habilidad
      const pokemonList = data.pokemon.map(p => ({
        name: p.pokemon.name,
        isHidden: p.is_hidden,
        id: p.pokemon.url.split('/').filter(Boolean).pop()
      }))
        .filter(p => {
          const id = parseInt(p.id);
          return id <= 10300 && !p.name.includes('-totem');
        })
        .sort((a, b) => parseInt(a.id) - parseInt(b.id));

      setDetalles({
        nombreEs,
        nombreEn: data.name.replace(/-/g, ' '),
        descripcion: descripcionPrincipal,
        descripcionesEs: flavorsEsUnicos,
        efectoDetallado,
        efectoCorto,
        efectoEnIngles,
        pokemon: pokemonList,
        generacion: data.generation?.name?.replace('generation-', 'Gen ').toUpperCase() || ''
      });
    } catch (err) {
      console.error('Error al cargar los detalles de la habilidad', err);
      setDetalles({
        nombreEs: ability.esName || ability.name,
        nombreEn: ability.name,
        descripcion: 'Error al cargar la descripción.',
        descripcionesEs: [],
        efectoDetallado: 'Error al cargar el efecto.',
        efectoCorto: '',
        efectoEnIngles: false,
        pokemon: [],
        generacion: ''
      });
    }
    setEstaCargando(false);
  };

  const manejarClicSuperposicion = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose();
    }
  };

  const colorPrincipal = 'var(--primary)';

  const renderPagina1 = () => (
    <div className="fade-in">
      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', color: colorPrincipal, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Info size={18} /> Descripción
      </h3>
      <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: 'var(--text-main)', fontStyle: 'italic', marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        "{detalles.descripcion}"
      </p>

      {detalles.generacion && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', padding: '0.3rem 0.8rem', borderRadius: '8px', fontWeight: 600 }}>
            {detalles.generacion}
          </span>
        </div>
      )}
    </div>
  );

  const renderPagina2 = () => (
    <div className="fade-in">
      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', color: colorPrincipal, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Sparkles size={18} /> Efecto Detallado
      </h3>

      {/* Efecto mecánico detallado — ARRIBA */}
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Efecto en combate
        </div>
        {detalles.efectoCorto && (
          <p style={{ margin: '0 0 0.8rem 0', color: 'var(--text-main)', lineHeight: 1.6, fontSize: '0.9rem', fontWeight: 600 }}>{detalles.efectoCorto}</p>
        )}
        <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.9rem' }}>{detalles.efectoDetallado}</p>
      </div>

      {/* Descripciones en español (del juego) — ABAJO */}
      {detalles.descripcionesEs.length > 0 && (
        <div style={{ background: 'rgba(239, 68, 68, 0.06)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descripción en español</div>
          {detalles.descripcionesEs.map((desc, i) => (
            <p key={i} style={{ margin: i < detalles.descripcionesEs.length - 1 ? '0 0 0.6rem 0' : 0, color: 'var(--text-main)', lineHeight: 1.6, fontSize: '0.95rem', fontStyle: 'italic' }}>
              "{desc}"
            </p>
          ))}
        </div>
      )}
    </div>
  );

  const renderPagina3 = () => {
    const normales = detalles.pokemon.filter(p => !p.isHidden);
    const ocultas = detalles.pokemon.filter(p => p.isHidden);

    return (
      <div className="fade-in">
        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem', color: colorPrincipal, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} /> Pokémon con esta habilidad
          <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {detalles.pokemon.length} Pokémon
          </span>
        </h3>

        {detalles.pokemon.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontStyle: 'italic' }}>
            No se encontraron Pokémon con esta habilidad.
          </p>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
            {normales.length > 0 && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Habilidad normal ({normales.length})
                </div>
                <div className="ability-pokemon-grid" style={{ marginBottom: '1.5rem' }}>
                  {normales.map(p => (
                    <div key={`normal-${p.id}`} className="ability-pokemon-chip">
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                        alt={p.name}
                        loading="lazy"
                      />
                      <span>{formatPokemonName(p.name)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {ocultas.length > 0 && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>◆</span> Habilidad oculta ({ocultas.length})
                </div>
                <div className="ability-pokemon-grid">
                  {ocultas.map(p => (
                    <div key={`hidden-${p.id}`} className="ability-pokemon-chip" style={{ borderColor: 'rgba(239, 68, 68, 0.15)' }}>
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                        alt={p.name}
                        loading="lazy"
                      />
                      <span>{formatPokemonName(p.name)}</span>
                      <span className="ability-hidden-badge">◆ Oculta</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={manejarClicSuperposicion} style={{ zIndex: 99999 }}>
      <div className="modal-content glass ability-modal-wrapper" style={{ border: `1px solid ${colorPrincipal}`, height: '580px', display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {estaCargando && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <Loader2 className="loader" size={48} />
          </div>
        )}

        <button className="modal-close" onClick={onClose}><X size={24} /></button>

        {/* Panel izquierdo */}
        <div className="ability-modal-left">
          <div className="ability-modal-icon-wrap">
            <Sparkles size={40} color="var(--primary)" />
          </div>
          <div>
            <h2 className="ability-modal-title">
              {detalles?.nombreEs || ability.esName || ability.name}
            </h2>
            <p className="ability-modal-subtitle">
              {detalles?.nombreEn || ability.name}
            </p>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="ability-modal-right">
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {!estaCargando && detalles && (
              <>
                {paginaActual === 1 && renderPagina1()}
                {paginaActual === 2 && renderPagina2()}
                {paginaActual === 3 && renderPagina3()}
              </>
            )}
          </div>

          {/* Navegación de páginas */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
      `}} />
    </div>
  );
}
