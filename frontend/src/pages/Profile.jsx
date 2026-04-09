import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { User, Mail, Save, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            await updateProfile({ name });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError('No se pudo actualizar el perfil.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <h2>Debes iniciar sesión para ver esta página</h2>
                <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>Ir al Login</Link>
            </div>
        );
    }

  return (
    <div className="login-page-container" style={{ 
      background: 'radial-gradient(circle at 50% -20%, #1a1a2e 0%, #0a0a12 100%)',
    }}>
      
      <div className="login-card-premium fade-in" style={{ 
        maxWidth: '500px',
        padding: '2.5rem',
        background: 'rgba(23, 23, 33, 0.9)',
      }}>
        
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <Link to="/mis-partidas" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <ArrowLeft size={20} />
             </Link>
             <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white' }}>Mi Perfil</h1>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: '100px', height: '100px', borderRadius: '50%', border: '3px solid var(--primary)', padding: '3px' }} />
                ) : (
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--primary)' }}>
                        <User size={48} color="var(--primary)" />
                    </div>
                )}
                <div style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--primary)', borderRadius: '50%', padding: '0.4rem', border: '3px solid #13131d' }}>
                    <CheckCircle size={14} color="white" />
                </div>
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1.2rem' }}>{user.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Entrenador de Nuzlockes</p>
        </div>

        {success && (
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '0.8rem', 
            background: 'rgba(34, 197, 94, 0.1)', 
            borderRadius: '12px', 
            color: '#4ade80', 
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}>
            <CheckCircle size={18} /> ¡Perfil actualizado con éxito!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem', marginLeft: '0.5rem' }}>NOMBRE DE ENTRENADOR</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', zIndex: 1 }}>
                <User size={18} />
              </span>
              <input 
                type="text" 
                className="input-premium" 
                placeholder="Tu nombre"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem', marginLeft: '0.5rem' }}>CORREO ELECTRÓNICO (No editable)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.1)', zIndex: 1 }}>
                <Mail size={18} />
              </span>
              <input 
                type="email" 
                className="input-premium" 
                value={user.email}
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <button className="btn btn-primary btn-shine" style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontWeight: 'bold' }} disabled={loading}>
            {loading ? <Loader2 size={24} className="loader" /> : (
              <>
                <Save size={20} /> Guardar Cambios
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Tu información se sincronizará con todas tus partidas guardadas.
            </p>
        </div>
      </div>
    </div>
  );
}
