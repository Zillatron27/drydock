import type {
  Blueprint,
  ModuleSelections,
  ModuleSlot,
  BlueprintExport,
  CollectionExport,
  ImportResult,
} from '../types';
import {
  stlEngine,
  stlFuelTank,
  ftlReactor,
  ftlFuelTank,
  cargoBay,
  hullPlates,
  heatShielding,
  whippleShielding,
  stabilitySystem,
  radiationShielding,
  selfRepairDrones,
  highGSeats,
} from '../data/modules';

// Validation lookup: each key maps to its ModuleSlot (which has .options and .required)
const SLOT_REGISTRY: Record<keyof ModuleSelections, ModuleSlot> = {
  stlEngine,
  stlFuelTank,
  ftlReactor,
  ftlFuelTank,
  cargoBay,
  hullPlates,
  heatShielding,
  whippleShielding,
  stabilitySystem,
  radiationShielding,
  selfRepairDrones,
  highGSeats,
};

const SLOT_KEYS = Object.keys(SLOT_REGISTRY) as Array<keyof ModuleSelections>;

const EXPORT_VERSION = '1.0';

// --- Export ---

export function exportBlueprint(blueprint: Blueprint): BlueprintExport {
  return {
    type: 'drydock-blueprint',
    version: EXPORT_VERSION,
    exported_at: new Date().toISOString(),
    name: blueprint.name,
    modules: { ...blueprint.moduleSelections },
  };
}

export function exportCollection(blueprints: Blueprint[]): CollectionExport {
  return {
    type: 'drydock-collection',
    version: EXPORT_VERSION,
    exported_at: new Date().toISOString(),
    blueprints: blueprints.map(bp => ({
      name: bp.name,
      modules: { ...bp.moduleSelections },
    })),
  };
}

// --- Validation ---

/** Validate a single blueprint's data (internal). Returns validated name + modules or error. */
function validateBlueprintData(
  data: unknown,
  label: string,
): { valid: true; name: string; modules: ModuleSelections } | { valid: false; error: string } {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { valid: false, error: `${label}: not a valid object` };
  }

  const obj = data as Record<string, unknown>;

  // Name
  if (typeof obj.name !== 'string' || obj.name.trim() === '') {
    return { valid: false, error: `${label}: missing or empty "name"` };
  }
  const name = obj.name.trim().slice(0, 50);

  // Modules object
  if (typeof obj.modules !== 'object' || obj.modules === null || Array.isArray(obj.modules)) {
    return { valid: false, error: `${label}: missing or invalid "modules" object` };
  }
  const mods = obj.modules as Record<string, unknown>;

  // Reject unknown keys in modules
  for (const key of Object.keys(mods)) {
    if (!SLOT_KEYS.includes(key as keyof ModuleSelections)) {
      return { valid: false, error: `${label}: unknown module key "${key}"` };
    }
  }

  // Validate each slot, build into a plain record then cast once at the end
  const built: Record<string, string | null> = {};
  for (const key of SLOT_KEYS) {
    const slot = SLOT_REGISTRY[key];
    const value = mods[key];

    if (slot.required) {
      if (typeof value !== 'string' || value === '') {
        return { valid: false, error: `${label}: required module "${key}" is missing or null` };
      }
      if (!slot.options.some(opt => opt.ticker === value)) {
        return { valid: false, error: `${label}: invalid ticker "${value}" for slot "${key}"` };
      }
      built[key] = value;
    } else {
      if (value === null || value === undefined) {
        built[key] = null;
      } else if (typeof value === 'string') {
        if (!slot.options.some(opt => opt.ticker === value)) {
          return { valid: false, error: `${label}: invalid ticker "${value}" for slot "${key}"` };
        }
        built[key] = value;
      } else {
        return { valid: false, error: `${label}: module "${key}" must be a string or null` };
      }
    }
  }

  return { valid: true, name, modules: built as unknown as ModuleSelections };
}

/** Validate a drydock-blueprint import */
function validateSingleBlueprint(data: Record<string, unknown>): ImportResult {
  const result = validateBlueprintData(data, 'Blueprint');
  if (!result.valid) return { success: false, error: result.error };
  return { success: true, entries: [{ name: result.name, modules: result.modules }] };
}

/** Validate a drydock-collection import */
function validateCollection(data: Record<string, unknown>): ImportResult {
  if (!Array.isArray(data.blueprints)) {
    return { success: false, error: 'Collection: missing "blueprints" array' };
  }

  const entries: Array<{ name: string; modules: ModuleSelections }> = [];
  const errors: string[] = [];

  for (let i = 0; i < data.blueprints.length; i++) {
    const result = validateBlueprintData(data.blueprints[i], `Blueprint[${i}]`);
    if (result.valid) {
      entries.push({ name: result.name, modules: result.modules });
    } else {
      errors.push(result.error);
    }
  }

  if (entries.length === 0 && errors.length > 0) {
    return { success: false, error: errors.join('; ') };
  }

  // Empty collection with no errors is valid — just has zero entries
  return { success: true, entries };
}

/** Entry point: parse raw JSON string and validate */
export function validateImport(raw: string): ImportResult {
  // Strip UTF-8 BOM and trim whitespace
  const cleaned = raw.replace(/^\uFEFF/, '').trim();

  if (cleaned === '') {
    return { success: false, error: 'Empty input' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { success: false, error: 'Invalid JSON' };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { success: false, error: 'Expected a JSON object' };
  }

  const data = parsed as Record<string, unknown>;

  // Type routing
  if (data.type !== 'drydock-blueprint' && data.type !== 'drydock-collection') {
    return { success: false, error: `Unknown or missing type: "${String(data.type ?? '')}"` };
  }

  // Version check: major must be 1
  if (typeof data.version !== 'string') {
    return { success: false, error: 'Missing "version" field' };
  }
  const version = data.version as string;
  const majorStr = version.split('.')[0] ?? '';
  const major = parseInt(majorStr, 10);
  if (isNaN(major) || major !== 1) {
    return { success: false, error: `Incompatible version "${data.version}" (expected 1.x)` };
  }

  if (data.type === 'drydock-blueprint') {
    return validateSingleBlueprint(data);
  }

  return validateCollection(data);
}

// --- Name collision resolution ---

export function resolveNameCollisions(newNames: string[], existingNames: string[]): string[] {
  const taken = new Set(existingNames);
  const resolved: string[] = [];

  for (const name of newNames) {
    let candidate = name;
    if (taken.has(candidate)) {
      candidate = `${name} (imported)`;
      let counter = 2;
      while (taken.has(candidate)) {
        candidate = `${name} (imported ${counter})`;
        counter++;
      }
    }
    taken.add(candidate);
    resolved.push(candidate);
  }

  return resolved;
}

// --- Clipboard / file helpers ---

export async function copyToClipboard(json: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(json);
    return true;
  } catch {
    return false;
  }
}

export function downloadAsFile(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildExportFilename(type: 'blueprint' | 'collection', name?: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  if (type === 'blueprint' && name) {
    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `drydock-blueprint-${safeName}-${timestamp}.json`;
  }
  return `drydock-collection-${timestamp}.json`;
}
