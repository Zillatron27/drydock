import { describe, it, expect } from 'vitest';
import { fillFromOrderBook, depthPriceBlueprint, depthCherryPickPricing } from '../depth_pricing';
import type { BOMEntry } from '../../types';
import type { FIOExchangeEntry } from '../fio';

function makeFIOEntry(
  ticker: string,
  exchange: string,
  asks: Array<{ price: number; quantity: number }>,
): FIOExchangeEntry {
  const bestAsk = asks.length > 0 ? asks.reduce((min, a) => a.price < min ? a.price : min, Infinity) : null;
  const totalSupply = asks.reduce((sum, a) => sum + a.quantity, 0);
  return {
    MaterialTicker: ticker,
    ExchangeCode: exchange,
    MMBuy: null,
    MMSell: null,
    Ask: bestAsk,
    AskCount: asks.length > 0 ? asks.filter(a => a.price === bestAsk).reduce((s, a) => s + a.quantity, 0) : null,
    Bid: null,
    BidCount: null,
    Supply: totalSupply,
    Demand: null,
    PriceAverage: null,
    orderBook: {
      asks: [...asks].sort((a, b) => a.price - b.price),
      bids: [],
      totalAskSupply: totalSupply,
      totalBidDemand: 0,
    },
  };
}

describe('fillFromOrderBook', () => {
  it('fills exactly from a single tier', () => {
    const asks = [{ price: 100, quantity: 50 }];
    const result = fillFromOrderBook(asks, 50);
    expect(result.filledQuantity).toBe(50);
    expect(result.totalCost).toBe(5000);
    expect(result.blendedUnitCost).toBe(100);
    expect(result.tiers).toEqual([{ price: 100, quantity: 50, cost: 5000 }]);
  });

  it('partially fills from a single tier', () => {
    const asks = [{ price: 100, quantity: 30 }];
    const result = fillFromOrderBook(asks, 50);
    expect(result.filledQuantity).toBe(30);
    expect(result.totalCost).toBe(3000);
    expect(result.blendedUnitCost).toBe(100);
    expect(result.tiers).toEqual([{ price: 100, quantity: 30, cost: 3000 }]);
  });

  it('walks multiple tiers to fill exactly', () => {
    const asks = [
      { price: 100, quantity: 30 },
      { price: 120, quantity: 20 },
    ];
    const result = fillFromOrderBook(asks, 50);
    expect(result.filledQuantity).toBe(50);
    expect(result.totalCost).toBe(30 * 100 + 20 * 120);  // 5400
    expect(result.blendedUnitCost).toBe(5400 / 50);       // 108
    expect(result.tiers).toHaveLength(2);
  });

  it('walks multiple tiers with partial fill mid-tier', () => {
    const asks = [
      { price: 3990, quantity: 50 },
      { price: 4100, quantity: 48 },
      { price: 4500, quantity: 200 },
    ];
    const result = fillFromOrderBook(asks, 109);
    expect(result.filledQuantity).toBe(109);
    // 50*3990 + 48*4100 + 11*4500 = 199500 + 196800 + 49500 = 445800
    expect(result.totalCost).toBe(445800);
    expect(result.blendedUnitCost).toBeCloseTo(445800 / 109, 2);
    expect(result.tiers).toEqual([
      { price: 3990, quantity: 50, cost: 199500 },
      { price: 4100, quantity: 48, cost: 196800 },
      { price: 4500, quantity: 11, cost: 49500 },
    ]);
  });

  it('returns zero for empty order book', () => {
    const result = fillFromOrderBook([], 50);
    expect(result.filledQuantity).toBe(0);
    expect(result.totalCost).toBe(0);
    expect(result.blendedUnitCost).toBeNull();
    expect(result.tiers).toEqual([]);
  });

  it('returns zero for zero quantity needed', () => {
    const asks = [{ price: 100, quantity: 50 }];
    const result = fillFromOrderBook(asks, 0);
    expect(result.filledQuantity).toBe(0);
    expect(result.totalCost).toBe(0);
    expect(result.blendedUnitCost).toBeNull();
    expect(result.tiers).toEqual([]);
  });

  it('fills a single unit from multi-tier book', () => {
    const asks = [
      { price: 100, quantity: 50 },
      { price: 200, quantity: 50 },
    ];
    const result = fillFromOrderBook(asks, 1);
    expect(result.filledQuantity).toBe(1);
    expect(result.totalCost).toBe(100);
    expect(result.blendedUnitCost).toBe(100);
    expect(result.tiers).toEqual([{ price: 100, quantity: 1, cost: 100 }]);
  });
});

