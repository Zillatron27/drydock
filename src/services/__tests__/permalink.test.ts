import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ModuleSelections } from '../../types';
import { PRESET_BLUEPRINTS } from '../../data/presets';
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
} from '../../data/modules';
import { encodeBlueprint, decodeBlueprint, SLOT_OPTIONS, SLOT_KEYS } from '../permalink';

// Stub window.location.origin for URL construction in encodeBlueprint
beforeEach(() => {
  vi.stubGlobal('window', { location: { origin: 'https://drydock.cc' } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// -- Test fixtures --

const STL_HAULER: ModuleSelections = {
  stlEngine: 'ENG',
  stlFuelTank: 'SSL',
  ftlReactor: null,
  ftlFuelTank: null,
  cargoBay: 'SCB',
  hullPlates: 'BHP',
  heatShielding: null,
  whippleShielding: null,
  stabilitySystem: null,
  radiationShielding: null,
  selfRepairDrones: null,
  highGSeats: null,
};

const FTL_FREIGHTER: ModuleSelections = {
  stlEngine: 'ENG',
  stlFuelTank: 'MSL',
  ftlReactor: 'QCR',
  ftlFuelTank: 'MFL',
  cargoBay: 'LCB',
  hullPlates: 'BHP',
  heatShielding: null,
  whippleShielding: null,
  stabilitySystem: null,
  radiationShielding: null,
  selfRepairDrones: null,
  highGSeats: null,
};

const FULL_LOADOUT: ModuleSelections = {
  stlEngine: 'HTE',
  stlFuelTank: 'LSL',
  ftlReactor: 'HYR',
  ftlFuelTank: 'LFL',
  cargoBay: 'HCB',
  hullPlates: 'AHP',
  heatShielding: 'APT',
  whippleShielding: 'AWH',
  stabilitySystem: 'STS',
  radiationShielding: 'ARP',
  selfRepairDrones: 'RDL',
  highGSeats: 'AGS',
};

/** Extract the bp param value from a full URL */
function getBpParam(url: string): string {
  return new URL(url).searchParams.get('bp')!;
}

/** Build URLSearchParams from a bp string and optional name */
function makeParams(bp: string, name?: string): URLSearchParams {
  const params = new URLSearchParams();
  params.set('bp', bp);
  if (name !== undefined) params.set('n', name);
  return params;
}

// -- Roundtrip tests --

describe('encodeBlueprint → decodeBlueprint roundtrip', () => {
  it('roundtrips STL-only hauler', () => {
    const url = encodeBlueprint(STL_HAULER, 'STL Hauler');
    const params = new URL(url).searchParams;
    const result = decodeBlueprint(params);

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.selections).toEqual(STL_HAULER);
    expect(result.name).toBe('STL Hauler');
  });

  it('roundtrips FTL freighter', () => {
    const url = encodeBlueprint(FTL_FREIGHTER, 'FTL Freighter');
    const params = new URL(url).searchParams;
    const result = decodeBlueprint(params);

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.selections).toEqual(FTL_FREIGHTER);
    expect(result.name).toBe('FTL Freighter');
  });

  it('roundtrips full loadout with all shields/equipment', () => {
    const url = encodeBlueprint(FULL_LOADOUT, 'Full Loadout');
    const params = new URL(url).searchParams;
    const result = decodeBlueprint(params);

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.selections).toEqual(FULL_LOADOUT);
    expect(result.name).toBe('Full Loadout');
  });
});

describe('preset blueprint roundtrips', () => {
  for (const preset of PRESET_BLUEPRINTS) {
    it(`roundtrips preset: ${preset.name}`, () => {
      const url = encodeBlueprint(preset.modules, preset.name);
      const params = new URL(url).searchParams;
      const result = decodeBlueprint(params);

      expect('error' in result).toBe(false);
      if ('error' in result) return;
      expect(result.selections).toEqual(preset.modules);
      expect(result.name).toBe(preset.name);
    });
  }
});

// -- Trailing zero trimming --

describe('trailing zero trimming', () => {
  it('STL hauler produces a shorter string than 12 digits', () => {
    const bp = getBpParam(encodeBlueprint(STL_HAULER));
    const digits = bp.split('-')[1]!;
    // STL hauler: positions 0-5 are 000020, positions 6-11 are all 0 → trimmed
    expect(digits.length).toBeLessThan(12);
    expect(digits.length).toBeGreaterThanOrEqual(6);
  });

  it('full loadout produces exactly 12 digits (no trailing zeros to trim)', () => {
    const bp = getBpParam(encodeBlueprint(FULL_LOADOUT));
    const digits = bp.split('-')[1]!;
    expect(digits.length).toBe(12);
  });

  it('trimmed string decodes identically to full-length', () => {
    // STL hauler encoded (trimmed)
    const url = encodeBlueprint(STL_HAULER);
    const bpTrimmed = getBpParam(url);

    // Manually build full-length version
    const digits = bpTrimmed.split('-')[1]!;
    const fullBp = `1-${digits.padEnd(12, '0')}`;

    const trimmedResult = decodeBlueprint(makeParams(bpTrimmed));
    const fullResult = decodeBlueprint(makeParams(fullBp));

    expect('error' in trimmedResult).toBe(false);
    expect('error' in fullResult).toBe(false);
    if ('error' in trimmedResult || 'error' in fullResult) return;
    expect(trimmedResult.selections).toEqual(fullResult.selections);
  });

  it('always emits at least 6 digits', () => {
    // Even with all-zero optional slots, positions 0-5 are always present
    const bp = getBpParam(encodeBlueprint(STL_HAULER));
    const digits = bp.split('-')[1]!;
    expect(digits.length).toBeGreaterThanOrEqual(6);
  });
});

// -- Specific encoding values from the spec --

describe('encoding matches spec examples', () => {
  // Spec example says trimmed to 1-00002 (5 digits), but rules say
  // "always emit positions 0-5" = 6 digit minimum. Following the rules.
  it('basic hauler (ENG+SSL+SCB+BHP) encodes to 1-000020', () => {
    const hauler: ModuleSelections = {
      stlEngine: 'ENG',      // pos 0 → 0
      stlFuelTank: 'SSL',    // pos 1 → 0
      ftlReactor: null,       // pos 2 → 0
      ftlFuelTank: null,      // pos 3 → 0
      cargoBay: 'SCB',       // pos 4 → 2
      hullPlates: 'BHP',     // pos 5 → 0
      heatShielding: null,
      whippleShielding: null,
      stabilitySystem: null,
      radiationShielding: null,
      selfRepairDrones: null,
      highGSeats: null,
    };
    const bp = getBpParam(encodeBlueprint(hauler));
    expect(bp).toBe('1-000020');
  });

  it('FTL freighter (ENG+MSL+QCR+MFL+LCB+LHP) encodes to 1-012241', () => {
    const freighter: ModuleSelections = {
      stlEngine: 'ENG',      // pos 0 → 0
      stlFuelTank: 'MSL',    // pos 1 → 1
      ftlReactor: 'QCR',     // pos 2 → 2
      ftlFuelTank: 'MFL',    // pos 3 → 2
      cargoBay: 'LCB',       // pos 4 → 4
      hullPlates: 'LHP',     // pos 5 → 1
      heatShielding: null,    // pos 6 → 0
      whippleShielding: null, // pos 7 → 0
      stabilitySystem: null,
      radiationShielding: null,
      selfRepairDrones: null,
      highGSeats: null,
    };
    const bp = getBpParam(encodeBlueprint(freighter));
    expect(bp).toBe('1-012241');
  });

  it('full loadout encodes to 1-424374221322', () => {
    const bp = getBpParam(encodeBlueprint(FULL_LOADOUT));
    expect(bp).toBe('1-424374221322');
  });
});

// -- Validation: rejection cases --

describe('decodeBlueprint — rejection', () => {
  it('rejects missing bp parameter', () => {
    const result = decodeBlueprint(new URLSearchParams());
    expect('error' in result).toBe(true);
  });

  it('rejects invalid version (2)', () => {
    const result = decodeBlueprint(makeParams('2-000020'));
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('newer format');
    }
  });

  it('rejects invalid version (0)', () => {
    const result = decodeBlueprint(makeParams('0-000020'));
    expect('error' in result).toBe(true);
  });

  it('rejects missing version separator', () => {
    const result = decodeBlueprint(makeParams('1000020'));
    expect('error' in result).toBe(true);
  });

  it('rejects out-of-range digit (8 in position 0, max 4)', () => {
    const result = decodeBlueprint(makeParams('1-800020'));
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('position 0');
    }
  });

  it('rejects out-of-range digit (5 in position 0)', () => {
    const result = decodeBlueprint(makeParams('1-500020'));
    expect('error' in result).toBe(true);
  });

  it('rejects non-digit characters', () => {
    const result = decodeBlueprint(makeParams('1-00a020'));
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Invalid characters');
    }
  });

  it('rejects too-short string (< 6 digits)', () => {
    const result = decodeBlueprint(makeParams('1-00002'));
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('too short');
    }
  });

  it('rejects empty digit string', () => {
    const result = decodeBlueprint(makeParams('1-'));
    expect('error' in result).toBe(true);
  });
});

