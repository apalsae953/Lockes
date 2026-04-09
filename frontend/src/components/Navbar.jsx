import { Link, useLocation } from 'react-router-dom';
import { Ghost, LogIn, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../services/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="container nav-content">
        <div className="nav-main" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '1rem' }}>
          <Link to="/" className="nav-logo gradient-text" style={{ marginRight: '1rem' }}>
            <Ghost size={34} color="#ef4444" />
            <span>NuzTracker</span>
          </Link>

          {/* EN PC ESTO SE VE DESPUÉS DEL LOGO, EN MÓVIL SE OCULTA O PASA ABAJO SEGÚN CSS */}
          <div className="nav-links">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              Reglas
            </Link>
            <Link to="/pokedex" className={`nav-link ${location.pathname === '/pokedex' ? 'active' : ''}`}>
              Pokédex
            </Link>
            <Link to="/tipos" className={`nav-link ${location.pathname === '/tipos' ? 'active' : ''}`}>
              Tipos
            </Link>
            <Link to="/mis-reglas" className={`nav-link ${location.pathname === '/mis-reglas' ? 'active' : ''}`}>
              Mis Reglas
            </Link>
            <Link to="/mis-partidas" className={`nav-link ${location.pathname.includes('/mis-partidas') || location.pathname.includes('/tracker') ? 'active' : ''}`}>
              Partidas
            </Link>
          </div>

          <div className="nav-user-section">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link to="/perfil" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  padding: '0.4rem 0.8rem', 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.3s'
                }} className="nav-profile-link">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--primary)' }} />
                  ) : (
                    <div style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex' }}><UserIcon size={16} /></div>
                  )}
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }} className="nav-user-name">{user.name}</span>
                </Link>
                <button onClick={logout} style={{ background: 'rgba(255, 68, 68, 0.1)', border: 'none', cursor: 'pointer', color: '#ff4444', height: '40px', width: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }} className="logout-btn" title="Cerrar Sesión">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.6rem', 
                padding: '0.6rem 1.2rem', 
                borderRadius: '12px', 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: 'var(--primary)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontWeight: 'bold'
              }}>
                <LogIn size={18} /> <span className="nav-user-name">Iniciar sesión</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>

  );
}
