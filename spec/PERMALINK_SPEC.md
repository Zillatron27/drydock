# DryDock: Permalink Sharing Spec

**Date:** 2026-02-24
**Target version:** 1.0.0
**Status:** Ready for implementation

## Overview

Share ship blueprints as compact URLs that can be pasted into Discord, forums, or chat. No server needed — the entire blueprint is encoded in the URL. Opening a permalink loads the blueprint directly into DryDock.

## URL Format

```
https://drydock.cc/?bp=1-012240100000
                       │ ││││││││││││
                       │ │└┴┴┴┴┴┴┴┴┴┴── 12 slot digits (positions 0-11)
                       │ └───────────── encoding version
                       └─────────────── query parameter
```

### Blueprint Name

Optional. Appended as a separate parameter:

```
https://drydock.cc/?bp=1-012240100000&n=FTL+Freighter
```

If `n` is absent, the imported blueprint is named "Shared Blueprint" (or "Shared Blueprint (2)" etc. on collision).

## Encoding Scheme

### Version Prefix

The string before the `-` is the encoding version. Currently `1`. This allows the slot order or option mappings to change in future versions without breaking old links.

### Slot Positions

Each character is a single digit (0-9) representing the selected option index within that slot. The slot order is fixed:

| Pos | Slot | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|-----|------|---|---|---|---|---|---|---|---|
| 0 | STL Engine | ENG | FSE | GEN | AEN | HTE | | | |
| 1 | STL Fuel Tank | SSL | MSL | LSL | | | | | |
| 2 | FTL Reactor | *none* | RCT | QCR | HPR | HYR | | | |
| 3 | FTL Fuel Tank | *none* | SFL | MFL | LFL | | | | |
| 4 | Cargo Bay | TCB | VSC | SCB | MCB | LCB | WCB | VCB | HCB |
| 5 | Hull Plates | BHP | LHP | RHP | HHP | AHP | | | |
| 6 | Heat Shielding | *none* | BPT | APT | | | | | |
| 7 | Whipple Shielding | *none* | BWH | AWH | | | | | |
| 8 | Stability System | *none* | STS | | | | | | |
| 9 | Radiation Shielding | *none* | BRP | SRP | ARP | | | | |
| 10 | Repair Drones | *none* | RDS | RDL | | | | | |
| 11 | High-G Seats | *none* | BGS | AGS | | | | | |

Option ordering within each slot follows the same order as `src/data/modules.ts` (which matches the in-game BLU command ordering). Index `0` for optional slots always means "none selected."

### Trailing Zero Trimming

Trailing `0` characters may be omitted. The parser fills missing positions with `0` (none/default). This keeps URLs shorter for typical builds where optional equipment isn't used.

**Examples:**

| Blueprint | Full | Trimmed | URL |
|-----------|------|---------|-----|
| Basic hauler (ENG+SSL+SCB+BHP) | `1-000020000000` | `1-00002` | `drydock.cc/?bp=1-00002` |
| FTL freighter (ENG+MSL+QCR+MFL+LCB+LHP) | `1-012240100000` | `1-0122401` | `drydock.cc/?bp=1-0122401` |
| Full loadout (HTE+LSL+HYR+LFL+HCB+AHP+APT+AWH+STS+ARP+RDL+AGS) | `1-424374221322` | `1-424374221322` | `drydock.cc/?bp=1-424374221322` |

Worst case is 16 characters (`1-` + 12 digits). With name, typical Discord-friendly URLs are ~40-60 characters total.

## Behaviour

### Opening a Permalink

When DryDock loads with a `?bp=` parameter:

1. **Parse** the encoding version and slot digits
2. **Validate** — each digit must be within range for its slot position. If invalid, show error toast and load normally.
3. **Build** `ModuleSelections` from the decoded tickers
4. **Create** a new `Blueprint` with fresh UUID, decoded selections, and computed BOM
5. **Add** to the user's blueprint list (append, don't replace)
6. **Select** the new blueprint (expand its card, trigger price fetch)
7. **Clean URL** — replace `?bp=...` with clean `/` via `history.replaceState()` so refreshing doesn't re-import

### Name Collision

If a blueprint with the same name already exists, append ` (shared)`. Same pattern as import/export.

### Generating a Permalink

Add a "Share" button to each blueprint card (alongside Export). Clicking it:

1. **Encode** the blueprint's `ModuleSelections` into the positional string
2. **Build** the full URL with `?bp=` and optional `&n=` (URL-encoded name)
3. **Copy** to clipboard
4. **Toast** feedback: "Link copied to clipboard"

### Share Button in Editor

Also add a Share button in the `BlueprintEditor` stats panel / header area. This lets users generate a permalink for a build they're still editing (before saving). Uses the editor's current selections, not a saved blueprint.

## Validation Rules

### On Decode

- Version must be `1` (reject unknown versions with "This link uses a newer format — please update DryDock")
- String after `-` must contain only digits 0-9
- Each digit must be ≤ max option index for its slot position (e.g. position 4 max is 7 for HCB)
- Minimum 6 characters after version prefix (positions 0-5 cover all required slots)
- Positions 6-11 default to `0` (none) if omitted

