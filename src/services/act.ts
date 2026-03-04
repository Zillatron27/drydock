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
  allowUnfilled: boolean;
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

/** Sanitize name for ACT — non-ASCII and special characters break rPrun's command parser */
function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9 ._-]/g, '-');
}

/** Generate ACT package for buying all BOM materials at a single exchange */
export function generateACTPackage(
  blueprintName: string,
  bom: BOMEntry[],
  exchange: string,
  exchangePrices: FIOExchangeEntry[],
): ACTPackage {
  const supplyLookup = buildSupplyLookup(exchangePrices);
  const safeName = sanitizeName(blueprintName);
  const groupName = `${safeName} Parts`;

  // Only include materials with supply at this exchange
  const materials: Record<string, number> = {};
  for (const entry of bom) {
    const exchanges = supplyLookup.get(entry.ticker);
    if (exchanges?.has(exchange)) {
      materials[entry.ticker] = entry.quantity;
    }
  }

  return {
    global: { name: `Ship ${safeName} ${exchange}` },
    groups: [{ materials, name: groupName, type: 'Manual' }],
    actions: [{
      group: groupName,
      exchange,
      priceLimits: {},
      buyPartial: false,
      allowUnfilled: false,
      useCXInv: true,
      name: `Buy ${safeName}`,
      type: 'CX Buy',
    }],
  };
}

/** Generate cherry-pick ACT package with materials sourced from cheapest exchanges */
export function generateCherryPickACT(
  blueprintName: string,
  cherryPickItems: CherryPickItem[],
): ACTPackage {
  const safeName = sanitizeName(blueprintName);
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
    const groupName = `${safeName} - ${exchange}`;
    groups.push({ materials, name: groupName, type: 'Manual' });
    actions.push({
      group: groupName,
      exchange,
      priceLimits: {},
      buyPartial: false,
      allowUnfilled: false,
      useCXInv: true,
      name: `Buy from ${exchange}`,
      type: 'CX Buy',
    });
  }

  return {
    global: { name: `Ship ${safeName} Cherry Pick` },
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