// -- Name handling --

describe('name handling', () => {
  it('uses provided name', () => {
    const result = decodeBlueprint(makeParams('1-000020', 'My Ship'));
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.name).toBe('My Ship');
  });

  it('defaults to "Shared Blueprint" when name is absent', () => {
    const result = decodeBlueprint(makeParams('1-000020'));
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.name).toBe('Shared Blueprint');
  });

  it('defaults to "Shared Blueprint" when name is empty', () => {
    const result = decodeBlueprint(makeParams('1-000020', ''));
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.name).toBe('Shared Blueprint');
  });

  it('truncates name at 50 characters', () => {
    const longName = 'A'.repeat(80);
    const result = decodeBlueprint(makeParams('1-000020', longName));
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.name.length).toBe(50);
  });

  it('special characters survive URL encoding roundtrip', () => {
    const name = 'My Ship (v2) — 50% off!';
    const url = encodeBlueprint(STL_HAULER, name);
    const params = new URL(url).searchParams;
    const result = decodeBlueprint(params);

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.name).toBe(name);
  });

  it('preserves + and & characters in name', () => {
    const name = 'Ship+Name&More';
    const url = encodeBlueprint(STL_HAULER, name);
    const params = new URL(url).searchParams;
    const result = decodeBlueprint(params);

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.name).toBe(name);
  });
});

// -- Critical: SLOT_OPTIONS ordering matches modules.ts --

describe('SLOT_OPTIONS ordering matches modules.ts', () => {
  const MODULES_IN_ORDER = [
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
  ];

  for (let i = 0; i < MODULES_IN_ORDER.length; i++) {
    const slot = MODULES_IN_ORDER[i]!;
    const options = SLOT_OPTIONS[i]!;

    it(`position ${i} (${slot.name}): option tickers match modules.ts order`, () => {
      // For optional slots, SLOT_OPTIONS has null at index 0, then the tickers
      // For required slots, SLOT_OPTIONS starts directly with tickers
      const expectedTickers = slot.required
        ? slot.options.map(o => o.ticker)
        : [null, ...slot.options.map(o => o.ticker)];

      expect(options).toEqual(expectedTickers);
    });
  }

  it('SLOT_KEYS has correct length (12)', () => {
    expect(SLOT_KEYS.length).toBe(12);
  });

  it('SLOT_OPTIONS has correct length (12)', () => {
    expect(SLOT_OPTIONS.length).toBe(12);
  });
});
