import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gamepad, LogIn, User as UserIcon, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../services/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem('theme') === 'light');

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  return (
    <nav className="navbar">
      <div className="container nav-content">
        <div className="nav-main" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '1rem' }}>
          <Link to="/" className="nav-logo gradient-text" style={{ marginRight: '1rem' }}>
            <Gamepad size={34} color="#ef4444" />
            <span>NuzTracker</span>
          </Link>

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
            <Link to="/contacto" className={`nav-link ${location.pathname === '/contacto' ? 'active' : ''}`}>
              Sugerencias
            </Link>
          </div>

          <div className="nav-user-section">
            {/* TOGGLE MODO CLARO/OSCURO CON SOLROCK Y LUNATONE */}
            <button 
              onClick={() => setIsLightMode(!isLightMode)} 
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.3s'
              }}
              className="theme-toggle-btn"
              title={isLightMode ? "Cambiar a Modo Oscuro (Lunatone)" : "Cambiar a Modo Claro (Solrock)"}
            >
              <img 
                src={isLightMode ? "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/337.png" : "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/338.png"} 
                alt="Theme switch" 
                style={{ width: '45px', height: '45px', filter: isLightMode ? 'none' : 'drop-shadow(0 0 8px var(--primary))' }} 
              />
            </button>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link to="/perfil" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.8rem',
                  background: 'rgba(var(--text-main-rgb), 0.03)',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  transition: 'all 0.3s'
                }} className="nav-profile-link">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--primary)' }} />
                  ) : (
                    <div style={{ padding: '0.4rem', background: 'var(--glass-border)', borderRadius: '50%', display: 'flex' }}><UserIcon size={16} /></div>
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
