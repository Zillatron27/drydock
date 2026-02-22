import type { BOMEntry, ExchangeTotal, ExchangeLineItem, CherryPickResult, CherryPickItem } from '../types';
import type { FIOExchangeEntry } from './fio';

/** All 6 PrUn commodity exchanges */
export const EXCHANGES = ['AI1', 'CI1', 'CI2', 'IC1', 'NC1', 'NC2'] as const;

/** Build a ticker+exchange → ask price lookup from FIO data */
function buildPriceLookup(exchangePrices: FIOExchangeEntry[]): Map<string, number> {
  const lookup = new Map<string, number>();
  for (const entry of exchangePrices) {
    if (entry.Ask !== null && entry.Ask > 0) {
      lookup.set(`${entry.MaterialTicker}:${entry.ExchangeCode}`, entry.Ask);
    }
  }
  return lookup;
}

/** Price a BOM across each exchange individually */
export function priceBlueprint(bom: BOMEntry[], exchangePrices: FIOExchangeEntry[]): ExchangeTotal[] {
  const lookup = buildPriceLookup(exchangePrices);

  return EXCHANGES.map(exchange => {
    let total = 0;
    let available = 0;
    let missing = 0;
    const breakdown: ExchangeLineItem[] = [];

    for (const entry of bom) {
      const unitPrice = lookup.get(`${entry.ticker}:${exchange}`) ?? null;
      const lineTotal = unitPrice !== null ? unitPrice * entry.quantity : null;

      if (unitPrice !== null) {
        total += lineTotal!;
        available++;
      } else {
        missing++;
      }

      breakdown.push({ ticker: entry.ticker, quantity: entry.quantity, unitPrice, lineTotal });
    }

    return { exchange, total, available, missing, breakdown };
  });
}

/** Find the cheapest source for each material across all exchanges */
export function cherryPickPricing(bom: BOMEntry[], exchangePrices: FIOExchangeEntry[]): CherryPickResult {
  const lookup = buildPriceLookup(exchangePrices);
  let total = 0;
  const items: CherryPickItem[] = [];

  for (const entry of bom) {
    let bestPrice = Infinity;
    let bestExchange = '';

    for (const exchange of EXCHANGES) {
      const price = lookup.get(`${entry.ticker}:${exchange}`);
      if (price !== undefined && price < bestPrice) {
        bestPrice = price;
        bestExchange = exchange;
      }
    }

    if (bestExchange !== '') {
      const lineTotal = bestPrice * entry.quantity;
      total += lineTotal;
      items.push({
        ticker: entry.ticker,
        quantity: entry.quantity,
        bestExchange,
        unitPrice: bestPrice,
        lineTotal,
      });
    }
  }

  return { total, items };
}
