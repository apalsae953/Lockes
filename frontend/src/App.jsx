import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Pokedex from './pages/Pokedex';
import MisPartidas from './pages/MisPartidas';
import PartidaTracker from './pages/PartidaTracker';
import TablaTipos from './pages/TablaTipos';
import MisReglas from './pages/MisReglas';
import Login from './pages/Login';
import LoginSuccess from './pages/LoginSuccess';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
// import ForgotPassword from './pages/ForgotPassword';
// import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-success" element={<LoginSuccess />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/pokedex" element={<Pokedex />} />
        <Route path="/tipos" element={<TablaTipos />} />
        <Route path="/mis-reglas" element={<MisReglas />} />
        <Route path="/mis-partidas" element={<MisPartidas />} />
        <Route path="/tracker/:id" element={<PartidaTracker />} />
        <Route path="/contacto" element={<Contact />} />
        {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
        {/* <Route path="/reset-password" element={<ResetPassword />} /> */}
      </Routes>
    </Router>

  );
}

export default App;
