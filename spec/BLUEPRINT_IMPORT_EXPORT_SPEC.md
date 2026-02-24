# DryDock: Blueprint Import/Export Spec

**Date:** 2026-02-23
**Target version:** 0.4.0
**Status:** Implemented

## Overview

Add the ability to export and import ship blueprints as JSON, enabling players to share designs via Discord, forums, or direct links. Follows the same versioned-JSON pattern used in PrUnderground's `json_io.py`.

## Design Principles

- **BOM is always derived, never stored** — exports contain module selections only. BOM is recalculated on import using `calculateBOM()`. This keeps exports compact and means they're never stale if formula logic is updated.
- **Clipboard-first** — primary sharing mechanism is copy/paste. Players share builds in Discord constantly. File download is secondary.
- **Validation on import** — every ticker in an imported blueprint must resolve to a valid module option. Invalid selections are rejected with a clear error, not silently dropped.
- **Backwards compatible** — version field enables future schema changes without breaking existing exports.

## JSON Schema

### Single Blueprint Export

```json
{
  "type": "drydock-blueprint",
  "version": "1.0",
  "exported_at": "2026-02-23T10:30:00Z",
  "name": "FTL Freighter",
  "modules": {
    "stlEngine": "ENG",
    "stlFuelTank": "SFT",
    "ftlReactor": "RCT",
    "ftlFuelTank": "FFT",
    "cargoBay": "LCB",
    "hullPlates": "AHP",
    "heatShielding": null,
    "whippleShielding": null,
    "stabilitySystem": null,
    "radiationShielding": null,
    "selfRepairDrones": null,
    "highGSeats": null
  }
}
```

### Multi-Blueprint Export (All Blueprints)

```json
{
  "type": "drydock-collection",
  "version": "1.0",
  "exported_at": "2026-02-23T10:30:00Z",
  "blueprints": [
    {
      "name": "FTL Freighter",
      "modules": { ... }
    },
    {
      "name": "Basic Hauler",
      "modules": { ... }
    }
  ]
}
```

### Field Notes

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | string | Yes | `"drydock-blueprint"` or `"drydock-collection"` — routes import logic |
| `version` | string | Yes | Schema version. Only `"1.x"` is accepted (major version match). |
| `exported_at` | string | No | ISO 8601 timestamp. Informational only, not used for logic. |
| `name` | string | Yes | Blueprint name. Truncated to 50 chars on import. |
| `modules` | object | Yes | Maps directly to `ModuleSelections` interface. All keys must be present. |

The `modules` object uses **tickers** (e.g. `"ENG"`, `"RCT"`, `"LCB"`) not display names. Nullable fields use JSON `null`.

## Import Logic

### Validation

Create `src/services/blueprint_io.ts` with the following validation:

```
validateBlueprint(data: unknown) → { valid: true, blueprint: Blueprint } | { valid: false, error: string }
```

Validation steps (in order, fail fast):

1. **Is it an object?** — reject if not
2. **Has `type` field?** — must be `"drydock-blueprint"` or `"drydock-collection"`
3. **Version compatible?** — major version must be `1` (same check as PrUnderground: `parseInt(version.split('.')[0]) === 1`)
4. **Has `name`?** — non-empty string, truncate to 50 chars
5. **Has `modules` object?** — must be present and be an object
6. **All required keys present?** — `stlEngine`, `stlFuelTank`, `cargoBay`, `hullPlates` must be non-null strings
7. **All tickers valid?** — every non-null value in `modules` must exist as an option in its corresponding slot in `src/data/modules.ts`. This is the critical check — a typo in a ticker or an outdated export shouldn't silently produce a broken blueprint.

For `drydock-collection`: validate each blueprint individually. Report per-blueprint errors. Import all valid ones, skip invalid ones with a summary.

### Import Modes

Unlike PrUnderground (which has replace/merge modes because it deals with server-side data), DryDock is simpler:

- **Single blueprint** (`drydock-blueprint`): adds as a new blueprint with a fresh UUID. If a blueprint with the same name already exists, append ` (imported)` to the name.
- **Collection** (`drydock-collection`): adds all valid blueprints as new entries. Same name-collision handling.

