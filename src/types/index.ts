/** A selectable slot in the blueprint editor (e.g. "STL Engine", "Cargo Bay") */
export interface ModuleSlot {
  name: string;
  options: ModuleOption[];
  required: boolean;
}

/** One option within a slot (e.g. "Standard" engine → ENG, 239m³) */
export interface ModuleOption {
  name: string;
  ticker: string;
  volume: number;
}

/** User's module selections for a complete blueprint */
export interface ModuleSelections {
  stlEngine: string;       // ticker
  stlFuelTank: string;     // ticker
  ftlReactor: string | null;
  ftlFuelTank: string | null;
  cargoBay: string;        // ticker
  hullPlates: string;      // ticker
  heatShielding: string | null;
  whippleShielding: string | null;
  stabilitySystem: string | null;
  radiationShielding: string | null;
  selfRepairDrones: string | null;
  highGSeats: string | null;
}

/** A saved ship blueprint */
export interface Blueprint {
  id: string;
  name: string;
  moduleSelections: ModuleSelections;
  bom: BOMEntry[];
}

/** Single line item in the Bill of Materials */
export interface BOMEntry {
  ticker: string;
  name: string;
  quantity: number;
  category: MaterialCategory;
}

/** Material categories matching APEX_ design system color tokens */
export type MaterialCategory =
  | 'ship_engines'
  | 'ship_kits'
  | 'ship_parts'
  | 'ship_shields'
  | 'fuels'
  | 'electronic_systems'
  | 'construction_materials'
  | 'metals'
  | 'alloys'
  | 'elements'
  | 'plastics'
  | 'minerals'
  | 'chemicals';

/** Price data from a single commodity exchange */
export interface CXPrice {
  exchange: string;
  ticker: string;
  ask: number | null;
  bid: number | null;
  supply: number | null;
  demand: number | null;
}

/** Pricing result for a full BOM on one exchange */
export interface ExchangeTotal {
  exchange: string;
  total: number;
  available: number;   // count of BOM materials with ask prices
  missing: number;     // count without
  breakdown: ExchangeLineItem[];
}

/** Per-material pricing on one exchange */
export interface ExchangeLineItem {
  ticker: string;
  quantity: number;
  unitPrice: number | null;
  lineTotal: number | null;
}

/** Cherry-pick result: best price per material across all exchanges */
export interface CherryPickResult {
  total: number;
  items: CherryPickItem[];
}

export interface CherryPickItem {
  ticker: string;
  quantity: number;
  bestExchange: string;
  unitPrice: number;
  lineTotal: number;
}

/** FTL emitter counts */
export interface EmitterCounts {
  small: number;   // SFE
  medium: number;  // MFE
  large: number;   // LFE
}

/** Single blueprint export JSON */
export interface BlueprintExport {
  type: 'drydock-blueprint';
  version: string;
  exported_at: string;
  name: string;
  modules: ModuleSelections;
}

/** Multi-blueprint export JSON */
export interface CollectionExport {
  type: 'drydock-collection';
  version: string;
  exported_at: string;
  blueprints: Array<{ name: string; modules: ModuleSelections }>;
}

/** Result of validating an import — entries contain validated data without IDs or BOMs */
export type ImportResult =
  | { success: true; entries: Array<{ name: string; modules: ModuleSelections }> }
  | { success: false; error: string };
