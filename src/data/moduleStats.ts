// Wire-captured module stats from PrUn game data
// Source: APEX_/data/drydock_module_data.json (validated 2026-02-23)

export interface ModuleStats {
  ticker: string;
  option: string;
  slotType: string;
  bomWeight: number;
  bomVolume: number;
  modifiers: Record<string, number>;
}

export const moduleStats: Record<string, ModuleStats> = {
  AEN: { ticker: 'AEN', option: 'STL_ENGINE_ADVANCED', slotType: 'STL_ENGINE', bomWeight: 14, bomVolume: 7, modifiers: { STL_USAGE: 0.02 } },
  AGS: { ticker: 'AGS', option: 'HIGH_G_SEATS_ADVANCED', slotType: 'HIGH_G_SEATS', bomWeight: 30, bomVolume: 5, modifiers: { MAX_G_FACTOR_INCREASE: 12 } },
  AHP: { ticker: 'AHP', option: 'HULL_PLATES_ADVANCED', slotType: 'HULL_TYPE', bomWeight: 10, bomVolume: 10, modifiers: { SHIELDING_GENERAL: 0.3, MAX_G_FACTOR: 15 } },
  APT: { ticker: 'APT', option: 'HEAT_SHIELD_ADVANCED', slotType: 'HEAT_SHIELD', bomWeight: 0.03, bomVolume: 0.3, modifiers: { SHIELDING_HEAT: 1 } },
  ARP: { ticker: 'ARP', option: 'RADIATION_SHIELD_ADVANCED', slotType: 'RADIATION_SHIELD', bomWeight: 0.04, bomVolume: 0.2, modifiers: { SHIELDING_RADIATION: 0.35 } },
  AWH: { ticker: 'AWH', option: 'WHIPPLE_SHIELD_ADVANCED', slotType: 'WHIPPLE_SHIELD', bomWeight: 0.12, bomVolume: 1, modifiers: { SHIELDING_WHIPPLE: 1 } },
  BGS: { ticker: 'BGS', option: 'HIGH_G_SEATS_BASIC', slotType: 'HIGH_G_SEATS', bomWeight: 20, bomVolume: 3, modifiers: { MAX_G_FACTOR_INCREASE: 5 } },
  BHP: { ticker: 'BHP', option: 'HULL_PLATES_BASIC', slotType: 'HULL_TYPE', bomWeight: 9, bomVolume: 10, modifiers: { SHIELDING_GENERAL: 0, MAX_G_FACTOR: 8 } },
  BPT: { ticker: 'BPT', option: 'HEAT_SHIELD_BASIC', slotType: 'HEAT_SHIELD', bomWeight: 0.02, bomVolume: 0.3, modifiers: { SHIELDING_HEAT: 0.5 } },
  BR1: { ticker: 'BR1', option: 'COMMAND_BRIDGE_MK1', slotType: 'COMMAND_BRIDGE', bomWeight: 180, bomVolume: 300, modifiers: {} },
  BR2: { ticker: 'BR2', option: 'COMMAND_BRIDGE_MK2', slotType: 'COMMAND_BRIDGE', bomWeight: 280, bomVolume: 400, modifiers: {} },
  BRP: { ticker: 'BRP', option: 'RADIATION_SHIELD_BASIC', slotType: 'RADIATION_SHIELD', bomWeight: 0.03, bomVolume: 0.2, modifiers: { SHIELDING_RADIATION: 0.15 } },
  BRS: { ticker: 'BRS', option: 'COMMAND_BRIDGE_SHORT', slotType: 'COMMAND_BRIDGE', bomWeight: 150, bomVolume: 200, modifiers: {} },
  BWH: { ticker: 'BWH', option: 'WHIPPLE_SHIELD_BASIC', slotType: 'WHIPPLE_SHIELD', bomWeight: 0.1, bomVolume: 1, modifiers: { SHIELDING_WHIPPLE: 0.5 } },
  CQL: { ticker: 'CQL', option: 'CREW_QUARTERS_STANDARD', slotType: 'CREW_QUARTERS', bomWeight: 75, bomVolume: 150, modifiers: {} },
  CQM: { ticker: 'CQM', option: 'CREW_QUARTERS_MEDIUM', slotType: 'CREW_QUARTERS', bomWeight: 50, bomVolume: 100, modifiers: {} },
  CQS: { ticker: 'CQS', option: 'CREW_QUARTERS_SMALL', slotType: 'CREW_QUARTERS', bomWeight: 25, bomVolume: 50, modifiers: {} },
  CQT: { ticker: 'CQT', option: 'CREW_QUARTERS_TINY', slotType: 'CREW_QUARTERS', bomWeight: 12.5, bomVolume: 25, modifiers: {} },
  ENG: { ticker: 'ENG', option: 'STL_ENGINE_STANDARD', slotType: 'STL_ENGINE', bomWeight: 8, bomVolume: 4, modifiers: { STL_USAGE: 0.015 } },
  FFC: { ticker: 'FFC', option: 'FTL_FIELD_CONTROLLER', slotType: 'FTL_FIELD_CONTROLLER', bomWeight: 50, bomVolume: 16, modifiers: {} },
  FSE: { ticker: 'FSE', option: 'STL_ENGINE_FUEL_SAVING', slotType: 'STL_ENGINE', bomWeight: 6, bomVolume: 3, modifiers: { STL_USAGE: 0.0075 } },
  GEN: { ticker: 'GEN', option: 'STL_ENGINE_GLASS', slotType: 'STL_ENGINE', bomWeight: 5, bomVolume: 3, modifiers: { STL_USAGE: 0.015 } },
  HAM: { ticker: 'HAM', option: 'HABITATION_MODULE_COLONY_SHIP', slotType: 'HABITATION_MODULE', bomWeight: 1200, bomVolume: 1200, modifiers: {} },
  HCB: { ticker: 'HCB', option: 'CARGO_BAY_HUGE', slotType: 'CARGO_BAY', bomWeight: 500, bomVolume: 500, modifiers: { CARGO_CAPACITY_VOLUME: 5000, CARGO_CAPACITY_WEIGHT: 5000 } },
  HHP: { ticker: 'HHP', option: 'HULL_PLATES_HARDENED', slotType: 'HULL_TYPE', bomWeight: 10, bomVolume: 10, modifiers: { SHIELDING_GENERAL: 0.15, MAX_G_FACTOR: 13 } },
  HPR: { ticker: 'HPR', option: 'FTL_REACTOR_HIGH_POWER', slotType: 'FTL_REACTOR', bomWeight: 16, bomVolume: 15, modifiers: { FTL_POWER: 4800, FTL_CHARGE_FACTOR: 15 } },
  HTE: { ticker: 'HTE', option: 'STL_ENGINE_HYPERTHRUST', slotType: 'STL_ENGINE', bomWeight: 16, bomVolume: 10, modifiers: { STL_USAGE: 0.03 } },
  HYR: { ticker: 'HYR', option: 'FTL_REACTOR_HYPER_POWER', slotType: 'FTL_REACTOR', bomWeight: 25, bomVolume: 25, modifiers: { FTL_POWER: 7200, FTL_CHARGE_FACTOR: 30 } },
  LCB: { ticker: 'LCB', option: 'CARGO_BAY_LARGE', slotType: 'CARGO_BAY', bomWeight: 200, bomVolume: 200, modifiers: { CARGO_CAPACITY_VOLUME: 2000, CARGO_CAPACITY_WEIGHT: 2000 } },
  LFE: { ticker: 'LFE', option: 'FTL_FIELD_EMITTER_LARGE', slotType: 'FTL_FIELD_EMITTER_LARGE', bomWeight: 0.4, bomVolume: 1.6, modifiers: { FTL_VOLUME_SPAN: 1000, POWER_REQUIREMENT: 300 } },
  LFL: { ticker: 'LFL', option: 'FTL_FUEL_TANK_LARGE', slotType: 'FTL_FUEL_TANK', bomWeight: 60, bomVolume: 10, modifiers: { FTL_FUEL_CAPACITY: 2000 } },
  LHP: { ticker: 'LHP', option: 'HULL_PLATES_LIGHTWEIGHT', slotType: 'HULL_TYPE', bomWeight: 4, bomVolume: 10, modifiers: { SHIELDING_GENERAL: -0.1, MAX_G_FACTOR: 10 } },
  LSL: { ticker: 'LSL', option: 'STL_FUEL_TANK_LARGE', slotType: 'STL_FUEL_TANK', bomWeight: 125, bomVolume: 100, modifiers: { STL_FUEL_CAPACITY: 8000 } },
  MCB: { ticker: 'MCB', option: 'CARGO_BAY_MEDIUM', slotType: 'CARGO_BAY', bomWeight: 100, bomVolume: 100, modifiers: { CARGO_CAPACITY_VOLUME: 1000, CARGO_CAPACITY_WEIGHT: 1000 } },
  MFE: { ticker: 'MFE', option: 'FTL_FIELD_EMITTER_MEDIUM', slotType: 'FTL_FIELD_EMITTER_MEDIUM', bomWeight: 0.2, bomVolume: 0.8, modifiers: { FTL_VOLUME_SPAN: 500, POWER_REQUIREMENT: 175 } },
  MFL: { ticker: 'MFL', option: 'FTL_FUEL_TANK_MEDIUM', slotType: 'FTL_FUEL_TANK', bomWeight: 24, bomVolume: 4, modifiers: { FTL_FUEL_CAPACITY: 800 } },
  MSL: { ticker: 'MSL', option: 'STL_FUEL_TANK_MEDIUM', slotType: 'STL_FUEL_TANK', bomWeight: 50, bomVolume: 50, modifiers: { STL_FUEL_CAPACITY: 3500 } },
  QCR: { ticker: 'QCR', option: 'FTL_REACTOR_QUICK_CHARGE', slotType: 'FTL_REACTOR', bomWeight: 14, bomVolume: 10, modifiers: { FTL_POWER: 2000, FTL_CHARGE_FACTOR: 10 } },
  RCT: { ticker: 'RCT', option: 'FTL_REACTOR_STANDARD', slotType: 'FTL_REACTOR', bomWeight: 7, bomVolume: 4, modifiers: { FTL_POWER: 2400, FTL_CHARGE_FACTOR: 2 } },
  RDL: { ticker: 'RDL', option: 'REPAIR_DRONES_LARGE', slotType: 'REPAIR_DRONES', bomWeight: 150, bomVolume: 30, modifiers: { SHIELDING_GENERAL: 0.1 } },
  RDS: { ticker: 'RDS', option: 'REPAIR_DRONES_SMALL', slotType: 'REPAIR_DRONES', bomWeight: 50, bomVolume: 10, modifiers: { SHIELDING_GENERAL: 0.05 } },
  RHP: { ticker: 'RHP', option: 'HULL_PLATES_REINFORCED', slotType: 'HULL_TYPE', bomWeight: 10, bomVolume: 10, modifiers: { SHIELDING_GENERAL: 0.1, MAX_G_FACTOR: 11 } },
  SCB: { ticker: 'SCB', option: 'CARGO_BAY_SMALL', slotType: 'CARGO_BAY', bomWeight: 50, bomVolume: 50, modifiers: { CARGO_CAPACITY_VOLUME: 500, CARGO_CAPACITY_WEIGHT: 500 } },
  SFE: { ticker: 'SFE', option: 'FTL_FIELD_EMITTER_SMALL', slotType: 'FTL_FIELD_EMITTER_SMALL', bomWeight: 0.1, bomVolume: 0.4, modifiers: { FTL_VOLUME_SPAN: 250, POWER_REQUIREMENT: 100 } },
  SFL: { ticker: 'SFL', option: 'FTL_FUEL_TANK_SMALL', slotType: 'FTL_FUEL_TANK', bomWeight: 9, bomVolume: 1.5, modifiers: { FTL_FUEL_CAPACITY: 300 } },
  SRP: { ticker: 'SRP', option: 'RADIATION_SHIELD_SPECIALIZED', slotType: 'RADIATION_SHIELD', bomWeight: 0.1, bomVolume: 0.2, modifiers: { SHIELDING_RADIATION: 0.7 } },
  SSC: { ticker: 'SSC', option: 'STRUCTURAL_SPACECRAFT_COMPONENT', slotType: 'STRUCTURE', bomWeight: 1, bomVolume: 1, modifiers: {} },
  SSL: { ticker: 'SSL', option: 'STL_FUEL_TANK_SMALL', slotType: 'STL_FUEL_TANK', bomWeight: 20, bomVolume: 20, modifiers: { STL_FUEL_CAPACITY: 1500 } },
  STS: { ticker: 'STS', option: 'GRAVITY_SHIELD_BASIC', slotType: 'GRAVITY_SHIELD', bomWeight: 0.1, bomVolume: 0.1, modifiers: { SHIELDING_GRAVITY: 1 } },
  TCB: { ticker: 'TCB', option: 'CARGO_BAY_TINY', slotType: 'CARGO_BAY', bomWeight: 20, bomVolume: 20, modifiers: { CARGO_CAPACITY_VOLUME: 100, CARGO_CAPACITY_WEIGHT: 100 } },
  VCB: { ticker: 'VCB', option: 'CARGO_BAY_HIGH_VOLUME', slotType: 'CARGO_BAY', bomWeight: 200, bomVolume: 200, modifiers: { CARGO_CAPACITY_VOLUME: 3000, CARGO_CAPACITY_WEIGHT: 1000 } },
  VFT: { ticker: 'VFT', option: 'VORTEX_FUEL_TANK_STANDARD', slotType: 'VORTEX_FUEL_TANK', bomWeight: 1000, bomVolume: 1000, modifiers: { VORTEX_FUEL_CAPACITY: 10000 } },
  VOE: { ticker: 'VOE', option: 'VORTEX_REACTOR_STANDARD', slotType: 'VORTEX_REACTOR', bomWeight: 40, bomVolume: 35, modifiers: {} },
  VSC: { ticker: 'VSC', option: 'CARGO_BAY_VERY_SMALL', slotType: 'CARGO_BAY', bomWeight: 35, bomVolume: 35, modifiers: { CARGO_CAPACITY_VOLUME: 250, CARGO_CAPACITY_WEIGHT: 250 } },
  WCB: { ticker: 'WCB', option: 'CARGO_BAY_HIGH_LOAD', slotType: 'CARGO_BAY', bomWeight: 200, bomVolume: 200, modifiers: { CARGO_CAPACITY_VOLUME: 1000, CARGO_CAPACITY_WEIGHT: 3000 } },
};

