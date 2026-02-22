import { useState, useEffect, useMemo, useCallback } from 'react';
import type { BOMEntry, MaterialCategory } from '../types';
import { fetchAllExchangePrices, getPriceFetchedAt, isPriceStale } from '../services/fio';
import type { FIOExchangeEntry } from '../services/fio';
import { priceBlueprint, cherryPickPricing, EXCHANGES } from '../services/pricing';
import { generateACTPackage, generateCherryPickACT, copyACTToClipboard } from '../services/act';
import styles from './ShipyardDetail.module.css';

interface ShipyardDetailProps {
  blueprintName: string;
  bom: BOMEntry[];
  onLoadingChange?: (loading: boolean) => void;
}

// Category display order and labels
const CATEGORY_ORDER: MaterialCategory[] = [
  'ship_engines', 'fuels', 'ship_kits', 'ship_parts', 'ship_shields',
  'electronic_systems', 'construction_materials', 'metals', 'alloys',
  'elements', 'plastics', 'minerals', 'chemicals',
];

const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  ship_engines: 'Ship Engines', fuels: 'Fuels', ship_kits: 'Ship Kits',
  ship_parts: 'Ship Parts', ship_shields: 'Ship Shields',
  electronic_systems: 'Electronic Systems', construction_materials: 'Construction Materials',
  metals: 'Metals', alloys: 'Alloys', elements: 'Elements',
  plastics: 'Plastics', minerals: 'Minerals', chemicals: 'Chemicals',
};

type BuildStatus = 'full' | 'partial' | 'incomplete';

interface ExchangeAnalysis {
  exchange: string;
  status: BuildStatus;
  buildable: number;  // how many complete ships can be built from supply
  linesFull: number;
  linesPartial: number;
  linesUnavailable: number;
}

/** Analyze supply availability for a BOM at one exchange */
function analyzeExchange(
  bom: BOMEntry[],
  exchange: string,
  priceLookup: Map<string, FIOExchangeEntry>,
): ExchangeAnalysis {
  let minBuildable = Infinity;
  let linesFull = 0;
  let linesPartial = 0;
  let linesUnavailable = 0;

  for (const entry of bom) {
    const data = priceLookup.get(`${entry.ticker}:${exchange}`);
    const supply = data?.AskCount ?? 0;

    if (supply >= entry.quantity) {
      linesFull++;
    } else if (supply > 0) {
      linesPartial++;
    } else {
      linesUnavailable++;
    }

    const buildableForMat = entry.quantity > 0 ? Math.floor(supply / entry.quantity) : 0;
    minBuildable = Math.min(minBuildable, buildableForMat);
  }

  const buildable = bom.length > 0 ? minBuildable : 0;
  let status: BuildStatus;
  if (linesUnavailable === 0 && linesPartial === 0) {
    status = 'full';
  } else if (linesUnavailable === bom.length) {
    status = 'incomplete';
  } else {
    status = 'partial';
  }

  return { exchange, status, buildable, linesFull, linesPartial, linesUnavailable };
}

/** Analyze cherry-pick supply: can we build from the combined best sources? */
function analyzeCherryPick(
  bom: BOMEntry[],
  priceLookup: Map<string, FIOExchangeEntry>,
  bestPrices: Map<string, { exchange: string; price: number }>,
): { status: BuildStatus; buildable: number } {
  let minBuildable = Infinity;
  let allFull = true;
  let anyAvail = false;

  for (const entry of bom) {
    const best = bestPrices.get(entry.ticker);
    if (!best) {
      allFull = false;
      minBuildable = 0;
      continue;
    }

    anyAvail = true;
    const data = priceLookup.get(`${entry.ticker}:${best.exchange}`);
    const supply = data?.AskCount ?? 0;

    if (supply < entry.quantity) allFull = false;
    const buildableForMat = entry.quantity > 0 ? Math.floor(supply / entry.quantity) : 0;
    minBuildable = Math.min(minBuildable, buildableForMat);
  }

  const buildable = bom.length > 0 && isFinite(minBuildable) ? minBuildable : 0;
  const status: BuildStatus = allFull ? 'full' : anyAvail ? 'partial' : 'incomplete';
  return { status, buildable };
}