describe('depthPriceBlueprint', () => {
  const bom: BOMEntry[] = [
    { ticker: 'LHP', name: 'Lightweight Hull Plate', quantity: 109, category: 'metals' },
    { ticker: 'TRU', name: 'Truss', quantity: 20, category: 'construction_materials' },
  ];

  it('prices a full BOM at one exchange', () => {
    const prices: FIOExchangeEntry[] = [
      makeFIOEntry('LHP', 'CI1', [
        { price: 3990, quantity: 50 },
        { price: 4100, quantity: 48 },
        { price: 4500, quantity: 200 },
      ]),
      makeFIOEntry('TRU', 'CI1', [
        { price: 500, quantity: 100 },
      ]),
    ];

    const result = depthPriceBlueprint(bom, prices, 'CI1');
    expect(result.exchange).toBe('CI1');
    expect(result.available).toBe(2);
    expect(result.missing).toBe(0);
    // LHP: 445800, TRU: 20*500 = 10000
    expect(result.total).toBe(445800 + 10000);
    expect(result.breakdown).toHaveLength(2);
  });

  it('handles materials with zero availability', () => {
    const prices: FIOExchangeEntry[] = [
      makeFIOEntry('LHP', 'CI1', []),
      makeFIOEntry('TRU', 'CI1', [{ price: 500, quantity: 100 }]),
    ];

    const result = depthPriceBlueprint(bom, prices, 'CI1');
    expect(result.available).toBe(1);
    expect(result.missing).toBe(1);
    expect(result.total).toBe(10000);

    const lhp = result.breakdown.find(b => b.ticker === 'LHP');
    expect(lhp?.unitPrice).toBeNull();
    expect(lhp?.lineTotal).toBeNull();
  });

  it('handles missing exchange data', () => {
    const result = depthPriceBlueprint(bom, [], 'CI1');
    expect(result.available).toBe(0);
    expect(result.missing).toBe(2);
    expect(result.total).toBe(0);
  });
});

describe('depthCherryPickPricing', () => {
  const bom: BOMEntry[] = [
    { ticker: 'LHP', name: 'Lightweight Hull Plate', quantity: 10, category: 'metals' },
    { ticker: 'TRU', name: 'Truss', quantity: 5, category: 'construction_materials' },
  ];

  it('picks cheapest blended cost per material across exchanges', () => {
    const prices: FIOExchangeEntry[] = [
      // AI1: LHP cheap, TRU expensive
      makeFIOEntry('LHP', 'AI1', [{ price: 100, quantity: 50 }]),
      makeFIOEntry('TRU', 'AI1', [{ price: 800, quantity: 50 }]),
      // CI1: LHP expensive, TRU cheap
      makeFIOEntry('LHP', 'CI1', [{ price: 200, quantity: 50 }]),
      makeFIOEntry('TRU', 'CI1', [{ price: 400, quantity: 50 }]),
    ];

    const result = depthCherryPickPricing(bom, prices);
    expect(result.items).toHaveLength(2);

    const lhp = result.items.find(i => i.ticker === 'LHP')!;
    expect(lhp.bestExchange).toBe('AI1');
    expect(lhp.unitPrice).toBe(100);

    const tru = result.items.find(i => i.ticker === 'TRU')!;
    expect(tru.bestExchange).toBe('CI1');
    expect(tru.unitPrice).toBe(400);

    expect(result.total).toBe(10 * 100 + 5 * 400);
  });

  it('handles material available on one exchange only', () => {
    const prices: FIOExchangeEntry[] = [
      makeFIOEntry('LHP', 'AI1', [{ price: 100, quantity: 50 }]),
      makeFIOEntry('TRU', 'CI1', [{ price: 400, quantity: 50 }]),
    ];

    const result = depthCherryPickPricing(bom, prices);
    expect(result.items).toHaveLength(2);
    expect(result.items.find(i => i.ticker === 'LHP')!.bestExchange).toBe('AI1');
    expect(result.items.find(i => i.ticker === 'TRU')!.bestExchange).toBe('CI1');
  });

  it('prefers deeper liquidity with lower blended cost over better best-ask', () => {
    // Exchange A: best ask 90 but only 2 units, rest at 200 → blended for 10 = (2*90 + 8*200)/10 = 178
    // Exchange B: all at 150 → blended for 10 = 150
    const prices: FIOExchangeEntry[] = [
      makeFIOEntry('LHP', 'AI1', [
        { price: 90, quantity: 2 },
        { price: 200, quantity: 20 },
      ]),
      makeFIOEntry('LHP', 'CI1', [
        { price: 150, quantity: 50 },
      ]),
      makeFIOEntry('TRU', 'AI1', [{ price: 400, quantity: 50 }]),
      makeFIOEntry('TRU', 'CI1', [{ price: 400, quantity: 50 }]),
    ];

    const result = depthCherryPickPricing(bom, prices);
    const lhp = result.items.find(i => i.ticker === 'LHP')!;
    // CI1 at 150 blended is cheaper than AI1 at 178 blended
    expect(lhp.bestExchange).toBe('CI1');
    expect(lhp.unitPrice).toBe(150);
  });
});
