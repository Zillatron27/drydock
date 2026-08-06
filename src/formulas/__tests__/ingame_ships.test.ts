import { describe, it, expect } from 'vitest';
import {
  calculateVolume,
  calculateSSC,
  getBridge,
  getCrewQuarters,
  calculateMass,
} from '../index';
import type { ModuleSelections } from '../../types';

// Ground-truth fixture: 24 blueprints built in-game (BLU command) on
// 2026-08-06 while root-causing issues #4-#7. Every expected value below is
// read directly off an in-game screenshot: displayed volume, command bridge,
// crew quarters, structural element count, and operating empty mass.
// These pinned the fractional volume deltas, the floor() display rule, the
// bridge rule (incl. the AEN/HTE→BR2 branch and its +210 volume feedback),
// and the CQ thresholds. Do not weaken these assertions — this table IS the
// volume model's evidence.

interface InGameShip {
  label: string;
  selections: Partial<ModuleSelections>;
  volume: number;
  bridge: string;
  cq: string;
  ssc: number;
  mass: number; // displayed (rounded) operating empty mass
}

function sel(overrides: Partial<ModuleSelections>): ModuleSelections {
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

const SHIPS: InGameShip[] = [
  // -- Round 1: bridge rule + thresholds (issues #4-#7) --
  { label: 'AEN STL-only (issue #7 ship)', selections: { stlEngine: 'AEN' },
    volume: 1047, bridge: 'BR2', cq: 'CQS', ssc: 50, mass: 889 },
  { label: 'HTE STL-only', selections: { stlEngine: 'HTE' },
    volume: 1050, bridge: 'BR2', cq: 'CQS', ssc: 50, mass: 891 },
  { label: 'GEN STL-only', selections: { stlEngine: 'GEN' },
    volume: 833, bridge: 'BRS', cq: 'CQT', ssc: 40, mass: 665 },
  { label: 'T2 probe: ENG+MSL+HPR+SFL+MCB', selections: { stlFuelTank: 'MSL', ftlReactor: 'HPR', ftlFuelTank: 'SFL', cargoBay: 'MCB' },
    volume: 1731, bridge: 'BR2', cq: 'CQM', ssc: 83, mass: 1277 },
  { label: 'HTE+MSL+QCR+LFL+LCB', selections: { stlEngine: 'HTE', stlFuelTank: 'MSL', ftlReactor: 'QCR', ftlFuelTank: 'LFL', cargoBay: 'LCB' },
    volume: 2695, bridge: 'BR1', cq: 'CQM', ssc: 129, mass: 1596 },
  { label: 'ENG+MSL+HPR+SFL+VSC', selections: { stlFuelTank: 'MSL', ftlReactor: 'HPR', ftlFuelTank: 'SFL', cargoBay: 'VSC' },
    volume: 943, bridge: 'BR2', cq: 'CQT', ssc: 45, mass: 929 },
  { label: 'BRP shield ship (no BRP bridge)', selections: { stlFuelTank: 'MSL', ftlReactor: 'RCT', ftlFuelTank: 'MFL', cargoBay: 'VSC', radiationShielding: 'BRP' },
    volume: 832, bridge: 'BR1', cq: 'CQT', ssc: 40, mass: 795 },

  // -- Round 2: T1/T3 probes --
  { label: 'T1 probe: 949 → CQS (refutes T1=950)', selections: { stlFuelTank: 'MSL', ftlReactor: 'HPR', ftlFuelTank: 'MFL', cargoBay: 'VSC' },
    volume: 949, bridge: 'BR2', cq: 'CQS', ssc: 46, mass: 958 },
  { label: 'T3 decider: AEN+MSL+LCB no-FTL → CQL', selections: { stlEngine: 'AEN', stlFuelTank: 'MSL', cargoBay: 'LCB' },
    volume: 2748, bridge: 'BR2', cq: 'CQL', ssc: 131, mass: 1605 },
  { label: 'T1 probe: 947 → CQS (pins AEN=+3.5)', selections: { stlEngine: 'AEN', stlFuelTank: 'MSL', ftlReactor: 'HPR', ftlFuelTank: 'SFL', cargoBay: 'VSC' },
    volume: 947, bridge: 'BR2', cq: 'CQS', ssc: 46, mass: 949 },
  { label: 'MSL probe: reference + MSL', selections: { stlFuelTank: 'MSL', ftlReactor: 'RCT', ftlFuelTank: 'SFL' },
    volume: 1089, bridge: 'BR1', cq: 'CQS', ssc: 52, mass: 900 },
  { label: 'VSC probe: ENG+SSL+HPR+SFL+VSC', selections: { ftlReactor: 'HPR', ftlFuelTank: 'SFL', cargoBay: 'VSC' },
    volume: 817, bridge: 'BR2', cq: 'CQT', ssc: 39, mass: 857 },

  // -- Round 3: per-module fraction survey --
  { label: 'QCR probe', selections: { stlEngine: 'AEN', stlFuelTank: 'MSL', ftlReactor: 'QCR', ftlFuelTank: 'SFL' },
    volume: 1099, bridge: 'BR1', cq: 'CQS', ssc: 53, mass: 914 },
  { label: 'HYR probe', selections: { stlEngine: 'AEN', stlFuelTank: 'MSL', ftlReactor: 'HYR', ftlFuelTank: 'SFL' },
    volume: 1220, bridge: 'BR2', cq: 'CQS', ssc: 59, mass: 1067 },
  { label: 'LSL probe', selections: { stlEngine: 'AEN', stlFuelTank: 'LSL', ftlReactor: 'RCT', ftlFuelTank: 'SFL' },
    volume: 1376, bridge: 'BR1', cq: 'CQS', ssc: 66, mass: 1067 },
  { label: 'LFL probe', selections: { stlEngine: 'AEN', ftlReactor: 'HPR', ftlFuelTank: 'LFL' },
    volume: 1101, bridge: 'BR2', cq: 'CQS', ssc: 53, mass: 1037 },
  { label: 'TCB probe', selections: { stlEngine: 'AEN', ftlReactor: 'HPR', ftlFuelTank: 'SFL', cargoBay: 'TCB' },
    volume: 663, bridge: 'BR2', cq: 'CQT', ssc: 32, mass: 787 },
  { label: 'MCB probe', selections: { stlEngine: 'AEN', ftlReactor: 'HPR', ftlFuelTank: 'SFL', cargoBay: 'MCB' },
    volume: 1608, bridge: 'BR2', cq: 'CQS', ssc: 77, mass: 1195 },
  { label: 'WCB probe', selections: { stlEngine: 'AEN', ftlReactor: 'HPR', ftlFuelTank: 'SFL', cargoBay: 'WCB' },
    volume: 1608, bridge: 'BR2', cq: 'CQS', ssc: 77, mass: 1295 },
  { label: 'VCB probe', selections: { stlEngine: 'AEN', ftlReactor: 'HPR', ftlFuelTank: 'SFL', cargoBay: 'VCB' },
    volume: 3708, bridge: 'BR2', cq: 'CQL', ssc: 177, mass: 1887 },
  { label: 'HCB probe', selections: { stlEngine: 'AEN', ftlReactor: 'HPR', ftlFuelTank: 'SFL', cargoBay: 'HCB' },
    volume: 5808, bridge: 'BR2', cq: 'CQL', ssc: 277, mass: 2657 },
  { label: 'GEN fraction probe', selections: { stlEngine: 'GEN', ftlReactor: 'HPR', ftlFuelTank: 'SFL', cargoBay: 'VSC' },
    volume: 816, bridge: 'BR2', cq: 'CQT', ssc: 39, mass: 854 },
  { label: 'FSE fraction probe (VSC)', selections: { stlEngine: 'FSE', ftlReactor: 'HPR', ftlFuelTank: 'SFL', cargoBay: 'VSC' },
    volume: 816, bridge: 'BR2', cq: 'CQT', ssc: 39, mass: 855 },
  { label: 'FSE fraction probe (reference swap)', selections: { stlEngine: 'FSE', ftlReactor: 'RCT', ftlFuelTank: 'SFL' },
    volume: 962, bridge: 'BR1', cq: 'CQS', ssc: 46, mass: 826 },
];

describe('in-game ground truth (24 BLU screenshots, 2026-08-06)', () => {
  it.each(SHIPS.map((s) => [s.label, s] as const))('%s', (_label, ship) => {
    const selections = sel(ship.selections);
    const volume = calculateVolume(selections);

    expect(volume).toBe(ship.volume);
    expect(getBridge(selections)).toBe(ship.bridge);
    expect(getCrewQuarters(volume)).toBe(ship.cq);
    expect(calculateSSC(volume)).toBe(ship.ssc);
    expect(Math.round(calculateMass(selections, volume))).toBe(ship.mass);
  });
});
