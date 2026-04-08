import { getTypeColor } from '../services/pokeApi';

export default function PokemonCard({ pokemon, onClick }) {
  // Use primary type for background subtle glow
  const primaryTypeColor = getTypeColor(pokemon.types[0]);

  return (
    <div 
      className="pokemon-card glass" 
      onClick={() => onClick(pokemon)}
      style={{ '--card-glow': primaryTypeColor }}
    >
      <div className="pokemon-id">#{pokemon.spriteId}</div>
      <img 
        src={pokemon.image} 
        alt={pokemon.name} 
        className="pokemon-img"
        loading="lazy" 
      />
      <div className="pokemon-info">
        <h3>{pokemon.name}</h3>
        <div className="types-container">
          {pokemon.types.map(type => (
            <span 
              key={type} 
              className="type-badge" 
              style={{ backgroundColor: getTypeColor(type) }}
            >
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
