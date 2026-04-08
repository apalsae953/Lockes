import { Link, useLocation } from 'react-router-dom';
import { Ghost } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="container nav-content">
        <Link to="/" className="nav-logo gradient-text">
          <Ghost size={28} color="#ef4444" />
          NuzTracker
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Reglas & Info
          </Link>
          <Link to="/pokedex" className={`nav-link ${location.pathname === '/pokedex' ? 'active' : ''}`}>
            Pokédex
          </Link>
          <Link to="/tipos" className={`nav-link ${location.pathname === '/tipos' ? 'active' : ''}`}>
            Tabla de Tipos
          </Link>
          <Link to="/mis-reglas" className={`nav-link ${location.pathname === '/mis-reglas' ? 'active' : ''}`}>
            Mis Reglas
          </Link>
          <Link to="/mis-partidas" className={`nav-link ${location.pathname.includes('/mis-partidas') || location.pathname.includes('/tracker') ? 'active' : ''}`}>
            Mis Partidas
          </Link>
        </div>
      </div>
    </nav>
  );
}
