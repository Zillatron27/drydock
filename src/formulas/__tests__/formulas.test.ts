import { describe, it, expect } from 'vitest';
import {
  calculateVolume,
  calculateSSC,
  calculatePlates,
  calculateEmitters,
  getBridge,
  getCrewQuarters,
  calculateBOM,
  calculateMass,
  calculateBuildTime,
} from '../index';
import type { ModuleSelections } from '../../types';

/** Minimal STL-only ship; override slots per test case */
function makeSelections(overrides: Partial<ModuleSelections> = {}): ModuleSelections {
  return {
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
    ...overrides,
  };
}

// -- Verified ship volumes and SSC counts --
// Source: in-game screenshots, validated ceil(V/21) across 13 ships
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
  // Diminishing-multiplier algorithm: LFE=floor(V/1000), rem=V%1000,
  // working=rem*20/(10+LFE), MFE=floor(working/500), SFE=ceil(leftover/250)
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
    // 2000 / 1000 = 2 LFE, remainder 0 → no MFE/SFE needed
    const result = calculateEmitters(2000);
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
  it('returns BRS for STL-only ships with small engines', () => {
    expect(getBridge(makeSelections({ stlEngine: 'ENG' }))).toBe('BRS');
    expect(getBridge(makeSelections({ stlEngine: 'FSE' }))).toBe('BRS');
    expect(getBridge(makeSelections({ stlEngine: 'GEN' }))).toBe('BRS');
  });

  it('returns BR2 for STL-only ships with AEN/HTE engines (issue #7)', () => {
    expect(getBridge(makeSelections({ stlEngine: 'AEN' }))).toBe('BR2');
    expect(getBridge(makeSelections({ stlEngine: 'HTE' }))).toBe('BR2');
  });

  it('returns BR1 for RCT/QCR with an FTL fuel tank', () => {
    expect(getBridge(makeSelections({ ftlReactor: 'RCT', ftlFuelTank: 'SFL' }))).toBe('BR1');
    expect(getBridge(makeSelections({ ftlReactor: 'QCR', ftlFuelTank: 'SFL' }))).toBe('BR1');
  });

  it('returns BR2 for HPR/HYR with an FTL fuel tank', () => {
    expect(getBridge(makeSelections({ ftlReactor: 'HPR', ftlFuelTank: 'SFL' }))).toBe('BR2');
    expect(getBridge(makeSelections({ ftlReactor: 'HYR', ftlFuelTank: 'SFL' }))).toBe('BR2');
  });

  it('treats a reactor without an FTL fuel tank as non-FTL', () => {
    expect(getBridge(makeSelections({ ftlReactor: 'RCT' }))).toBe('BRS');
    expect(getBridge(makeSelections({ ftlReactor: 'RCT', stlEngine: 'AEN' }))).toBe('BR2');
  });

  it('FTL rule wins over the engine rule when both apply', () => {
    expect(getBridge(makeSelections({ stlEngine: 'AEN', ftlReactor: 'RCT', ftlFuelTank: 'SFL' }))).toBe('BR1');
  });
});

describe('getCrewQuarters', () => {
  it('returns CQT for volume <= 944', () => {
    expect(getCrewQuarters(834)).toBe('CQT');
    expect(getCrewQuarters(500)).toBe('CQT');
    expect(getCrewQuarters(944)).toBe('CQT');
  });

  it('returns CQS for 945 <= volume <= 1699', () => {
    expect(getCrewQuarters(945)).toBe('CQS');
    expect(getCrewQuarters(963)).toBe('CQS');   // starter ship — issue #5
    expect(getCrewQuarters(1485)).toBe('CQS');
    expect(getCrewQuarters(1611)).toBe('CQS');
  });

  it('returns CQM for 1700 <= volume <= 2699', () => {
    expect(getCrewQuarters(1700)).toBe('CQM');
    expect(getCrewQuarters(2535)).toBe('CQM');
    expect(getCrewQuarters(2699)).toBe('CQM');
  });

  it('returns CQL for volume >= 2700', () => {
    expect(getCrewQuarters(2700)).toBe('CQL');
    expect(getCrewQuarters(2819)).toBe('CQL');
    expect(getCrewQuarters(5838)).toBe('CQL');
  });

  it('handles exact boundaries', () => {
    expect(getCrewQuarters(944)).toBe('CQT');
    expect(getCrewQuarters(945)).toBe('CQS');
    expect(getCrewQuarters(1699)).toBe('CQS');
    expect(getCrewQuarters(1700)).toBe('CQM');
    expect(getCrewQuarters(2699)).toBe('CQM');
    expect(getCrewQuarters(2700)).toBe('CQL');
  });
});

