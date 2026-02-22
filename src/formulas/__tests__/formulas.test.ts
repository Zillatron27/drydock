import { describe, it, expect } from 'vitest';
import {
  calculateVolume,
  calculateSSC,
  calculatePlates,
  calculateEmitters,
  getBridge,
  getCrewQuarters,
  calculateBOM,
} from '../index';
import type { ModuleSelections } from '../../types';

// -- Verified ship volumes and SSC counts --
// Source: spec verified ceil(V/21) against 13 in-game screenshots
const sscCases: Array<[string, number, number]> = [
  ['ENG+SSL+SCB', 834, 40],
  ['ENG+MSL+SCB', 960, 46],
  ['ENG+MSL+MCB', 1485, 71],
  ['ENG+MSL+LCB', 2535, 121],
  ['ENG+LSL+LCB', 2819, 135],
  ['ENG+MSL+MCB+RCT', 1611, 77],
  ['ENG+MSL+MCB+QCR', 1618, 78],
  ['ENG+MSL+MCB+HPR', 1728, 83],
  ['FSE+MSL+LCB+QCR', 2534, 121],
  ['FSE+MSL+VCB+QCR', 3584, 171],
  ['ENG+MSL+HCB+QCR', 5838, 278],
  ['FSE+MSL+HCB+QCR', 5837, 278],
  ['FSE+MSL+MCB+HPR+MFL', 1736, 83],
];

describe('calculateSSC', () => {
  it.each(sscCases)(
    '%s (vol=%i) → SSC=%i',
    (_label, volume, expectedSSC) => {
      expect(calculateSSC(volume)).toBe(expectedSSC);
    }
  );

  it('uses ceil, not floor or round', () => {
    // vol=1079: 1079/21=51.38 → ceil=52, floor=51, round=51
    expect(calculateSSC(1079)).toBe(52);
  });
});

describe('calculatePlates', () => {
  it('uses ceil with divisor 2.07, not round with 2.06', () => {
    // These two cases proved ceil(V^(2/3)/2.07) over round(V^(2/3)/2.06):
    // vol=962: round(962^(2/3)/2.06)=47 (wrong), ceil(962^(2/3)/2.07)=48 (correct)
    expect(calculatePlates(962)).toBe(48);
    // vol=1638: round(1638^(2/3)/2.06)=67 (wrong), ceil(1638^(2/3)/2.07)=68 (correct)
    expect(calculatePlates(1638)).toBe(68);
  });

  // Plate counts verified against in-game data for specific ships
  const plateCases: Array<[string, number, number]> = [
    ['5838m³ HCB+QCR ship', 5838, 157],  // spec: AWH=157=LHP on this ship
    ['5837m³ HCB+QCR ship', 5837, 157],
    ['2534m³ LCB+QCR ship', 2534, 90],   // spec: APT=90=LHP on this ship
    ['1728m³ MCB+HPR ship', 1728, 70],
    ['2819m³ LCB+LSL ship', 2819, 97],
  ];

  it.each(plateCases)(
    '%s (vol=%i) → plates=%i',
    (_label, volume, expectedPlates) => {
      expect(calculatePlates(volume)).toBe(expectedPlates);
    }
  );

  it('plate count is independent of plate type', () => {
    // Same formula whether BHP or LHP — only ticker changes
    const vol = 5838;
    expect(calculatePlates(vol)).toBe(157);
  });
});

describe('calculateEmitters', () => {
  // Greedy cover: LFE=1050, MFE=260, SFE=100
  // Format: [label, volume, expectedLarge, expectedMedium, expectedSmall]
  const emitterCases: Array<[string, number, number, number, number]> = [
    ['834m³ (STL only)', 834, 0, 3, 1],
    ['960m³ (STL only)', 960, 0, 3, 2],
    ['1485m³ (1×LFE)', 1485, 1, 1, 2],
    ['1611m³ (1×LFE)', 1611, 1, 2, 1],
    ['2535m³ (2×LFE)', 2535, 2, 1, 2],
    ['5838m³ (5×LFE)', 5838, 5, 2, 1],
  ];

  it.each(emitterCases)(
    '%s → LFE=%i, MFE=%i, SFE=%i',
    (_label, volume, large, medium, small) => {
      const result = calculateEmitters(volume);
      expect(result.large).toBe(large);
      expect(result.medium).toBe(medium);
      expect(result.small).toBe(small);
    }
  );

  it('handles exact LFE multiples', () => {
    const result = calculateEmitters(2100);
    expect(result.large).toBe(2);
    expect(result.medium).toBe(0);
    expect(result.small).toBe(0);
  });

  it('handles zero volume', () => {
    const result = calculateEmitters(0);
    expect(result.large).toBe(0);
    expect(result.medium).toBe(0);
    expect(result.small).toBe(0);
  });
});

