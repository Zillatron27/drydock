import type { ModuleSelections, BOMEntry, EmitterCounts } from '../types';
import { materialInfo } from '../data/modules';
import {
  moduleStats,
  VOLUME_REFERENCE,
  VOLUME_DELTAS,
  NO_FTL_DELTA,
  CQ_THRESHOLDS,
  BRIDGE_MAP,
  EMITTER_CONSTANTS,
} from '../data/moduleStats';

/** Total ship volume via delta model (validated against 23 in-game blueprints) */
export function calculateVolume(selections: ModuleSelections): number {
  let volume = VOLUME_REFERENCE.totalVolume;

  const selectionEntries: Array<[string | null, string]> = [
    [selections.stlEngine, 'STL_ENGINE'],
    [selections.stlFuelTank, 'STL_FUEL_TANK'],
    [selections.cargoBay, 'CARGO_BAY'],
    [selections.hullPlates, 'HULL_TYPE'],
    [selections.ftlReactor, 'FTL_REACTOR'],
    [selections.ftlFuelTank, 'FTL_FUEL_TANK'],
    [selections.heatShielding, 'HEAT_SHIELD'],
    [selections.whippleShielding, 'WHIPPLE_SHIELD'],
    [selections.stabilitySystem, 'GRAVITY_SHIELD'],
    [selections.radiationShielding, 'RADIATION_SHIELD'],
    [selections.selfRepairDrones, 'REPAIR_DRONES'],
    [selections.highGSeats, 'HIGH_G_SEATS'],
  ];

  for (const [ticker, slotType] of selectionEntries) {
    if (!ticker) continue;
    const stats = moduleStats[ticker];
    if (!stats) continue;
    const delta = VOLUME_DELTAS[slotType]?.[stats.option];
    if (delta) volume += delta.volumeDelta;
  }

  // STL-only ships: subtract reference FTL contribution
  if (!selections.ftlReactor && !selections.ftlFuelTank) {
    volume += NO_FTL_DELTA.volumeDelta;
  }

  return volume;
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
 * FTL emitter counts — diminishing-multiplier volume coverage.
 * Validated against 47 FTL ships.
 */
export function calculateEmitters(volume: number): EmitterCounts {
  const { LFE_SPAN, MFE_SPAN, SFE_SPAN, BASE_D, MULTIPLIER } = EMITTER_CONSTANTS;

  const large = Math.floor(volume / LFE_SPAN);
  const rem = volume % LFE_SPAN;

  if (rem === 0) {
    return { small: 0, medium: 0, large };
  }

  const working = (rem * MULTIPLIER) / (BASE_D + large);
  const medium = Math.floor(working / MFE_SPAN);
  const leftover = working - medium * MFE_SPAN;
  const small = leftover > 0 ? Math.ceil(leftover / SFE_SPAN) : 0;

  return { small, medium, large };
}

/** Bridge type depends on FTL reactor type */
export function getBridge(ftlReactor: string | null): string {
  if (!ftlReactor) return 'BRS';
  const stats = moduleStats[ftlReactor];
  if (!stats) return 'BRS';
  return BRIDGE_MAP[stats.option] ?? 'BRS';
}

/** Crew quarters depend on volume thresholds (validated 52/52 ships) */
export function getCrewQuarters(volume: number): string {
  for (const { maxVolume, ticker } of CQ_THRESHOLDS) {
    if (maxVolume === null || volume <= maxVolume) return ticker;
  }
  return 'CQL';
}

/**
 * Operating empty mass: exact BOM weight summation.
 * sum(bomWeight * quantity) for every BOM entry.
 * Validated: zero error across 24 in-game blueprints.
 */
export function calculateMass(selections: ModuleSelections, volume: number): number {
  const plateCount = calculatePlates(volume);
  let mass = 0;

  function addWeight(ticker: string, quantity: number): void {
    const stats = moduleStats[ticker];
    if (stats) mass += quantity * stats.bomWeight;
  }

  // Selectable modules (1 unit each)
  addWeight(selections.stlEngine, 1);
  addWeight(selections.stlFuelTank, 1);
  addWeight(selections.cargoBay, 1);
  if (selections.ftlReactor) addWeight(selections.ftlReactor, 1);
  if (selections.ftlFuelTank) addWeight(selections.ftlFuelTank, 1);

  // Hull plates — plateCount units
  addWeight(selections.hullPlates, plateCount);

  // Shields — each equipped type gets plateCount units
  if (selections.heatShielding) addWeight(selections.heatShielding, plateCount);
  if (selections.whippleShielding) addWeight(selections.whippleShielding, plateCount);
  if (selections.radiationShielding) addWeight(selections.radiationShielding, plateCount);

  // Single-unit optional equipment
  if (selections.stabilitySystem) addWeight(selections.stabilitySystem, 1);
  if (selections.selfRepairDrones) addWeight(selections.selfRepairDrones, 1);
  if (selections.highGSeats) addWeight(selections.highGSeats, 1);

  // Auto-computed components
  addWeight('SSC', calculateSSC(volume));
  addWeight(getBridge(selections.ftlReactor), 1);
  addWeight(getCrewQuarters(volume), 1);

  if (selections.ftlReactor) {
    addWeight('FFC', 1);
    const emitters = calculateEmitters(volume);
    if (emitters.large > 0) addWeight('LFE', emitters.large);
    if (emitters.medium > 0) addWeight('MFE', emitters.medium);
    if (emitters.small > 0) addWeight('SFE', emitters.small);
  }

  return mass;
}

/** Build time in hours: mass / 50 */
export function calculateBuildTime(mass: number): number {
  return mass / 50;
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

  // Stability system — 1 unit
  if (selections.stabilitySystem) add(selections.stabilitySystem, 1);

  // Optional equipment — 1 unit each
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
