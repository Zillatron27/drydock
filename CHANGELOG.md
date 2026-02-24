# Changelog

## 1.0.2 — Card Grid Fix (2026-02-24)

### Bug Fixes
- Cap blueprint card grid at 4 columns (was 5) by increasing minimum card width to 240px

## 1.0.1 — Card Layout Polish (2026-02-24)

### Bug Fixes
- Fix blueprint card header — stack name above Share/Export buttons so long names don't clash with action buttons
- Cap blueprint card grid at 4 columns using CSS grid with `max-width` constraint
- Name now truncates with ellipsis instead of pushing buttons off-screen

## 1.0.0 — Permalink Sharing (2026-02-24)

### Features
- Share blueprints as compact URLs — `drydock.cc/?bp=1-012241&n=Ship+Name`
- 12 module slots encoded as single digits, version-prefixed, with trailing zero trimming
- Share button on blueprint cards copies permalink to clipboard
- Share button in blueprint editor lets users share before saving
- Permalink import on page load — opening a link auto-creates the blueprint
- URL cleaned via `history.replaceState` after import (no re-import on refresh)
- Name collision handling appends `(shared)` suffix
- 43 new tests: roundtrips, preset blueprints, trailing zero trimming, validation rejection, name handling, SLOT_OPTIONS ordering guard

## 0.6.1 — Live Editor Stats (2026-02-23)

### Features
- Integrate StatsPanel into BlueprintEditor for live stat feedback while changing module selections
- Replace standalone volume summary with full stats dashboard (mass, build time, max G, cargo, drive, shielding)

## 0.6.0 — Ship Stats Dashboard (2026-02-23)

### Features
- Add StatsPanel between blueprint header and pricing — displays computed ship performance stats
- Ship overview: volume, mass, build time, max G
- Cargo section: volume and weight capacity from cargo bay
- STL drive: fuel usage and fuel capacity
- FTL drive (conditional): reactor power, charge factor, fuel capacity, emitter breakdown, volume span, power requirement
- Shielding (conditional): general, heat, whipple, gravity, radiation percentages
- Replace approximate ship model with validated wire-captured module data (bomWeight, bomVolume, modifiers)
- Mass calculation now uses exact BOM weight summation (zero error across 24 in-game blueprints)
- Volume calculation uses delta model validated against 23 in-game blueprints
- Emitter algorithm validated against 47 FTL ships

## 0.5.0 — Preset Blueprints (2026-02-23)

### Features
- Seed 4 pre-loaded "evo" ship configurations on first visit (LCB, WCB, VCB, HCB haulers)
- "Load example ships" button in empty state for users who cleared their blueprints
- "Examples" button in header to append presets at any time
- Name collision handling appends `(preset)` suffix when duplicates exist
- First-visit seeding respects user intent — deleted blueprints won't reappear on reload
- Responsive header layout with proper wrapping at mobile breakpoints

## 0.4.2 — FIO Category Alignment (2026-02-23)

### Bug Fixes
- Fix 18 material category classifications to match FIO API `/material/allmaterials`
- SSC now displays under Ship Parts instead of Construction Materials
- Fuel tanks (SSL/MSL/LSL, SFL/MFL/LFL) now classified as Ship Kits
- FTL emitters (SFE/MFE/LFE) now classified as Ship Engines
- High-G seats (BGS/AGS) now classified as Ship Parts
- Bridges (BRS/BR1/BR2) and crew quarters (CQT/CQS/CQM/CQL) now classified as Unit Prefabs
- Self-repair drones (RDS/RDL) now classified as Unit Prefabs
- Add `unit_prefabs` category with teal-grey color token from APEX_ design system

## 0.4.1 — Cherry Pick Cost Breakdown (2026-02-23)

### Features
- Per-exchange cost subtotals in cherry pick panel showing spend at each sourcing exchange
- Amber-bordered badges visually distinct from grey source count tags

## 0.4.0 — Blueprint Import/Export (2026-02-23)

### Features
- Export individual blueprints to clipboard via per-card Export button
- Export All blueprints to clipboard as a collection from header
- Download All blueprints as a `.json` file
- Import blueprints from clipboard paste or `.json` file upload
- Live validation with clear error messages for invalid JSON, wrong versions, bad tickers
- Name collision resolution: appends `(imported)` suffix automatically
- Versioned JSON schema (`drydock-blueprint` / `drydock-collection`) for forward compatibility
- 35 new tests covering roundtrips, rejection cases, edge cases, and collections

## 0.3.1 — Version Consolidation (2026-02-23)

### Features
- Consolidate version string to single source of truth (`src/version.ts`)
- Add CHANGELOG.md with backfilled release history
- Add deploy skill for automated build and Cloudflare Pages deployment

### Bug Fixes
- Fix exchange status logic and availability display to match APEX_
- Remove unused materialInfo import from BlueprintEditor

## 0.3.0 — Exchange Status Overhaul (2026-02-23)

### Features
- Add spinning hex icon to header during price loading
- Replace price-based "Best" marker with status-based card highlighting

### Bug Fixes
- Fix exchange status logic and availability display to match APEX_

## 0.2.0 — Comparison Table & Cherry-Pick (2026-02-22)

### Features
- Redesign cherry-pick panel to match APEX_ layout
- Add full/partial/incomplete status badges and build counter
- Replace BOM list with comparison table and add ACT copy
- Add retry button and better error display for price fetching

## 0.1.0 — Initial Release (2026-02-22)

### Features
- Ship blueprint builder with module selection
- Exchange pricing via FIO API
- Authoritative ship blueprint spec (13-ship verified formulas)
- Cloudflare Pages deployment via wrangler
- APEX_-themed UI with Vite + React + TypeScript
