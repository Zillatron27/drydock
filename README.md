# ⬡ DryDock

Ship blueprint cost calculator for [Prosperous Universe](https://prosperousuniverse.com).

Design a ship. See what it costs. Find the cheapest exchange to buy parts.

**→ [drydock.cc](https://drydock.cc)**

## What it does

1. Select ship modules from dropdowns (same layout as in-game BLU command)
2. Auto-calculates derived components (structure, hull plates, shields, emitters, bridge, crew quarters)
3. Prices the full Bill of Materials across all 6 commodity exchanges
4. Shows cherry-pick sourcing (buy each part where it's cheapest)

## Tech

- React + TypeScript + Vite
- Hosted on Cloudflare Pages
- Uses [FIO API](https://doc.fnar.net) for material data and CX pricing
- No backend, no accounts — runs entirely in your browser
- Uses the [APEX_](https://github.com/Zillatron27/APEX_) design system

## Development

```bash
npm install
npm run dev
```

## Formulas

All blueprint formulas were reverse-engineered from in-game testing across 13 ship configurations. See `spec/SHIP_BLUEPRINT_BUILDER_SPEC.md` for the full derivation and verification data.

## Credits

Part of the APEX_ ecosystem of Prosperous Universe community tools.

Built with [Claude Code](https://claude.ai/code).
