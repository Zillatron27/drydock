# DryDock: Pricing Modes Spec

**Date:** 2026-03-04
**Target version:** 1.1.0
**Status:** Ready for implementation

## Overview

DryDock currently answers one question: "What's the cheapest price per material?" This is useful but incomplete. Players with capital don't care about cheapest — they want to know if they can buy a ship *right now* and what it'll actually cost to fill the order.

Two pricing modes, toggled by the user:

1. **Best Price** (current behaviour, default) — cheapest ask, availability at that price level only
2. **Full Depth** — walk the order book to fill BOM quantities, show total supply and blended actual cost

## Pricing Mode Definitions

### Best Price (default)

No changes to existing behaviour. Uses best ask price per material per exchange. Availability count = units available at the best ask price level only (already implemented via `/exchange/full` aggregation).

**Question answered:** "Can I buy a ship at the cheapest price on each exchange?"

### Full Depth

Walk the sell side of the order book to fill the required BOM quantity. Consume orders from cheapest to most expensive until the quantity is filled.

- **Price displayed:** Blended unit cost (total spend ÷ quantity needed). If the full quantity can't be filled, show the blended cost for what's available + flag as partial.
- **Availability count:** Total units across all sell orders (full order book depth), not just at best ask.
- **Exchange card totals:** Actual total cost to buy the full BOM quantity by walking the book. This will be ≥ Best Price totals.
- **Status analysis (Full/Partial/Incomplete):** Based on total supply vs BOM quantity — realistic assessment of whether the ship is actually buildable right now.
- **Cherry-pick:** Find the cheapest *blended* cost per material across exchanges, not just cheapest best-ask.

**Question answered:** "Can I buy this ship right now, and what will it actually cost?"

**Example:** Need 109 LHP on CI1. Order book: 50 @ 3,990 + 48 @ 4,100 + 200 @ 4,500. Walk: consume 50 @ 3,990 (199,500) + 48 @ 4,100 (196,800) + 11 @ 4,500 (49,500) = 445,800 total for 109 units. Blended unit cost = 4,091.74. Best Price mode would show 3,990 × 109 = 434,910 (but only 50 are actually available at that price).

## Data Layer Changes

### FIO Cache: Retain Order Book Depth

Currently `fio.ts` fetches `/exchange/full`, aggregates `AskCount`/`BidCount` at best price, then strips `SellingOrders`/`BuyingOrders` to keep cache lean. Full Depth mode needs the order book.

**Change:** Instead of stripping raw order arrays, process them into a compact depth summary and cache that alongside the existing fields.

```typescript
/** Processed order book depth — sorted price tiers with quantities */
export interface OrderBookDepth {
  /** Sell orders sorted by price ascending (cheapest first) */
  asks: Array<{ price: number; quantity: number }>;
  /** Buy orders sorted by price descending (highest first) */
  bids: Array<{ price: number; quantity: number }>;
  /** Total units available across all ask price levels */
  totalAskSupply: number;
  /** Total units across all bid price levels */
  totalBidDemand: number;
}
```

**Extend `FIOExchangeEntry`:**

```typescript
export interface FIOExchangeEntry {
  // ... existing fields unchanged ...
  orderBook: OrderBookDepth;
}
```

**Processing in `fetchAllExchangePrices()`:**

```typescript
const asks = entry.SellingOrders
  .map(o => ({ price: o.ItemCost, quantity: o.ItemCount }))
  .sort((a, b) => a.price - b.price);

const bids = entry.BuyingOrders
  .map(o => ({ price: o.ItemCost, quantity: o.ItemCount }))
  .sort((a, b) => b.price - a.price);

const totalAskSupply = asks.reduce((sum, o) => sum + o.quantity, 0);
const totalBidDemand = bids.reduce((sum, o) => sum + o.quantity, 0);
```

This is more memory than the current stripped approach, but far less than keeping raw FIO response arrays. The depth summary is the minimum needed for both modes.

### New: `src/services/depth_pricing.ts`

New service module for order book depth calculations. Keep `pricing.ts` unchanged (it handles Best Price mode).