describe('getBridge', () => {
  it('returns BRS for no FTL', () => {
    expect(getBridge(null)).toBe('BRS');
  });

  it('returns BR1 for RCT', () => {
    expect(getBridge('RCT')).toBe('BR1');
  });

  it('returns BR1 for QCR', () => {
    expect(getBridge('QCR')).toBe('BR1');
  });

  it('returns BR2 for HPR', () => {
    expect(getBridge('HPR')).toBe('BR2');
  });

  it('returns BR2 for HYR', () => {
    expect(getBridge('HYR')).toBe('BR2');
  });
});

describe('getCrewQuarters', () => {
  it('returns CQT for volume < 1000', () => {
    expect(getCrewQuarters(834)).toBe('CQT');
    expect(getCrewQuarters(960)).toBe('CQT');
  });

  it('returns CQS for 1000 <= volume < 2000', () => {
    expect(getCrewQuarters(1485)).toBe('CQS');
    expect(getCrewQuarters(1611)).toBe('CQS');
  });

  it('returns CQM for 2000 <= volume < 3000', () => {
    expect(getCrewQuarters(2535)).toBe('CQM');
    expect(getCrewQuarters(2819)).toBe('CQM');
  });

  it('returns CQL for volume >= 3000', () => {
    expect(getCrewQuarters(3584)).toBe('CQL');
    expect(getCrewQuarters(5838)).toBe('CQL');
  });

  it('handles exact boundaries', () => {
    expect(getCrewQuarters(999)).toBe('CQT');
    expect(getCrewQuarters(1000)).toBe('CQS');
    expect(getCrewQuarters(1999)).toBe('CQS');
    expect(getCrewQuarters(2000)).toBe('CQM');
    expect(getCrewQuarters(2999)).toBe('CQM');
    expect(getCrewQuarters(3000)).toBe('CQL');
  });
});

describe('calculateVolume', () => {
  it('calculates STL-only ship volume', () => {
    const selections: ModuleSelections = {
      stlEngine: 'ENG',       // 239
      stlFuelTank: 'SSL',     // 70
      cargoBay: 'SCB',        // 525
      ftlReactor: null,
      ftlFuelTank: null,
      hullPlates: 'BHP',
      heatShielding: null,
      whippleShielding: null,
      stabilitySystem: null,
      radiationShielding: null,
      selfRepairDrones: null,
      highGSeats: null,
    };
    expect(calculateVolume(selections)).toBe(834);
  });

  it('calculates FTL ship volume', () => {
    const selections: ModuleSelections = {
      stlEngine: 'ENG',       // 239
      stlFuelTank: 'MSL',     // 196
      cargoBay: 'MCB',        // 1050
      ftlReactor: 'RCT',      // 126
      ftlFuelTank: null,
      hullPlates: 'LHP',
      heatShielding: null,
      whippleShielding: null,
      stabilitySystem: null,
      radiationShielding: null,
      selfRepairDrones: null,
      highGSeats: null,
    };
    expect(calculateVolume(selections)).toBe(1611);
  });

  it('includes FTL fuel tank volume', () => {
    const selections: ModuleSelections = {
      stlEngine: 'FSE',       // 238
      stlFuelTank: 'MSL',     // 196
      cargoBay: 'MCB',        // 1050
      ftlReactor: 'HPR',      // 243
      ftlFuelTank: 'MFL',     // 9
      hullPlates: 'BHP',
      heatShielding: null,
      whippleShielding: null,
      stabilitySystem: null,
      radiationShielding: null,
      selfRepairDrones: null,
      highGSeats: null,
    };
    expect(calculateVolume(selections)).toBe(1736);
  });

  it('optional equipment does NOT add volume', () => {
    const base: ModuleSelections = {
      stlEngine: 'ENG',
      stlFuelTank: 'MSL',
      cargoBay: 'HCB',
      ftlReactor: 'QCR',
      ftlFuelTank: null,
      hullPlates: 'LHP',
      heatShielding: null,
      whippleShielding: null,
      stabilitySystem: null,
      radiationShielding: null,
      selfRepairDrones: null,
      highGSeats: null,
    };
    const withOptional: ModuleSelections = {
      ...base,
      selfRepairDrones: 'RDL',
      highGSeats: 'AGS',
      stabilitySystem: 'STS',
    };
    expect(calculateVolume(base)).toBe(calculateVolume(withOptional));
  });
});

