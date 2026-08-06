# Changelog

## 1.5.0 — Exact Ship Formulas (2026-08-06)

Every derived-component formula now matches the game exactly, verified by a
24-blueprint in-game survey (thanks to community reports from raylu, SLKLS,
and xSupeFly — issues #4, #5, #6, #7).

### Bug Fixes
- Bridge rule: STL-only ships with Advanced (AEN) or Hyperthrust (HTE) engines now correctly get a BR2 bridge instead of BRS; FTL bridges now require both a reactor and an FTL fuel tank
- Bridge volume feedback: non-FTL BR2 ships are +210 m³ larger, which cascades into crew quarters, hull plates, SSC, mass, and build time
- Crew quarters thresholds corrected to 945/1700/2700 (was 1000/1750/2750) — fixes the starter ship (CQS, not CQT) and the AEN clipper misidentifications
- Volume model rebuilt with fractional (half-integer) module deltas and floor(), matching the in-game BLU display exactly — eliminates a class of off-by-one volume/SSC errors (e.g. HTE ships)

### Technical
- New in-game ground-truth regression suite: 24 blueprints with volume, bridge, crew quarters, SSC, and mass assertions from BLU screenshots
- New 561-combination regression suite vendored from PUNoted (MIT)
- Formula reference spec rewritten: fractional deltas, floor rule, bridge rule with volume feedback, CQ boundary evidence

## 1.4.0 — Cherry-Pick Filter, Discord Embeds, CQ Fix (2026-03-23)

### Features
- Cherry-pick exchange filter — exchange badges in the cherry-pick pane are now clickable toggles to exclude exchanges from sourcing
- Disabled exchanges appear visually muted; cherry-pick total, sourcing, status, and ACT generation recalculate live
- At least one exchange must remain enabled (last badge won't toggle off)
- Filter persists to localStorage as a user preference across sessions and blueprints
- Discord embed previews — sharing a permalink in Discord now shows ship name, module tickers, and amber accent bar via Open Graph meta tags

### Bug Fixes
- Fix crew quarters volume thresholds: corrected to 1000/1750/2750 (was 834/2533/3587), validated against 17 in-game blueprints
- Ships with volume 2750–3587 now correctly assign CQL instead of CQM

### Technical
- Server-side Umami analytics via Cloudflare Worker (no client-side scripts or cookies)
- Worker injects OG meta tags for `?bp=` permalink requests
- `cherryPickPricing()` and `depthCherryPickPricing()` accept optional `enabledExchanges` filter parameter
- Strengthened formula tests with exact mass verification and CQ regression case

## 1.2.0 — Pricing Modes: Full Depth (2026-03-04)

### Features
- Add Full Depth pricing mode — walks the order book to show blended costs and realistic availability
- Toggle between Best Price (cheapest ask) and Full Depth (order book walk) above exchange cards
- Full Depth exchange totals reflect actual cost to fill BOM quantities across all price tiers
- Full Depth availability counts show total supply across all ask levels, not just at best price
- Cherry-pick in Full Depth mode selects cheapest blended cost per material across exchanges
- Pricing mode persists to localStorage across sessions

### Bug Fixes
- Fix ACT package names — sanitize to ASCII-safe characters so rPrun's command parser doesn't reject on execute
- Fix pricing mode toggle color to use `--accent` token instead of undefined `--color-amber`
- Increase toggle button size for readability

### Technical
- Cache processed order book depth (sorted ask/bid tiers) alongside existing FIO exchange data
- New `depth_pricing.ts` service with `fillFromOrderBook`, `depthPriceBlueprint`, `depthCherryPickPricing`
- Unit tests for order book walking algorithm and depth pricing functions

## 1.1.1 — Fix Availability Counts (2026-03-03)

### Bug Fixes
- Fix availability counts showing only a single order instead of total units at the best price
- Switch from FIO `/exchange/all` to `/exchange/full` and aggregate all orders at the best ask/bid price
- Example: LHP on CI1 with 3 ASK orders at 3,990 (50 + 48 + 11) now correctly shows 109 available

## 1.1.0 — Remove Inactive Exchanges (2026-03-03)

### Changes
- Remove CI2 and NC2 exchanges — no meaningful trading activity
- Pricing cards, BOM table, and cherry-pick sourcing now show 4 active exchanges (AI1, CI1, IC1, NC1)
- Reduces visual noise and makes cherry-pick results more useful

## 1.0.3 — Settings & Accessibility (2026-02-28)

### Features
- Add SET menu with accessibility settings panel
- Font size selector (Default / Medium / Large / Extra Large) with live preview
- High contrast mode — boosts secondary text, muted text, and border visibility
- Settings persist to localStorage and apply instantly
- Reset to Defaults button restores original appearance
- Add Edit and Duplicate buttons to blueprint cards
- Restyle header buttons — Load Examples and SET now match Import/Export styling

### Bug Fixes
- Fix font fallback stacks — `cursive` and bare `monospace` replaced with proper system font stacks
- Remove redundant standalone Edit button from detail view (now on cards)

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
