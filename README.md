# ⬡ DryDock

Ship blueprint cost calculator for [Prosperous Universe](https://prosperousuniverse.com).

Design a ship. See what it costs. Find the cheapest exchange to buy parts. Share builds with a link.

**LIVE HERE → [drydock.cc](https://drydock.cc)**

## What it does

1. Select ship modules from dropdowns (same layout as in-game BLU command)
2. Auto-calculates derived components (structure, hull plates, shields, emitters, bridge, crew quarters)
3. Prices the full Bill of Materials across all 6 commodity exchanges
4. Shows cherry-pick sourcing (buy each part where it's cheapest)
5. Share blueprints as compact URLs — paste into Discord, forums, or chat

## Sharing

Every blueprint can be shared as a URL:

```
https://drydock.cc/?bp=1-012241&n=FTL+Hauler
```

Click **Share** on any blueprint card or in the editor to copy the link. Opening a shared link auto-imports the blueprint.

## Tech

- React + TypeScript + Vite
- Hosted on Cloudflare Pages
- Uses [FIO API](https://doc.fnar.net) for material data and CX pricing
- No backend, no accounts — runs entirely in your browser
- Design derived from 27bit Industries internal **APEX_** tool.
  
## Development

```bash
npm install
npm run dev
npm test        # 129 tests (formulas, import/export, permalinks)
```

## Formulas

All blueprint formulas were reverse-engineered from in-game testing across 13 ship configurations. See [`spec/SHIP_BLUEPRINT_BUILDER_SPEC.md`](https://github.com/Zillatron27/drydock/blob/main/spec/SHIP_BLUEPRINT_BUILDER_SPEC.md) for the full derivation and verification data.

## Credits

Part of the 27bit Industries internal APEX_ tool.

Built with [Claude Code](https://claude.ai/code).
