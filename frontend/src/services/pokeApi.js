import axios from 'axios';

const BASE_URL = 'https://pokeapi.co/api/v2';

export const getRegions = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/region/`);
    return res.data.results;
  } catch (error) {
    console.error("Error fetching regions:", error);
    return [];
  }
};

export const getRegionLocations = async (regionName) => {
  try {
    const res = await axios.get(`${BASE_URL}/region/${regionName}`);
    
    // Obtenemos los data completos de las localizaciones para leer español
    const locationsData = await Promise.all(
      res.data.locations.map(l => axios.get(l.url).then(r => r.data).catch(() => null))
    );

    return locationsData.map(loc => {
      if (!loc) return "Lugar desconocido";
      const esName = loc.names.find(n => n.language.name === 'es');
      if (esName) return esName.name;
      
      // Fallback
      return loc.name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
};

export const getAllPokemonNames = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/pokemon?limit=1025`);
    return res.data.results.map(p => {
      const parts = p.url.split('/');
      return {
        id: parseInt(parts[parts.length - 2]),
        name: p.name
      };
    });
  } catch (error) {
    return [];
  }
};

export const getPokemonByType = async (type) => {
  try {
    const res = await axios.get(`${BASE_URL}/type/${type}`);
    return res.data.pokemon.map(p => p.pokemon.name);
  } catch (error) {
    return [];
  }
};

export const getPokemonList = async (limit = 20, offset = 0) => {
  try {
    const response = await axios.get(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
    // We fetch detailed info for each pokemon in the list
    const results = await Promise.all(
      response.data.results.map(async (pokemon) => {
        const details = await axios.get(pokemon.url);
        return formatPokemonData(details.data);
      })
    );
    return {
      results,
      nextOffset: offset + limit,
      hasMore: response.data.next !== null
    };
  } catch (error) {
    console.error("Error fetching pokemon list:", error);
    return { results: [], nextOffset: offset, hasMore: false };
  }
};

export const getPokemonSpecies = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/pokemon-species/${id}/`);
    // Filter flavor text to spanish only
    const esText = response.data.flavor_text_entries.find(entry => entry.language.name === 'es');
    return esText ? esText.flavor_text.replace(/\f/g, ' ') : 'Agilidad y destreza no descritas aún.';
  } catch (error) {
    console.error("Error fetching species:", error);
    return 'Entrada de pokedex no disponible.';
  }
};

const formatPokemonData = (data) => {
  return {
    id: data.id,
    name: data.name,
    types: data.types.map(t => t.type.name),
    stats: data.stats.map(s => ({
      name: s.stat.name,
      value: s.base_stat
    })),
    // Official artwork image is high quality
    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`,
    spriteId: String(data.id).padStart(3, '0') // Used for UI display Ex: #001
  };
};

export const getTypeColor = (type) => {
  return `var(--type-${type}, var(--bg-card))`;
};
