import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { ArrowLeft, Plus, Download, Trash2, Camera, Heart, HeartCrack, Infinity, ScrollText, Swords, MapPin, GripVertical, UserPlus, X, Edit2, Search, Skull, FileSpreadsheet } from 'lucide-react';
import { UNIVERSAL_RULES, PRESET_VARIANTS } from '../constants/rulesData';
import { REGION_BOSSES } from '../constants/gameData';
import { useAuth } from '../services/AuthContext';
import api from '../services/AuthContext';

export default function PartidaTracker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [partida, setPartida] = useState(null);
  const [availableCustomRules, setAvailableCustomRules] = useState([]);
  const [toast, setToast] = useState(null);

  // Estado del Modal de Jefe Personalizado
  const [showBossModal, setShowBossModal] = useState(false);
  const [editingBossIndex, setEditingBossIndex] = useState(null);
  const [newBoss, setNewBoss] = useState({ name: '', titleType: 'Líder', titleNum: '1', level: '', customImgUrl: '' });

  // Estado de Arrastrar y Soltar (Drag and Drop)
  const [draggingId, setDraggingId] = useState(null);

  // Estado de Búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // Estado de Selección de Equipo
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectingSlotIdx, setSelectingSlotIdx] = useState(null);

  // Lógica de Scroll Horizontal
  const scrollRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const startDragging = (e) => {
    setIsScrolling(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const stopDragging = (e) => {
    setIsScrolling(false);
  };

  useEffect(() => {
    const handleWindowMouseMove = (e) => {
      if (!isScrolling) return;
      const x = e.pageX - scrollRef.current.offsetLeft;
      const scroll = (x - startX) * 2;
      scrollRef.current.scrollLeft = scrollLeft - scroll;
    };

    const handleWindowMouseUp = () => {
      setIsScrolling(false);
    };

    if (isScrolling) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isScrolling, startX, scrollLeft]);

  useEffect(() => {
    const fetchPartida = async () => {
      if (user && !isNaN(id)) {
        try {
          const response = await api.get(`/api/runs/${id}`);
          const p = response.data;
          setPartida({
            ...p,
            vidasMax: p.vidas_max,
            vidasActuales: p.vidas_actuales,
            extraRules: p.extra_rules,
            game: p.game_name,
            gameId: p.game_id,
            team: p.team || Array(6).fill(null),
            customBosses: p.custom_bosses || [],
            defeatedBosses: p.defeated_bosses || []
          });
        } catch (error) {
          console.error("Error cargando partida de la API", error);
          navigate('/mis-partidas');
        }
      } else {
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
      }
    };

    try {
      const savedCustom = JSON.parse(localStorage.getItem('customRules') || '[]');
      setAvailableCustomRules(savedCustom);
    } catch { }

    fetchPartida();
  }, [id, navigate, user]);

  // Timer para el guardado debounced (evita peticiones excesivas)
  const saveTimeoutRef = useRef(null);

  const guardarPartida = async (p = partida, debounce = false) => {
    // Actualizamos estado local siempre para que el UI sea fluido
    setPartida({ ...p });

    if (debounce) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        performApiSave(p);
      }, 1000); // Esperamos 1 segundo de inactividad para guardar en el servidor
    } else {
      performApiSave(p);
    }
  };

  const performApiSave = async (p) => {
    if (user && !isNaN(id)) {
      try {
        const payload = {
          name: p.name,
          vidas_actuales: (p.vidasActuales === null || p.vidasActuales === undefined) ? null : parseInt(p.vidasActuales),
          encounters: p.encounters || [],
          team: p.team || Array(6).fill(null),
          custom_bosses: p.customBosses || [],
          defeated_bosses: p.defeatedBosses || []
        };
        await api.patch(`/api/runs/${id}`, payload);
      } catch (error) {
        console.error("Error guardando en API", error);
      }
    } else {
      const saved = JSON.parse(localStorage.getItem('lockeRuns') || '[]');
      const updated = saved.map(item => item.id === p.id ? p : item);
      localStorage.setItem('lockeRuns', JSON.stringify(updated));
    }
  };

  // Estado para la animación de daño
  const [isDamaged, setIsDamaged] = useState(false);

  useEffect(() => {
    if (partida && partida.vidasActuales !== undefined) {
      // Si las vidas han bajado, activamos la animación
      const prevVidas = sessionStorage.getItem(`vidas_${id}`);
      if (prevVidas !== null && parseInt(prevVidas) > partida.vidasActuales) {
        setIsDamaged(true);
        setTimeout(() => setIsDamaged(false), 600);
      }
      sessionStorage.setItem(`vidas_${id}`, partida.vidasActuales);
    }
  }, [partida?.vidasActuales, id]);

  const handleUpdateVidas = (modifier) => {
    if (partida.vidasMax === null) return;
    const newVal = partida.vidasActuales + modifier;
    if (newVal >= 0 && newVal <= partida.vidasMax) {
      if (modifier < 0) {
        setIsDamaged(true);
        setTimeout(() => setIsDamaged(false), 600);
      }
      guardarPartida({ ...partida, vidasActuales: newVal }, false); // Las vidas guardan inmediato
    }
  };

  const toggleBossDefeated = (bossName) => {
    const updated = { ...partida };
    if (!updated.defeatedBosses) updated.defeatedBosses = [];
    
    if (updated.defeatedBosses.includes(bossName)) {
      updated.defeatedBosses = updated.defeatedBosses.filter(b => b !== bossName);
    } else {
      updated.defeatedBosses.push(bossName);
    }
    guardarPartida(updated, false); // Los jefes guardan inmediato
  };

  const handleUpdateEncounter = (encId, field, value) => {
    const updatedPartida = { ...partida };
    const encIndex = updatedPartida.encounters.findIndex(e => e.id === encId);
    if (encIndex >= 0) {
      const current = { ...updatedPartida.encounters[encIndex] };

      // Lógica de reducción automática de vidas
      if (field === 'status' && value === 'Muerto' && current.status !== 'Muerto') {
        if (updatedPartida.vidasMax !== null && updatedPartida.vidasActuales > 0) {
          updatedPartida.vidasActuales -= 1;
        }
      }

      current[field] = value;
      updatedPartida.encounters[encIndex] = current;
      
      // Si estamos escribiendo texto, usamos DEBOUNCE
      const isText = ['lugar', 'pokemon', 'mote'].includes(field);
      guardarPartida(updatedPartida, isText);
    }
  };

  const updateTeamSlot = (slotIdx, encounterId) => {
    const updated = { ...partida };
    if (!updated.team) updated.team = Array(6).fill(null);
    updated.team[slotIdx] = encounterId;
    guardarPartida(updated);
    setShowTeamModal(false);
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
      
      const updatedPartida = { ...partida };
      const encIndex = updatedPartida.encounters.findIndex(e => e.id === encId);
      if (encIndex >= 0) {
        updatedPartida.encounters[encIndex].img = res.data.sprites.front_default;
        updatedPartida.encounters[encIndex].status = 'Vivo';
        guardarPartida(updatedPartida);
      }
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

  // Manejadores de Arrastrar y Soltar (Drag and Drop)
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

  const exportExcel = () => {
    // 1. Mapear datos con los nombres de columna que quieres
    const data = (partida.encounters || []).map(e => ({
      'DONDE SE OBTUVO': e.lugar || 'Desconocido',
      'NOMBRE POKÉMON': e.pokemon || '---',
      'MOTE': e.mote || '---',
      'ESTADO': e.status || 'Pendiente'
    }));

    // 2. Crear hoja y libro
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mis Capturas");

    // 3. Ponerlo "Bonito" (Ajustar anchos de columna)
    const wscols = [
      { wch: 30 }, // Lugar
      { wch: 25 }, // Pokémon
      { wch: 20 }, // Mote
      { wch: 15 }  // Estado
    ];
    worksheet['!cols'] = wscols;

    // 4. Generar archivo y descargar
    const fileName = `Lockes_${partida.name.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (!partida) return <div className="loader" style={{ margin: '5rem auto', display: 'block' }}></div>;

  const allKnownRules = [...PRESET_VARIANTS, ...availableCustomRules];
  const isInfinite = partida.vidasMax === null;
  const bosses = partida.gameId === 'custom' ? (partida.customBosses || []) : (REGION_BOSSES[partida.gameId] || []);
  const team = partida.team || Array(6).fill(null);
  const alivePokemon = (partida.encounters || []).filter(e => e.status === 'Vivo');

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

      <div className="tracker-grid">
        {/* Lado Izquierdo: Título y Reglas */}
        <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
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

          <div style={{ flex: 1, maxHeight: '600px', overflowY: 'auto', pr: '1rem' }}>
            {UNIVERSAL_RULES.map(r => (
              <RuleBlock key={r.id} title={r.name} description={r.description} color="var(--primary)" />
            ))}

            {partida.extraRules.map((ruleName, idx) => {
              const foundObj = allKnownRules.find(k => k.name === ruleName);
              const desc = foundObj ? foundObj.description : "Regla personalizada del jugador.";
              return <RuleBlock key={`ex_${idx}`} title={ruleName} description={desc} color="var(--accent)" />;
            })}
          </div>
        </div>

        {/* Lado Derecho: Vidas + Equipo (REDIMENSIONADO IGUAL) */}
        <div className="tracker-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Contador de Vidas Mini (Ahora con flex 1) */}
          <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, textAlign: 'center' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>Vidas Restantes</h4>
            
            {/* CORAZÓN DINÁMICO (VIDA VISUAL) */}
            <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <svg width="80" height="80" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))' }}>
                <defs>
                  <linearGradient id="heartGradient" x1="0" y1="1" x2="0" y2="0">
                    <stop 
                      offset={isInfinite ? "100%" : `${Math.min(100, Math.max(0, (partida.vidasActuales / (partida.vidasMax || 1)) * 100))}%`} 
                      stopColor="var(--primary)" 
                    />
                    <stop 
                      offset={isInfinite ? "100%" : `${Math.min(100, Math.max(0, (partida.vidasActuales / (partida.vidasMax || 1)) * 100))}%`} 
                      stopColor="rgba(255,255,255,0.1)" 
                    />
                  </linearGradient>
                </defs>
                <path 
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                  fill="url(#heartGradient)"
                  stroke="var(--primary)"
                  strokeWidth="0.5"
                />
              </svg>
              <div style={{ position: 'absolute', fontSize: '1.8rem', fontWeight: 900, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                {isInfinite ? <Infinity size={32} /> : partida.vidasActuales}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              {!isInfinite && (
                <>
                  <button className="btn btn-outline" onClick={() => handleUpdateVidas(-1)} disabled={partida.vidasActuales === 0} style={{ padding: '0.6rem', borderRadius: '50%' }}>
                    <HeartCrack size={20} />
                  </button>
                  <button className="btn btn-outline" onClick={() => handleUpdateVidas(1)} disabled={partida.vidasActuales >= partida.vidasMax} style={{ padding: '0.6rem', borderRadius: '50%' }}>
                    <Heart size={20} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tu Equipo Activo Mini (Con flex 1) */}
          <div className="glass" style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <Swords size={20} /> Mi Equipo
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', flex: 1 }}>
              {team.map((encId, idx) => {
                const enc = (partida.encounters || []).find(e => e.id === encId);
                return (
                  <div 
                    key={idx} 
                    onClick={() => { setSelectingSlotIdx(idx); setShowTeamModal(true); }}
                    style={{ 
                      aspectRatio: '1/1', 
                      background: 'rgba(0,0,0,0.3)', 
                      borderRadius: '12px', 
                      border: '1px dashed var(--glass-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}
                    className="team-slot-hover"
                  >
                    {enc ? (
                      <>
                        <img src={enc.img} alt={enc.pokemon} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', fontSize: '0.6rem', padding: '2px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {enc.mote || enc.pokemon}
                        </div>
                      </>
                    ) : (
                      <Plus size={24} opacity={0.1} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>


      {(bosses.length > 0 || partida.gameId === 'custom') && (
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Swords /> Gimnasios y Alto Mando (Niveles Máximos)
            </h2>
            {partida.gameId === 'custom' && (
              <button className="btn btn-outline" onClick={() => {
                setEditingBossIndex(null);
                setNewBoss({ name: '', titleType: 'Líder', titleNum: '1', level: '', customImgUrl: '' });
                setShowBossModal(true);
              }}>
                <UserPlus size={18} /> Añadir Jefe
              </button>
            )}
          </div>
          <div 
            ref={scrollRef}
            onMouseDown={startDragging}
            style={{ 
              display: 'flex', 
              gap: '1rem', 
              overflowX: 'auto', 
              paddingBottom: '1rem',
              cursor: isScrolling ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            {bosses.length === 0 && (
              <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.2)', width: '100%', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No tienes jefes registrados para este Locke personalizado. Utiliza el botón superior para crearlos.
              </div>
            )}
            {bosses.map((boss, idx) => {
              const isDefeated = (partida.defeatedBosses || []).includes(boss.name);
              return (
                <div 
                  key={idx} 
                  className="card glass" 
                  onClick={() => toggleBossDefeated(boss.name)}
                  style={{ 
                    minWidth: '150px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    textAlign: 'center', 
                    padding: '1.5rem 1rem', 
                    flexShrink: 0, 
                    position: 'relative',
                    cursor: 'pointer',
                    filter: isDefeated ? 'grayscale(0.9) brightness(0.7)' : 'none',
                    border: isDefeated ? '2px solid var(--text-muted)' : '2px solid transparent',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isDefeated && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, color: 'var(--primary)', opacity: 0.8 }}>
                      <Skull size={50} />
                    </div>
                  )}
                  {partida.gameId === 'custom' && (
                    <>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          let tType = 'Líder';
                          let tNum = '1';
                          if (boss.title) {
                            if (boss.title.startsWith('Líder ')) { tType = 'Líder'; tNum = boss.title.replace('Líder ', ''); }
                            else if (boss.title.startsWith('Alto Mando ')) { tType = 'Alto Mando'; tNum = boss.title.replace('Alto Mando ', ''); }
                            else { tType = boss.title; tNum = ''; }
                          }
                          setNewBoss({ 
                            name: boss.name, 
                            titleType: tType, 
                            titleNum: tNum, 
                            level: boss.level === 0 ? '' : boss.level.toString(),
                            customImgUrl: boss.customImgUrl || ''
                          });
                          setEditingBossIndex(idx);
                          setShowBossModal(true);
                        }} 
                        style={{ position: 'absolute', top: '10px', left: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '5px' }}
                        title="Editar Jefe"
                      >
                        <Edit2 size={16}/>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = { ...partida };
                          updated.customBosses.splice(idx, 1);
                          guardarPartida(updated);
                        }}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '5px' }}
                        title="Eliminar Jefe"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                  <div style={{ width: '80px', height: '80px', marginBottom: '1rem', background: 'var(--bg-darker)', borderRadius: '50%', overflow: 'hidden', border: isDefeated ? '2px solid var(--text-muted)' : '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                    <img src={boss.customImgUrl ? boss.customImgUrl : `https://play.pokemonshowdown.com/sprites/trainers/${boss.img}.png`} alt={boss.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'; e.target.style.objectFit = 'contain'; e.target.style.padding = '10px'; }} />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{boss.title}</div>
                  <h4 style={{ margin: '0.5rem 0' }}>{isDefeated && boss.defeatedName ? boss.defeatedName : boss.name}</h4>
                  {boss.level > 0 && <div className="type-badge" style={{ background: isDefeated ? 'var(--text-muted)' : 'var(--primary)', color: 'black' }}>Nvl: {boss.level}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin /> Tus Capturas
        </h2>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '600px', marginLeft: '2rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="input" 
              placeholder="Buscar ruta o Pokémon..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={addCustomRoute}>
            <Plus size={18} /> Nueva Ruta
          </button>
          <button className="btn btn-outline" onClick={exportExcel} style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.4)' }}>
            <FileSpreadsheet size={18} /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="table-responsive">
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
            {partida.encounters
              .filter(enc => 
                enc.lugar.toLowerCase().includes(searchTerm.toLowerCase()) || 
                enc.pokemon.toLowerCase().includes(searchTerm.toLowerCase()) ||
                enc.mote.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((enc) => (
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

      {/* Modal para Crear Jefes Personalizados */}
      {showBossModal && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowBossModal(false)}>
          <div className="modal-content glass" style={{ flexDirection: 'column', maxWidth: '450px', margin: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Crear Jefe Enemigo</h3>
              <button className="modal-close" style={{ position: 'relative', top: 0, right: 0 }} onClick={() => setShowBossModal(false)}><X size={20} /></button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Nombre del Entrenador</label>
                <input className="input" value={newBoss.name} onChange={e => setNewBoss({ ...newBoss, name: e.target.value })} placeholder="Ej. Rojo..." autoFocus />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 2 }}>
                  <label className="form-label">Rango</label>
                  <select className="input" value={newBoss.titleType} onChange={e => setNewBoss({ ...newBoss, titleType: e.target.value })}>
                    <option value="Líder">Líder</option>
                    <option value="Alto Mando">Alto Mando</option>
                    <option value="Campeón">Campeón</option>
                    <option value="Rival">Rival</option>
                    <option value="Jefe de Equipo">Jefe de Equipo</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {['Líder', 'Alto Mando'].includes(newBoss.titleType) && (
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Nº</label>
                    <input type="number" className="input" value={newBoss.titleNum} onChange={e => setNewBoss({ ...newBoss, titleNum: e.target.value })} min="1" max="8" />
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Nivel Máximo <span style={{color: 'var(--primary)'}}>(Opcional)</span></label>
                <input type="number" className="input" value={newBoss.level} onChange={e => setNewBoss({ ...newBoss, level: e.target.value })} placeholder="Ej. 14 (Déjalo vacío si no hay nivel límite)" />
              </div>

              <div>
                <label className="form-label">URL de Fotografía <span style={{color: 'var(--primary)'}}>(Opcional)</span></label>
                <input type="text" className="input" value={newBoss.customImgUrl} onChange={e => setNewBoss({ ...newBoss, customImgUrl: e.target.value })} placeholder="Pega aquí el enlace a una imagen (.jpg, .png...)" />
              </div>
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setShowBossModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => {
                if (!newBoss.name) {
                  showToast('El Nombre es obligatorio');
                  return;
                }
                const updated = { ...partida };
                if (!updated.customBosses) updated.customBosses = [];

                let finalTitle = newBoss.titleType;
                if (['Líder', 'Alto Mando'].includes(newBoss.titleType) && newBoss.titleNum) {
                  finalTitle += ` ${newBoss.titleNum}`;
                }

                const bossObj = {
                  name: newBoss.name,
                  level: parseInt(newBoss.level) || 0,
                  title: finalTitle,
                  img: 'pokemon-trainer',
                  customImgUrl: newBoss.customImgUrl
                };

                if (editingBossIndex !== null) {
                  updated.customBosses[editingBossIndex] = bossObj;
                } else {
                  updated.customBosses.push(bossObj);
                }

                guardarPartida(updated);
                setShowBossModal(false);
                setNewBoss({ name: '', titleType: 'Líder', titleNum: '1', level: '', customImgUrl: '' });
                showToast(editingBossIndex !== null ? 'Jefe actualizado correctamente' : 'Jefe añadido correctamente');
              }}>{editingBossIndex !== null ? 'Guardar Cambios' : 'Guardar Jefe'}</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal para Seleccionar Equipo */}
      {showTeamModal && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowTeamModal(false)}>
          <div className="modal-content glass" style={{ flexDirection: 'column', maxWidth: '500px', margin: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Seleccionar para el Equipo</h3>
              <button className="modal-close" style={{ position: 'relative', top: 0, right: 0 }} onClick={() => setShowTeamModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              <div 
                onClick={() => updateTeamSlot(selectingSlotIdx, null)}
                style={{ padding: '1rem', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', marginBottom: '0.5rem', textAlign: 'center', color: 'var(--primary)' }}
              >
                VACIAR SLOT
              </div>
              {alivePokemon.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No tienes Pokémon vivos para añadir.</p>}
              {alivePokemon.map(enc => (
                <div 
                  key={enc.id} 
                  onClick={() => updateTeamSlot(selectingSlotIdx, enc.id)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    background: 'rgba(255,255,255,0.05)', 
                    marginBottom: '0.5rem',
                    border: team.includes(enc.id) ? '1px solid var(--accent)' : '1px solid transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <img src={enc.img} alt={enc.pokemon} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{enc.mote || enc.pokemon}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{enc.lugar}</div>
                  </div>
                  {team.includes(enc.id) && <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--accent)' }}>EN EQUIPO</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
