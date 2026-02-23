import { describe, it, expect } from 'vitest';
import type { Blueprint, ModuleSelections } from '../../types';
import {
  exportBlueprint,
  exportCollection,
  validateImport,
  resolveNameCollisions,
  buildExportFilename,
} from '../blueprint_io';
import { calculateBOM } from '../../formulas';

// Minimal valid STL-only selections
const STL_SELECTIONS: ModuleSelections = {
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

// Fully loaded FTL selections
const FTL_SELECTIONS: ModuleSelections = {
  stlEngine: 'AEN',
  stlFuelTank: 'LSL',
  ftlReactor: 'HPR',
  ftlFuelTank: 'LFL',
  cargoBay: 'LCB',
  hullPlates: 'AHP',
  heatShielding: 'APT',
  whippleShielding: 'AWH',
  stabilitySystem: 'STS',
  radiationShielding: 'ARP',
  selfRepairDrones: 'RDL',
  highGSeats: 'AGS',
};

function makeBlueprint(name: string, selections: ModuleSelections): Blueprint {
  return {
    id: 'test-uuid',
    name,
    moduleSelections: selections,
    bom: calculateBOM(selections),
  };
}

/** Helper: parse JSON, mutate a nested field, re-stringify */
function withMutation(json: string, mutate: (obj: Record<string, unknown>) => void): string {
  const obj = JSON.parse(json) as Record<string, unknown>;
  mutate(obj);
  return JSON.stringify(obj);
}

describe('exportBlueprint', () => {
  it('produces valid drydock-blueprint JSON', () => {
    const bp = makeBlueprint('Test Ship', STL_SELECTIONS);
    const exported = exportBlueprint(bp);

    expect(exported.type).toBe('drydock-blueprint');
    expect(exported.version).toBe('1.0');
    expect(exported.name).toBe('Test Ship');
    expect(exported.modules).toEqual(STL_SELECTIONS);
    expect(exported.exported_at).toBeTruthy();
  });

  it('does not include id or bom in export', () => {
    const bp = makeBlueprint('Test', STL_SELECTIONS);
    const exported = exportBlueprint(bp);
    const json = JSON.parse(JSON.stringify(exported)) as Record<string, unknown>;

    expect(json['id']).toBeUndefined();
    expect(json['bom']).toBeUndefined();
  });
});

describe('exportCollection', () => {
  it('produces valid drydock-collection JSON', () => {
    const bps = [
      makeBlueprint('Ship A', STL_SELECTIONS),
      makeBlueprint('Ship B', FTL_SELECTIONS),
    ];
    const exported = exportCollection(bps);

    expect(exported.type).toBe('drydock-collection');
    expect(exported.version).toBe('1.0');
    expect(exported.blueprints).toHaveLength(2);
    expect(exported.blueprints[0]!.name).toBe('Ship A');
    expect(exported.blueprints[1]!.name).toBe('Ship B');
  });
});

describe('validateImport — roundtrip', () => {
  it('roundtrips a single blueprint', () => {
    const bp = makeBlueprint('Roundtrip Ship', FTL_SELECTIONS);
    const json = JSON.stringify(exportBlueprint(bp));
    const result = validateImport(json);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]!.name).toBe('Roundtrip Ship');
    expect(result.entries[0]!.modules).toEqual(FTL_SELECTIONS);
  });

  it('roundtrips a collection', () => {
    const bps = [
      makeBlueprint('Ship A', STL_SELECTIONS),
      makeBlueprint('Ship B', FTL_SELECTIONS),
    ];
    const json = JSON.stringify(exportCollection(bps));
    const result = validateImport(json);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]!.modules).toEqual(STL_SELECTIONS);
    expect(result.entries[1]!.modules).toEqual(FTL_SELECTIONS);
  });
});

