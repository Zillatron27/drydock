import type { ModuleSlot, MaterialCategory } from '../types';

// -- Drive System --

export const stlEngine: ModuleSlot = {
  name: 'STL Engine',
  options: [
    { name: 'Standard', ticker: 'ENG' },
    { name: 'Fuel-saving', ticker: 'FSE' },
    { name: 'Glass', ticker: 'GEN' },
    { name: 'Advanced', ticker: 'AEN' },
    { name: 'Hyperthrust', ticker: 'HTE' },
  ],
  required: true,
};

export const stlFuelTank: ModuleSlot = {
  name: 'STL Fuel Tank',
  options: [
    { name: 'Small', ticker: 'SSL' },
    { name: 'Medium', ticker: 'MSL' },
    { name: 'Large', ticker: 'LSL' },
  ],
  required: true,
};

export const ftlReactor: ModuleSlot = {
  name: 'FTL Reactor',
  options: [
    { name: 'Standard', ticker: 'RCT' },
    { name: 'Quick-charge', ticker: 'QCR' },
    { name: 'High-power', ticker: 'HPR' },
    { name: 'Hyper-power', ticker: 'HYR' },
  ],
  required: false,
};

export const ftlFuelTank: ModuleSlot = {
  name: 'FTL Fuel Tank',
  options: [
    { name: 'Small', ticker: 'SFL' },
    { name: 'Medium', ticker: 'MFL' },
    { name: 'Large', ticker: 'LFL' },
  ],
  required: false,
};

// -- Cargo --

export const cargoBay: ModuleSlot = {
  name: 'Cargo Bay',
  options: [
    { name: 'Tiny', ticker: 'TCB' },
    { name: 'Very Small', ticker: 'VSC' },
    { name: 'Small', ticker: 'SCB' },
    { name: 'Medium', ticker: 'MCB' },
    { name: 'Large', ticker: 'LCB' },
    { name: 'High-Load', ticker: 'WCB' },
    { name: 'High-Volume', ticker: 'VCB' },
    { name: 'Huge', ticker: 'HCB' },
  ],
  required: true,
};

// -- Hull & Shielding --

export const hullPlates: ModuleSlot = {
  name: 'Hull Plates',
  options: [
    { name: 'Basic', ticker: 'BHP' },
    { name: 'Lightweight', ticker: 'LHP' },
    { name: 'Reinforced', ticker: 'RHP' },
    { name: 'Hardened', ticker: 'HHP' },
    { name: 'Advanced', ticker: 'AHP' },
  ],
  required: true,
};

export const heatShielding: ModuleSlot = {
  name: 'Heat Shielding',
  options: [
    { name: 'Basic', ticker: 'BPT' },
    { name: 'Advanced', ticker: 'APT' },
  ],
  required: false,
};

export const whippleShielding: ModuleSlot = {
  name: 'Whipple Shielding',
  options: [
    { name: 'Basic', ticker: 'BWH' },
    { name: 'Advanced', ticker: 'AWH' },
  ],
  required: false,
};

export const stabilitySystem: ModuleSlot = {
  name: 'Stability System',
  options: [
    { name: 'Stability Support System', ticker: 'STS' },
  ],
  required: false,
};

export const radiationShielding: ModuleSlot = {
  name: 'Radiation Shielding',
  options: [
    { name: 'Basic', ticker: 'BRP' },
    { name: 'Specialized', ticker: 'SRP' },
    { name: 'Advanced', ticker: 'ARP' },
  ],
  required: false,
};

// -- Optional Equipment (1 unit each) --

export const selfRepairDrones: ModuleSlot = {
  name: 'Self-repair Drones',
  options: [
    { name: 'Small', ticker: 'RDS' },
    { name: 'Large', ticker: 'RDL' },
  ],
  required: false,
};

export const highGSeats: ModuleSlot = {
  name: 'High-G Seats',
  options: [
    { name: 'Basic', ticker: 'BGS' },
    { name: 'Advanced', ticker: 'AGS' },
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
