import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Gamepad2, PlaySquare, X, Trash2 } from 'lucide-react';
import { PRESET_ROUTES } from '../constants/gameData';
import { PRESET_VARIANTS } from '../constants/rulesData';
import { useAuth } from '../services/AuthContext';
import api from '../services/AuthContext';

const JUEGOS = [
  { id: 'kanto', name: 'Kanto (Rojo/Azul/Verde/Amarillo)' },
  { id: 'johto', name: 'Johto (Oro/Plata/Cristal/HGSS)' },
  { id: 'hoenn', name: 'Hoenn (Rubí/Zafiro/Esmeralda)' },
  { id: 'sinnoh', name: 'Sinnoh (Diamante/Perla/Platino)' },
  { id: 'pokemonz', name: 'Pokémon Z (EricLostie)' },
  { id: 'custom', name: 'Fan Game' }
];

export default function MisPartidas() {
  const [partidas, setPartidas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoCreacion, setCargandoCreacion] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalBorrado, setMostrarModalBorrado] = useState(false);
  const [idBorrando, setIdBorrando] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estado del Modal de Creación
  const [nuevoNombre, setNuevoNombre] = useState('Mi Nuzlocke');
  const [regionSeleccionada, setRegionSeleccionada] = useState('kanto');
  const [vidasIlimitadas, setVidasIlimitadas] = useState(true);
  const [vidas, setVidas] = useState(10);

  const [reglasExtras, setReglasExtras] = useState([]);
  const [seleccionRegla, setSeleccionRegla] = useState('');

  // Reglas personalizadas de la base de datos (localStorage)
  const [reglasPersonalizadasDisponibles, setReglasPersonalizadasDisponibles] = useState([]);

  useEffect(() => {
    const obtenerPartidas = async () => {
      if (user) {
        try {
          const response = await api.get('/api/runs');
          // Mapear de snake_case a camelCase para compatibilidad con el resto del front
          const mapped = response.data.map(p => ({
            ...p,
            vidasMax: p.vidas_max,
            vidasActuales: p.vidas_actuales,
            reglasExtras: p.extra_rules,
            game: p.game_name,
            capturesCount: p.captures_count
          }));
          setPartidas(mapped);
        } catch (error) {
          console.error("Error cargando partidas de la API", error);
        }
      } else {
        try {
          const saved = JSON.parse(localStorage.getItem('lockeRuns') || '[]');
          setPartidas(saved);
        } catch {
          setPartidas([]);
        }
      }
    };
    obtenerPartidas().finally(() => setCargando(false));
  }, [user]);

  const iniciarCreacion = () => {
    try {
      const custom = JSON.parse(localStorage.getItem('customRules') || '[]');
      setReglasPersonalizadasDisponibles(custom);
    } catch {
      setReglasPersonalizadasDisponibles([]);
    }
    setSeleccionRegla('seleccionar');
    setReglasExtras([]);
    setVidasIlimitadas(true);
    setVidas(10);
    setNuevoNombre('Mi Nuzlocke');
    setRegionSeleccionada('kanto');
    setMostrarModal(true);
  };

  const eliminarPartida = (id) => {
    setIdBorrando(id);
    setMostrarModalBorrado(true);
  };

  const confirmarEliminacion = async () => {
    if (user && !isNaN(idBorrando)) {
      try {
        await api.delete(`/api/runs/${idBorrando}`);
        setPartidas(partidas.filter(p => p.id !== idBorrando));
      } catch (error) {
        console.error("Error borrando partida", error);
      }
    } else {
      const updated = partidas.filter(p => p.id !== idBorrando);
      setPartidas(updated);
      localStorage.setItem('lockeRuns', JSON.stringify(updated));
    }
    setMostrarModalBorrado(false);
    setIdBorrando(null);
  };

  const handleAddRule = (e) => {
    e.preventDefault();
    if (!seleccionRegla || seleccionRegla === 'seleccionar') return;
    if (!reglasExtras.includes(seleccionRegla)) {
      setReglasExtras([...reglasExtras, seleccionRegla]);
    }
  };

  const handleCreate = async () => {
    if (!nuevoNombre.trim() || !regionSeleccionada) return;

    let locations = [];
    if (regionSeleccionada !== 'custom') {
      locations = PRESET_ROUTES[regionSeleccionada] || [];
    }

    if (locations.length === 0) {
      locations = ['Pokémon Inicial'];
    }

    const encounters = locations.map(lugar => ({
      id: Math.random().toString(36).substr(2, 9),
      lugar,
      pokemon: '',
      img: null,
      mote: '',
      status: 'Pendiente'
    }));

    const maxVidasVal = vidasIlimitadas ? null : (parseInt(vidas, 10) || 1);
    const gameName = JUEGOS.find(j => j.id === regionSeleccionada)?.name || 'Desconocido';

    if (user) {
      setCargandoCreacion(true);
      try {
        const response = await api.post('/api/runs', {
          name: nuevoNombre,
          game_id: regionSeleccionada,
          game_name: gameName,
          vidas_max: maxVidasVal,
          vidas_actuales: maxVidasVal,
          extra_rules: reglasExtras,
          encounters: encounters
        });

        const created = {
          ...response.data,
          vidasMax: response.data.vidas_max,
          vidasActuales: response.data.vidas_actuales,
          reglasExtras: response.data.extra_rules,
          game: response.data.game_name
        };

        setPartidas([created, ...partidas]);
        setMostrarModal(false);
        navigate(`/tracker/${created.id}`);
      } catch (error) {
        console.error("Error creando partida en API", error);
        alert("Error al crear la partida: " + (error.response?.data?.message || error.message));
      } finally {
        setCargandoCreacion(false);
      }
    } else {
      const newPartida = {
        id: Date.now().toString(),
        name: nuevoNombre,
        gameId: regionSeleccionada,
        game: gameName,
        vidasMax: maxVidasVal,
        vidasActuales: maxVidasVal,
        reglasExtras: [...reglasExtras],
        encounters
      };

      const updated = [...partidas, newPartida];
      localStorage.setItem('lockeRuns', JSON.stringify(updated));
      setPartidas(updated);
      setMostrarModal(false);
      navigate(`/tracker/${newPartida.id}`);
    }
  };


  return (
    <div className="container" style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
      <div className="partidas-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 className="title-glow" style={{ fontSize: '3rem' }}>
          Mis <span className="gradient-text">Partidas</span>
        </h1>
        <button className="btn btn-primary" onClick={iniciarCreacion}>
          <PlusCircle size={20} /> Crear Partida
        </button>
      </div>

      {!user && (
        <div className="glass" style={{
          marginBottom: '2rem',
          padding: '1rem 1.5rem',
          borderLeft: '4px solid var(--warning-border)',
          background: 'var(--warning-bg)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          borderRadius: '8px'
        }}>
          <div style={{ backgroundColor: 'var(--warning-border)', color: '#000', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0 }}>!</div>
          <p style={{ margin: 0, color: 'var(--warning-text)', fontSize: '0.95rem' }}>
            <strong>Atención Entrenador:</strong> Estás usando el almacenamiento local. <Link to="/login" style={{ color: 'var(--warning-border)', fontWeight: 'bold', textDecoration: 'underline' }}>Inicia sesión</Link> para guardar tus partidas en la nube y no perderlas.
          </p>
        </div>
      )}

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '6rem' }}>
          <div className="loader"></div>
          <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontFamily: 'Outfit' }}>Cargando tus aventuras...</p>
        </div>
      ) : partidas.length === 0 ? (
        <div className="card glass" style={{ textAlign: 'center', padding: '4rem' }}>
          <Gamepad2 size={64} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h2>Aún no tienes partidas</h2>
          <p>Crea tu primer Nuzlocke para empezar a llevar el registro de tus capturas.</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {partidas.map(partida => (
            <div key={partida.id} className="card glass" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <span className="type-badge" style={{ background: 'var(--accent)', textTransform: 'uppercase' }}>
                  {partida.game.split(' ')[0]}
                </span>
              </div>
              <h3 style={{ marginBottom: '0.5rem', marginTop: '1rem' }}>{partida.name}</h3>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: partida.vidasActuales !== 0 ? 'var(--text-main)' : 'var(--primary)', marginBottom: '1.5rem' }}>
                Vidas: {partida.vidasMax === null ? 'Ilimitadas (∞)' : `${partida.vidasActuales} / ${partida.vidasMax}`}
              </div>
              <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                Capturas: {partida.capturesCount ?? (partida.encounters?.filter(e => e.pokemon).length || 0)}
              </p>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to={`/tracker/${partida.id}`} className="btn btn-primary" style={{ flex: 1 }}>
                  <PlaySquare size={18} /> Jugar
                </Link>
                <button className="btn btn-outline" onClick={() => eliminarPartida(partida.id)}>
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE CREACIÓN DE PARTIDA */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setMostrarModal(false)}>
          <div className="modal-content glass" style={{ flexDirection: 'column', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Crear Partida</h2>
              <button className="modal-close" style={{ position: 'relative', top: 0, right: 0 }} onClick={() => setMostrarModal(false)}><X size={24} /></button>
            </div>

            <div style={{ padding: '2rem' }}>
              <div className="form-group">
                <label className="form-label">Nombre de tu Locke</label>
                <input className="input" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} />
              </div>

              <div className="form-group partidas-modal-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                <div>
                  <label className="form-label">Región Principal</label>
                  <select className="input" value={regionSeleccionada} onChange={e => setRegionSeleccionada(e.target.value)}>
                    {JUEGOS.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Vidas</span>
                    <label style={{ fontSize: '0.8rem', display: 'flex', gap: '0.3rem', alignItems: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      <input type="checkbox" checked={vidasIlimitadas} onChange={e => setVidasIlimitadas(e.target.checked)} />
                      Ilimitadas
                    </label>
                  </label>
                  <input
                    type="number"
                    className="input"
                    min="1" max="99"
                    value={vidasIlimitadas ? '' : vidas}
                    onChange={e => setVidas(e.target.value)}
                    disabled={vidasIlimitadas}
                    placeholder={vidasIlimitadas ? '∞' : '10'}
                    style={{ opacity: vidasIlimitadas ? 0.3 : 1 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tus Normas (Elegidas selectivamente)</label>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {/* Las reglas universales son implícitas, no hace falta saturar la UI. */}
                  <span style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '0.85rem' }}>Muerte Permanente + Captura Limitada + Motes</span>

                  {reglasExtras.map((rule, idx) => (
                    <span key={idx} style={{ padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.4)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--accent)' }}>
                      {rule}
                      <button type="button" onClick={(e) => { e.preventDefault(); setReglasExtras(reglasExtras.filter((_, i) => i !== idx)); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>

                <form style={{ display: 'flex', gap: '0.5rem' }} onSubmit={handleAddRule}>
                  <select className="input" value={seleccionRegla} onChange={e => setSeleccionRegla(e.target.value)}>
                    <option value="seleccionar">Seleccionar...</option>
                    <optgroup label="Variantes Oficiales">
                      {PRESET_VARIANTS.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </optgroup>
                    <optgroup label="Tus Reglas Privadas">
                      {reglasPersonalizadasDisponibles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </optgroup>
                  </select>
                  <button className="btn btn-outline" type="submit" style={{ whiteSpace: 'nowrap' }}>Añadir ✓</button>
                </form>
              </div>
            </div>

            <div style={{ padding: '2rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'rgba(0,0,0,0.3)' }}>
              <button className="btn btn-outline" onClick={() => setMostrarModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={cargandoCreacion}>
                {cargandoCreacion ? <div className="loader" style={{ width: '20px', height: '20px', borderTopColor: 'black' }}></div> : (
                  <>
                    Iniciar Aventura <PlaySquare size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
      {mostrarModalBorrado && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setMostrarModalBorrado(false)}>
          <div className="modal-content glass" style={{ flexDirection: 'column', maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>
              <Trash2 size={64} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ marginBottom: '1rem' }}>¿Borrar Partida?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>
              Esta acción no se puede deshacer. Se perderán todos los datos de capturas y progreso de este Nuzlocke.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setMostrarModalBorrado(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--primary)', color: 'black' }} onClick={confirmarEliminacion}>
                Sí, Borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