// Volume reference: ENG + SSL + RCT + SFL + SCB + BHP (validated against in-game data)
export const VOLUME_REFERENCE = {
  totalVolume: 963,
  operatingEmptyMass: 827.8,
} as const;

// Volume deltas: slotType -> option -> { volumeDelta, weightDelta }
// Delta relative to the reference ship's selections per slot
export const VOLUME_DELTAS: Record<string, Record<string, { volumeDelta: number; weightDelta: number }>> = {
  STL_ENGINE: {
    STL_ENGINE_STANDARD: { volumeDelta: 0, weightDelta: 0 },
    STL_ENGINE_FUEL_SAVING: { volumeDelta: -1, weightDelta: -2 },
    STL_ENGINE_GLASS: { volumeDelta: -1, weightDelta: -3 },
    STL_ENGINE_ADVANCED: { volumeDelta: 3, weightDelta: 6 },
    STL_ENGINE_HYPERTHRUST: { volumeDelta: 7, weightDelta: 9 },
  },
  STL_FUEL_TANK: {
    STL_FUEL_TANK_SMALL: { volumeDelta: 0, weightDelta: 0 },
    STL_FUEL_TANK_MEDIUM: { volumeDelta: 126, weightDelta: 71.7 },
    STL_FUEL_TANK_LARGE: { volumeDelta: 410, weightDelta: 232.9 },
  },
  FTL_REACTOR: {
    FTL_REACTOR_STANDARD: { volumeDelta: 0, weightDelta: 0 },
    FTL_REACTOR_QUICK_CHARGE: { volumeDelta: 7, weightDelta: 8 },
    FTL_REACTOR_HIGH_POWER: { volumeDelta: 117, weightDelta: 141.7 },
    FTL_REACTOR_HYPER_POWER: { volumeDelta: 127, weightDelta: 159.7 },
  },
  FTL_FUEL_TANK: {
    FTL_FUEL_TANK_SMALL: { volumeDelta: 0, weightDelta: 0 },
    FTL_FUEL_TANK_MEDIUM: { volumeDelta: 6, weightDelta: 16 },
    FTL_FUEL_TANK_LARGE: { volumeDelta: 18, weightDelta: 52 },
  },
  CARGO_BAY: {
    CARGO_BAY_TINY: { volumeDelta: -420, weightDelta: -197.8 },
    CARGO_BAY_VERY_SMALL: { volumeDelta: -262, weightDelta: -120.7 },
    CARGO_BAY_SMALL: { volumeDelta: 0, weightDelta: 0 },
    CARGO_BAY_MEDIUM: { volumeDelta: 525, weightDelta: 219 },
    CARGO_BAY_LARGE: { volumeDelta: 1575, weightDelta: 628.4 },
    CARGO_BAY_HIGH_LOAD: { volumeDelta: 525, weightDelta: 319 },
    CARGO_BAY_HIGH_VOLUME: { volumeDelta: 2625, weightDelta: 919.8 },
    CARGO_BAY_HUGE: { volumeDelta: 4725, weightDelta: 1689.6 },
  },
  HULL_TYPE: {
    HULL_PLATES_BASIC: { volumeDelta: 0, weightDelta: 0 },
    HULL_PLATES_LIGHTWEIGHT: { volumeDelta: 0, weightDelta: -240 },
    HULL_PLATES_REINFORCED: { volumeDelta: 0, weightDelta: 48 },
    HULL_PLATES_HARDENED: { volumeDelta: 0, weightDelta: 48 },
    HULL_PLATES_ADVANCED: { volumeDelta: 0, weightDelta: 48 },
  },
  HEAT_SHIELD: {
    HEAT_SHIELD_BASIC: { volumeDelta: 0, weightDelta: 0.96 },
    HEAT_SHIELD_ADVANCED: { volumeDelta: 0, weightDelta: 0 },
  },
  WHIPPLE_SHIELD: {
    WHIPPLE_SHIELD_BASIC: { volumeDelta: 0, weightDelta: 4.8 },
    WHIPPLE_SHIELD_ADVANCED: { volumeDelta: 0, weightDelta: 0 },
  },
  GRAVITY_SHIELD: {
    GRAVITY_SHIELD_BASIC: { volumeDelta: 0, weightDelta: 0.1 },
  },
  RADIATION_SHIELD: {
    RADIATION_SHIELD_BASIC: { volumeDelta: 0, weightDelta: 1.44 },
    RADIATION_SHIELD_ADVANCED: { volumeDelta: 0, weightDelta: 0 },
    RADIATION_SHIELD_SPECIALIZED: { volumeDelta: 0, weightDelta: 0 },
  },
  REPAIR_DRONES: {
    REPAIR_DRONES_SMALL: { volumeDelta: 0, weightDelta: 50 },
    REPAIR_DRONES_LARGE: { volumeDelta: 0, weightDelta: 0 },
  },
  HIGH_G_SEATS: {
    HIGH_G_SEATS_BASIC: { volumeDelta: 0, weightDelta: 20 },
    HIGH_G_SEATS_ADVANCED: { volumeDelta: 0, weightDelta: 0 },
  },
};

// Applied when both ftlReactor AND ftlFuelTank are null (STL-only ship)
export const NO_FTL_DELTA = {
  volumeDelta: -129,
  weightDelta: -160.3,
} as const;

// Crew quarters volume thresholds (validated 52/52 ships)
export const CQ_THRESHOLDS: ReadonlyArray<{ maxVolume: number | null; ticker: string }> = [
  { maxVolume: 834, ticker: 'CQT' },
  { maxVolume: 2533, ticker: 'CQS' },
  { maxVolume: 3587, ticker: 'CQM' },
  { maxVolume: null, ticker: 'CQL' },
];

// Bridge determination by FTL reactor option (validated 52/52 ships)
export const BRIDGE_MAP: Record<string, string> = {
  FTL_REACTOR_STANDARD: 'BR1',
  FTL_REACTOR_QUICK_CHARGE: 'BR1',
  FTL_REACTOR_HIGH_POWER: 'BR2',
  FTL_REACTOR_HYPER_POWER: 'BR2',
};

// FTL emitter algorithm constants
export const EMITTER_CONSTANTS = {
  LFE_SPAN: 1000,
  MFE_SPAN: 500,
  SFE_SPAN: 250,
  BASE_D: 10,
  MULTIPLIER: 20,
} as const;
