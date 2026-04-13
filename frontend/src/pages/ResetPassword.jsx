import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { Lock, Loader2, CheckCircle, X, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ResetPassword() {
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const token = query.get('token');
  const email = query.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError('Enlace inválido o expirado.');
    }
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await resetPassword({
        token,
        email,
        password: formData.password,
        password_confirmation: formData.confirmPassword
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-page-container" style={{ background: 'radial-gradient(circle at 50% -20%, #2a0a0a 0%, #0a0a12 100%)' }}>
        <div className="login-card-premium" style={{ textAlign: 'center' }}>
          <div style={{ color: '#22c55e', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <CheckCircle size={64} />
          </div>
          <h2 style={{ color: 'white', marginBottom: '1rem' }}>¡Contraseña Cambiada!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ width: '100%' }}>
            Entrar Ahora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-container" style={{ background: 'radial-gradient(circle at 50% -20%, #2a0a0a 0%, #0a0a12 100%)' }}>
      <div className="login-card-premium">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '0.5rem' }}>Nueva Contraseña</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Elige una contraseña segura que puedas recordar.
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(255, 68, 68, 0.1)', borderRadius: '12px', color: '#ff4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255, 68, 68, 0.15)' }}>
            <X size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', zIndex: 1 }}>
                <Lock size={16} />
              </span>
              <input 
                type={showPass ? "text" : "password"}
                className="input-premium" 
                placeholder="Nueva Contraseña"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', zIndex: 2, display: 'flex' }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', zIndex: 1 }}>
                <Lock size={16} />
              </span>
              <input 
                type={showConfirmPass ? "text" : "password"}
                className="input-premium" 
                placeholder="Confirmar Nueva Contraseña"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', zIndex: 2, display: 'flex' }}
              >
                {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={loading || !token}>
            {loading ? <Loader2 size={24} className="loader" /> : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
