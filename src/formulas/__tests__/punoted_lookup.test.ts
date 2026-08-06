import { describe, it, expect } from 'vitest';
import { calculateVolume, calculateSSC, getBridge, getCrewQuarters } from '../index';
import { moduleStats, BRIDGE_MAP } from '../../data/moduleStats';
import type { ModuleSelections } from '../../types';
import fixture from './fixtures/punoted_testdata.json';

// Fixture source: PUNoted (MIT license), https://github.com/xflasar/PUNoted
// src/cosm/shipproduction/data/testdata.json @ 9f37825
// 561 real blueprint combinations with expected volume, bridge, crew
// quarters, SSC count, and operating empty mass.
//
// Known model differences, accounted for below:
// - PUNoted's volume model rounds differently on a minority of combos
//   (GEN engine / LSL tank ships) — ours is validated against in-game BLU
//   displays, so we assert |Δvolume| <= 2 and use OUR volume for CQ.
// - 32 cases list bridge "BRP" when a basic radiation shield is equipped.
//   In PUNoted's own data those ships have identical volume and build time
//   to their BR1/BR2 twins, and the mass delta equals the shield-plate
//   weight difference exactly — the physical bridge is unchanged. BRP is
//   also the basic radiation shield plate's ticker. We therefore expect
//   the reactor-determined bridge for those cases.

interface ExpectedStats {
  bridge: string;
  buildTime: number;
  crewQuarters: string;
  operatingEmptyMass: number;
  sscCount: number;
  volume: number;
}

const cases = Object.entries(fixture.combinationsLookup as Record<string, ExpectedStats>);

// option name (e.g. "CARGO_BAY_SMALL") -> ticker, from wire-captured stats
const tickerByOption = new Map<string, string>(
  Object.values(moduleStats).map((s) => [s.option, s.ticker]),
);

// slotType -> ModuleSelections key for every selectable slot
const selectionKeyBySlot: Record<string, keyof ModuleSelections> = {
  STL_ENGINE: 'stlEngine',
  STL_FUEL_TANK: 'stlFuelTank',
  FTL_REACTOR: 'ftlReactor',
  FTL_FUEL_TANK: 'ftlFuelTank',
  CARGO_BAY: 'cargoBay',
  HULL_TYPE: 'hullPlates',
  HEAT_SHIELD: 'heatShielding',
  WHIPPLE_SHIELD: 'whippleShielding',
  GRAVITY_SHIELD: 'stabilitySystem',
  RADIATION_SHIELD: 'radiationShielding',
  REPAIR_DRONES: 'selfRepairDrones',
  HIGH_G_SEATS: 'highGSeats',
};

/** Build ModuleSelections from a fixture key ("OPT_A|OPT_B|..."), ignoring
 * derived components (SSC, FFC, emitters) that PUNoted includes in the key. */
function selectionsFromKey(key: string): ModuleSelections {
  const selections: ModuleSelections = {
    stlEngine: '',
    stlFuelTank: '',
    ftlReactor: null,
    ftlFuelTank: null,
    cargoBay: '',
    hullPlates: '',
    heatShielding: null,
    whippleShielding: null,
    stabilitySystem: null,
    radiationShielding: null,
    selfRepairDrones: null,
    highGSeats: null,
  };

  for (const option of key.split('|')) {
    const ticker = tickerByOption.get(option);
    if (!ticker) continue;
    const slotType = moduleStats[ticker]?.slotType;
    const selectionKey = slotType ? selectionKeyBySlot[slotType] : undefined;
    if (selectionKey) selections[selectionKey] = ticker;
  }

  return selections;
}

/** Expected bridge with the BRP display quirk resolved to the real component. */
function expectedBridge(exp: ExpectedStats, selections: ModuleSelections): string {
  if (exp.bridge !== 'BRP') return exp.bridge;
  const reactor = selections.ftlReactor ? moduleStats[selections.ftlReactor] : undefined;
  return reactor ? (BRIDGE_MAP[reactor.option] ?? 'BRS') : 'BRS';
}

describe('PUNoted 561-case blueprint lookup', () => {
  it('covers all 561 combinations', () => {
    expect(cases.length).toBe(561);
  });

  it.each(cases)('%s', (key, exp) => {
    const selections = selectionsFromKey(key);

    // Required slots must all have resolved to a ticker
    expect(selections.stlEngine).not.toBe('');
    expect(selections.stlFuelTank).not.toBe('');
    expect(selections.cargoBay).not.toBe('');
    expect(selections.hullPlates).not.toBe('');

    const volume = calculateVolume(selections);
    expect(Math.abs(volume - exp.volume)).toBeLessThanOrEqual(2);

    expect(getCrewQuarters(volume)).toBe(exp.crewQuarters);
    expect(getBridge(selections)).toBe(expectedBridge(exp, selections));
    expect(calculateSSC(exp.volume)).toBe(exp.sscCount);
  });
});