```typescript
/** Walk the order book to fill a quantity. Returns { totalCost, filled, tiers }. */
export function fillFromOrderBook(
  asks: Array<{ price: number; quantity: number }>,
  quantityNeeded: number,
): {
  totalCost: number;
  filledQuantity: number;
  blendedUnitCost: number | null; // null if nothing available
  tiers: Array<{ price: number; quantity: number; cost: number }>;
}

/** Price a full BOM using order book depth at one exchange */
export function depthPriceBlueprint(
  bom: BOMEntry[],
  exchangePrices: FIOExchangeEntry[],
  exchange: string,
): ExchangeTotal  // reuse existing type, but total reflects blended cost

/** Cherry-pick using blended costs across exchanges */
export function depthCherryPickPricing(
  bom: BOMEntry[],
  exchangePrices: FIOExchangeEntry[],
): CherryPickResult  // reuse existing type, unitPrice is blended
```

### Pricing Mode Type

```typescript
export type PricingMode = 'best_price' | 'full_depth';
```

Add to `src/types/index.ts`.

## UI Changes

### Mode Toggle

**Position:** Horizontal row above the exchange cards, below the stale data warning. Same vertical zone as the stale warning — contextual to the analysis, not buried in settings.

**Appearance:** Two compact buttons in a button group. Muted border style matching existing UI. Active mode highlighted with amber fill (`var(--color-amber)` / `#c4a35a`). Inactive button uses the standard muted border treatment.

**Labels:**
- `Best Price` (default)
- `Full Depth`

**Interaction:** Click to switch. Immediate re-render — no loading state needed since both modes use the same cached FIO data. The toggle is purely a presentation/calculation switch.

**CSS:** Add to `ShipyardDetail.module.css`. Button group pattern — no gaps between buttons, shared border, rounded ends only on first/last child.

### What Changes Per Mode

| UI Element | Best Price | Full Depth |
|------------|-----------|------------|
| BOM table: unit price | Best ask | Blended unit cost |
| BOM table: "X avail" | Units at best ask | Total units (all tiers) |
| BOM table: line total | Best ask × qty | Blended total (from book walk) |
| Exchange card: total | Sum of best ask line totals | Sum of blended line totals |
| Exchange card: status | Based on supply at best ask | Based on total supply |
| Exchange card: avail % | Based on supply at best ask | Based on total supply |
| Cherry-pick: price | Best ask per material | Blended cost per material |
| Cherry-pick: total | Sum of best ask cherry picks | Sum of blended cherry picks |
| Cherry-pick: sourcing | Cheapest best-ask exchange | Cheapest blended-cost exchange |

### No Changes To

- Blueprint editor, card layout, import/export, permalinks, settings modal, header
- ACT package generation (always uses best ask prices — ACT is about placing orders at market, not walking the book)
- Stats panel

## Persistence

### localStorage Key

Store the selected pricing mode in the existing `drydock_settings` localStorage object alongside `fontSize` and `highContrast`:

```typescript
export interface DryDockSettings {
  fontSize: 'default' | 'medium' | 'large' | 'xl';
  highContrast: boolean;
  pricingMode: PricingMode;  // new field
}
```

Default: `'best_price'`. On load, if the field is missing or invalid, fall back to `'best_price'` (the spread-over-defaults pattern in `loadSettings()` handles this).

This is a user preference, not a per-blueprint setting. Users who want full depth will likely want it for every blueprint they look at.

## Implementation Plan

### Modified Files

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `PricingMode` type, `OrderBookDepth` interface |
| `src/services/fio.ts` | Retain processed order book depth in cache instead of stripping. Add `orderBook: OrderBookDepth` to `FIOExchangeEntry`. |
| `src/services/settings.ts` | Add `pricingMode` to `DryDockSettings` with default `'best_price'` |
| `src/components/ShipyardDetail.tsx` | Add mode toggle UI. Branch analysis/pricing logic by mode. Pass mode to pricing functions. |
| `src/components/ShipyardDetail.module.css` | Styles for mode toggle button group |

### New Files

| File | Purpose |
|------|---------|
| `src/services/depth_pricing.ts` | `fillFromOrderBook()`, `depthPriceBlueprint()`, `depthCherryPickPricing()` |
| `src/services/__tests__/depth_pricing.test.ts` | Unit tests for order book walking logic |