### On Encode

- Always emit at least positions 0-5
- Trim trailing zeros from position 6 onward only

## Implementation Plan

### New Files

| File | Purpose |
|------|---------|
| `src/services/permalink.ts` | `encodeBlueprint()`, `decodeBlueprint()`, `generatePermalink()` |
| `src/services/__tests__/permalink.test.ts` | Encode/decode roundtrip tests, validation edge cases |

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Check `window.location.search` on mount, call `decodeBlueprint()`, `history.replaceState()` |
| `src/components/BlueprintCard.tsx` | Add Share button |
| `src/components/BlueprintEditor.tsx` | Add Share button for current editor state |

### Constants

The slot-to-options mapping lives in `permalink.ts` as a static array, not derived from `modules.ts` at runtime. This keeps the encoding stable even if module display order changes. The mapping is verified against `modules.ts` in tests.

```typescript
const PERMALINK_VERSION = '1';

const SLOT_OPTIONS: readonly (readonly (string | null)[])[] = [
  /* 0  STL Engine      */ ['ENG', 'FSE', 'GEN', 'AEN', 'HTE'],
  /* 1  STL Fuel Tank   */ ['SSL', 'MSL', 'LSL'],
  /* 2  FTL Reactor     */ [null, 'RCT', 'QCR', 'HPR', 'HYR'],
  /* 3  FTL Fuel Tank   */ [null, 'SFL', 'MFL', 'LFL'],
  /* 4  Cargo Bay       */ ['TCB', 'VSC', 'SCB', 'MCB', 'LCB', 'WCB', 'VCB', 'HCB'],
  /* 5  Hull Plates     */ ['BHP', 'LHP', 'RHP', 'HHP', 'AHP'],
  /* 6  Heat Shielding  */ [null, 'BPT', 'APT'],
  /* 7  Whipple Shield  */ [null, 'BWH', 'AWH'],
  /* 8  Stability       */ [null, 'STS'],
  /* 9  Radiation Shield */ [null, 'BRP', 'SRP', 'ARP'],
  /* 10 Repair Drones   */ [null, 'RDS', 'RDL'],
  /* 11 High-G Seats    */ [null, 'BGS', 'AGS'],
];

const SLOT_KEYS: readonly (keyof ModuleSelections)[] = [
  'stlEngine', 'stlFuelTank', 'ftlReactor', 'ftlFuelTank',
  'cargoBay', 'hullPlates', 'heatShielding', 'whippleShielding',
  'stabilitySystem', 'radiationShielding', 'selfRepairDrones', 'highGSeats',
];

const MIN_DIGITS = 6; // Must include all required slots (positions 0-5)
```

### Tests

`permalink.test.ts` should cover:

- Roundtrip: encode → decode for multiple configurations
- Trailing zero trimming: full-length and trimmed produce same decode
- Minimum length: 6-digit string decodes correctly (optional slots default to none)
- All preset blueprints encode/decode correctly
- Invalid version rejected
- Out-of-range digit rejected (e.g. `8` in position 0 which only has 5 options)
- Non-digit characters rejected
- Too-short string rejected (< 6 digits after version)
- Name parameter: present, absent, URL-encoded special characters
- SLOT_OPTIONS matches modules.ts option ordering (guards against silent breakage)

## Edge Cases

- **Blueprint name with special characters** — URL-encode with `encodeURIComponent()`. Decode on import.
- **Name parameter too long** — truncate to 50 chars (same as JSON import).
- **Multiple `?bp=` parameters** — use first occurrence, ignore rest.
- **Hash routing conflict** — DryDock currently doesn't use hash routing, so `?bp=` is safe. If routing is added later, permalinks should move to hash params (`#bp=...`).
- **Permalink + existing blueprints** — the shared blueprint is *added*, never replaces existing data. Users might open the same link twice and get duplicates — this is acceptable (they can delete extras).

## NOT in Scope

- **Short URL service** — no `drydock.cc/s/abc123` style short links. Adds server dependency. The positional encoding is already short enough for Discord.
- **Embed previews** — Open Graph / Discord embed cards showing ship stats. Requires server-side rendering. Could be added later with Cloudflare Workers.
- **Collection permalinks** — sharing multiple blueprints in one URL. Use JSON export for collections.
- **QR codes** — URLs are short enough to share as text. QR generation is a nice-to-have, not v1.

## Future Considerations

- **Version 2 encoding** — if new module slots are added to PrUn (e.g. colony ship modules), bump the version prefix to `2` and extend the position list. Old `1-` links remain valid.
- **Embed previews** — a Cloudflare Worker could parse the `?bp=` parameter and return Open Graph meta tags with ship stats, making Discord/Slack show a rich preview card when someone pastes a link. No code changes to the client — just a Worker that intercepts requests with `?bp=` and injects `<meta>` tags before serving the SPA.
