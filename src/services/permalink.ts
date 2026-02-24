import type { ModuleSelections } from '../types';

const PERMALINK_VERSION = '1';
const MIN_DIGITS = 6;
const MAX_NAME_LENGTH = 50;
const DEFAULT_NAME = 'Shared Blueprint';

/**
 * Static slot-to-options mapping for permalink encoding.
 * Index 0 for optional slots = null (none selected).
 * Ordering matches src/data/modules.ts — verified in tests.
 */
export const SLOT_OPTIONS: readonly (readonly (string | null)[])[] = [
  /* 0  STL Engine      */ ['ENG', 'FSE', 'GEN', 'AEN', 'HTE'],
  /* 1  STL Fuel Tank   */ ['SSL', 'MSL', 'LSL'],
  /* 2  FTL Reactor     */ [null, 'RCT', 'QCR', 'HPR', 'HYR'],
  /* 3  FTL Fuel Tank   */ [null, 'SFL', 'MFL', 'LFL'],
  /* 4  Cargo Bay       */ ['TCB', 'VSC', 'SCB', 'MCB', 'LCB', 'WCB', 'VCB', 'HCB'],
  /* 5  Hull Plates     */ ['BHP', 'LHP', 'RHP', 'HHP', 'AHP'],
  /* 6  Heat Shielding  */ [null, 'BPT', 'APT'],
  /* 7  Whipple Shield  */ [null, 'BWH', 'AWH'],
  /* 8  Stability       */ [null, 'STS'],
  /* 9  Radiation Shield */ [null, 'BRP', 'SRP', 'ARP'],
  /* 10 Repair Drones   */ [null, 'RDS', 'RDL'],
  /* 11 High-G Seats    */ [null, 'BGS', 'AGS'],
];

export const SLOT_KEYS: readonly (keyof ModuleSelections)[] = [
  'stlEngine', 'stlFuelTank', 'ftlReactor', 'ftlFuelTank',
  'cargoBay', 'hullPlates', 'heatShielding', 'whippleShielding',
  'stabilitySystem', 'radiationShielding', 'selfRepairDrones', 'highGSeats',
];

/** Encode a blueprint's module selections into a full permalink URL. */
export function encodeBlueprint(selections: ModuleSelections, name?: string): string {
  const digits: number[] = [];

  for (let i = 0; i < SLOT_KEYS.length; i++) {
    const key = SLOT_KEYS[i]!;
    const options = SLOT_OPTIONS[i]!;
    const ticker = selections[key];

    const index = options.indexOf(ticker);
    // If ticker not found (shouldn't happen with valid data), default to 0
    digits.push(index >= 0 ? index : 0);
  }

  // Trim trailing zeros from positions 6-11 only
  let encoded = digits.map(String).join('');
  // Always keep at least MIN_DIGITS (positions 0-5)
  let trimEnd = encoded.length;
  while (trimEnd > MIN_DIGITS && encoded[trimEnd - 1] === '0') {
    trimEnd--;
  }
  encoded = encoded.slice(0, trimEnd);

  const bp = `${PERMALINK_VERSION}-${encoded}`;
  const url = new URL(window.location.origin);
  url.searchParams.set('bp', bp);
  if (name) {
    url.searchParams.set('n', name);
  }

  return url.toString();
}

/** Decode a permalink from URL search params. Returns selections + name or an error. */
export function decodeBlueprint(
  searchParams: URLSearchParams,
): { selections: ModuleSelections; name: string } | { error: string } {
  const bp = searchParams.get('bp');
  if (!bp) {
    return { error: 'Missing "bp" parameter' };
  }

  const dashIndex = bp.indexOf('-');
  if (dashIndex < 0) {
    return { error: 'Invalid format — missing version separator' };
  }

  const version = bp.slice(0, dashIndex);
  const digitString = bp.slice(dashIndex + 1);

  // Version check
  if (version !== PERMALINK_VERSION) {
    return { error: 'This link uses a newer format — please update DryDock' };
  }

  // Digits only
  if (!/^\d+$/.test(digitString)) {
    return { error: 'Invalid characters in blueprint data' };
  }

  // Minimum length
  if (digitString.length < MIN_DIGITS) {
    return { error: `Blueprint data too short — expected at least ${MIN_DIGITS} digits` };
  }

  // Pad to 12 digits with trailing zeros
  const padded = digitString.padEnd(SLOT_KEYS.length, '0');

  // Validate each digit and build selections
  const built: Record<string, string | null> = {};

  for (let i = 0; i < SLOT_KEYS.length; i++) {
    const key = SLOT_KEYS[i]!;
    const options = SLOT_OPTIONS[i]!;
    const digit = parseInt(padded[i]!, 10);

    if (digit >= options.length) {
      return { error: `Invalid option at position ${i} — digit ${digit} exceeds range 0-${options.length - 1}` };
    }

    built[key] = options[digit]!;
  }

  // Parse name
  const rawName = searchParams.get('n');
  let name = DEFAULT_NAME;
  if (rawName !== null && rawName.trim() !== '') {
    name = rawName.trim().slice(0, MAX_NAME_LENGTH);
  }

  return { selections: built as unknown as ModuleSelections, name };
}
