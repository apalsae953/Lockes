export const PRESET_ROUTES = {
  kanto: [
    'Pokémon Inicial', 'Ruta 1', 'Ruta 22', 'Ruta 2', 'Bosque Verde', 
    'Ciudad Plateada', 'Ruta 3', 'Monte Moon', 'Ruta 4', 'Ciudad Celeste', 
    'Ruta 24', 'Ruta 25', 'Ruta 5', 'Ruta 6', 'Ciudad Carmín', 
    'Ruta 11', 'Cueva Diglett', 'Ruta 9', 'Ruta 10', 'Túnel Roca',
    'Pueblo Lavanda', 'Ruta 8', 'Ruta 7', 'Guarida Rocket',
    'Torre Pokémon', 'Ruta 12', 'Ruta 16', 'Ruta 17', 'Ruta 18',
    'Zona Safari', 'Ruta 19', 'Ruta 20', 'Islas Espuma', 'Mansión Pokémon'
  ],
  johto: [
    'Pokémon Inicial', 'Ruta 29', 'Ruta 46', 'Ruta 30', 'Ruta 31',
    'Cueva Oscura', 'Torre Bellsprout', 'Ruta 32', 'Ruinas Alfa', 'Cueva Unión',
    'Ruta 33', 'Pozo Slowpoke', 'Encinar', 'Ruta 34', 'Ruta 35',
    'Parque Nacional', 'Ruta 36', 'Ruta 37', 'Torre Quemada', 'Ruta 38',
    'Ruta 39', 'Ruta 40', 'Ruta 41', 'Islas Remolino', 'Monte Mortero',
    'Ruta 42', 'Ruta 43', 'Lago de la Furia', 'Ruta 44', 'Ruta 45', 'Cueva Helada'
  ],
  hoenn: [
    'Pokémon Inicial', 'Ruta 101', 'Ruta 102', 'Ruta 103', 'Ruta 104',
    'Bosque Petalia', 'Túnel Fervegal', 'Ruta 116', 'Cueva Granito',
    'Ruta 105', 'Ruta 106', 'Ruta 109', 'Ruta 110', 'Ruta 117',
    'Ruta 111', 'Ruta 112', 'Senda Ígnea', 'Ruta 113', 'Ruta 114',
    'Cascada Meteoro', 'Ruta 115', 'Monte Cenizo', 'Desfiladero', 'Ruta 119',
    'Ruta 120', 'Ruta 121', 'Monte Pírico', 'Guarida Magma/Aqua', 'Ruta 124'
  ],
  sinnoh: [
    'Pokémon Inicial', 'Ruta 201', 'Ruta 202', 'Ruta 203', 'Puerta Pirita',
    'Mina Pirita', 'Ruta 204', 'Senda Desolada', 'Valle Eólico', 'Ruta 205',
    'Bosque Veto', 'Ruta 206', 'Cueva Extravío', 'Ruta 207', 'Monte Corona',
    'Ruta 208', 'Ruta 209', 'Torre Perdida', 'Ruta 210', 'Ruta 212',
    'Ruta 213', 'Ruta 214', 'Ruta 215', 'Gran Pantano', 'Ruta 218'
  ]
};