describe('validateImport — rejection', () => {
  it('rejects non-object inputs', () => {
    for (const input of ['"hello"', '42', 'true', 'null', '[1,2,3]']) {
      const result = validateImport(input);
      expect(result.success).toBe(false);
    }
  });

  it('rejects missing type field', () => {
    const result = validateImport(JSON.stringify({ version: '1.0', name: 'X', modules: {} }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('type');
  });

  it('rejects wrong type field', () => {
    const result = validateImport(JSON.stringify({ type: 'something-else', version: '1.0' }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('type');
  });

  it('rejects incompatible version "2.0"', () => {
    const json = withMutation(
      JSON.stringify(exportBlueprint(makeBlueprint('X', STL_SELECTIONS))),
      obj => { obj['version'] = '2.0'; },
    );
    const result = validateImport(json);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('version');
  });

  it('rejects incompatible version "0.9"', () => {
    const json = withMutation(
      JSON.stringify(exportBlueprint(makeBlueprint('X', STL_SELECTIONS))),
      obj => { obj['version'] = '0.9'; },
    );
    const result = validateImport(json);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('version');
  });

  it('accepts compatible versions "1.0", "1.1", "1.99"', () => {
    for (const ver of ['1.0', '1.1', '1.99']) {
      const json = withMutation(
        JSON.stringify(exportBlueprint(makeBlueprint('X', STL_SELECTIONS))),
        obj => { obj['version'] = ver; },
      );
      const result = validateImport(json);
      expect(result.success).toBe(true);
    }
  });

  it('rejects null required module (stlEngine)', () => {
    const json = withMutation(
      JSON.stringify(exportBlueprint(makeBlueprint('X', STL_SELECTIONS))),
      obj => { (obj['modules'] as Record<string, unknown>)['stlEngine'] = null; },
    );
    const result = validateImport(json);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('stlEngine');
  });

  it('rejects invalid ticker in a slot', () => {
    const json = withMutation(
      JSON.stringify(exportBlueprint(makeBlueprint('X', STL_SELECTIONS))),
      obj => { (obj['modules'] as Record<string, unknown>)['stlEngine'] = 'FAKE'; },
    );
    const result = validateImport(json);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('FAKE');
      expect(result.error).toContain('stlEngine');
    }
  });

  it('rejects ticker in wrong slot (ENG in cargoBay)', () => {
    const json = withMutation(
      JSON.stringify(exportBlueprint(makeBlueprint('X', STL_SELECTIONS))),
      obj => { (obj['modules'] as Record<string, unknown>)['cargoBay'] = 'ENG'; },
    );
    const result = validateImport(json);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('ENG');
      expect(result.error).toContain('cargoBay');
    }
  });

  it('rejects unknown keys in modules', () => {
    const json = withMutation(
      JSON.stringify(exportBlueprint(makeBlueprint('X', STL_SELECTIONS))),
      obj => { (obj['modules'] as Record<string, unknown>)['warpDrive'] = 'XYZ'; },
    );
    const result = validateImport(json);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('warpDrive');
  });

  it('accepts all-null optional fields (STL-only ship)', () => {
    const result = validateImport(JSON.stringify(exportBlueprint(makeBlueprint('STL Only', STL_SELECTIONS))));
    expect(result.success).toBe(true);
  });

  it('rejects malformed JSON string', () => {
    const result = validateImport('{not valid json!!!}');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('Invalid JSON');
  });

  it('rejects empty input', () => {
    const result = validateImport('');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('Empty input');
  });

  it('rejects missing name', () => {
    const json = withMutation(
      JSON.stringify(exportBlueprint(makeBlueprint('X', STL_SELECTIONS))),
      obj => { delete obj['name']; },
    );
    const result = validateImport(json);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('name');
  });

  it('rejects missing modules object', () => {
    const result = validateImport(JSON.stringify({
      type: 'drydock-blueprint',
      version: '1.0',
      name: 'Test',
    }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('modules');
  });
});

describe('validateImport — edge cases', () => {
  it('truncates name at 50 chars', () => {
    const longName = 'A'.repeat(80);
    const json = withMutation(
      JSON.stringify(exportBlueprint(makeBlueprint('X', STL_SELECTIONS))),
      obj => { obj['name'] = longName; },
    );
    const result = validateImport(json);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entries[0]!.name).toHaveLength(50);
  });

  it('strips UTF-8 BOM', () => {
    const json = JSON.stringify(exportBlueprint(makeBlueprint('BOM Test', STL_SELECTIONS)));
    const withBOM = '\uFEFF' + json;
    const result = validateImport(withBOM);
    expect(result.success).toBe(true);
  });

  it('trims surrounding whitespace', () => {
    const json = JSON.stringify(exportBlueprint(makeBlueprint('Trim Test', STL_SELECTIONS)));
    const result = validateImport('   \n' + json + '\n   ');
    expect(result.success).toBe(true);
  });

  it('treats missing optional module key as null', () => {
    const json = withMutation(
      JSON.stringify(exportBlueprint(makeBlueprint('X', STL_SELECTIONS))),
      obj => { delete (obj['modules'] as Record<string, unknown>)['ftlReactor']; },
    );
    const result = validateImport(json);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entries[0]!.modules.ftlReactor).toBeNull();
  });
});

describe('validateImport — collections', () => {
  it('accepts empty collection with zero entries', () => {
    const data = {
      type: 'drydock-collection',
      version: '1.0',
      exported_at: new Date().toISOString(),
      blueprints: [],
    };
    const result = validateImport(JSON.stringify(data));
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entries).toHaveLength(0);
  });

  it('returns valid entries from mixed collection', () => {
    const validModules = { ...STL_SELECTIONS };
    const invalidModules = { ...STL_SELECTIONS, stlEngine: 'FAKE' };

    const data = {
      type: 'drydock-collection',
      version: '1.0',
      exported_at: new Date().toISOString(),
      blueprints: [
        { name: 'Good Ship', modules: validModules },
        { name: 'Bad Ship', modules: invalidModules },
      ],
    };
    const result = validateImport(JSON.stringify(data));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]!.name).toBe('Good Ship');
  });

  it('fails when all blueprints in collection are invalid', () => {
    const data = {
      type: 'drydock-collection',
      version: '1.0',
      exported_at: new Date().toISOString(),
      blueprints: [
        { name: 'Bad 1', modules: { stlEngine: 'FAKE' } },
        { name: 'Bad 2', modules: { stlEngine: null } },
      ],
    };
    const result = validateImport(JSON.stringify(data));
    expect(result.success).toBe(false);
  });

  it('rejects collection with missing blueprints array', () => {
    const data = {
      type: 'drydock-collection',
      version: '1.0',
      exported_at: new Date().toISOString(),
    };
    const result = validateImport(JSON.stringify(data));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('blueprints');
  });
});