No replace/merge modes needed — the user can delete duplicates manually. Keep it simple.

### Import Entry Points

Two ways to import:

1. **Paste from clipboard** — modal with a textarea. User pastes JSON, clicks Import. Validate and add.
2. **File upload** — same modal, with a file picker that accepts `.json`. Read file contents, validate and add.

Both feed into the same `validateBlueprint()` / `validateCollection()` pipeline.

## Export Entry Points

### Per-Blueprint Export

On each `BlueprintCard`, add an export button (or add to existing card actions). Clicking it:

1. Builds the `drydock-blueprint` JSON from the card's `Blueprint` data
2. Copies to clipboard
3. Shows brief toast/feedback: "Copied to clipboard"

### Export All

In the header or a toolbar area, add "Export All" button. Builds `drydock-collection` JSON from all blueprints, copies to clipboard.

### File Download (Secondary)

Both export actions should also offer "Download as .json" as a secondary option. Use the same filename pattern as PrUnderground:

```
drydock-blueprint-{name}-{YYYYMMDD-HHmmss}.json
drydock-collection-{YYYYMMDD-HHmmss}.json
```

## UI Components

### Import Modal

New component: `src/components/ImportModal.tsx` + `ImportModal.module.css`

Layout:
- Modal overlay (same pattern as BlueprintEditor)
- Title: "Import Blueprint"
- Textarea: monospace font, placeholder text showing a minimal example
- File picker: "or load from file" with `.json` accept filter
- Import button (disabled until valid JSON detected)
- Cancel button
- Validation feedback area: shows errors in red, success preview in green (blueprint name + module summary)

### Export Feedback

No new component needed. Use a brief inline confirmation on the card/button that triggered export. Fade after 2 seconds. No toast library — keep dependencies minimal.

## Implementation Plan

### New Files

| File | Purpose |
|------|---------|
| `src/services/blueprint_io.ts` | `exportBlueprint()`, `exportCollection()`, `validateBlueprint()`, `validateCollection()`, `importFromJSON()` |
| `src/services/__tests__/blueprint_io.test.ts` | Validation tests |
| `src/components/ImportModal.tsx` | Import UI |
| `src/components/ImportModal.module.css` | Import modal styles |

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Add import button in toolbar, import modal state, `handleImport()` callback |
| `src/components/BlueprintCard.tsx` | Add export button per card |
| `src/components/Header.tsx` | Add "Import" and "Export All" buttons |
| `src/types/index.ts` | Add `BlueprintExport`, `CollectionExport`, `ImportResult` types |

### Tests

`blueprint_io.test.ts` should cover:

- Valid single blueprint roundtrip (export → import → compare)
- Valid collection roundtrip
- Reject missing `type` field
- Reject incompatible version (`"2.0"`)
- Reject missing required modules (`stlEngine` null)
- Reject invalid ticker (`"FAKE"` in stlEngine slot)
- Accept null optional fields (no FTL, no shields)
- Name collision appends ` (imported)`
- Name truncation at 50 chars
- Malformed JSON (not an object, missing fields)

## Edge Cases

- **Empty collection** — valid but imports nothing. Show "No blueprints found in collection."
- **Duplicate names in collection** — each gets ` (imported)`, second duplicate gets ` (imported 2)`, etc.
- **Whitespace in textarea** — trim before parsing.
- **BOM in file** — strip UTF-8 BOM if present before JSON.parse.
- **Very large paste** — no hard limit, but if JSON.parse throws, catch and show "Invalid JSON" error.

## Related

- **Permalink sharing** (`drydock.cc/?bp=...`) — URL-encoded blueprint sharing is specified separately in `PERMALINK_SPEC.md`.
- **Import from game clipboard** — the in-game BLU command doesn't export to a parseable format. Not feasible.
- **Cloud sync** — DryDock is client-side only. No accounts, no server.

## Reference

- PrUnderground pattern: `app/services/json_io.py` — versioned schema, type-routed import, validation pipeline
- DryDock types: `src/types/index.ts` — `Blueprint`, `ModuleSelections`
- Module validation source: `src/data/modules.ts` — all valid tickers per slot