const STATUS_LABELS: Record<BuildStatus, string> = {
  full: 'Full', partial: 'Partial', incomplete: 'Incomplete',
};

/** Build a verdict string like "12/15 full, 3 partial" for the cherry-pick panel */
function buildCherryVerdict(
  bom: BOMEntry[],
  priceLookup: Map<string, FIOExchangeEntry>,
  bestPrices: Map<string, { exchange: string; price: number }>,
): string {
  let full = 0;
  let partial = 0;
  let unavailable = 0;

  for (const entry of bom) {
    const best = bestPrices.get(entry.ticker);
    if (!best) {
      unavailable++;
      continue;
    }
    const data = priceLookup.get(`${entry.ticker}:${best.exchange}`);
    const supply = data?.AskCount ?? 0;
    if (supply >= entry.quantity) {
      full++;
    } else if (supply > 0) {
      partial++;
    } else {
      unavailable++;
    }
  }

  const total = bom.length;
  if (full === total) return `All ${total} materials available`;
  if (unavailable === 0) return `${full}/${total} full, ${partial} partial`;
  return `${unavailable} of ${total} unavailable`;
}

export default function ShipyardDetail({ blueprintName, bom, onLoadingChange }: ShipyardDetailProps) {
  const [prices, setPrices] = useState<FIOExchangeEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAllExchangePrices()
      .then(data => { if (!cancelled) { setPrices(data); setLoading(false); } })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch prices');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [retryCount]);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  const exchangeTotals = useMemo(
    () => prices ? priceBlueprint(bom, prices) : [],
    [bom, prices],
  );

  const cherryPick = useMemo(
    () => prices ? cherryPickPricing(bom, prices) : null,
    [bom, prices],
  );

  const cheapestExchange = useMemo(() => {
    const withPrices = exchangeTotals.filter(e => e.total > 0);
    if (withPrices.length === 0) return null;
    return withPrices.reduce((min, e) => e.total < min.total ? e : min).exchange;
  }, [exchangeTotals]);

  // Build per-material per-exchange price lookup
  const priceLookup = useMemo(() => {
    if (!prices) return new Map<string, FIOExchangeEntry>();
    const map = new Map<string, FIOExchangeEntry>();
    for (const entry of prices) {
      map.set(`${entry.MaterialTicker}:${entry.ExchangeCode}`, entry);
    }
    return map;
  }, [prices]);

  // Per-material best price across exchanges
  const bestPrices = useMemo(() => {
    if (!cherryPick) return new Map<string, { exchange: string; price: number }>();
    const map = new Map<string, { exchange: string; price: number }>();
    for (const item of cherryPick.items) {
      map.set(item.ticker, { exchange: item.bestExchange, price: item.unitPrice });
    }
    return map;
  }, [cherryPick]);

  // Cherry-pick source counts for display
  const cherrySourceCounts = useMemo(() => {
    if (!cherryPick) return [];
    const counts = new Map<string, number>();
    for (const item of cherryPick.items) {
      counts.set(item.bestExchange, (counts.get(item.bestExchange) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [cherryPick]);

  // Per-exchange availability analysis
  const exchangeAnalyses = useMemo(() => {
    const map = new Map<string, ExchangeAnalysis>();
    for (const ex of EXCHANGES) {
      map.set(ex, analyzeExchange(bom, ex, priceLookup));
    }
    return map;
  }, [bom, priceLookup]);

  // Cherry-pick availability analysis
  const cherryAnalysis = useMemo(
    () => analyzeCherryPick(bom, priceLookup, bestPrices),
    [bom, priceLookup, bestPrices],
  );

  const handleCopyACT = useCallback(async (exchange: string) => {
    if (!prices) return;
    const act = generateACTPackage(blueprintName, bom, exchange, prices);
    const ok = await copyACTToClipboard(act);
    if (ok) {
      setCopiedId(exchange);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, [blueprintName, bom, prices]);

  const handleCopyCherryACT = useCallback(async () => {
    if (!cherryPick) return;
    const act = generateCherryPickACT(blueprintName, cherryPick.items);
    const ok = await copyACTToClipboard(act);
    if (ok) {
      setCopiedId('cherry');
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, [blueprintName, cherryPick]);

  const stale = isPriceStale();
  const fetchedAt = getPriceFetchedAt();

  // Group BOM by category for table rendering
  const bomByCategory = useMemo(() => {
    const grouped = new Map<MaterialCategory, BOMEntry[]>();
    for (const entry of bom) {
      const list = grouped.get(entry.category) ?? [];
      list.push(entry);
      grouped.set(entry.category, list);
    }
    return grouped;
  }, [bom]);

  if (loading) {
    return (
      <div className={styles.detail}>
        <div className={styles.loadingState}>Fetching exchange prices...</div>
      </div>
    );
  }

  if (error && !prices) {
    return (
      <div className={styles.detail}>
        <div className={styles.errorState}>
          <div>Failed to load exchange prices</div>
          <div className={styles.errorDetail}>{error}</div>
          <button onClick={() => setRetryCount(c => c + 1)} style={{ marginTop: 'var(--gap-sm)' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.detail}>
      {stale && fetchedAt && (
        <div className={styles.staleWarning}>
          Stale price data — last fetched {new Date(fetchedAt).toLocaleTimeString()}
        </div>
      )}

      {/* Exchange summary cards */}
      <div className={styles.exchangeGrid}>
        {exchangeTotals.map(ex => {
          const total = ex.available + ex.missing;
          const pct = total > 0 ? Math.round((ex.available / total) * 100) : 0;
          const analysis = exchangeAnalyses.get(ex.exchange);
          const statusClass = analysis ? styles[`status-card-${analysis.status}`] : '';

          return (
            <div key={ex.exchange} className={`${styles.exchangeCard} ${statusClass}`}>
              <div className={styles.cardTop}>
                <span className={styles.exchangeCode}>{ex.exchange}</span>
              </div>
              <div className={styles.cardTotal}>
                {ex.total > 0 ? formatCurrency(ex.total) : '—'}
              </div>
              {analysis && (
                <div className={styles.cardStatus}>
                  <span className={`${styles.statusBadge} ${styles[`status-${analysis.status}`]}`}>
                    {STATUS_LABELS[analysis.status]}
                    {analysis.buildable > 0 && ` ×${analysis.buildable}`}
                  </span>
                  <span className={styles.lineCounts}>
                    {analysis.linesFull}F / {analysis.linesPartial}P / {analysis.linesUnavailable}U
                  </span>
                </div>
              )}
              <div className={styles.cardAvail}>
                {pct}% available ({ex.available}/{total})
              </div>
              <button
                className={`${styles.actBtn} ${copiedId === ex.exchange ? styles.copied : ''}`}
                onClick={() => handleCopyACT(ex.exchange)}
              >
                {copiedId === ex.exchange ? 'Copied' : 'Copy ACT'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Cherry-pick */}
      {cherryPick && cherryPick.total > 0 && (() => {
        const cpBuildable = cherryAnalysis.status === 'full';
        const verdict = buildCherryVerdict(bom, priceLookup, bestPrices);
        const bestSingle = cheapestExchange
          ? exchangeTotals.find(e => e.exchange === cheapestExchange)
          : null;
        const savings = bestSingle && bestSingle.total > cherryPick.total
          ? bestSingle.total - cherryPick.total
          : null;

        return (
          <div className={`${styles.cherryPick} ${cpBuildable ? styles.cherryBuildable : ''}`}>
            <div className={styles.cherryHeader}>
              <span className={styles.cherryLabel}>Cherry Pick</span>
              <span className={`${styles.statusBadge} ${styles[`status-${cherryAnalysis.status}`]}`}>
                {cherryAnalysis.status === 'full' ? 'Buildable' : STATUS_LABELS[cherryAnalysis.status]}
                {cherryAnalysis.buildable > 0 && ` ×${cherryAnalysis.buildable}`}
              </span>
              <span className={styles.cherryNote}>{verdict}</span>
            </div>
            <div className={styles.cherryBody}>
              <div className={styles.cherryTotal}>
                {formatCurrency(cherryPick.total)}
              </div>
              <div className={styles.cherrySources}>
                {cherrySourceCounts.map(([ex, count]) => (
                  <span key={ex} className={styles.sourceTag}>{ex} ×{count}</span>
                ))}
              </div>
              {savings !== null && cheapestExchange && (
                <div className={styles.cherrySavings}>
                  Save {formatCurrency(savings)} vs {cheapestExchange}
                </div>
              )}
              <button
                className={`${styles.actBtn} ${copiedId === 'cherry' ? styles.copied : ''}`}
                onClick={handleCopyCherryACT}
              >
                {copiedId === 'cherry' ? 'Copied' : 'Copy ACT (Multi)'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* BOM comparison table */}
      <div className={styles.tableWrap}>
        <table className={styles.bomTable}>
          <thead>
            <tr>
              <th>Material</th>
              <th>Qty</th>
              {EXCHANGES.map(ex => <th key={ex}>{ex}</th>)}
              <th className={styles.bestCol}>Best</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORY_ORDER.map(cat => {
              const entries = bomByCategory.get(cat);
              if (!entries) return null;
              const catClass = `cat-${cat.replace(/_/g, '-')}`;

              return entries.map((entry, i) => (
                <BOMRow
                  key={entry.ticker}
                  entry={entry}
                  catClass={catClass}
                  catLabel={i === 0 ? CATEGORY_LABELS[cat] : null}
                  priceLookup={priceLookup}
                  bestPrice={bestPrices.get(entry.ticker)}
                />
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface BOMRowProps {
  entry: BOMEntry;
  catClass: string;
  catLabel: string | null;
  priceLookup: Map<string, FIOExchangeEntry>;
  bestPrice?: { exchange: string; price: number };
}

function BOMRow({ entry, catClass, catLabel, priceLookup, bestPrice }: BOMRowProps) {
  return (
    <>
      {catLabel && (
        <tr className={styles.catRow}>
          <td colSpan={2 + EXCHANGES.length + 1}>
            <span className={`${styles.catLabel} ${catClass}`}>{catLabel}</span>
          </td>
        </tr>
      )}
      <tr>
        <td>
          <div className={styles.matCell}>
            <span className={`ticker-badge ${catClass}`}>{entry.ticker}</span>
            <span className={styles.matName}>{entry.name}</span>
          </div>
        </td>
        <td className={styles.qtyCell}>{entry.quantity}</td>
        {EXCHANGES.map(ex => {
          const data = priceLookup.get(`${entry.ticker}:${ex}`);
          return (
            <td key={ex} className={styles.priceCell}>
              <ExchangeCell data={data ?? null} quantity={entry.quantity} />
            </td>
          );
        })}
        <td className={`${styles.priceCell} ${styles.bestCol}`}>
          {bestPrice ? (
            <>
              <div className={styles.cellPrice}>{formatPrice(bestPrice.price)}</div>
              <div className={styles.bestExchange}>{bestPrice.exchange}</div>
              <div className={styles.cellLine}>{formatCurrency(bestPrice.price * entry.quantity)}</div>
            </>
          ) : (
            <span className={styles.noPrice}>—</span>
          )}
        </td>
      </tr>
    </>
  );
}

function ExchangeCell({ data, quantity }: { data: FIOExchangeEntry | null; quantity: number }) {
  if (!data || data.Ask === null || data.Ask <= 0) {
    return <span className={styles.noPrice}>—</span>;
  }

  const supply = data.AskCount ?? 0;
  const supplyClass = supply >= quantity
    ? styles.supplyFull
    : supply > 0
      ? styles.supplyPartial
      : styles.supplyNone;

  return (
    <>
      <div className={styles.cellPrice}>{formatPrice(data.Ask)}</div>
      <div className={`${styles.cellSupply} ${supplyClass}`}>
        {supply.toLocaleString()} avail
      </div>
      <div className={styles.cellLine}>{formatCurrency(data.Ask * quantity)}</div>
    </>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toFixed(2);
}

function formatPrice(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 10_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
