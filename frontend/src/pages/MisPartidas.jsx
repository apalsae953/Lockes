import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Gamepad2, PlaySquare, X, Trash2 } from 'lucide-react';
import { PRESET_ROUTES } from '../constants/gameData';
import { PRESET_VARIANTS } from '../constants/rulesData';

const JUEGOS = [
  { id: 'kanto', name: 'Kanto (Rojo/Azul/Amarillo/Fuego)' },
  { id: 'johto', name: 'Johto (Oro/Plata/Cristal/HGSS)' },
  { id: 'hoenn', name: 'Hoenn (Rubí/Zafiro/Esmeralda)' },
  { id: 'sinnoh', name: 'Sinnoh (Diamante/Perla/Platino)' },
  { id: 'custom', name: 'Juego Fan / Aleatorio' }
];

export default function MisPartidas() {
  const [partidas, setPartidas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Create Modal State
  const [newName, setNewName] = useState('Mi Nuzlocke Épico');
  const [selectedRegion, setSelectedRegion] = useState('kanto');
  const [vidasIlimitadas, setVidasIlimitadas] = useState(true);
  const [vidas, setVidas] = useState(10);
  
  const [extraRules, setExtraRules] = useState([]);
  const [ruleSelect, setRuleSelect] = useState('');
  
  // Custom rules from DB
  const [availableCustomRules, setAvailableCustomRules] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('lockeRuns') || '[]');
      setPartidas(saved);
    } catch {
      setPartidas([]);
    }
  }, []);

  const initCreation = () => {
    try {
      const custom = JSON.parse(localStorage.getItem('customRules') || '[]');
      setAvailableCustomRules(custom);
    } catch {
      setAvailableCustomRules([]);
    }
    setRuleSelect(PRESET_VARIANTS[0]?.name || '');
    setExtraRules([]);
    setVidasIlimitadas(true);
    setVidas(10);
    setNewName('Mi Nuzlocke Épico');
    setSelectedRegion('kanto');
    setShowModal(true);
  };

  const removePartida = (id) => {
    const updated = partidas.filter(p => p.id !== id);
    setPartidas(updated);
    localStorage.setItem('lockeRuns', JSON.stringify(updated));
  };

  const handleAddRule = (e) => {
    e.preventDefault();
    if (!ruleSelect) return;
    if (!extraRules.includes(ruleSelect)) {
      setExtraRules([...extraRules, ruleSelect]);
    }
  };

  const handleCreate = () => {
    if (!newName.trim() || !selectedRegion) return;

    let locations = [];
    if (selectedRegion !== 'custom') {
      locations = PRESET_ROUTES[selectedRegion] || [];
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

    const newPartida = {
      id: Date.now().toString(),
      name: newName,
      gameId: selectedRegion, // Needed to resolve bosses
      game: JUEGOS.find(j => j.id === selectedRegion)?.name || 'Desconocido',
      vidasMax: maxVidasVal,
      vidasActuales: maxVidasVal,
      extraRules: [...extraRules],
      encounters
    };

    const updated = [...partidas, newPartida];
    localStorage.setItem('lockeRuns', JSON.stringify(updated));
    setPartidas(updated);
    setShowModal(false);
    
    navigate(`/tracker/${newPartida.id}`);
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 className="title-glow" style={{ fontSize: '3rem' }}>
          Mis <span className="gradient-text">Partidas</span>
        </h1>
        <button className="btn btn-primary" onClick={initCreation}>
          <PlusCircle size={20} /> Crear Partida
        </button>
      </div>

      {partidas.length === 0 ? (
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
                Capturas: {partida.encounters?.filter(e => e.pokemon).length || 0}
              </p>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to={`/tracker/${partida.id}`} className="btn btn-primary" style={{ flex: 1 }}>
                  <PlaySquare size={18} /> Jugar
                </Link>
                <button className="btn btn-outline" onClick={() => removePartida(partida.id)}>
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE GAME MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowModal(false)}>
          <div className="modal-content glass" style={{ flexDirection: 'column', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Crear Partida</h2>
              <button className="modal-close" style={{ position: 'relative', top: 0, right: 0 }} onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div className="form-group">
                <label className="form-label">Nombre de tu Locke</label>
                <input className="input" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                <div>
                  <label className="form-label">Región Principal</label>
                  <select className="input" value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}>
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
                  {/* Basic Universal ones are implicit, we don't need to clog the UI here, or we can just say they apply. */}
                  <span style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '0.85rem' }}>Muerte Permanente + Captura Limitada + Motes</span>
                  
                  {extraRules.map((rule, idx) => (
                    <span key={idx} style={{ padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.4)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--accent)' }}>
                      {rule}
                      <button type="button" onClick={(e) => { e.preventDefault(); setExtraRules(extraRules.filter((_, i) => i !== idx)); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <X size={14}/>
                      </button>
                    </span>
                  ))}
                </div>
                
                <form style={{ display: 'flex', gap: '0.5rem' }} onSubmit={handleAddRule}>
                  <select className="input" value={ruleSelect} onChange={e => setRuleSelect(e.target.value)}>
                    <optgroup label="Variantes Oficiales">
                      {PRESET_VARIANTS.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </optgroup>
                    <optgroup label="Tus Reglas Privadas">
                      {availableCustomRules.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </optgroup>
                  </select>
                  <button className="btn btn-outline" type="submit" style={{ whiteSpace: 'nowrap' }}>Añadir ✓</button>
                </form>
              </div>
            </div>

            <div style={{ padding: '2rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'rgba(0,0,0,0.3)' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate}>
                Iniciar Aventura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
