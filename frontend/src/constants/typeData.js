export const TYPE_ES = {
  normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico',
  grass: 'Planta', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
  ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
  rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro',
  steel: 'Acero', fairy: 'Hada'
};

export const EFICACIA_DEFENSIVA = {
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

export const calculateEffectiveness = (types) => {
  const effectiveness = {};
  
  types.forEach(type => {
    const data = EFICACIA_DEFENSIVA[type];
    if (!data) return;

    data.weakness.forEach(t => {
      effectiveness[t] = (effectiveness[t] ?? 1) * 2;
    });
    data.resistance.forEach(t => {
      effectiveness[t] = (effectiveness[t] ?? 1) * 0.5;
    });
    data.immune.forEach(t => {
      effectiveness[t] = 0;
    });
  });

  const weakness = [];
  const resistance = [];
  const superWeakness = [];
  const superResistance = [];
  const immune = [];

  Object.keys(EFICACIA_DEFENSIVA).forEach(type => {
    const val = effectiveness[type] === undefined ? 1 : effectiveness[type];
    if (val === 4) superWeakness.push(type);
    else if (val === 2) weakness.push(type);
    else if (val === 0.25) superResistance.push(type);
    else if (val === 0.5) resistance.push(type);
    else if (val === 0) immune.push(type);
  });

  return { superWeakness, weakness, superResistance, resistance, immune };
};
