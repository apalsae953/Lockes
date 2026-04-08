import { Shield, Skull, Sword, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container">
      <section className="hero">
        <h1 className="title-glow">Sobrevive al <span className="gradient-text">Nuzlocke</span></h1>
        <p>
          El desafío definitivo para cualquier entrenador Pokémon. Descubre qué son los Nuzlockes, conoce sus estrictas reglas y prepárate para una aventura donde cada decisión importa.
        </p>
        <Link to="/pokedex" className="btn btn-primary">
          <Zap size={20} /> Explorar Pokédex
        </Link>
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
