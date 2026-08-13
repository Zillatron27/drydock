import { describe, it, expect } from 'vitest';
import { FIXED_PRESET_BLUEPRINTS, PRESET_BLUEPRINTS } from '../presets';

/**
 * Fixed-BOM presets carry authoritative game data (wire-captured blueprint
 * payloads), so these tests pin the data exactly rather than deriving it.
 */

// BP-CLNY-0000 bill of materials, wire capture Oct 2025.
const COLONY_BOM: Record<string, number> = {
  HTE: 1, LSL: 1, VOE: 1, VFT: 1, HCB: 1, HAM: 1, STS: 1, AGS: 1,
  RDL: 1, BR2: 1, CQL: 1, AHP: 202, APT: 202, AWH: 202, SRP: 202, SSC: 407,
};

describe('fixed preset blueprints', () => {
  const colony = FIXED_PRESET_BLUEPRINTS.find(p => p.name.includes('BP-CLNY-0000'));

  it('includes the Colony Ship preset', () => {
    expect(colony).toBeDefined();
  });

  it('Colony Ship BOM matches the wire-captured blueprint exactly', () => {
    const bomMap = Object.fromEntries(colony!.bom.map(e => [e.ticker, e.quantity]));
    expect(bomMap).toEqual(COLONY_BOM);
  });

  it('every BOM entry has a resolved name and category', () => {
    for (const preset of FIXED_PRESET_BLUEPRINTS) {
      for (const entry of preset.bom) {
        expect(entry.name, entry.ticker).toBeTruthy();
        expect(entry.category, entry.ticker).toBeTruthy();
        expect(entry.quantity).toBeGreaterThan(0);
      }
    }
  });

  it('Colony Ship stats match the wire-captured performance block', () => {
    expect(colony!.staticStats).toEqual({
      volume: 8532,
      mass: 5893.6,
      buildTimeHours: 117,
      cargoVolume: 5000,
      cargoWeight: 5000,
    });
  });

  it('fixed preset names do not collide with regular presets', () => {
    const regularNames = new Set(PRESET_BLUEPRINTS.map(p => p.name));
    for (const preset of FIXED_PRESET_BLUEPRINTS) {
      expect(regularNames.has(preset.name)).toBe(false);
    }
  });
});