export const REGION_BOSSES = {
  kanto: [
    { name: 'Brock', img: 'brock', level: 14, title: 'Líder 1' },
    { name: 'Misty', img: 'misty', level: 21, title: 'Líder 2' },
    { name: 'Lt. Surge', img: 'ltsurge', level: 24, title: 'Líder 3' },
    { name: 'Erika', img: 'erika', level: 29, title: 'Líder 4' },
    { name: 'Koga', img: 'koga', level: 43, title: 'Líder 5' },
    { name: 'Sabrina', img: 'sabrina', level: 43, title: 'Líder 6' },
    { name: 'Blaine', img: 'blaine', level: 47, title: 'Líder 7' },
    { name: 'Giovanni', img: 'giovanni', level: 50, title: 'Líder 8' },
    { name: 'Lorelei', img: 'lorelei', level: 54, title: 'Alto Mando 1' },
    { name: 'Bruno', img: 'bruno', level: 55, title: 'Alto Mando 2' },
    { name: 'Agatha', img: 'agatha', level: 58, title: 'Alto Mando 3' },
    { name: 'Lance', img: 'lance', level: 60, title: 'Alto Mando 4' },
    { name: 'Blue', img: 'blue', level: 65, title: 'Campeón' }
  ],
  johto: [
    { name: 'Pegaso', img: 'falkner', level: 13, title: 'Líder 1' },
    { name: 'Antón', img: 'bugsy', level: 15, title: 'Líder 2' },
    { name: 'Blanca', img: 'whitney', level: 19, title: 'Líder 3' },
    { name: 'Morti', img: 'morty', level: 25, title: 'Líder 4' },
    { name: 'Aníbal', img: 'chuck', level: 31, title: 'Líder 5' },
    { name: 'Fredo', img: 'pryce', level: 34, title: 'Líder 6' },
    { name: 'Yasmina', img: 'jasmine', level: 35, title: 'Líder 7' },
    { name: 'Débora', img: 'clair', level: 41, title: 'Líder 8' },
    { name: 'Mento', img: 'will', level: 42, title: 'Alto Mando 1' },
    { name: 'Koga', img: 'koga', level: 44, title: 'Alto Mando 2' },
    { name: 'Bruno', img: 'bruno', level: 46, title: 'Alto Mando 3' },
    { name: 'Karen', img: 'karen', level: 47, title: 'Alto Mando 4' },
    { name: 'Lance', img: 'lance', level: 50, title: 'Campeón' }
  ],
  hoenn: [
    { name: 'Petra', img: 'roxanne', level: 15, title: 'Líder 1' },
    { name: 'Marcial', img: 'brawly', level: 19, title: 'Líder 2' },
    { name: 'Erico', img: 'wattson', level: 24, title: 'Líder 3' },
    { name: 'Candela', img: 'flannery', level: 29, title: 'Líder 4' },
    { name: 'Norman', img: 'norman', level: 31, title: 'Líder 5' },
    { name: 'Alana', img: 'winona', level: 33, title: 'Líder 6' },
    { name: 'Vito y Leti', img: 'tate', level: 42, title: 'Líder 7' },
    { name: 'Galano', img: 'juan', level: 46, title: 'Líder 8' },
    { name: 'Sixto', img: 'sidney', level: 49, title: 'Alto Mando 1' },
    { name: 'Fátima', img: 'phoebe', level: 51, title: 'Alto Mando 2' },
    { name: 'Nívea', img: 'glacia', level: 53, title: 'Alto Mando 3' },
    { name: 'Dracón', img: 'drake', level: 55, title: 'Alto Mando 4' },
    { name: 'Máximo', img: 'steven', level: 58, title: 'Campeón' }
  ],
  sinnoh: [
    { name: 'Roco', img: 'roark', level: 14, title: 'Líder 1' },
    { name: 'Gardenia', img: 'gardenia', level: 22, title: 'Líder 2' },
    { name: 'Brega', img: 'maylene', level: 30, title: 'Líder 3' },
    { name: 'Mananti', img: 'crasherwake', level: 30, title: 'Líder 4' },
    { name: 'Fantina', img: 'fantina', level: 36, title: 'Líder 5' },
    { name: 'Acerón', img: 'byron', level: 39, title: 'Líder 6' },
    { name: 'Inverna', img: 'candice', level: 42, title: 'Líder 7' },
    { name: 'Lectro', img: 'volkner', level: 49, title: 'Líder 8' },
    { name: 'Alecrán', img: 'aaron', level: 53, title: 'Alto Mando 1' },
    { name: 'Gaia', img: 'bertha', level: 55, title: 'Alto Mando 2' },
    { name: 'Fausto', img: 'flint', level: 57, title: 'Alto Mando 3' },
    { name: 'Delos', img: 'lucian', level: 59, title: 'Alto Mando 4' },
    { name: 'Cintia', img: 'cynthia', level: 62, title: 'Campeón' }
  ]
};

export const defaultRules = [
  'Muerte Permanente: Si se debilita, lo pones en la caja Cementerio',
  'Captura Limitada: Solo atrapar el primer encuentro de la ruta',
  'Vínculo: Ponle Mote a todo'
];
