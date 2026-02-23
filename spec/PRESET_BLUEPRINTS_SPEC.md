# DryDock: Preset Blueprints Spec

**Date:** 2026-02-23
**Target version:** 0.4.0
**Status:** Ready for implementation

## Overview

Ship DryDock with pre-loaded example blueprints so new visitors see real ship configurations immediately instead of an empty state. The preset data is already committed at `src/data/presets.ts`.

## Behaviour

### First Visit (Empty localStorage)

When `drydock_blueprints` is either absent from localStorage or is an empty array, automatically populate it with the four preset blueprints from `PRESET_BLUEPRINTS`. Each gets a fresh `crypto.randomUUID()` and its BOM calculated via `calculateBOM()`.

**Critical:** This must only happen when the user has zero blueprints. If they've deleted all their blueprints intentionally, we don't want presets silently reappearing on refresh. Use a separate localStorage flag to distinguish "never visited" from "deleted everything":

```
drydock_presets_loaded: "true"
```

Logic:
1. Load blueprints from localStorage
2. If empty AND `drydock_presets_loaded` is not `"true"`:
   - Generate blueprints from `PRESET_BLUEPRINTS` (UUID + calculateBOM for each)
   - Save to localStorage
   - Set `drydock_presets_loaded` to `"true"`
3. If empty AND flag is already set: show normal empty state

### "Load Examples" Button

Add a button in the empty state view (where it currently says "Click + to create your first blueprint"). This gives users who deleted the presets a way to get them back.

Label: **"Load example ships"** (not "Reset" — avoid implying data loss)

Behaviour:
1. Generate blueprints from `PRESET_BLUEPRINTS` (fresh UUIDs, fresh BOMs)
2. **Append** to existing blueprints (don't replace). If a blueprint with the same name already exists, append ` (preset)` to avoid confusion.
3. Save to localStorage

This button should also appear in the header/toolbar area as a secondary action when the user has blueprints, so it's always discoverable. Less prominent than Import — maybe in a "..." menu or just a small text link.

### Preset Visual Indicator

Presets should look identical to user-created blueprints. No special badges, no "preset" labels, no locked/read-only state. They're just blueprints that happened to arrive pre-made. Users can edit, rename, or delete them freely.

## Implementation

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Import `PRESET_BLUEPRINTS`. Add first-visit seeding logic in `loadBlueprints()`. Add "Load example ships" button in empty state. Add `handleLoadPresets()` callback. |

### Logic in `loadBlueprints()`

```typescript
import { PRESET_BLUEPRINTS } from './data/presets';
import { calculateBOM } from './formulas';

const STORAGE_KEY = 'drydock_blueprints';
const PRESETS_LOADED_KEY = 'drydock_presets_loaded';

function loadBlueprints(): Blueprint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Blueprint[];
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // Fall through to preset check
  }

  // Empty or missing — check if we should seed presets
  if (localStorage.getItem(PRESETS_LOADED_KEY) !== 'true') {
    const seeded = generatePresetsAsBlueprints();
    saveBlueprints(seeded);
    localStorage.setItem(PRESETS_LOADED_KEY, 'true');
    return seeded;
  }

  return [];
}

function generatePresetsAsBlueprints(): Blueprint[] {
  return PRESET_BLUEPRINTS.map(preset => ({
    id: crypto.randomUUID(),
    name: preset.name,
    moduleSelections: preset.modules,
    bom: calculateBOM(preset.modules),
  }));
}
```

### "Load Example Ships" Handler

```typescript
function handleLoadPresets() {
  const existingNames = new Set(blueprints.map(b => b.name));
  const newBlueprints = generatePresetsAsBlueprints().map(bp => ({
    ...bp,
    name: existingNames.has(bp.name) ? `${bp.name} (preset)` : bp.name,
  }));
  persist([...blueprints, ...newBlueprints]);
}
```

### Empty State Update

Replace the current empty state text with:

```
No blueprints yet.

[+ New Blueprint]  [Load example ships]
```

Both buttons. "New Blueprint" opens the editor (existing behaviour). "Load example ships" calls `handleLoadPresets()`.

## NOT in Scope

- **Preset descriptions in UI** — the `description` field in `presets.ts` is available for future use (tooltips, a preset picker modal) but doesn't need to surface yet. Just load them as regular blueprints.
- **Curated preset library** — four ships is enough for launch. More can be added to `presets.ts` later without any code changes.
- **Community-submitted presets** — requires a backend. Out of scope.

## Tests

No new test file needed. The preset data is validated implicitly by the existing formula tests (same module selections, same `calculateBOM()` path). If specific preset loading tests are desired:

- `generatePresetsAsBlueprints()` returns 4 blueprints with valid UUIDs and non-empty BOMs
- Name collision appends ` (preset)`
- First visit seeds presets, second visit with empty list does not
