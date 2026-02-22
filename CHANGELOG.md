# Changelog

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
