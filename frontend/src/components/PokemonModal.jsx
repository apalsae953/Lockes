import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getPokemonSpecies } from '../services/pokeApi';

export const TYPE_ES = {
  normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico',
  grass: 'Planta', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
  ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
  rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro',
  steel: 'Acero', fairy: 'Hada'
};

export default function PokemonModal({ pokemon, onClose }) {
  const [description, setDescription] = useState('Cargando base de datos de la pokédex...');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    getPokemonSpecies(pokemon.id).then(text => {
      // Find the first spanish entry if we modified the service, or just let whatever text come in
      setDescription(text);
    }).catch(() => {
      setDescription("No se encontró entrada en la Pokédex.");
    });

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [pokemon.id]);

  const primaryColor = `var(--type-${pokemon.types[0]})`;

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose();
    }
  };

  const statNames = {
    'hp': 'PS',
    'attack': 'Ataque',
    'defense': 'Defensa',
    'special-attack': 'Atq. Esp',
    'special-defense': 'Def. Esp',
    'speed': 'Velocidad'
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} style={{ zIndex: 99999 }}>
      <div className="modal-content glass" style={{ border: `1px solid ${primaryColor}` }}>
        <button className="modal-close" onClick={onClose}><X size={24} /></button>
        
        <div className="modal-left" style={{ 
          background: `radial-gradient(circle at center, ${primaryColor} 0%, transparent 80%)`,
          position: 'relative'
        }}>
          <div className="pokemon-id" style={{ position: 'absolute', top: '1rem', right: '1rem', opacity: 0.8, fontSize: '1.5rem', fontWeight: 800 }}>
            #{pokemon.spriteId}
          </div>
          <img 
            src={pokemon.image} 
            alt={pokemon.name} 
            style={{ width: '100%', maxWidth: '300px', filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.5))', zIndex: 2, position: 'relative' }}
          />
          <h2 style={{ fontSize: '2.5rem', textTransform: 'capitalize', marginTop: '1rem', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            {pokemon.name}
          </h2>
          <div className="types-container" style={{ marginTop: '1rem', justifyContent: 'center' }}>
            {pokemon.types.map(type => (
              <span key={type} className="type-badge" style={{ background: `var(--type-${type})`, fontSize: '1rem', padding: '0.4rem 1rem', color: '#000' }}>
                {TYPE_ES[type] || type}
              </span>
            ))}
          </div>
        </div>

        <div className="modal-right">
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', color: primaryColor }}>
            Entrada de la Pokédex
          </h3>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--text-main)', fontStyle: 'italic', marginBottom: '2rem' }}>
            "{description}"
          </p>

          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            Estadísticas Base
          </h3>
          <div className="stats-container">
            {pokemon.stats.map(stat => {
              const statPercentage = Math.min((stat.value / 255) * 100, 100);
              const label = statNames[stat.name] || stat.name;
              
              return (
                <div key={stat.name} className="stat-row">
                  <span className="stat-name">{label}</span>
                  <span className="stat-value">{stat.value}</span>
                  <div className="stat-bar-bg">
                    <div 
                      className="stat-bar" 
                      style={{ 
                        width: `${statPercentage}%`, 
                        backgroundColor: primaryColor,
                        boxShadow: `0 0 10px ${primaryColor}` 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
