import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Pokedex from './pages/Pokedex';
import AbilityDex from './pages/AbilityDex';
import MisPartidas from './pages/MisPartidas';
import PartidaTracker from './pages/PartidaTracker';
import TablaTipos from './pages/TablaTipos';
import MisReglas from './pages/MisReglas';
import Login from './pages/Login';
import LoginSuccess from './pages/LoginSuccess';
import Profile from './pages/Profile';
// import Contact from './pages/Contact';
import TeamBuilder from './pages/TeamBuilder';
// import ForgotPassword from './pages/ForgotPassword';
// import ResetPassword from './pages/ResetPassword';

// Estructura de páginas plana para mejorar compatibilidad con Vercel
function App() {
  useEffect(() => {
    if (!window.Capacitor) return;

    const handleUrl = (rawUrl) => {
      try {
        // rawUrl is "lockes://login-success?token=..."
        const cleanUrl = rawUrl.replace('lockes://', 'http://');
        const url = new URL(cleanUrl);
        if (url.pathname === '/login-success' || rawUrl.includes('login-success')) {
          const token = url.searchParams.get('token');
          if (token) {
            localStorage.setItem('token', token);
            window.location.hash = `/login-success?token=${token}`;
            window.location.reload();
          }
        }
      } catch (e) {
        console.error('Error al procesar URL de la app:', e);
      }
    };

    // 1. Escuchar cuando la app ya está abierta en segundo plano
    const handleAppUrl = CapApp.addListener('appUrlOpen', (data) => {
      handleUrl(data.url);
    });

    // 2. Comprobar si la app fue abierta desde cero por el enlace
    CapApp.getLaunchUrl().then((launchUrlObj) => {
      if (launchUrlObj && launchUrlObj.url) {
        handleUrl(launchUrlObj.url);
      }
    });

    return () => {
      handleAppUrl.then(listener => listener.remove());
    };
  }, []);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-success" element={<LoginSuccess />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/pokedex" element={<Pokedex />} />
        <Route path="/habilidex" element={<AbilityDex />} />
        <Route path="/tipos" element={<TablaTipos />} />
        <Route path="/mis-reglas" element={<MisReglas />} />
        <Route path="/mis-partidas" element={<MisPartidas />} />
        <Route path="/tracker/:id" element={<PartidaTracker />} />
        {/* <Route path="/contacto" element={<Contact />} /> */}
        <Route path="/equipos" element={<TeamBuilder />} />
        {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
        {/* <Route path="/reset-password" element={<ResetPassword />} /> */}
      </Routes>
    </Router>

  );
}

export default App;
