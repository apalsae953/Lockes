import React, { useState } from 'react';
import { useAuth } from '../../services/AuthContext';
import { Mail, ArrowLeft, Loader2, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="login-page-container" style={{ background: 'radial-gradient(circle at 50% -20%, #2a0a0a 0%, #0a0a12 100%)' }}>
        <div className="login-card-premium" style={{ textAlign: 'center' }}>
          <div style={{ color: '#22c55e', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <CheckCircle size={64} />
          </div>
          <h2 style={{ color: 'white', marginBottom: '1rem' }}>¡Correo Enviado!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
            Si el correo <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña en unos minutos.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ width: '100%' }}>
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-container" style={{ background: 'radial-gradient(circle at 50% -20%, #2a0a0a 0%, #0a0a12 100%)' }}>
      <div className="login-card-premium">
        <button 
          onClick={() => navigate('/login')}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.9rem' }}
        >
          <ArrowLeft size={16} /> Volver
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '0.5rem' }}>Recuperar Acceso</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Introduce tu email y te enviaremos instrucciones para cambiar tu contraseña.
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(255, 68, 68, 0.1)', borderRadius: '12px', color: '#ff4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255, 68, 68, 0.15)' }}>
            <X size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', zIndex: 1 }}>
                <Mail size={16} />
              </span>
              <input 
                type="email" 
                className="input-premium" 
                placeholder="Tu email de entrenador"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={loading}>
            {loading ? <Loader2 size={24} className="loader" /> : 'Enviar Enlace'}
          </button>
        </form>
      </div>
    </div>
  );
}
