import React, { useState, useEffect } from 'react';
import { UNIVERSAL_RULES, PRESET_VARIANTS } from '../constants/rulesData';
import { Trash2, Plus, Edit2, Lock } from 'lucide-react';

export default function MisReglas() {
  const [reglasPersonalizadas, setReglasPersonalizadas] = useState([]);
  const [idEditando, setIdEditando] = useState(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('reglasPersonalizadas') || '[]');
      setReglasPersonalizadas(saved);
    } catch {
      setReglasPersonalizadas([]);
    }
  }, []);

  const saveCustomRules = (rules) => {
    localStorage.setItem('reglasPersonalizadas', JSON.stringify(rules));
    setReglasPersonalizadas(rules);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !descripcion.trim()) return;

    if (idEditando) {
      const updated = reglasPersonalizadas.map(r =>
        r.id === idEditando ? { ...r, nombre, descripcion } : r
      );
      saveCustomRules(updated);
      setIdEditando(null);
    } else {
      const newRule = {
        id: 'cus_' + Date.now().toString(),
        nombre,
        descripcion
      };
      saveCustomRules([...reglasPersonalizadas, newRule]);
    }
    setNombre('');
    setDescripcion('');
  };

  const manejarEdicion = (rule) => {
    setIdEditando(rule.id);
    setNombre(rule.nombre);
    setDescripcion(rule.descripcion);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const manejarBorrado = (id) => {
    saveCustomRules(reglasPersonalizadas.filter(r => r.id !== id));
  };

  const cancelEdit = () => {
    setIdEditando(null);
    setNombre('');
    setDescripcion('');
  };

  const RuleCard = ({ r, locked }) => (
    <div className="card glass" style={{ padding: '1.5rem', marginBottom: '1rem', borderLeft: locked ? '4px solid var(--text-muted)' : '4px solid var(--primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', marginBottom: '0' }}>
          {locked && <Lock size={16} color="var(--text-muted)" />}
          {r.nombre}
        </h3>
        {!locked && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => manejarEdicion(r)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}><Edit2 size={18} /></button>
            <button onClick={() => manejarBorrado(r.id)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><Trash2 size={18} /></button>
          </div>
        )}
      </div>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '0.5rem' }}>{r.descripcion}</p>
    </div>
  );

  return (
    <div className="container" style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
      <h1 className="title-glow reglas-page-header" style={{ fontSize: '3rem', marginBottom: '2rem' }}>
        Mis <span className="gradient-text">Reglas</span>
      </h1>

      <div className="glass" style={{ padding: '2rem', marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>{idEditando ? 'Editar Regla' : 'Crear Nueva Regla'}</h2>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Nombre de la Regla</label>
            <input className="input" placeholder="Ej. Regla de..." value={nombre} onChange={e => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Descripción / Explicación Detallada</label>
            <textarea
              className="input"
              placeholder="Explica tu norma aquí..."
              style={{ minHeight: '100px', resize: 'vertical' }}
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              <Plus size={18} /> {idEditando ? 'Guardar Cambios' : 'Añadir a mi Biblioteca'}
            </button>
            {idEditando && (
              <button type="button" className="btn btn-outline" onClick={cancelEdit}>Cancelar</button>
            )}
          </div>
        </form>
      </div>

      <div className="reglas-two-col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
        <div>
          <h2 style={{ marginBottom: '1.5rem' }}>Oficiales <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>(Base y Dashboard)</span></h2>
          {UNIVERSAL_RULES.map(r => <RuleCard key={r.id} r={r} locked />)}
          <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '1.25rem' }}>Variantes del Dashboard</h3>
          {PRESET_VARIANTS.map(r => <RuleCard key={r.id} r={r} locked />)}
        </div>
        <div>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Tus Normas Privadas</h2>
          {reglasPersonalizadas.length === 0 ? (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--glass-border)' }}>
              <p style={{ color: 'var(--text-muted)' }}>Todavía no tienes reglas. Empieza a crear arriba.</p>
            </div>
          ) : (
            reglasPersonalizadas.map(r => <RuleCard key={r.id} r={r} />)
          )}
        </div>
      </div>
    </div>
  );
}
