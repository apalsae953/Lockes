// Reglas personalizadas del jugador, guardadas en localStorage.
// Formato: { id, name, description } (igual que UNIVERSAL_RULES / PRESET_VARIANTS).

const STORAGE_KEY = 'customRules';

// Entre junio y noviembre de 2026 "Mis Reglas" guardó por error en esta clave
// y con los campos { nombre, descripcion }. Se recuperan al cargar.
const LEGACY_KEY = 'reglasPersonalizadas';

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function normalize(rule) {
  const { nombre, descripcion, ...rest } = rule;
  return {
    ...rest,
    name: rule.name ?? nombre ?? '',
    description: rule.description ?? descripcion ?? '',
  };
}

export function saveCustomRules(rules) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  } catch {
    // Sin almacenamiento disponible: las reglas solo duran esta sesión.
  }
}

export function loadCustomRules() {
  const current = readArray(STORAGE_KEY).map(normalize);
  const legacy = readArray(LEGACY_KEY).map(normalize);

  if (legacy.length === 0) return current;

  const knownIds = new Set(current.map(r => r.id));
  const merged = [...current, ...legacy.filter(r => !knownIds.has(r.id))];

  saveCustomRules(merged);
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Si no se puede borrar, se volverá a fusionar sin duplicar (por id).
  }
  return merged;
}
