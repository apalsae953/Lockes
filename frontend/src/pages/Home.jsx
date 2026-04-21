import React, { useState } from 'react';
import { Shield, Skull, Sword, Zap, Gamepad2, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [showNotice, setShowNotice] = useState(true);

  return (
    <div className="container">
      {/* AVISO DE SERVIDOR GRATUITO (FLOTANTE) */}
      {showNotice && (
        <div className="glass home-notice" style={{
          position: 'fixed',
          top: '7rem',
          right: '2rem',
          zIndex: 1000,
          maxWidth: '420px',
          padding: '1.25rem 1.5rem',
          borderLeft: '4px solid var(--info-border)',
          background: 'var(--glass-bg)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          borderRadius: '16px',
          boxShadow: 'var(--glass-shadow)',
          animation: 'slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{ color: 'var(--info-border)', flexShrink: 0 }}><Info size={28} /></div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--info-text)', lineHeight: '1.5', paddingRight: '1rem' }}>
            <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.2rem', fontSize: '1rem' }}>Aviso del Centro Pokémon:</strong> 
            Esta web utiliza un servidor gratuito que entra en reposo. Puede tardar hasta un minuto en reaccionar inicialmente y es normal experimentar lentitud puntual. ¡Gracias por tu paciencia!
          </p>
          <button 
            onClick={() => setShowNotice(false)}
            style={{ 
              position: 'absolute', 
              top: '0.75rem', 
              right: '0.75rem', 
              background: 'rgba(255,255,255,0.05)', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.3rem',
              borderRadius: '8px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
            title="Cerrar aviso"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="hero">
        <h1 className="title-glow">Crea tu <span className="gradient-text">Nuzlocke</span></h1>
        <p>
          El desafío definitivo para cualquier entrenador Pokémon. Descubre qué son los Nuzlockes, conoce sus estrictas reglas y prepárate para una aventura donde cada decisión importa.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/pokedex" className="btn btn-primary">
            <Zap size={20} /> Explorar Pokédex
          </Link>
          <Link to="/mis-partidas" className="btn btn-outline">
            <Gamepad2 size={20} /> Ver Mis Partidas
          </Link>
        </div>
      </section>

      <section style={{ marginBottom: '6rem' }}>
        <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Reglas Básicas Universales</h2>
        <div className="grid grid-3">
          <div className="card glass">
            <h3 style={{ color: 'var(--primary)' }}><Skull /> Muerte Permanente</h3>
            <p>Si tu Pokémon se debilita en combate, se considera "muerto". Debe ser liberado o guardado de forma permanente en una caja del PC destinada a ser un cementerio.</p>
          </div>
          <div className="card glass">
            <h3 style={{ color: 'var(--accent)' }}><Shield /> Captura Limitada</h3>
            <p>Solo puedes atrapar al <strong>primer Pokémon salvaje</strong> que encuentres en cada ruta o área. Si lo debilitas o huye, no puedes atrapar nada más allí.</p>
          </div>
          <div className="card glass">
            <h3 style={{ color: 'var(--type-electric)' }}><Sword /> Vínculo (Motes)</h3>
            <p>Todos los Pokémon atrapados deben recibir un mote (apodo) para que formes un vínculo emocional más fuerte con ellos.</p>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '6rem' }}>
        <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Tipos de Lockes (Variantes)</h2>
        <div className="grid grid-3">
          <div className="card glass">
            <h3>Hardcore Nuzlocke</h3>
            <p>Añade restricciones severas: no se pueden usar objetos curativos en combate, límite de nivel estricto según los líderes de gimnasio, y se debe jugar en modo de combate "Set".</p>
          </div>
          <div className="card glass">
            <h3>Randomlocke</h3>
            <p>Se juega con el ROM alterado (randomizer) para que los Pokémon salvajes, iniciales, objetos o movimientos sean completamente aleatorios y sorpresivos.</p>
          </div>
          <div className="card glass">
            <h3>Wonderlocke / Egglocke</h3>
            <p>Cada vez que atrapas un Pokémon, debes intercambiarlo de inmediato mediante Intercambio Prodigioso o sustituirlo por el Huevo misterioso de un amigo.</p>
          </div>
          <div className="card glass">
            <h3>Soul Link</h3>
            <p>Cooperativo para dos jugadores donde los Pokémon atrapados en la misma ruta están "vinculados". Si uno muere en el juego de uno, su pareja muere en el juego del otro.</p>
          </div>
          <div className="card glass">
            <h3>Monolocke</h3>
            <p>Limitado a usar solo un tipo específico de Pokémon (por ejemplo, todo tu equipo debe ser tipo Agua) a lo largo de toda la aventura.</p>
          </div>
          <div className="card glass">
            <h3>Wedlocke</h3>
            <p>Los Pokémon se emparejan por género. Solo pueden luchar junto a su pareja; si uno muere durante el combate, el compañero asume toda la responsabilidad.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
