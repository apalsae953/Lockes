import axios from 'axios';
import { TYPE_ES } from '../constants/typeData';

const BASE_URL = 'https://pokeapi.co/api/v2';

export const formatPokemonName = (name) => {
  if (name.includes('-mega')) {
    const parts = name.split('-mega');
    const base = parts[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const suffix = parts[1] ? parts[1].replace(/-/g, ' ').trim().toUpperCase() : '';
    return suffix ? `Mega ${base} ${suffix}` : `Mega ${base}`;
  }
  if (name.includes('-primal')) {
    const base = name.replace('-primal', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return `Primal ${base}`;
  }
  return name.replace(/-/g, ' ');
};

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
    const res = await axios.get(`${BASE_URL}/pokemon?limit=3000`);
    const results = res.data.results;
    
    // Primero creamos un mapa de Pokémon base (1-1025) para referencia rápida
    const baseMap = {};
    const processedList = results.map(p => {
      const parts = p.url.split('/');
      const id = parseInt(parts[parts.length - 2]);
      if (id <= 1025) baseMap[p.name] = id;
      return { id, name: p.name };
    });

    const regionalSuffixes = ['-alola', '-galar', '-hisui', '-paldea'];
    const megaSuffixes = ['-mega', '-primal'];

    // Formas especiales: mapa de nombre → nombre base para buscar en baseMap
    const specialForms = new Map([['floette-eternal', 'floette']]);

    const getBaseName = (name) => {
      let base = name;
      // Cortar desde el sufijo regional (puede estar en medio: tauros-paldea-combat)
      for (const suffix of regionalSuffixes) {
        const idx = base.indexOf(suffix);
        if (idx !== -1) { base = base.substring(0, idx); break; }
      }
      // Cortar desde -mega o -primal en adelante
      const megaIdx = base.indexOf('-mega');
      if (megaIdx !== -1) return base.substring(0, megaIdx);
      const primalIdx = base.indexOf('-primal');
      if (primalIdx !== -1) return base.substring(0, primalIdx);
      return base;
    };

    return processedList
      .filter(p => {
        if (p.id <= 1025) return true;
        if (specialForms.has(p.name)) return true;
        if (regionalSuffixes.some(key => p.name.includes(key))) return true;
        if (megaSuffixes.some(key => p.name.includes(key))) return true;
        return false;
      })
      .map(p => {
        let dexId = p.id;
        if (p.id > 1025) {
          if (specialForms.has(p.name)) {
            dexId = baseMap[specialForms.get(p.name)] || p.id;
          } else {
            dexId = baseMap[getBaseName(p.name)] || p.id;
          }
        }
        return { id: p.id, dexId, name: p.name };
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
    // Obtenemos información detallada para cada Pokémon de la lista
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
    // Para formas regionales, primero obtenemos los datos del pokemon para hallar su especie
    const pokemonRes = await axios.get(`${BASE_URL}/pokemon/${id}`);
    const speciesUrl = pokemonRes.data.species.url;
    const res = await axios.get(speciesUrl);
    
    const entry = res.data.flavor_text_entries.find(e => e.language.name === 'es') || 
                  res.data.flavor_text_entries.find(e => e.language.name === 'en');
    return entry ? entry.flavor_text.replace(/\f/g, ' ') : "No hay descripción disponible.";
  } catch (error) {
    return "No se pudo cargar la descripción.";
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
    // El artwork oficial tiene alta calidad
    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`,
    spriteId: String(data.id).padStart(3, '0') // Usado para mostrar en la UI, ej: #001
  };
};

export const getEvolutionChain = async (id) => {
  try {
    const pokemonRes = await axios.get(`${BASE_URL}/pokemon/${id}`);
    const currentPokemonName = pokemonRes.data.name;
    const speciesRes = await axios.get(pokemonRes.data.species.url);
    const evolutionChainUrl = speciesRes.data.evolution_chain.url;
    const evoRes = await axios.get(evolutionChainUrl);
    
    const regionalSuffixes = ['-alola', '-galar', '-hisui', '-paldea'];
    const regionalKeywords = ['alola', 'galar', 'hisui', 'paldea'];
    const activeSuffix = regionalSuffixes.find(s => currentPokemonName.endsWith(s)) || '';

    const chain = [];
    let current = evoRes.data.chain;

    const capitalize = (str) => {
      const translations = {
        'moss-rock': 'Roca Musgo', 'ice-rock': 'Roca Hielo',
        'leaf-stone': 'Piedra Hoja', 'ice-stone': 'Piedra Hielo',
        'fire-stone': 'Piedra Fuego', 'water-stone': 'Piedra Agua',
        'thunder-stone': 'Piedra Trueno', 'moon-stone': 'Piedra Lunar',
        'sun-stone': 'Piedra Solar', 'shiny-stone': 'Piedra Día',
        'dusk-stone': 'Piedra Noche', 'dawn-stone': 'Piedra Alba',
        'everstone': 'Piedra Eterna'
      };
      if (translations[str]) return translations[str];
      return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
    };

    const processStep = async (step, evolvesFromId = null, parentSuffix = '') => {
      const speciesName = step.species.name;
      const stepSpeciesRes = await axios.get(step.species.url);
      const sData = stepSpeciesRes.data;
      
      // Lista de Pokémon cuya forma regional evoluciona de una pre-evolución estándar
      const regionalBranchers = [
        'raichu-alola', 'exeggutor-alola', 'marowak-alola', 
        'weezing-galar', 'lilligant-hisui', 'braviary-hisui', 
        'sliggoo-hisui', 'avalugg-hisui', 'decidueye-hisui', 
        'typhlosion-hisui', 'samurott-hisui', 'kleavor', 'ursaluna'
      ];

      // Obtenemos todas las variedades relevantes (Base + Regionales + Eternales)
      let relevantVarieties = sData.varieties.filter(v => {
        const n = v.pokemon.name;
        if (n === speciesName) return true;
        if (n.endsWith('-eternal')) return true;
        return regionalSuffixes.some(suffix => n.endsWith(suffix));
      });

      // Filtrado inteligente según el ancestro
      if (parentSuffix) {
        const hasRegionalVariety = relevantVarieties.some(v => v.pokemon.name.includes(parentSuffix));
        if (hasRegionalVariety) {
          // Este eslabón tiene forma regional: continuar solo en esa línea
          relevantVarieties = relevantVarieties.filter(v => v.pokemon.name.includes(parentSuffix));
        } else {
          // Este eslabón no tiene forma regional (ej: Pichu/Pikachu en cadena Alola):
          // usar la base y propagar el sufijo al siguiente paso
          relevantVarieties = relevantVarieties.filter(v => v.pokemon.name === speciesName);
        }
      } else {
        // Si venimos de un estándar, queremos el base y solo regionales que ramifican de estándar
        relevantVarieties = relevantVarieties.filter(v =>
          v.pokemon.name === speciesName ||
          v.pokemon.name.endsWith('-eternal') ||
          regionalBranchers.some(b => v.pokemon.name.includes(b))
        );
      }

      for (const variety of relevantVarieties) {
        const vParts = variety.pokemon.url.split('/');
        const vId = vParts[vParts.length - 2];
        const vName = variety.pokemon.name;
        const currentVarietySuffix = regionalSuffixes.find(s => vName.endsWith(s)) || '';

        const detailsArray = step.evolution_details || [];
        const methods = detailsArray.map(d => {
          let trigger = '';
          let conditions = [];
          if (d.trigger) {
            const tName = d.trigger.name;
            if (tName === 'level-up') trigger = 'Subir Nivel';
            else if (tName === 'use-item') trigger = 'Usar';
            else if (tName === 'trade') trigger = 'Intercambio';
            else trigger = capitalize(tName);
          }
          if (d.min_level) conditions.push(`Nivel ${d.min_level}`);
          if (d.min_happiness) conditions.push('Felicidad');
          if (d.min_affection) conditions.push('Afecto');
          if (d.known_move) conditions.push(`Conoce ${capitalize(d.known_move.name)}`);
          if (d.known_move_type) {
            const typeEs = TYPE_ES[d.known_move_type.name] || d.known_move_type.name;
            conditions.push(`Mov. Tipo ${capitalize(typeEs)}`);
          }
          if (d.held_item) conditions.push(`Llevando ${capitalize(d.held_item.name)}`);
          if (d.item) conditions.push(capitalize(d.item.name));
          if (d.location) conditions.push('Lugar Especial');
          if (d.time_of_day) conditions.push(d.time_of_day === 'day' ? 'Día' : 'Noche');
          return { trigger, condition: conditions.join(' + ') };
        });

        let filteredMethods = methods;
        if (currentVarietySuffix && methods.length > 1) {
          const specific = methods.find(m => m.condition.toLowerCase().includes(currentVarietySuffix.replace('-', '')) || m.condition.includes('Noche') || m.condition.includes('Hielo'));
          if (specific) filteredMethods = [specific];
        } else if (!currentVarietySuffix && methods.length > 1) {
          filteredMethods = methods.filter(m => !regionalKeywords.some(key => m.condition.toLowerCase().includes(key)));
          if (['rattata', 'raticate', 'exeggutor', 'raichu', 'marowak'].includes(vName)) {
             filteredMethods = filteredMethods.filter(m => !m.condition.includes('Noche'));
          }
        }

        // Simplificación de condiciones para evitar redundancia (ej: Felicidad y Afecto son casi lo mismo)
        const processedConditions = filteredMethods.map(m => {
          let c = m.condition;
          if (c.includes('Felicidad') && c.includes('Afecto')) return c.replace(' + Afecto', '');
          return c;
        });

        // Eliminar duplicados lógicos después de simplificar
        const uniqueConditions = [...new Set(processedConditions)];
        
        let finalCondition = uniqueConditions.join(' o ') || (methods[0]?.condition || '');
        const finalTrigger = filteredMethods[0]?.trigger || (methods[0]?.trigger || '');
        
        // Caso ultra-específico para Sylveon y similares
        if (uniqueConditions.length > 1 && 
            uniqueConditions.every(c => c.includes('Mov. Tipo Hada')) &&
            uniqueConditions.some(c => c.includes('Felicidad')) && 
            uniqueConditions.some(c => c.includes('Afecto'))) {
          finalCondition = 'Amistad + Mov. Tipo Hada';
        }

        chain.push({
          id: vId,
          dexId: sData.id.toString(),
          name: formatPokemonName(vName),
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${vId}.png`,
          trigger: finalTrigger,
          level: finalCondition,
          evolvesFromId
        });

        // Añadir Megas/Primales como hijos directos sin condición de evolución
        if (!vName.includes('-mega') && !vName.includes('-primal')) {
          const megaForms = sData.varieties.filter(v => {
            const n = v.pokemon.name;
            return n.includes('-mega') || n.includes('-primal');
          });
          for (const mega of megaForms) {
            const megaParts = mega.pokemon.url.split('/');
            const megaId = megaParts[megaParts.length - 2];
            chain.push({
              id: megaId,
              dexId: sData.id.toString(),
              name: formatPokemonName(mega.pokemon.name),
              image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${megaId}.png`,
              trigger: '',
              level: '',
              evolvesFromId: vId
            });
          }
        }

        // Solo propagar la cadena desde la variedad canónica o la forma regional,
        // nunca desde formas especiales (eternal, etc.) que no evolucionan.
        // Propagamos currentVarietySuffix || parentSuffix para mantener el contexto
        // regional cuando el eslabón actual no tiene forma propia (ej: Pichu en cadena Alola).
        const canPropagate = vName === speciesName || regionalSuffixes.some(s => vName.endsWith(s));
        if (canPropagate && step.evolves_to.length > 0) {
          const nextSuffix = currentVarietySuffix || parentSuffix;
          for (const nextStep of step.evolves_to) {
            await processStep(nextStep, vId, nextSuffix);
          }
        }
      }
    };

    await processStep(current, null, activeSuffix);
    return chain;
  } catch (error) {
    console.error("Error fetching evolution chain:", error);
    return [];
  }
};


export const getTypeColor = (type) => {
  return `var(--type-${type}, var(--bg-card))`;
};