### Files NOT Modified

| File | Why |
|------|-----|
| `src/services/pricing.ts` | Best Price mode logic is unchanged. Full Depth uses new `depth_pricing.ts`. |
| `src/services/act.ts` | ACT always uses best ask — it generates buy orders at market price, not limit orders across tiers. |
| `src/components/ExchangePricing.tsx` | Legacy component, not used in main flow. |
| `src/services/permalink.ts` | Pricing mode is not encoded in permalinks — it's a viewer preference, not a blueprint property. |

## `fillFromOrderBook` Algorithm

Core algorithm for Full Depth mode. Walks sorted ask tiers to fill a quantity:

```
Input: asks (sorted ascending by price), quantityNeeded
Output: { totalCost, filledQuantity, blendedUnitCost, tiers }

remaining = quantityNeeded
totalCost = 0
tiers = []

for each tier in asks:
    if remaining <= 0: break
    take = min(tier.quantity, remaining)
    cost = take * tier.price
    totalCost += cost
    remaining -= take
    tiers.push({ price: tier.price, quantity: take, cost })

filledQuantity = quantityNeeded - remaining
blendedUnitCost = filledQuantity > 0 ? totalCost / filledQuantity : null

return { totalCost, filledQuantity, blendedUnitCost, tiers }
```

### Edge Cases

- **Empty order book:** `filledQuantity = 0`, `blendedUnitCost = null`, `totalCost = 0`
- **Partial fill:** BOM needs 100 units, book only has 60. `filledQuantity = 60`, cost reflects those 60 only. Status = Partial.
- **Single tier covers it:** Degenerates to Best Price pricing (blended cost = best ask). This is correct.
- **Zero quantity needed:** Return immediately with zero cost. (Shouldn't happen with valid BOMs but handle defensively.)

## Tests

### `depth_pricing.test.ts`

Test `fillFromOrderBook()`:
- Single tier, exact fill
- Single tier, partial fill (book has less than needed)
- Multiple tiers, exact fill at tier boundary
- Multiple tiers, partial fill mid-tier
- Empty order book
- Zero quantity needed
- Single unit needed from multi-tier book
- Verify tiers array contains correct per-tier breakdown

Test `depthPriceBlueprint()`:
- Full BOM priced against one exchange
- Materials with partial availability
- Materials with zero availability
- Verify totals match sum of `fillFromOrderBook()` results

Test `depthCherryPickPricing()`:
- Picks cheapest blended cost per material across exchanges
- Material available on one exchange but not another
- Blended cost on Exchange A is cheaper than best-ask on Exchange B (because A has deep liquidity at a slightly higher best-ask)

### Existing Tests

Run `npm run test` — all existing tests must still pass. The `FIOExchangeEntry` interface change (adding `orderBook`) needs any mocked FIO data in tests to include the new field.

## NOT in Scope

- **Bid-side depth analysis** — we compute `totalBidDemand` and cache bid depth, but no UI consumes it yet. Available for future "sell my ship parts" feature.
- **Per-tier breakdown in UI** — showing which price tiers were consumed to fill an order. Useful but adds UI complexity. Could be a tooltip or expandable row in a future iteration.
- **Limit-price ACT generation** — generating ACT packages with price limits based on the depth walk. ACT currently uses market orders (no price limits). Separate feature.
- **Cross-exchange depth walk** — walking the combined order book across all exchanges to find the absolute cheapest way to fill a BOM (mixing quantities from different exchanges at different tiers). Cherry-pick handles the per-material cross-exchange case; full cross-exchange depth optimization is a different problem.

## Future Considerations

- **Per-tier tooltips:** On hover over a material's price cell in Full Depth mode, show the tier breakdown (e.g. "50 @ 3,990 + 48 @ 4,100 + 11 @ 4,500"). Low effort, high information density.
- **"Cost to fill" vs "Cost at best":** In Full Depth mode, could show both the blended cost and the best-ask cost side by side (with the delta). Helps players understand the premium they're paying for immediate availability.
- **Mode in permalinks:** If demand emerges, could encode the active pricing mode in the permalink query params (`&mode=depth`). Currently out of scope — mode is a viewer preference.