describe('calculateBOM', () => {
  it('builds correct BOM for STL-only ship', () => {
    const selections: ModuleSelections = {
      stlEngine: 'ENG',
      stlFuelTank: 'SSL',
      cargoBay: 'SCB',
      ftlReactor: null,
      ftlFuelTank: null,
      hullPlates: 'BHP',
      heatShielding: null,
      whippleShielding: null,
      stabilitySystem: null,
      radiationShielding: null,
      selfRepairDrones: null,
      highGSeats: null,
    };

    const bom = calculateBOM(selections);
    const byTicker = Object.fromEntries(bom.map(e => [e.ticker, e.quantity]));

    // vol=834
    expect(byTicker['ENG']).toBe(1);
    expect(byTicker['SSL']).toBe(1);
    expect(byTicker['SCB']).toBe(1);
    expect(byTicker['BHP']).toBe(calculatePlates(834));
    expect(byTicker['SSC']).toBe(calculateSSC(834));
    expect(byTicker['BRS']).toBe(1);    // no FTL → BRS
    expect(byTicker['CQT']).toBe(1);    // vol < 1000

    // No FTL components
    expect(byTicker['FFC']).toBeUndefined();
    expect(byTicker['SFE']).toBeUndefined();
    expect(byTicker['MFE']).toBeUndefined();
    expect(byTicker['LFE']).toBeUndefined();
  });

  it('builds correct BOM for FTL ship with shields', () => {
    const selections: ModuleSelections = {
      stlEngine: 'ENG',       // 239
      stlFuelTank: 'MSL',     // 196
      cargoBay: 'HCB',        // 5250
      ftlReactor: 'QCR',      // 133
      ftlFuelTank: null,
      hullPlates: 'LHP',
      heatShielding: null,
      whippleShielding: 'AWH',
      stabilitySystem: null,
      radiationShielding: null,
      selfRepairDrones: null,
      highGSeats: null,
    };

    const bom = calculateBOM(selections);
    const byTicker = Object.fromEntries(bom.map(e => [e.ticker, e.quantity]));

    // vol = 239 + 196 + 5250 + 133 = 5818
    const vol = 5818;
    const plates = calculatePlates(vol);
    expect(byTicker['LHP']).toBe(plates);
    expect(byTicker['AWH']).toBe(plates);   // shield count = plate count
    expect(byTicker['SSC']).toBe(calculateSSC(vol));
    expect(byTicker['FFC']).toBe(1);
    expect(byTicker['BR1']).toBe(1);   // QCR → BR1
    expect(byTicker['CQL']).toBe(1);   // vol >= 3000
  });

  it('includes optional equipment as 1 unit', () => {
    const selections: ModuleSelections = {
      stlEngine: 'ENG',
      stlFuelTank: 'SSL',
      cargoBay: 'SCB',
      ftlReactor: null,
      ftlFuelTank: null,
      hullPlates: 'BHP',
      heatShielding: null,
      whippleShielding: null,
      stabilitySystem: 'STS',
      radiationShielding: null,
      selfRepairDrones: 'RDS',
      highGSeats: 'AGS',
    };

    const bom = calculateBOM(selections);
    const byTicker = Object.fromEntries(bom.map(e => [e.ticker, e.quantity]));

    expect(byTicker['STS']).toBe(1);
    expect(byTicker['RDS']).toBe(1);
    expect(byTicker['AGS']).toBe(1);
  });

  it('includes all 3 shield types when equipped', () => {
    const selections: ModuleSelections = {
      stlEngine: 'ENG',
      stlFuelTank: 'MSL',
      cargoBay: 'MCB',
      ftlReactor: null,
      ftlFuelTank: null,
      hullPlates: 'BHP',
      heatShielding: 'APT',
      whippleShielding: 'AWH',
      stabilitySystem: null,
      radiationShielding: 'ARP',
      selfRepairDrones: null,
      highGSeats: null,
    };

    const bom = calculateBOM(selections);
    const byTicker = Object.fromEntries(bom.map(e => [e.ticker, e.quantity]));
    const vol = 239 + 196 + 1050; // 1485
    const plates = calculatePlates(vol);

    expect(byTicker['BHP']).toBe(plates);
    expect(byTicker['APT']).toBe(plates);
    expect(byTicker['AWH']).toBe(plates);
    expect(byTicker['ARP']).toBe(plates);
  });

  it('includes FTL emitters when reactor equipped', () => {
    const selections: ModuleSelections = {
      stlEngine: 'ENG',       // 239
      stlFuelTank: 'MSL',     // 196
      cargoBay: 'LCB',        // 2100
      ftlReactor: 'QCR',      // 133
      ftlFuelTank: 'MFL',     // 9
      hullPlates: 'LHP',
      heatShielding: null,
      whippleShielding: null,
      stabilitySystem: null,
      radiationShielding: null,
      selfRepairDrones: null,
      highGSeats: null,
    };

    const bom = calculateBOM(selections);
    const byTicker = Object.fromEntries(bom.map(e => [e.ticker, e.quantity]));
    const vol = 239 + 196 + 2100 + 133 + 9; // 2677
    const emitters = calculateEmitters(vol);

    expect(byTicker['FFC']).toBe(1);
    expect(byTicker['LFE']).toBe(emitters.large);
    expect(byTicker['MFE']).toBe(emitters.medium);
    expect(byTicker['SFE']).toBe(emitters.small);
  });
});
