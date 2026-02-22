/**
 * FIO REST API client for Prosperous Universe data.
 * Endpoints: rest.fnar.net
 *
 * CORS note: FIO allows cross-origin requests from browsers.
 * If this changes, we'll need a Cloudflare Worker proxy.
 */

const FIO_BASE = 'https://rest.fnar.net';

// Cache TTLs
const PRICE_TTL_MS = 5 * 60 * 1000;     // 5 minutes for exchange prices
const MATERIAL_TTL_MS = 60 * 60 * 1000;  // 1 hour for material catalog

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

let priceCache: CacheEntry<FIOExchangeEntry[]> | null = null;
let materialCache: CacheEntry<FIOMaterial[]> | null = null;

/** Raw exchange price entry from FIO /exchange/all */
export interface FIOExchangeEntry {
  MaterialTicker: string;
  ExchangeCode: string;
  MMBuy: number | null;
  MMSell: number | null;
  Ask: number | null;
  AskCount: number | null;
  Bid: number | null;
  BidCount: number | null;
  Supply: number | null;
  Demand: number | null;
  PriceAverage: number | null;
}

/** Raw material entry from FIO /material/allmaterials */
export interface FIOMaterial {
  MaterialId: string;
  CategoryName: string;
  CategoryId: string;
  Name: string;
  Ticker: string;
  Weight: number;
  Volume: number;
}

function isFresh<T>(entry: CacheEntry<T> | null, ttl: number): boolean {
  return entry !== null && (Date.now() - entry.fetchedAt) < ttl;
}

/** Fetch all exchange prices. Returns cached data if fresh. */
export async function fetchAllExchangePrices(): Promise<FIOExchangeEntry[]> {
  if (priceCache && isFresh(priceCache, PRICE_TTL_MS)) {
    return priceCache.data;
  }

  const response = await fetch(`${FIO_BASE}/exchange/all`);
  if (!response.ok) {
    // Return stale data if available
    if (priceCache) return priceCache.data;
    throw new Error(`FIO exchange API returned ${response.status}`);
  }

  const data: FIOExchangeEntry[] = await response.json();
  priceCache = { data, fetchedAt: Date.now() };
  return data;
}

/** Fetch all materials. Returns cached data if fresh. */
export async function fetchMaterials(): Promise<FIOMaterial[]> {
  if (materialCache && isFresh(materialCache, MATERIAL_TTL_MS)) {
    return materialCache.data;
  }

  const response = await fetch(`${FIO_BASE}/material/allmaterials`);
  if (!response.ok) {
    if (materialCache) return materialCache.data;
    throw new Error(`FIO material API returned ${response.status}`);
  }

  const data: FIOMaterial[] = await response.json();
  materialCache = { data, fetchedAt: Date.now() };
  return data;
}

/** Get the timestamp of the last successful price fetch, or null if never fetched */
export function getPriceFetchedAt(): number | null {
  return priceCache?.fetchedAt ?? null;
}

/** Check if cached prices are stale (past TTL but still being served) */
export function isPriceStale(): boolean {
  return priceCache !== null && !isFresh(priceCache, PRICE_TTL_MS);
}
