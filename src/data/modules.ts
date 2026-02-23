import type { ModuleSlot, MaterialCategory } from '../types';

// -- Drive System --

export const stlEngine: ModuleSlot = {
  name: 'STL Engine',
  options: [
    { name: 'Standard', ticker: 'ENG', volume: 239 },
    { name: 'Fuel-saving', ticker: 'FSE', volume: 238 },
    { name: 'Glass', ticker: 'GEN', volume: 238 },
    { name: 'Advanced', ticker: 'AEN', volume: 452 },
    { name: 'Hyperthrust', ticker: 'HTE', volume: 456 },
  ],
  required: true,
};

export const stlFuelTank: ModuleSlot = {
  name: 'STL Fuel Tank',
  options: [
    { name: 'Small', ticker: 'SSL', volume: 70 },
    { name: 'Medium', ticker: 'MSL', volume: 196 },
    { name: 'Large', ticker: 'LSL', volume: 480 },
  ],
  required: true,
};

export const ftlReactor: ModuleSlot = {
  name: 'FTL Reactor',
  options: [
    { name: 'Standard', ticker: 'RCT', volume: 126 },
    { name: 'Quick-charge', ticker: 'QCR', volume: 133 },
    { name: 'High-power', ticker: 'HPR', volume: 243 },
    { name: 'Hyper-power', ticker: 'HYR', volume: 253 },
  ],
  required: false,
};

export const ftlFuelTank: ModuleSlot = {
  name: 'FTL Fuel Tank',
  options: [
    { name: 'Small', ticker: 'SFL', volume: 3 },
    { name: 'Medium', ticker: 'MFL', volume: 9 },
    { name: 'Large', ticker: 'LFL', volume: 21 },
  ],
  required: false,
};

// -- Cargo --

export const cargoBay: ModuleSlot = {
  name: 'Cargo Bay',
  options: [
    { name: 'Tiny', ticker: 'TCB', volume: 105 },
    { name: 'Very Small', ticker: 'VSC', volume: 263 },
    { name: 'Small', ticker: 'SCB', volume: 525 },
    { name: 'Medium', ticker: 'MCB', volume: 1050 },
    { name: 'Large', ticker: 'LCB', volume: 2100 },
    { name: 'High-Load', ticker: 'WCB', volume: 1050 },
    { name: 'High-Volume', ticker: 'VCB', volume: 3150 },
    { name: 'Huge', ticker: 'HCB', volume: 5250 },
  ],
  required: true,
};

// -- Hull & Shielding --

export const hullPlates: ModuleSlot = {
  name: 'Hull Plates',
  options: [
    { name: 'Basic', ticker: 'BHP', volume: 0 },
    { name: 'Lightweight', ticker: 'LHP', volume: 0 },
    { name: 'Reinforced', ticker: 'RHP', volume: 0 },
    { name: 'Hardened', ticker: 'HHP', volume: 0 },
    { name: 'Advanced', ticker: 'AHP', volume: 0 },
  ],
  required: true,
};

export const heatShielding: ModuleSlot = {
  name: 'Heat Shielding',
  options: [
    { name: 'Basic', ticker: 'BPT', volume: 0 },
    { name: 'Advanced', ticker: 'APT', volume: 0 },
  ],
  required: false,
};

export const whippleShielding: ModuleSlot = {
  name: 'Whipple Shielding',
  options: [
    { name: 'Basic', ticker: 'BWH', volume: 0 },
    { name: 'Advanced', ticker: 'AWH', volume: 0 },
  ],
  required: false,
};

export const stabilitySystem: ModuleSlot = {
  name: 'Stability System',
  options: [
    { name: 'Stability Support System', ticker: 'STS', volume: 0 },
  ],
  required: false,
};

export const radiationShielding: ModuleSlot = {
  name: 'Radiation Shielding',
  options: [
    { name: 'Basic', ticker: 'BRP', volume: 0 },
    { name: 'Specialized', ticker: 'SRP', volume: 0 },
    { name: 'Advanced', ticker: 'ARP', volume: 0 },
  ],
  required: false,
};

// -- Optional Equipment (1 unit each, no volume contribution) --

export const selfRepairDrones: ModuleSlot = {
  name: 'Self-repair Drones',
  options: [
    { name: 'Small', ticker: 'RDS', volume: 0 },
    { name: 'Large', ticker: 'RDL', volume: 0 },
  ],
  required: false,
};

export const highGSeats: ModuleSlot = {
  name: 'High-G Seats',
  options: [
    { name: 'Basic', ticker: 'BGS', volume: 0 },
    { name: 'Advanced', ticker: 'AGS', volume: 0 },
  ],
  required: false,
};

// -- All slots grouped by section for UI layout --

export const driveSlots = [stlEngine, stlFuelTank, ftlReactor, ftlFuelTank] as const;
export const cargoSlots = [cargoBay] as const;
export const hullSlots = [hullPlates, heatShielding, whippleShielding, stabilitySystem, radiationShielding] as const;
export const optionalSlots = [selfRepairDrones, highGSeats] as const;

// -- Material metadata: name + category for every ticker that can appear in a BOM --

