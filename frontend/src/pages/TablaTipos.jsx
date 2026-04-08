import React from 'react';
import { getTypeColor } from '../services/pokeApi';

export default function TablaTipos() {
  const tipos = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice', 
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 
    'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
  ];

  // Simply mapping effectiveness
  const effectiveness = {
    normal: { weakness: ['fighting'], resistance: [], immune: ['ghost'] },
    fire: { weakness: ['water', 'ground', 'rock'], resistance: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'], immune: [] },
    water: { weakness: ['electric', 'grass'], resistance: ['fire', 'water', 'ice', 'steel'], immune: [] },
    electric: { weakness: ['ground'], resistance: ['electric', 'flying', 'steel'], immune: [] },
    grass: { weakness: ['fire', 'ice', 'poison', 'flying', 'bug'], resistance: ['water', 'electric', 'grass', 'ground'], immune: [] },
    ice: { weakness: ['fire', 'fighting', 'rock', 'steel'], resistance: ['ice'], immune: [] },
    fighting: { weakness: ['flying', 'psychic', 'fairy'], resistance: ['bug', 'rock', 'dark'], immune: [] },
    poison: { weakness: ['ground', 'psychic'], resistance: ['grass', 'fighting', 'poison', 'bug', 'fairy'], immune: [] },
    ground: { weakness: ['water', 'grass', 'ice'], resistance: ['poison', 'rock'], immune: ['electric'] },
    flying: { weakness: ['electric', 'ice', 'rock'], resistance: ['grass', 'fighting', 'bug'], immune: ['ground'] },
    psychic: { weakness: ['bug', 'ghost', 'dark'], resistance: ['fighting', 'psychic'], immune: [] },
    bug: { weakness: ['fire', 'flying', 'rock'], resistance: ['grass', 'fighting', 'ground'], immune: [] },
    rock: { weakness: ['water', 'grass', 'fighting', 'ground', 'steel'], resistance: ['normal', 'fire', 'poison', 'flying'], immune: [] },
    ghost: { weakness: ['ghost', 'dark'], resistance: ['poison', 'bug'], immune: ['normal', 'fighting'] },
    dragon: { weakness: ['ice', 'dragon', 'fairy'], resistance: ['fire', 'water', 'electric', 'grass'], immune: [] },
    dark: { weakness: ['fighting', 'bug', 'fairy'], resistance: ['ghost', 'dark'], immune: ['psychic'] },
    steel: { weakness: ['fire', 'fighting', 'ground'], resistance: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'], immune: ['poison'] },
    fairy: { weakness: ['poison', 'steel'], resistance: ['fighting', 'bug', 'dark'], immune: ['dragon'] }
  };

  const TypeBadge = ({ type }) => (
    <span className="type-badge" style={{ backgroundColor: getTypeColor(type) }}>
      {type}
    </span>
  );

  return (
    <div className="container" style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
      <h1 className="title-glow" style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '2rem' }}>
        Tabla de <span className="gradient-text">Tipos</span>
      </h1>
      
      <div className="table-container glass">
        <table className="excel-table">
          <thead>
            <tr>
              <th>Tipo Defensor</th>
              <th>Débil contra (x2)</th>
              <th>Resiste (x0.5)</th>
              <th>Inmune (x0)</th>
            </tr>
          </thead>
          <tbody>
            {tipos.map(tipo => (
              <tr key={tipo}>
                <td><TypeBadge type={tipo} /></td>
                <td>
                  <div className="types-container" style={{ flexWrap: 'wrap' }}>
                    {effectiveness[tipo].weakness.map(t => <TypeBadge key={t} type={t} />)}
                  </div>
                </td>
                <td>
                  <div className="types-container" style={{ flexWrap: 'wrap' }}>
                    {effectiveness[tipo].resistance.map(t => <TypeBadge key={t} type={t} />)}
                  </div>
                </td>
                <td>
                  <div className="types-container" style={{ flexWrap: 'wrap' }}>
                    {effectiveness[tipo].immune.map(t => <TypeBadge key={t} type={t} />)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
