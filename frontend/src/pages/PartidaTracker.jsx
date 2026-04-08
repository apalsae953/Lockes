import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Download, Trash2, Camera, Heart, HeartCrack, Infinity, ScrollText, Swords, MapPin, GripVertical } from 'lucide-react';
import { UNIVERSAL_RULES, PRESET_VARIANTS } from '../constants/rulesData';
import { REGION_BOSSES } from '../constants/gameData';

export default function PartidaTracker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [partida, setPartida] = useState(null);
  const [availableCustomRules, setAvailableCustomRules] = useState([]);
  const [toast, setToast] = useState(null);
  
  // Drag and Drop state
  const [draggingId, setDraggingId] = useState(null);

  useEffect(() => {
    try {
      const savedCustom = JSON.parse(localStorage.getItem('customRules') || '[]');
      setAvailableCustomRules(savedCustom);
    } catch {}
    
    try {
      const saved = JSON.parse(localStorage.getItem('lockeRuns') || '[]');
      const found = saved.find(p => p.id === id);
      if (!found) {
        navigate('/mis-partidas');
        return;
      }
      setPartida(found);
    } catch {
      navigate('/mis-partidas');
    }
  }, [id, navigate]);

  const guardarPartida = (p = partida) => {
    const saved = JSON.parse(localStorage.getItem('lockeRuns') || '[]');
    const updated = saved.map(item => item.id === p.id ? p : item);
    localStorage.setItem('lockeRuns', JSON.stringify(updated));
    setPartida({...p});
  };

  const handleUpdateVidas = (modifier) => {
    if (partida.vidasMax === null) return;
    const newVal = partida.vidasActuales + modifier;
    if (newVal >= 0 && newVal <= partida.vidasMax) {
      guardarPartida({ ...partida, vidasActuales: newVal });
    }
  };

  const handleUpdateEncounter = (encId, field, value) => {
    const updatedPartida = { ...partida };
    const encIndex = updatedPartida.encounters.findIndex(e => e.id === encId);
    if (encIndex >= 0) {
      const current = updatedPartida.encounters[encIndex];
      
      // Auto-reduce life logic
      if (field === 'status' && value === 'Muerto' && current.status !== 'Muerto') {
        if (updatedPartida.vidasMax !== null && updatedPartida.vidasActuales > 0) {
          updatedPartida.vidasActuales -= 1;
        }
      }

      current[field] = value;
      guardarPartida(updatedPartida);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const fetchPokemonImage = async (encId, pokemonName) => {
    if (!pokemonName || !pokemonName.trim()) {
      handleUpdateEncounter(encId, 'img', null);
      return;
    }
    try {
      let cleanName = pokemonName.toLowerCase().trim().replace(/ /g, '-');
      const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${cleanName}`);
      handleUpdateEncounter(encId, 'img', res.data.sprites.front_default);
    } catch {
      handleUpdateEncounter(encId, 'img', null);
    }
  };

  const addCustomRoute = () => {
    const updated = { ...partida };
    updated.encounters.push({
      id: Math.random().toString(36).substr(2, 9),
      lugar: 'Nueva Ruta / Cueva...',
      pokemon: '',
      img: null,
      mote: '',
      status: 'Pendiente'
    });
    guardarPartida(updated);
    showToast('Nueva ruta añadida al final de la tabla');
  };

  const deleteEncounter = (encId) => {
    const updated = { ...partida };
    updated.encounters = updated.encounters.filter(e => e.id !== encId);
    guardarPartida(updated);
  };

  // Drag and Drop handlers
  const handleDragStart = (e, encId) => {
    setDraggingId(encId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetEncId) => {
    e.preventDefault();
    if (draggingId === targetEncId) {
      setDraggingId(null);
      return;
    }

    const updatedPartida = { ...partida };
    const encounters = [...updatedPartida.encounters];
    const sourceIndex = encounters.findIndex(enc => enc.id === draggingId);
    const targetIndex = encounters.findIndex(enc => enc.id === targetEncId);
    
    if (sourceIndex >= 0 && targetIndex >= 0) {
      const [removed] = encounters.splice(sourceIndex, 1);
      encounters.splice(targetIndex, 0, removed);
      updatedPartida.encounters = encounters;
      guardarPartida(updatedPartida);
    }
    setDraggingId(null);
  };

  const exportCSV = () => {
    const header = ['LUGAR', 'POKEMON', 'MOTE', 'ESTADO'];
    const rows = partida.encounters.map(e => [e.lugar, e.pokemon, e.mote, e.status]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [header, ...rows].map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `locke_${partida.name.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!partida) return <div className="loader" style={{margin: '5rem auto', display: 'block'}}></div>;

  const allKnownRules = [...PRESET_VARIANTS, ...availableCustomRules];
  const isInfinite = partida.vidasMax === null;
  const bosses = REGION_BOSSES[partida.gameId] || [];
  
  const RuleBlock = ({ title, description, color }) => (
    <div style={{ marginBottom: '1rem', borderLeft: `3px solid ${color}`, paddingLeft: '1rem' }}>
      <h4 style={{ color: color, marginBottom: '0.25rem', fontSize: '1.1rem' }}>{title}</h4>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, fontSize: '0.95rem' }}>{description}</p>
    </div>
  );

  return (
    <div className="container" style={{ paddingBottom: '4rem', paddingTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button className="btn btn-outline" onClick={() => navigate('/mis-partidas')}>
          <ArrowLeft size={18} /> Volver a Partidas
        </button>
        <span className="type-badge" style={{ background: 'var(--accent)', textTransform: 'uppercase', fontSize: '1rem', padding: '0.5rem 1rem' }}>
          Juego: {partida.game}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
        <div className="glass" style={{ padding: '2rem' }}>
          <input 
            className="input" 
            style={{ fontSize: '2.5rem', fontWeight: 800, background: 'transparent', border: 'none', borderBottom: '2px solid var(--glass-border)', borderRadius: 0, padding: '0.5rem 0', width: '100%', marginBottom: '2rem' }}
            value={partida.name} 
            onChange={(e) => guardarPartida({ ...partida, name: e.target.value })}
            placeholder="Nombre de la partida..."
          />
          
          <h3 style={{ color: 'var(--accent)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ScrollText /> Reglamento Activo
          </h3>
          
          {UNIVERSAL_RULES.map(r => (
            <RuleBlock key={r.id} title={r.name} description={r.description} color="var(--primary)" />
          ))}

          {partida.extraRules.map((ruleName, idx) => {
            const foundObj = allKnownRules.find(k => k.name === ruleName);
            const desc = foundObj ? foundObj.description : "Regla personalizada del jugador.";
            return <RuleBlock key={`ex_${idx}`} title={ruleName} description={desc} color="var(--accent)" />;
          })}
        </div>

        <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Contador de Vidas</h3>
          <div style={{ position: 'relative' }}>
            <Heart size={120} fill={isInfinite || partida.vidasActuales > 0 ? "var(--primary)" : "transparent"} color="var(--primary)" strokeWidth={isInfinite || partida.vidasActuales > 0 ? 0 : 2} style={{ filter: 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.4))' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 900, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              {isInfinite ? <Infinity size={64} /> : partida.vidasActuales}
            </div>
          </div>
          
          {!isInfinite && (
            <>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button className="btn btn-outline" onClick={() => handleUpdateVidas(-1)} disabled={partida.vidasActuales === 0} style={{ padding: '1rem', borderRadius: '50%' }}>
                  <HeartCrack size={24} />
                </button>
                <button className="btn btn-outline" onClick={() => handleUpdateVidas(1)} disabled={partida.vidasActuales >= partida.vidasMax} style={{ padding: '1rem', borderRadius: '50%' }}>
                  <Heart size={24} />
                </button>
              </div>
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Máximo: {partida.vidasMax} Vidas</p>
            </>
          )}
          {isInfinite && <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Vidas Infinitas</p>}
        </div>
      </div>

      {bosses.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Swords /> Gimnasios y Alto Mando (Niveles Máximos)
          </h2>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
            {bosses.map((boss, idx) => (
              <div key={idx} className="card glass" style={{ minWidth: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.5rem 1rem', flexShrink: 0 }}>
                <div style={{ width: '80px', height: '80px', marginBottom: '1rem', background: 'var(--bg-darker)', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)' }}>
                  <img src={`https://play.pokemonshowdown.com/sprites/trainers/${boss.img}.png`} alt={boss.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'; e.target.style.objectFit = 'contain'; e.target.style.padding = '10px'; }} />
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{boss.title}</div>
                <h4 style={{ margin: '0.5rem 0' }}>{boss.name}</h4>
                <div className="type-badge" style={{ background: 'var(--primary)', color: 'black' }}>Nvl: {boss.level}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin /> Tus Capturas
        </h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={addCustomRoute}>
            <Plus size={18} /> Nueva Ruta
          </button>
          <button className="btn btn-primary" onClick={exportCSV} style={{ backgroundColor: '#22c55e', color: '#000', fontWeight: 'bold' }}>
            <Download size={18} /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="excel-table">
          <thead>
            <tr>
              <th style={{ width: '5%', textAlign: 'center' }}></th>
              <th style={{ width: '22%' }}>Lugar (Ruta/Ciudad)</th>
              <th style={{ width: '23%' }}>Especie</th>
              <th style={{ width: '25%' }}>Apodo</th>
              <th style={{ width: '15%' }}>Estado</th>
              <th style={{ width: '10%', textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {partida.encounters.map((enc) => (
              <tr 
                key={enc.id}
                draggable
                onDragStart={(e) => handleDragStart(e, enc.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, enc.id)}
                onDragEnd={() => setDraggingId(null)}
                style={{ 
                  opacity: draggingId === enc.id ? 0.4 : 1, 
                  transition: 'opacity 0.2s',
                  background: draggingId === enc.id ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent'
                }}
              >
                <td style={{ textAlign: 'center', cursor: 'grab', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GripVertical size={18} />
                  </div>
                </td>
                <td>
                  <input 
                    className="input" 
                    value={enc.lugar} 
                    onChange={e => handleUpdateEncounter(enc.id, 'lugar', e.target.value)}
                    style={{ background: 'transparent', border: 'none', padding: '0.25rem 0.5rem' }}
                  />
                </td>
                <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {enc.img ? (
                      <img src={enc.img} alt={enc.pokemon} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Camera size={16} opacity={0.3} />
                    )}
                  </div>
                  <input 
                    className="input" 
                    placeholder="Bulbasaur... Enter"
                    value={enc.pokemon} 
                    onChange={e => handleUpdateEncounter(enc.id, 'pokemon', e.target.value)}
                    onBlur={(e) => fetchPokemonImage(enc.id, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !!enc.pokemon ? fetchPokemonImage(enc.id, e.target.value) : null}
                    style={{ background: 'transparent', border: '1px solid var(--glass-border)', flex: 1 }}
                  />
                </td>
                <td>
                  <input 
                    className="input" 
                    placeholder="Apodo..."
                    value={enc.mote} 
                    onChange={e => handleUpdateEncounter(enc.id, 'mote', e.target.value)}
                    style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}
                  />
                </td>
                <td>
                  <select 
                    className={`input status-badge status-${enc.status.toLowerCase().replace(' ', '')}`} 
                    value={enc.status}
                    onChange={e => handleUpdateEncounter(enc.id, 'status', e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.3)', width: '100%', padding: '0.5rem' }}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Vivo">Vivo</option>
                    <option value="Muerto">Muerto</option>
                    <option value="Caja">En Caja</option>
                  </select>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button onClick={() => deleteEncounter(enc.id)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} title="Eliminar fila">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {partida.encounters.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No hay lugares de captura registrados.
          </div>
        )}
      </div>

      {toast && (
        <div className="toast-notification glass" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 24px',
          background: 'var(--bg-darker)',
          borderLeft: '4px solid var(--accent)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          <MapPin size={18} color="var(--accent)" />
          <span style={{ fontWeight: 'bold' }}>{toast}</span>
        </div>
      )}
    </div>
  );
}