export const materialInfo: Record<string, { name: string; category: MaterialCategory }> = {
  // STL Engines
  ENG: { name: 'Standard STL Engine', category: 'ship_engines' },
  FSE: { name: 'Fuel-saving STL Engine', category: 'ship_engines' },
  GEN: { name: 'Glass STL Engine', category: 'ship_engines' },
  AEN: { name: 'Advanced STL Engine', category: 'ship_engines' },
  HTE: { name: 'Hyperthrust Engine', category: 'ship_engines' },

  // STL Fuel Tanks
  SSL: { name: 'Small STL Fuel Tank', category: 'ship_kits' },
  MSL: { name: 'Medium STL Fuel Tank', category: 'ship_kits' },
  LSL: { name: 'Large STL Fuel Tank', category: 'ship_kits' },

  // FTL Reactors
  RCT: { name: 'Standard FTL Reactor', category: 'ship_engines' },
  QCR: { name: 'Quick-charge FTL Reactor', category: 'ship_engines' },
  HPR: { name: 'High-power FTL Reactor', category: 'ship_engines' },
  HYR: { name: 'Hyper-power FTL Reactor', category: 'ship_engines' },

  // FTL Fuel Tanks
  SFL: { name: 'Small FTL Fuel Tank', category: 'ship_kits' },
  MFL: { name: 'Medium FTL Fuel Tank', category: 'ship_kits' },
  LFL: { name: 'Large FTL Fuel Tank', category: 'ship_kits' },

  // Cargo Bays
  TCB: { name: 'Tiny Cargo Bay', category: 'ship_kits' },
  VSC: { name: 'Very Small Cargo Bay', category: 'ship_kits' },
  SCB: { name: 'Small Cargo Bay', category: 'ship_kits' },
  MCB: { name: 'Medium Cargo Bay', category: 'ship_kits' },
  LCB: { name: 'Large Cargo Bay', category: 'ship_kits' },
  WCB: { name: 'High-Load Cargo Bay', category: 'ship_kits' },
  VCB: { name: 'High-Volume Cargo Bay', category: 'ship_kits' },
  HCB: { name: 'Huge Cargo Bay', category: 'ship_kits' },

  // Hull Plates
  BHP: { name: 'Basic Hull Plate', category: 'ship_parts' },
  LHP: { name: 'Lightweight Hull Plate', category: 'ship_parts' },
  RHP: { name: 'Reinforced Hull Plate', category: 'ship_parts' },
  HHP: { name: 'Hardened Hull Plate', category: 'ship_parts' },
  AHP: { name: 'Advanced Hull Plate', category: 'ship_parts' },

  // Heat Shielding
  BPT: { name: 'Basic Thermal Protection', category: 'ship_shields' },
  APT: { name: 'Advanced Thermal Protection', category: 'ship_shields' },

  // Whipple Shielding
  BWH: { name: 'Basic Whipple Shield', category: 'ship_shields' },
  AWH: { name: 'Advanced Whipple Shield', category: 'ship_shields' },

  // Stability
  STS: { name: 'Stability Support System', category: 'electronic_systems' },

  // Radiation Shielding
  BRP: { name: 'Basic Radiation Protection', category: 'ship_shields' },
  SRP: { name: 'Specialized Radiation Protection', category: 'ship_shields' },
  ARP: { name: 'Advanced Radiation Protection', category: 'ship_shields' },

  // Self-repair Drones
  RDS: { name: 'Small Self-repair Drones', category: 'unit_prefabs' },
  RDL: { name: 'Large Self-repair Drones', category: 'unit_prefabs' },

  // High-G Seats
  BGS: { name: 'Basic High-G Seats', category: 'ship_parts' },
  AGS: { name: 'Advanced High-G Seats', category: 'ship_parts' },

  // Auto-calculated components
  SSC: { name: 'Ship Structure Component', category: 'ship_parts' },
  FFC: { name: 'FTL Field Controller', category: 'electronic_systems' },
  SFE: { name: 'Small FTL Emitter', category: 'ship_engines' },
  MFE: { name: 'Medium FTL Emitter', category: 'ship_engines' },
  LFE: { name: 'Large FTL Emitter', category: 'ship_engines' },
  BRS: { name: 'Short-distance Command Bridge', category: 'unit_prefabs' },
  BR1: { name: 'Command Bridge MK1', category: 'unit_prefabs' },
  BR2: { name: 'Command Bridge MK2', category: 'unit_prefabs' },
  CQT: { name: 'Crew Quarters (Tiny)', category: 'unit_prefabs' },
  CQS: { name: 'Crew Quarters (Small)', category: 'unit_prefabs' },
  CQM: { name: 'Crew Quarters (Medium)', category: 'unit_prefabs' },
  CQL: { name: 'Crew Quarters (Large)', category: 'unit_prefabs' },
};

// -- Lookup helpers --

/** Get volume for a ticker from the module catalog. Returns 0 for unknown/zero-volume items. */
export function getVolume(ticker: string): number {
  const allSlots = [...driveSlots, ...cargoSlots, ...hullSlots, ...optionalSlots];
  for (const slot of allSlots) {
    const option = slot.options.find(o => o.ticker === ticker);
    if (option) return option.volume;
  }
  return 0;
}
