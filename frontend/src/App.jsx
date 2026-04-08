import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Pokedex from './pages/Pokedex';
import MisPartidas from './pages/MisPartidas';
import PartidaTracker from './pages/PartidaTracker';
import TablaTipos from './pages/TablaTipos';
import MisReglas from './pages/MisReglas';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pokedex" element={<Pokedex />} />
        <Route path="/tipos" element={<TablaTipos />} />
        <Route path="/mis-reglas" element={<MisReglas />} />
        <Route path="/mis-partidas" element={<MisPartidas />} />
        <Route path="/tracker/:id" element={<PartidaTracker />} />
      </Routes>
    </Router>
  );
}

export default App;
