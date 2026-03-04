import type { BOMEntry, ExchangeTotal, ExchangeLineItem, CherryPickResult, CherryPickItem } from '../types';
import type { FIOExchangeEntry } from './fio';
import { EXCHANGES } from './pricing';

export interface FillResult {
  totalCost: number;
  filledQuantity: number;
  blendedUnitCost: number | null;
  tiers: Array<{ price: number; quantity: number; cost: number }>;
}

/** Walk sorted ask tiers to fill a quantity, cheapest first. */
export function fillFromOrderBook(
  asks: Array<{ price: number; quantity: number }>,
  quantityNeeded: number,
): FillResult {
  if (quantityNeeded <= 0) {
    return { totalCost: 0, filledQuantity: 0, blendedUnitCost: null, tiers: [] };
  }

  let remaining = quantityNeeded;
  let totalCost = 0;
  const tiers: Array<{ price: number; quantity: number; cost: number }> = [];

  for (const tier of asks) {
    if (remaining <= 0) break;
    const take = Math.min(tier.quantity, remaining);
    const cost = take * tier.price;
    totalCost += cost;
    remaining -= take;
    tiers.push({ price: tier.price, quantity: take, cost });
  }

  const filledQuantity = quantityNeeded - remaining;
  const blendedUnitCost = filledQuantity > 0 ? totalCost / filledQuantity : null;

  return { totalCost, filledQuantity, blendedUnitCost, tiers };
}

/** Price a full BOM using order book depth at one exchange. */
export function depthPriceBlueprint(
  bom: BOMEntry[],
  exchangePrices: FIOExchangeEntry[],
  exchange: string,
): ExchangeTotal {
  // Build ticker → FIOExchangeEntry lookup for this exchange
  const lookup = new Map<string, FIOExchangeEntry>();
  for (const entry of exchangePrices) {
    if (entry.ExchangeCode === exchange) {
      lookup.set(entry.MaterialTicker, entry);
    }
  }

  let total = 0;
  let available = 0;
  let missing = 0;
  const breakdown: ExchangeLineItem[] = [];

  for (const entry of bom) {
    const data = lookup.get(entry.ticker);
    if (!data || data.orderBook.asks.length === 0) {
      missing++;
      breakdown.push({ ticker: entry.ticker, quantity: entry.quantity, unitPrice: null, lineTotal: null });
      continue;
    }

    const fill = fillFromOrderBook(data.orderBook.asks, entry.quantity);
    if (fill.filledQuantity > 0) {
      available++;
      total += fill.totalCost;
      breakdown.push({
        ticker: entry.ticker,
        quantity: entry.quantity,
        unitPrice: fill.blendedUnitCost,
        lineTotal: fill.totalCost,
      });
    } else {
      missing++;
      breakdown.push({ ticker: entry.ticker, quantity: entry.quantity, unitPrice: null, lineTotal: null });
    }
  }

  return { exchange, total, available, missing, breakdown };
}

/** Cherry-pick using blended costs across exchanges. */
export function depthCherryPickPricing(
  bom: BOMEntry[],
  exchangePrices: FIOExchangeEntry[],
): CherryPickResult {
  // Build ticker+exchange → FIOExchangeEntry lookup
  const lookup = new Map<string, FIOExchangeEntry>();
  for (const entry of exchangePrices) {
    lookup.set(`${entry.MaterialTicker}:${entry.ExchangeCode}`, entry);
  }

  let total = 0;
  const items: CherryPickItem[] = [];

  for (const entry of bom) {
    let bestCost: number | null = null;
    let bestExchange = '';
    let bestUnitPrice = 0;
    let bestLineTotal = 0;

    for (const exchange of EXCHANGES) {
      const data = lookup.get(`${entry.ticker}:${exchange}`);
      if (!data || data.orderBook.asks.length === 0) continue;

      const fill = fillFromOrderBook(data.orderBook.asks, entry.quantity);
      if (fill.blendedUnitCost === null) continue;

      if (bestCost === null || fill.blendedUnitCost < bestCost) {
        bestCost = fill.blendedUnitCost;
        bestExchange = exchange;
        bestUnitPrice = fill.blendedUnitCost;
        bestLineTotal = fill.totalCost;
      }
    }

    if (bestExchange !== '') {
      total += bestLineTotal;
      items.push({
        ticker: entry.ticker,
        quantity: entry.quantity,
        bestExchange,
        unitPrice: bestUnitPrice,
        lineTotal: bestLineTotal,
      });
    }
  }

  return { total, items };
}
