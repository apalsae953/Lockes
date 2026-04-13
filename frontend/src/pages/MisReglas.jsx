import React, { useState, useEffect } from 'react';
import { UNIVERSAL_RULES, PRESET_VARIANTS } from '../constants/rulesData';
import { Trash2, Plus, Edit2, Lock } from 'lucide-react';

export default function MisReglas() {
  const [customRules, setCustomRules] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('customRules') || '[]');
      setCustomRules(saved);
    } catch {
      setCustomRules([]);
    }
  }, []);

  const saveCustomRules = (rules) => {
    localStorage.setItem('customRules', JSON.stringify(rules));
    setCustomRules(rules);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    if (editingId) {
      const updated = customRules.map(r =>
        r.id === editingId ? { ...r, name, description } : r
      );
      saveCustomRules(updated);
      setEditingId(null);
    } else {
      const newRule = {
        id: 'cus_' + Date.now().toString(),
        name,
        description
      };
      saveCustomRules([...customRules, newRule]);
    }
    setName('');
    setDescription('');
  };

  const handleEdit = (rule) => {
    setEditingId(rule.id);
    setName(rule.name);
    setDescription(rule.description);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    saveCustomRules(customRules.filter(r => r.id !== id));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setDescription('');
  };

  const RuleCard = ({ r, locked }) => (
    <div className="card glass" style={{ padding: '1.5rem', marginBottom: '1rem', borderLeft: locked ? '4px solid var(--text-muted)' : '4px solid var(--primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', marginBottom: '0' }}>
          {locked && <Lock size={16} color="var(--text-muted)" />}
          {r.name}
        </h3>
        {!locked && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => handleEdit(r)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}><Edit2 size={18} /></button>
            <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><Trash2 size={18} /></button>
          </div>
        )}
      </div>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '0.5rem' }}>{r.description}</p>
    </div>
  );

  return (
    <div className="container" style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
      <h1 className="title-glow" style={{ fontSize: '3rem', marginBottom: '2rem' }}>
        Mis <span className="gradient-text">Reglas</span>
      </h1>

      <div className="glass" style={{ padding: '2rem', marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>{editingId ? 'Editar Regla' : 'Crear Nueva Regla'}</h2>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Nombre de la Regla</label>
            <input className="input" placeholder="Ej. Regla de..." value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Descripción / Explicación Detallada</label>
            <textarea
              className="input"
              placeholder="Explica tu norma aquí..."
              style={{ minHeight: '100px', resize: 'vertical' }}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              <Plus size={18} /> {editingId ? 'Guardar Cambios' : 'Añadir a mi Biblioteca'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={cancelEdit}>Cancelar</button>
            )}
          </div>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
        <div>
          <h2 style={{ marginBottom: '1.5rem' }}>Oficiales <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>(Base y Dashboard)</span></h2>
          {UNIVERSAL_RULES.map(r => <RuleCard key={r.id} r={r} locked />)}
          <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '1.25rem' }}>Variantes del Dashboard</h3>
          {PRESET_VARIANTS.map(r => <RuleCard key={r.id} r={r} locked />)}
        </div>
        <div>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Tus Normas Privadas</h2>
          {customRules.length === 0 ? (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--glass-border)' }}>
              <p style={{ color: 'var(--text-muted)' }}>Todavía no tienes reglas. Empieza a crear arriba.</p>
            </div>
          ) : (
            customRules.map(r => <RuleCard key={r.id} r={r} />)
          )}
        </div>
      </div>
    </div>
  );
}
