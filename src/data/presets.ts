import type { ModuleSelections, BOMEntry, StaticShipStats } from '../types';
import { materialInfo } from './modules';

/**
 * Pre-loaded example blueprints.
 *
 * "Starter Ship" is the stock ship every new player begins with (issue #5's
 * ship, also the volume model's reference configuration).
 *
 * The four "evo" configurations share one base platform (FSE engine, MSL STL
 * tank, QCR reactor, LFL FTL tank, LHP hull plates, no optional equipment) and
 * differ only in cargo bay. Source: Dan's ship procurement spreadsheet
 * (14 Jan 2026).
 */

export interface PresetBlueprint {
  name: string;
  description: string;
  modules: ModuleSelections;
}

/**
 * Fixed-BOM presets: stock blueprints whose modules the editor and formula
 * engine can't represent (e.g. the Colony Ship's vortex drive and habitation
 * module). The BOM is authoritative game data, not derived from modules, so
 * these blueprints are read-only in the UI. Kept separate from
 * PRESET_BLUEPRINTS because those must round-trip through permalink encoding.
 */
export interface FixedPresetBlueprint {
  name: string;
  description: string;
  /** Nearest representable selections — display only, never used to rebuild the BOM. */
  moduleSelections: ModuleSelections;
  bom: BOMEntry[];
  staticStats: StaticShipStats;
}

/** Build BOM entries from (ticker, quantity) pairs using the material catalog. */
function bomFrom(lines: Array<[string, number]>): BOMEntry[] {
  return lines.map(([ticker, quantity]) => {
    const info = materialInfo[ticker];
    if (!info) throw new Error(`Fixed preset BOM references unknown material: ${ticker}`);
    return { ticker, quantity, name: info.name, category: info.category };
  });
}

const BASE_MODULES: Omit<ModuleSelections, 'cargoBay'> = {
  stlEngine: 'FSE',
  stlFuelTank: 'MSL',
  ftlReactor: 'QCR',
  ftlFuelTank: 'LFL',
  hullPlates: 'LHP',
  heatShielding: null,
  whippleShielding: null,
  stabilitySystem: null,
  radiationShielding: null,
  selfRepairDrones: null,
  highGSeats: null,
};

/**
 * BP-CLNY-0000 — the stock Colony Ship (issue #3). BOM and stats taken from
 * the game's blueprint payload (wire capture, Oct 2025): every player's colony
 * ship blueprint is identical and LOCKED, so this data is universal.
 */
export const FIXED_PRESET_BLUEPRINTS: FixedPresetBlueprint[] = [
  {
    name: 'Colony Ship (BP-CLNY-0000)',
    description: 'The stock colony ship blueprint. Fixed configuration — priced for CX research.',
    moduleSelections: {
      stlEngine: 'HTE',
      stlFuelTank: 'LSL',
      ftlReactor: null,
      ftlFuelTank: null,
      cargoBay: 'HCB',
      hullPlates: 'AHP',
      heatShielding: 'APT',
      whippleShielding: 'AWH',
      stabilitySystem: 'STS',
      radiationShielding: 'SRP',
      selfRepairDrones: 'RDL',
      highGSeats: 'AGS',
    },
    bom: bomFrom([
      ['HTE', 1],
      ['LSL', 1],
      ['VOE', 1],
      ['VFT', 1],
      ['HCB', 1],
      ['HAM', 1],
      ['STS', 1],
      ['AGS', 1],
      ['RDL', 1],
      ['BR2', 1],
      ['CQL', 1],
      ['AHP', 202],
      ['APT', 202],
      ['AWH', 202],
      ['SRP', 202],
      ['SSC', 407],
    ]),
    staticStats: {
      volume: 8532,
      mass: 5893.6,
      buildTimeHours: 117,
      cargoVolume: 5000,
      cargoWeight: 5000,
    },
  },
];

export const PRESET_BLUEPRINTS: PresetBlueprint[] = [
  {
    name: 'Starter Ship (BP-STRT-0000)',
    description: 'The stock BLU every new player starts with. Price a rebuild or an upgrade baseline.',
    modules: {
      stlEngine: 'ENG',
      stlFuelTank: 'SSL',
      ftlReactor: 'RCT',
      ftlFuelTank: 'SFL',
      cargoBay: 'SCB',
      hullPlates: 'BHP',
      heatShielding: null,
      whippleShielding: null,
      stabilitySystem: null,
      radiationShielding: null,
      selfRepairDrones: null,
      highGSeats: null,
    },
  },
  {
    name: '2k2k LCB Hauler',
    description: 'Balanced hauler — 2k volume, 2k weight. The workhorse.',
    modules: { ...BASE_MODULES, cargoBay: 'LCB' },
  },
  {
    name: '3k/1k WCB Heavy',
    description: 'Weight-optimised — 3k weight, 1k volume. Heavy goods runner.',
    modules: { ...BASE_MODULES, cargoBay: 'WCB' },
  },
  {
    name: '1k/3k VCB Gas Hauler',
    description: 'Volume-optimised — 1k weight, 3k volume. Gas and light bulk.',
    modules: { ...BASE_MODULES, cargoBay: 'VCB' },
  },
  {
    name: '5k/5k HCB',
    description: 'Maximum capacity — 5k volume, 5k weight. The big rig.',
    modules: { ...BASE_MODULES, cargoBay: 'HCB' },
  },
];
