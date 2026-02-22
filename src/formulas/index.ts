import type { ModuleSelections, BOMEntry, EmitterCounts } from '../types';
import { getVolume, materialInfo } from '../data/modules';

/** Sum of all component volumes from module selections */
export function calculateVolume(selections: ModuleSelections): number {
  let total = 0;

  total += getVolume(selections.stlEngine);
  total += getVolume(selections.stlFuelTank);
  total += getVolume(selections.cargoBay);

  if (selections.ftlReactor) total += getVolume(selections.ftlReactor);
  if (selections.ftlFuelTank) total += getVolume(selections.ftlFuelTank);

  // Hull plates, shields, optional equipment: zero volume (confirmed in spec)
  return total;
}

/** Ship Structure Components: ceil(volume / 21) */
export function calculateSSC(volume: number): number {
  return Math.ceil(volume / 21);
}

/** Hull plates (and per-shield-type count): ceil(volume^(2/3) / 2.07) */
export function calculatePlates(volume: number): number {
  return Math.ceil(Math.pow(volume, 2 / 3) / 2.07);
}

/**
 * FTL emitter counts — greedy cover algorithm.
 * LFE spans 1050, MFE spans 260, SFE spans 100.
 * Source: game developer molp, corrected by SLKLS (Feb 2026).
 */
export function calculateEmitters(volume: number): EmitterCounts {
  let large = 0;
  let medium = 0;
  let small = 0;
  let covered = 0;

  while (covered + 1050 <= volume) {
    large += 1;
    covered += 1050;
  }

  while (covered + 260 <= volume) {
    medium += 1;
    covered += 260;
  }

  while (covered < volume) {
    small += 1;
    covered += 100;
  }

  return { small, medium, large };
}

/** Bridge type depends on FTL reactor type */
export function getBridge(ftlReactor: string | null): string {
  if (ftlReactor === null) return 'BRS';
  if (ftlReactor === 'RCT' || ftlReactor === 'QCR') return 'BR1';
  if (ftlReactor === 'HPR' || ftlReactor === 'HYR') return 'BR2';
  return 'BRS';
}

/** Crew quarters depend on volume thresholds */
export function getCrewQuarters(volume: number): string {
  if (volume < 1000) return 'CQT';
  if (volume < 2000) return 'CQS';
  if (volume < 3000) return 'CQM';
  return 'CQL';
}

/** Build the complete Bill of Materials from module selections */
export function calculateBOM(selections: ModuleSelections): BOMEntry[] {
  const volume = calculateVolume(selections);
  const plateCount = calculatePlates(volume);
  const entries: BOMEntry[] = [];

  function add(ticker: string, quantity: number): void {
    const info = materialInfo[ticker];
    if (!info) return;
    entries.push({ ticker, name: info.name, quantity, category: info.category });
  }

  // Selectable modules (1 unit each)
  add(selections.stlEngine, 1);
  add(selections.stlFuelTank, 1);
  add(selections.cargoBay, 1);

  if (selections.ftlReactor) add(selections.ftlReactor, 1);
  if (selections.ftlFuelTank) add(selections.ftlFuelTank, 1);

  // Hull plates — type selected by user, count calculated
  add(selections.hullPlates, plateCount);

  // Shields — each equipped type gets plateCount units
  if (selections.heatShielding) add(selections.heatShielding, plateCount);
  if (selections.whippleShielding) add(selections.whippleShielding, plateCount);
  if (selections.radiationShielding) add(selections.radiationShielding, plateCount);

  // Stability system — 1 unit, no volume
  if (selections.stabilitySystem) add(selections.stabilitySystem, 1);

  // Optional equipment — 1 unit each, no volume
  if (selections.selfRepairDrones) add(selections.selfRepairDrones, 1);
  if (selections.highGSeats) add(selections.highGSeats, 1);

  // Auto-calculated: structure
  add('SSC', calculateSSC(volume));

  // Auto-calculated: FTL components (only if reactor equipped)
  if (selections.ftlReactor) {
    add('FFC', 1);
    const emitters = calculateEmitters(volume);
    if (emitters.large > 0) add('LFE', emitters.large);
    if (emitters.medium > 0) add('MFE', emitters.medium);
    if (emitters.small > 0) add('SFE', emitters.small);
  }

  // Auto-calculated: bridge and crew quarters
  add(getBridge(selections.ftlReactor), 1);
  add(getCrewQuarters(volume), 1);

  return entries;
}
