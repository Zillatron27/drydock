# DryDock: Cherry-Pick Exchange Filter Spec

**Date:** 2026-03-22
**Target version:** 1.3.0
**Status:** Ready for implementation

## Overview

Cherry-pick sourcing currently considers all 4 active exchanges (AI1, CI1, IC1, NC1) unconditionally. Players often want to exclude exchanges for reasons DryDock can't infer — logistics, currency holdings, travel distance, or simply not wanting to visit a particular station. This feature lets them toggle exchanges on/off directly in the cherry-pick pane.

## Interaction Design

### Toggle Behaviour

The four exchange badges already displayed in the cherry-pick pane (e.g. `CI1: 2.49M`) become clickable toggles.

- **Default state:** All four enabled. No change for existing users.
- **Click to deselect:** Badge goes grey (visually muted). Cherry-pick recalculates live.
- **Click to re-enable:** Badge returns to normal colour. Cherry-pick recalculates live.
- **Minimum selection:** At least one exchange must remain enabled. If the user tries to deselect the last remaining exchange, the click is ignored (no error message needed — the badge just doesn't toggle).

### Visual Treatment

| State | Background | Text | Border |
|-------|-----------|------|--------|
| Enabled | Current styling (exchange status colours) | Current | Current |
| Disabled | `var(--color-surface-alt)` or equivalent dark muted | `var(--color-text-muted)` | `var(--color-border-muted)` |

The disabled state should look clearly "off" without being invisible. Cursor should indicate clickability on both states (`cursor: pointer`).

### Recalculation Scope

When the exchange filter changes, the following recalculate live:

- **Cherry-pick total** — only considers enabled exchanges
- **Cherry-pick per-material sourcing** — best price (or best blended cost in Full Depth mode) from enabled exchanges only
- **Cherry-pick availability status** — FULL/PARTIAL/INCOMPLETE based on enabled exchanges only
- **Cherry-pick availability percentage** — lines fully satisfiable from enabled exchanges
- **ACT generation (cherry-pick variant)** — only sources from enabled exchanges

### What Does NOT Change

- **Individual exchange cards** — these still show all 4 exchanges with their own totals and status, regardless of filter. The filter only affects cherry-pick.
- **Single-exchange ACT generation** — if a user generates an ACT for a specific exchange card, it uses that exchange regardless of the cherry-pick filter.
- **BOM table per-exchange columns** — still show all 4 exchanges.

### Status Logic When Filtered

Standard status rules apply to the filtered set. If deselecting an exchange means a material has no source among the remaining enabled exchanges:

- That material becomes **unavailable** in the cherry-pick analysis
- Cherry-pick status follows existing rules: any unavailable → INCOMPLETE, any partial → PARTIAL, all full → FULL
- Cherry-pick availability percentage reflects only lines satisfiable from enabled exchanges

This is the correct behaviour. The user made a deliberate choice to exclude that exchange — DryDock respects the choice and shows the real picture.

## Persistence

### localStorage

Add `cherryPickExchanges` to the existing `drydock_settings` object:

```typescript
export interface DryDockSettings {
  fontSize: 'default' | 'medium' | 'large' | 'xl';
  highContrast: boolean;
  pricingMode: PricingMode;
  cherryPickExchanges: Record<string, boolean>;  // e.g. { AI1: true, CI1: true, IC1: false, NC1: true }
}
```

**Default:** All exchanges `true`. On load, if the field is missing or invalid, fall back to all-enabled. If a new exchange were ever added to the data, it defaults to enabled (defensive — unknown keys are treated as enabled).

This is a user preference, not a per-blueprint setting. A player who doesn't want to shop at IC1 probably doesn't want to shop there for any blueprint.

## Implementation Plan

### Modified Files

| File | Change |
|------|--------|
| `src/services/settings.ts` | Add `cherryPickExchanges` to `DryDockSettings` with default all-true. Load/save/apply. |
| `src/components/ShipyardDetail.tsx` | Make exchange badges in cherry-pick pane clickable. Add toggle state (from settings). Filter exchange list before passing to cherry-pick pricing. Recalculate on toggle. |
| `src/components/ShipyardDetail.module.css` | Styles for disabled badge state (greyed out). Cursor pointer on badges. |
| `src/services/pricing.ts` | `cherryPickPricing()` accepts an optional `enabledExchanges` filter parameter. Filters exchange list before sourcing. |
| `src/services/depth_pricing.ts` | `depthCherryPickPricing()` accepts the same `enabledExchanges` filter parameter. |
| `src/services/act.ts` | Cherry-pick ACT generation respects the filter — only sources from enabled exchanges. |

### Files NOT Modified

| File | Why |
|------|-----|
| `src/services/fio.ts` | FIO data layer fetches all exchanges regardless. Filtering is at the presentation/pricing layer. |
| `src/formulas/index.ts` | Blueprint calculation is unrelated to exchange selection. |
| `src/services/permalink.ts` | Exchange filter is a viewer preference, not a blueprint property. Not encoded in permalinks. |
| `src/services/blueprint_io.ts` | Import/export is blueprint data only. |
| `src/components/BlueprintEditor.tsx` | Editor has no pricing context. |

## Tests

### New Tests

Add to existing pricing test files or create `src/services/__tests__/cherry_pick_filter.test.ts`:

- Cherry-pick with all exchanges enabled matches current behaviour (regression)
- Cherry-pick with one exchange disabled excludes it from sourcing
- Material only available on a disabled exchange → unavailable in cherry-pick
- Status calculation with filtered exchanges (FULL → INCOMPLETE when sole source is disabled)
- Minimum selection enforcement: can't disable all four
- Default settings: all exchanges enabled when `cherryPickExchanges` is missing from localStorage

### Existing Tests

All existing tests must pass unchanged. The `enabledExchanges` parameter on pricing functions is optional — existing call sites that don't pass it get current behaviour.

## NOT in Scope

- **Per-blueprint exchange filter** — this is a global user preference. If demand emerges for per-blueprint filters, that's a separate feature.
- **Exchange card hiding** — individual exchange cards always show. The filter only affects cherry-pick aggregation.
- **Filter presets** — e.g. "nearby exchanges only". Would need player location data we don't have.
- **Exchange filter in permalinks** — viewer preference, not shared state.
