import type { ModuleSelections } from '../types';

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
    name: '1k/3k VCB GasRunner',
    description: 'Volume-optimised — 1k weight, 3k volume. Gas and light bulk.',
    modules: { ...BASE_MODULES, cargoBay: 'VCB' },
  },
  {
    name: '5k/5k HCB',
    description: 'Maximum capacity — 5k volume, 5k weight. The big rig.',
    modules: { ...BASE_MODULES, cargoBay: 'HCB' },
  },
];
