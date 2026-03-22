import { describe, it, expect } from 'vitest';
import { cherryPickPricing } from '../pricing';
import { depthCherryPickPricing } from '../depth_pricing';
import type { BOMEntry, ExchangeFilter } from '../../types';
import type { FIOExchangeEntry } from '../fio';

function makeFIOEntry(
  ticker: string,
  exchange: string,
  ask: number,
  askCount: number = 100,
): FIOExchangeEntry {
  return {
    MaterialTicker: ticker,
    ExchangeCode: exchange,
    MMBuy: null,
    MMSell: null,
    Ask: ask,
    AskCount: askCount,
    Bid: null,
    BidCount: null,
    Supply: askCount,
    Demand: null,
    PriceAverage: null,
    orderBook: {
      asks: [{ price: ask, quantity: askCount }],
      bids: [],
      totalAskSupply: askCount,
      totalBidDemand: 0,
    },
  };
}

const bom: BOMEntry[] = [
  { ticker: 'BSE', name: 'Basic Structural Elements', quantity: 10, category: 'ship_parts' },
  { ticker: 'TRU', name: 'Truss', quantity: 5, category: 'ship_parts' },
];

const prices: FIOExchangeEntry[] = [
  makeFIOEntry('BSE', 'AI1', 100),
  makeFIOEntry('BSE', 'CI1', 120),
  makeFIOEntry('BSE', 'IC1', 90),
  makeFIOEntry('BSE', 'NC1', 110),
  makeFIOEntry('TRU', 'AI1', 200),
  makeFIOEntry('TRU', 'CI1', 180),
  makeFIOEntry('TRU', 'IC1', 210),
  makeFIOEntry('TRU', 'NC1', 190),
];

const allEnabled: ExchangeFilter = { AI1: true, CI1: true, IC1: true, NC1: true };

describe('cherryPickPricing with exchange filter', () => {
  it('all enabled matches unfiltered behaviour', () => {
    const filtered = cherryPickPricing(bom, prices, allEnabled);
    const unfiltered = cherryPickPricing(bom, prices);
    expect(filtered.total).toBe(unfiltered.total);
    expect(filtered.items).toEqual(unfiltered.items);
  });

  it('excludes disabled exchange from sourcing', () => {
    // IC1 has cheapest BSE (90). Disable it — should fall back to AI1 (100)
    const filter: ExchangeFilter = { AI1: true, CI1: true, IC1: false, NC1: true };
    const result = cherryPickPricing(bom, prices, filter);
    const bseItem = result.items.find(i => i.ticker === 'BSE');
    expect(bseItem?.bestExchange).toBe('AI1');
    expect(bseItem?.unitPrice).toBe(100);
  });

  it('material only on disabled exchange becomes unavailable', () => {
    const soloPrice: FIOExchangeEntry[] = [
      makeFIOEntry('BSE', 'IC1', 90),
      makeFIOEntry('TRU', 'CI1', 180),
    ];
    const filter: ExchangeFilter = { AI1: true, CI1: true, IC1: false, NC1: true };
    const result = cherryPickPricing(bom, soloPrice, filter);
    // BSE only available on IC1 which is disabled
    expect(result.items.find(i => i.ticker === 'BSE')).toBeUndefined();
    // TRU still available on CI1
    expect(result.items.find(i => i.ticker === 'TRU')).toBeDefined();
  });

  it('undefined filter means all exchanges enabled', () => {
    const result = cherryPickPricing(bom, prices, undefined);
    const unfiltered = cherryPickPricing(bom, prices);
    expect(result).toEqual(unfiltered);
  });
});

describe('depthCherryPickPricing with exchange filter', () => {
  it('all enabled matches unfiltered behaviour', () => {
    const filtered = depthCherryPickPricing(bom, prices, allEnabled);
    const unfiltered = depthCherryPickPricing(bom, prices);
    expect(filtered.total).toBe(unfiltered.total);
    expect(filtered.items).toEqual(unfiltered.items);
  });

  it('excludes disabled exchange from sourcing', () => {
    const filter: ExchangeFilter = { AI1: true, CI1: true, IC1: false, NC1: true };
    const result = depthCherryPickPricing(bom, prices, filter);
    const bseItem = result.items.find(i => i.ticker === 'BSE');
    // IC1 (90) disabled, next cheapest is AI1 (100)
    expect(bseItem?.bestExchange).toBe('AI1');
  });

  it('material only on disabled exchange becomes unavailable', () => {
    const soloPrice: FIOExchangeEntry[] = [
      makeFIOEntry('BSE', 'IC1', 90),
      makeFIOEntry('TRU', 'CI1', 180),
    ];
    const filter: ExchangeFilter = { AI1: true, CI1: true, IC1: false, NC1: true };
    const result = depthCherryPickPricing(bom, soloPrice, filter);
    expect(result.items.find(i => i.ticker === 'BSE')).toBeUndefined();
    expect(result.items.find(i => i.ticker === 'TRU')).toBeDefined();
  });
});