describe('resolveNameCollisions', () => {
  it('returns names unchanged when no collisions', () => {
    const result = resolveNameCollisions(['Ship A', 'Ship B'], ['Ship C']);
    expect(result).toEqual(['Ship A', 'Ship B']);
  });

  it('appends (imported) on first collision', () => {
    const result = resolveNameCollisions(['Ship A'], ['Ship A']);
    expect(result).toEqual(['Ship A (imported)']);
  });

  it('appends (imported 2) on second collision', () => {
    const result = resolveNameCollisions(['Ship A'], ['Ship A', 'Ship A (imported)']);
    expect(result).toEqual(['Ship A (imported 2)']);
  });

  it('handles multiple imports with same name', () => {
    const result = resolveNameCollisions(['Ship', 'Ship'], ['Ship']);
    expect(result).toEqual(['Ship (imported)', 'Ship (imported 2)']);
  });
});

describe('buildExportFilename', () => {
  it('includes blueprint name for single export', () => {
    const filename = buildExportFilename('blueprint', 'FTL Freighter');
    expect(filename).toMatch(/^drydock-blueprint-ftl-freighter-\d{8}-\d{6}\.json$/);
  });

  it('builds collection filename without name', () => {
    const filename = buildExportFilename('collection');
    expect(filename).toMatch(/^drydock-collection-\d{8}-\d{6}\.json$/);
  });

  it('sanitizes special characters in name', () => {
    const filename = buildExportFilename('blueprint', 'My Ship!@#$%');
    expect(filename).not.toMatch(/[!@#$%]/);
    expect(filename).toMatch(/^drydock-blueprint-/);
  });
});
