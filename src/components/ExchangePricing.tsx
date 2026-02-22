import { useState, useEffect, useMemo } from 'react';
import type { BOMEntry } from '../types';
import { fetchAllExchangePrices, getPriceFetchedAt, isPriceStale } from '../services/fio';
import type { FIOExchangeEntry } from '../services/fio';
import { priceBlueprint, cherryPickPricing, EXCHANGES } from '../services/pricing';
import styles from './ExchangePricing.module.css';

interface ExchangePricingProps {
  bom: BOMEntry[];
}

export default function ExchangePricing({ bom }: ExchangePricingProps) {
  const [prices, setPrices] = useState<FIOExchangeEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAllExchangePrices()
      .then(data => {
        if (!cancelled) {
          setPrices(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch prices');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  const exchangeTotals = useMemo(
    () => prices ? priceBlueprint(bom, prices) : [],
    [bom, prices]
  );

  const cherryPick = useMemo(
    () => prices ? cherryPickPricing(bom, prices) : null,
    [bom, prices]
  );

  const cheapestExchange = useMemo(() => {
    if (exchangeTotals.length === 0) return null;
    const withPrices = exchangeTotals.filter(e => e.total > 0);
    if (withPrices.length === 0) return null;
    return withPrices.reduce((min, e) => e.total < min.total ? e : min).exchange;
  }, [exchangeTotals]);

  const stale = isPriceStale();
  const fetchedAt = getPriceFetchedAt();

  if (loading) {
    return (
      <div className={styles.pricingSection}>
        <span className="panel-header">Exchange Pricing</span>
        <div className={styles.loadingState}>Fetching exchange prices...</div>
      </div>
    );
  }

  if (error && !prices) {
    return (
      <div className={styles.pricingSection}>
        <span className="panel-header">Exchange Pricing</span>
        <div className={styles.errorState}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.pricingSection}>
      <div className={styles.pricingHeader}>
        <span className="panel-header">Exchange Pricing</span>
        {stale && fetchedAt && (
          <span className={styles.staleWarning}>
            Stale data — last fetched {new Date(fetchedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className={styles.exchangeGrid}>
        {exchangeTotals.map(ex => {
          const isCheapest = ex.exchange === cheapestExchange;
          const totalMaterials = ex.available + ex.missing;
          const availability = totalMaterials > 0
            ? Math.round((ex.available / totalMaterials) * 100)
            : 0;

          return (
            <div
              key={ex.exchange}
              className={`${styles.exchangeCard} ${isCheapest ? styles.cheapest : ''}`}
            >
              <div className={styles.exchangeHeader}>
                <span className={styles.exchangeName}>{ex.exchange}</span>
                {isCheapest && <span className={styles.bestBadge}>Best</span>}
              </div>
              <div className={styles.exchangeTotal}>
                {ex.total > 0
                  ? formatCurrency(ex.total)
                  : '—'
                }
              </div>
              <div className={styles.exchangeAvailability}>
                {availability}% available ({ex.available}/{totalMaterials})
              </div>
            </div>
          );
        })}

        {cherryPick && cherryPick.total > 0 && (
          <div className={`${styles.exchangeCard} ${styles.cherryPickCard}`}>
            <div className={styles.exchangeHeader}>
              <span className={styles.exchangeName}>Cherry-pick</span>
              <span className={styles.cherryBadge}>Optimal</span>
            </div>
            <div className={styles.exchangeTotal}>
              {formatCurrency(cherryPick.total)}
            </div>
            <div className={styles.exchangeAvailability}>
              Best price per material across {EXCHANGES.length} exchanges
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return value.toFixed(2);
}