describe('calculateVolume', () => {
  it('calculates STL-only ship volume', () => {
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
    // delta: 963 + 0 + 0 + 0 + 0 + (-129) = 834
    expect(calculateVolume(selections)).toBe(834);
  });

  it('calculates FTL ship volume', () => {
    const selections: ModuleSelections = {
      stlEngine: 'ENG',
      stlFuelTank: 'MSL',
      cargoBay: 'MCB',
      ftlReactor: 'RCT',
      ftlFuelTank: null,
      hullPlates: 'LHP',
      heatShielding: null,
      whippleShielding: null,
      stabilitySystem: null,
      radiationShielding: null,
      selfRepairDrones: null,
      highGSeats: null,
    };
    // delta: floor(963 + 0 + 126 + 524.5 + 0 + 0) = floor(1613.5) = 1613
    expect(calculateVolume(selections)).toBe(1613);
  });

  it('includes FTL fuel tank volume', () => {
    const selections: ModuleSelections = {
      stlEngine: 'FSE',
      stlFuelTank: 'MSL',
      cargoBay: 'MCB',
      ftlReactor: 'HPR',
      ftlFuelTank: 'MFL',
      hullPlates: 'BHP',
      heatShielding: null,
      whippleShielding: null,
      stabilitySystem: null,
      radiationShielding: null,
      selfRepairDrones: null,
      highGSeats: null,
    };
    // delta: 963 + (-1) + 126 + 525 + 117 + 6 = 1736
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
    // delta: floor(963 + 0 + 126 + 4724.5 + 7 + 0) = floor(5820.5) = 5820
    // Optional equipment deltas are all 0
    expect(calculateVolume(base)).toBe(5820);
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
    expect(byTicker['CQT']).toBe(1);    // vol=834 < 1000 → CQT

    // No FTL components
    expect(byTicker['FFC']).toBeUndefined();
    expect(byTicker['SFE']).toBeUndefined();
    expect(byTicker['MFE']).toBeUndefined();
    expect(byTicker['LFE']).toBeUndefined();
  });

  it('builds correct BOM for FTL ship with shields', () => {
    const selections: ModuleSelections = {
      stlEngine: 'ENG',
      stlFuelTank: 'MSL',
      cargoBay: 'HCB',
      ftlReactor: 'QCR',
      ftlFuelTank: 'SFL',
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

    // delta: floor(963 + 0 + 126 + 4724.5 + 7 + 0 + 0) = 5820
    const vol = 5820;
    const plates = calculatePlates(vol);
    expect(byTicker['LHP']).toBe(plates);
    expect(byTicker['AWH']).toBe(plates);   // shield count = plate count
    expect(byTicker['SSC']).toBe(calculateSSC(vol));
    expect(byTicker['FFC']).toBe(1);
    expect(byTicker['BR1']).toBe(1);   // QCR + tank → BR1
    expect(byTicker['CQL']).toBe(1);   // vol=5821 >= 2700 → CQL
  });

  it('gives STL-only AEN ship a BR2 bridge and the larger volume (issue #7)', () => {
    // AEN+SSL+SCB+BHP: 963 + 3 - 129 (no FTL, assumes BRS) + 210 (BRS→BR2) = 1047
    const selections = makeSelections({ stlEngine: 'AEN' });
    const volume = calculateVolume(selections);
    expect(volume).toBe(1047);

    const bom = calculateBOM(selections);
    const byTicker = Object.fromEntries(bom.map(e => [e.ticker, e.quantity]));
    expect(byTicker['BR2']).toBe(1);
    expect(byTicker['BRS']).toBeUndefined();
    expect(byTicker['CQS']).toBe(1);    // vol=1047 >= 950 → CQS
    // Plates and SSC follow the corrected volume
    expect(byTicker['BHP']).toBe(calculatePlates(1047));
    expect(byTicker['SSC']).toBe(calculateSSC(1047));
  });

  it('gives STL-only HTE ship a BR2 bridge and the larger volume', () => {
    // HTE+SSL+SCB+BHP: floor(963 + 6.5 - 129 + 210) = floor(1050.5) = 1050
    const selections = makeSelections({ stlEngine: 'HTE' });
    expect(calculateVolume(selections)).toBe(1050);
    const byTicker = Object.fromEntries(calculateBOM(selections).map(e => [e.ticker, e.quantity]));
    expect(byTicker['BR2']).toBe(1);
  });

  it('does not apply the BR2 volume delta to GEN STL ships', () => {
    // GEN+SSL+SCB+BHP: 963 - 1 - 129 = 833, bridge stays BRS
    const selections = makeSelections({ stlEngine: 'GEN' });
    expect(calculateVolume(selections)).toBe(833);
    const byTicker = Object.fromEntries(calculateBOM(selections).map(e => [e.ticker, e.quantity]));
    expect(byTicker['BRS']).toBe(1);
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
    // delta: floor(963 + 0 + 126 + 524.5 + 0 + (-129)) = floor(1484.5) = 1484
    const plates = calculatePlates(1484);

    expect(byTicker['BHP']).toBe(plates);
    expect(byTicker['APT']).toBe(plates);
    expect(byTicker['AWH']).toBe(plates);
    expect(byTicker['ARP']).toBe(plates);
  });

  it('includes FTL emitters when reactor equipped', () => {
    const selections: ModuleSelections = {
      stlEngine: 'ENG',
      stlFuelTank: 'MSL',
      cargoBay: 'LCB',
      ftlReactor: 'QCR',
      ftlFuelTank: 'MFL',
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
    // delta: 963 + 0 + 126 + 1575 + 0 + 7 + 6 = 2677
    const emitters = calculateEmitters(2677);

    expect(byTicker['FFC']).toBe(1);
    expect(byTicker['LFE']).toBe(emitters.large);
    expect(byTicker['MFE']).toBe(emitters.medium);
    expect(byTicker['SFE']).toBe(emitters.small);
    expect(byTicker['CQM']).toBe(1);  // vol=2677, 1750 <= 2677 < 2750 → CQM
  });

  it('assigns CQL for vol=2819 LCB STL freighter (regression: was wrongly CQM)', () => {
    // Reported bug: player building ENG+LSL+LCB+BHP got CQM instead of CQL
    const selections: ModuleSelections = {
      stlEngine: 'ENG',
      stlFuelTank: 'LSL',
      cargoBay: 'LCB',
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

    expect(calculateVolume(selections)).toBe(2819);
    expect(byTicker['CQL']).toBe(1);    // vol=2819 >= 2750 → CQL
    expect(byTicker['CQM']).toBeUndefined();
  });
});

describe('calculateMass', () => {
  it('computes exact mass for VOL-BASE reference ship', () => {
    // ENG+SSL+RCT+SFL+SCB+BHP → vol=963 — this is the "starter ship" from
    // issue #5. Its wire-captured operating empty mass is 827.8, which only
    // sums correctly with CQS (25), not CQT (12.5):
    // Manual sum: ENG(8) + SSL(20) + RCT(7) + SFL(9) + SCB(50) + BHP(9×48)
    //   + SSC(1×46) + BR1(180) + CQS(25) + FFC(50) + MFE(0.2×3) + SFE(0.1×2)
    //   = 8 + 20 + 7 + 9 + 50 + 432 + 46 + 180 + 25 + 50 + 0.6 + 0.2 = 827.8
    const selections = makeSelections({ ftlReactor: 'RCT', ftlFuelTank: 'SFL' });
    const volume = calculateVolume(selections);
    expect(volume).toBe(963);
    // Verify derived components
    expect(calculateSSC(volume)).toBe(46);
    expect(calculatePlates(volume)).toBe(48);
    expect(getCrewQuarters(volume)).toBe('CQS');   // vol=963 >= 950
    expect(getBridge(selections)).toBe('BR1');
    const emitters = calculateEmitters(volume);
    expect(emitters).toEqual({ large: 0, medium: 3, small: 2 });
    expect(calculateMass(selections, volume)).toBeCloseTo(827.8, 1);
  });

  it('computes exact mass for STL-only ship', () => {
    // ENG+SSL+SCB+BHP, vol=834, no FTL
    // Manual sum: ENG(8) + SSL(20) + SCB(50) + BHP(9×43) + SSC(1×40)
    //   + BRS(150) + CQT(12.5) = 8 + 20 + 50 + 387 + 40 + 150 + 12.5 = 667.5
    const selections = makeSelections();
    const volume = calculateVolume(selections);
    expect(volume).toBe(834);
    // Verify derived components used in mass calc
    expect(calculateSSC(volume)).toBe(40);
    expect(calculatePlates(volume)).toBe(43);
    expect(getCrewQuarters(volume)).toBe('CQT');   // vol=834 < 950
    expect(getBridge(selections)).toBe('BRS');
    expect(calculateMass(selections, volume)).toBeCloseTo(667.5, 1);
  });
});

describe('calculateBuildTime', () => {
  it('returns mass / 50', () => {
    expect(calculateBuildTime(827.8)).toBeCloseTo(16.556, 2);
    expect(calculateBuildTime(500)).toBe(10);
    expect(calculateBuildTime(0)).toBe(0);
  });
});
