import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, User as UserIcon, Loader2, ArrowRight, X, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [esRegistro, setEsRegistro] = useState(false);
  const [datosFormulario, setDatosFormulario] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [mostrarPass, setMostrarPass] = useState(false);
  const [mostrarConfirmarPass, setMostrarConfirmarPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  
  const { login, register, iniciarSesionConGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error')) {
      setError('Error en la autenticación. Por favor, inténtalo de nuevo.');
    }
  }, [location]);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      if (esRegistro) {
        if (datosFormulario.password !== datosFormulario.confirmPassword) {
          setError('Las contraseñas no coinciden.');
          setCargando(false);
          return;
        }
        await register(datosFormulario);
      } else {
        await login({ email: datosFormulario.email, password: datosFormulario.password });
      }
      navigate('/mis-partidas');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page-container" style={{ background: 'var(--bg-dark)' }}>
      
      <div className="login-card-premium fade-in" style={{ 
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
            Nuz<span style={{ color: 'var(--primary)' }}>Tracker</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
            {esRegistro ? 'Crea tu perfil de entrenador' : '¡Bienvenido de nuevo, Entrenador!'}
          </p>
        </div>

        {error && (
          <div style={{ 
            marginBottom: '1.25rem', 
            padding: '0.75rem', 
            background: 'var(--warning-bg)', 
            borderRadius: '12px', 
            color: 'var(--warning-text)', 
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid var(--warning-border)'
          }}>
            <X size={16} /> {error}
          </div>
        )}

        <form onSubmit={manejarEnvio}>
          {esRegistro && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }}>
                  <UserIcon size={16} />
                </span>
                <input 
                  type="text" 
                  className="input-premium" 
                  placeholder="Apodo"
                  required={esRegistro}
                  value={datosFormulario.name}
                  onChange={(e) => setDatosFormulario({...datosFormulario, name: e.target.value})}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }}>
                <Mail size={16} />
              </span>
              <input 
                type="email" 
                className="input-premium" 
                placeholder="Email"
                required
                value={datosFormulario.email}
                onChange={(e) => setDatosFormulario({...datosFormulario, email: e.target.value})}
              />
            </div>
          </div>

          <div style={{ marginBottom: esRegistro ? '1rem' : '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }}>
                <Lock size={16} />
              </span>
              <input 
                type={mostrarPass ? "text" : "password"}
                className="input-premium" 
                placeholder="Contraseña"
                required
                value={datosFormulario.password}
                onChange={(e) => setDatosFormulario({...datosFormulario, password: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setMostrarPass(!mostrarPass)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 2, display: 'flex' }}
              >
                {mostrarPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Recuperación de contraseña deshabilitada temporalmente
          {!esRegistro && (
            <div style={{ textAlign: 'right', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
              <button 
                type="button" 
                onClick={() => navigate('/forgot-password')}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'none' }}
                onMouseEnter={(e) => e.target.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
              >
                ¿Has olvidado tu contraseña?
              </button>
            </div>
          )}
          */}

          {esRegistro && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }}>
                  <Lock size={16} />
                </span>
                <input 
                  type={mostrarConfirmarPass ? "text" : "password"}
                  className="input-premium" 
                  placeholder="Repetir Contraseña"
                  required={esRegistro}
                  value={datosFormulario.confirmPassword}
                  onChange={(e) => setDatosFormulario({...datosFormulario, confirmPassword: e.target.value})}
                />
                <button 
                  type="button"
                  onClick={() => setMostrarConfirmarPass(!mostrarConfirmarPass)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', zIndex: 2, display: 'flex' }}
                >
                  {mostrarConfirmarPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button className="btn btn-primary btn-shine" style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontSize: '1.1rem' }} disabled={cargando}>
            {cargando ? <Loader2 size={24} className="loader" /> : (
              <>
                {esRegistro ? 'Registrarse' : 'Entrar'} <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div style={{ position: 'relative', margin: '1.5rem 0', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '1px', background: 'var(--glass-border)' }}></div>
          <span style={{ position: 'relative', zIndex: 1, background: 'var(--bg-darker)', padding: '0 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>Ó</span>
        </div>

        <button onClick={iniciarSesionConGoogle} className="google-btn-premium" type="button" style={{ fontSize: '1rem', background: 'var(--text-main)', color: 'var(--bg-dark)' }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="22" alt="Google" />
          Continuar con Google
        </button>

        <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
          <button onClick={() => setEsRegistro(!esRegistro)} type="button" 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', opacity: 1, textDecoration: 'underline' }}
          >
            {esRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿Eres nuevo? Crea una cuenta gratis'}
          </button>
        </div>
      </div>
    </div>
  );
}
