import type { BOMEntry, CherryPickItem } from '../types';
import type { FIOExchangeEntry } from './fio';

interface ACTPackage {
  global: { name: string };
  groups: ACTGroup[];
  actions: ACTAction[];
}

interface ACTGroup {
  materials: Record<string, number>;
  name: string;
  type: 'Manual';
}

interface ACTAction {
  group: string;
  exchange: string;
  priceLimits: Record<string, never>;
  buyPartial: boolean;
  useCXInv: boolean;
  name: string;
  type: 'CX Buy';
}

/** Build a lookup of which materials have supply on which exchanges */
function buildSupplyLookup(exchangePrices: FIOExchangeEntry[]): Map<string, Set<string>> {
  const lookup = new Map<string, Set<string>>();
  for (const entry of exchangePrices) {
    if (entry.AskCount !== null && entry.AskCount > 0) {
      const exchanges = lookup.get(entry.MaterialTicker) ?? new Set();
      exchanges.add(entry.ExchangeCode);
      lookup.set(entry.MaterialTicker, exchanges);
    }
  }
  return lookup;
}

/** Generate ACT package for buying all BOM materials at a single exchange */
export function generateACTPackage(
  blueprintName: string,
  bom: BOMEntry[],
  exchange: string,
  exchangePrices: FIOExchangeEntry[],
): ACTPackage {
  const supplyLookup = buildSupplyLookup(exchangePrices);
  const groupName = `${blueprintName} Parts`;

  // Only include materials with supply at this exchange
  const materials: Record<string, number> = {};
  for (const entry of bom) {
    const exchanges = supplyLookup.get(entry.ticker);
    if (exchanges?.has(exchange)) {
      materials[entry.ticker] = entry.quantity;
    }
  }

  return {
    global: { name: `Ship ${blueprintName} ${exchange}` },
    groups: [{ materials, name: groupName, type: 'Manual' }],
    actions: [{
      group: groupName,
      exchange,
      priceLimits: {},
      buyPartial: false,
      useCXInv: true,
      name: `Buy ${blueprintName}`,
      type: 'CX Buy',
    }],
  };
}

/** Generate cherry-pick ACT package with materials sourced from cheapest exchanges */
export function generateCherryPickACT(
  blueprintName: string,
  cherryPickItems: CherryPickItem[],
): ACTPackage {
  // Group materials by their best exchange
  const byExchange = new Map<string, Record<string, number>>();
  for (const item of cherryPickItems) {
    const materials = byExchange.get(item.bestExchange) ?? {};
    materials[item.ticker] = item.quantity;
    byExchange.set(item.bestExchange, materials);
  }

  const groups: ACTGroup[] = [];
  const actions: ACTAction[] = [];

  for (const [exchange, materials] of byExchange) {
    const groupName = `${blueprintName} — ${exchange}`;
    groups.push({ materials, name: groupName, type: 'Manual' });
    actions.push({
      group: groupName,
      exchange,
      priceLimits: {},
      buyPartial: false,
      useCXInv: true,
      name: `Buy from ${exchange}`,
      type: 'CX Buy',
    });
  }

  return {
    global: { name: `Ship ${blueprintName} Cherry Pick` },
    groups,
    actions,
  };
}

/** Copy ACT package to clipboard, returns true on success */
export async function copyACTToClipboard(act: ACTPackage): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(JSON.stringify(act));
    return true;
  } catch {
    return false;
  }
}
