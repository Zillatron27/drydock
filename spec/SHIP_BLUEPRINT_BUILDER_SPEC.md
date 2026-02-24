# Ship Blueprint Builder — Feature Spec

## What Is This?

A custom ship blueprint cost calculator. Users design a ship by selecting modules from dropdowns (mirroring the in-game BLU command), the system calculates the full BOM, then prices it across all 6 exchanges with cherry-pick sourcing and ACT package generation.

## Why Build This?

The existing community tools don't do ship BOM cost analysis with exchange sourcing. The in-game blueprint editor shows you what materials you need, but doesn't tell you where to buy them cheaply or generate action packages for purchasing.

## User Flow

1. **Shipyard page** shows existing blueprint cards plus an empty card with "+" icon
2. User clicks "+" → **Blueprint Editor modal** opens
3. User selects modules from dropdowns (same layout categories as in-game BLU command)
4. System calculates derived components (structure, hull plates, shields, emitters, bridge, crew) in real-time as selections change
5. **Stats panel** shows computed ship performance (volume, mass, build time, cargo, drive stats, shielding)
6. **BOM preview** at bottom shows the full material list with counts
7. User names the blueprint and clicks **Save**
8. Blueprint appears as a new card alongside preset and imported blueprints
9. Clicking it triggers exchange analysis — exchange cards, cherry-pick, ACT packages

## Blueprint Editor Layout

The editor mirrors the in-game blueprint structure. Three sections:

### Section 1: Selectable Modules

All tickers verified against FIO `/material/allmaterials` endpoint. Each row is a dropdown. "—" means none selected (optional slots).

**Drive System**

| Slot | Options | Ticker | Required? |
|------|---------|--------|-----------|
| STL Engine | Standard, Fuel-saving, Glass, Advanced, Hyperthrust | ENG, FSE, GEN, AEN, HTE | Yes |
| STL Fuel Tank | Small, Medium, Large | SSL, MSL, LSL | Yes |
| FTL Reactor | —, Standard, Quick-charge, High-power, Hyper-power | RCT, QCR, HPR, HYR | No |
| FTL Fuel Tank | —, Small, Medium, Large | SFL, MFL, LFL | No (required if FTL) |

*Vortex Reactor, Vortex Engine, and Vortex Fuel Tank (VOR, VOE, VFT) exist as blueprint slots but are colony ship-only. Excluded from v1.*

**Cargo**

| Slot | Options | Ticker | Required? |
|------|---------|--------|-----------|
| Cargo Bay | Tiny, Very Small, Small, Medium, Large, High-Load, High-Volume, Huge | TCB, VSC, SCB, MCB, LCB, WCB, VCB, HCB | Yes |

**Hull & Shielding** (type selection — count auto-calculated for plates/shields)

| Slot | Options | Ticker | Required? |
|------|---------|--------|-----------|
| Hull Plates | Basic, Lightweight, Reinforced, Hardened, Advanced | BHP, LHP, RHP, HHP, AHP | Yes |
| Heat Shielding | —, Basic, Advanced | BPT, APT | No |
| Whipple Shielding | —, Basic, Advanced | BWH, AWH | No |
| Stability System | —, Stability Support System | STS | No |
| Radiation Shielding | —, Basic, Specialized, Advanced | BRP, SRP, ARP | No |

**Optional Equipment** (fixed quantity — 1 unit each, no volume contribution)

| Slot | Options | Ticker | Required? |
|------|---------|--------|-----------|
| Self-repair Drones | —, Small, Large | RDS, RDL | No |
| High-G Seats | —, Basic, Advanced | BGS, AGS | No |

These modules add mass but NOT volume. They appear as 1× in the BOM when selected. Confirmed: adding AGS to a 5837m³ ship changes mass (1862t→1892t) but volume, SSC, plates, and emitters all remain unchanged.

### Section 2: Auto-calculated Components (read-only display)

These are computed from the module selections and displayed as read-only rows:

| Component | Formula | Material | Condition |
|-----------|---------|----------|-----------|
| Structure | `ceil(volume / 21)` | SSC | Always |
| Hull Plates | `ceil(volume^(2/3) / 2.07)` | Same as hull plate selection | Always |
| Shield Components | `ceil(volume^(2/3) / 2.07)` per type | Same as each shield selection | Per equipped shield |
| FTL Field Controller | 1 | FFC | If FTL reactor equipped |
| Small FTL Emitters | Diminishing-multiplier algorithm | SFE | If FTL reactor equipped |
| Medium FTL Emitters | Diminishing-multiplier algorithm | MFE | If FTL reactor equipped |
| Large FTL Emitters | Diminishing-multiplier algorithm | LFE | If FTL reactor equipped |
| Command Bridge | 1 | BRS/BR1/BR2 (by FTL reactor type) | Always |
| Crew Quarters | 1 | CQT/CQS/CQM/CQL (by volume thresholds) | Always |

### Section 3: BOM Preview

Real-time material list with quantities, updated as selections change. Same badge-style display as the in-game BLU command bottom section.

## Core Calculations

### Volume — Delta Model

Volume cannot be calculated from absolute per-module values. Each module's contribution depends on the full ship configuration due to auto-computed component cascades (SSC, plates, shields, emitters all derive from total volume). Instead, DryDock uses a **delta model**: a validated reference ship plus per-slot deltas.

**Reference ship:** ENG + SSL + RCT + SFL + SCB + BHP = **963 m³** (827.8 t)

For each slot, the delta is the volume difference when swapping from the reference module to the selected module. The total volume is the reference volume plus all applicable deltas.

**STL Engine deltas:**

| Option | Ticker | Volume Δ |
|--------|--------|----------|
| Standard | ENG | 0 |
| Fuel-saving | FSE | −1 |
| Glass | GEN | −1 |
| Advanced | AEN | +3 |
| Hyperthrust | HTE | +7 |

**STL Fuel Tank deltas:**

| Option | Ticker | Volume Δ |
|--------|--------|----------|
| Small | SSL | 0 |
| Medium | MSL | +126 |
| Large | LSL | +410 |

**FTL Reactor deltas:**

| Option | Ticker | Volume Δ |
|--------|--------|----------|
| Standard | RCT | 0 |
| Quick-charge | QCR | +7 |
| High-power | HPR | +117 |
| Hyper-power | HYR | +127 |

**FTL Fuel Tank deltas:**

| Option | Ticker | Volume Δ |
|--------|--------|----------|
| Small | SFL | 0 |
| Medium | MFL | +6 |
| Large | LFL | +18 |

**Cargo Bay deltas:**

| Option | Ticker | Volume Δ |
|--------|--------|----------|
| Tiny | TCB | −420 |
| Very Small | VSC | −262 |
| Small | SCB | 0 |
| Medium | MCB | +525 |
| Large | LCB | +1575 |
| High-Load | WCB | +525 |
| High-Volume | VCB | +2625 |
| Huge | HCB | +4725 |

**Hull, shields, drones, seats:** All have **0 volume delta** (they affect mass only, not volume).

**STL-only ships:** When both FTL reactor and FTL fuel tank are null, apply an additional **−129** volume delta (the reference FTL contribution is subtracted).

**Validation:** 23 in-game blueprints with zero error. The delta model supersedes the absolute per-module volumes from PCT, which produced inconsistencies due to unaccounted auto-computed cascades.

### Structure (SSC)

```
SSC_count = ceil(total_volume / 21)
```

Validated 52/52 regular ships.

### Hull Plates

```
plate_count = ceil(total_volume ^ (2/3) / 2.07)
```

The plate count is the same regardless of plate type (BHP, LHP, RHP, HHP, AHP). The type only determines which material ticker goes into the BOM. Validated 52/52.

### Shield Components

Each equipped shield type adds materials equal to the plate count:

```
shield_count = plate_count  (same formula, same count)
```

Only shields the user selected are included.

### FTL Emitters — Diminishing-Multiplier Algorithm

This algorithm determines how many large, medium, and small FTL field emitters a ship needs. Validated 47/47 FTL ships.

**Constants:**
- LFE_SPAN = 1000
- MFE_SPAN = 500
- SFE_SPAN = 250
- BASE_D = 10
- MULTIPLIER = 20

**Algorithm:**

```
LFE = floor(volume / LFE_SPAN)
remainder = volume % LFE_SPAN

if remainder == 0:
    return { small: 0, medium: 0, large: LFE }

working = (remainder × MULTIPLIER) / (BASE_D + LFE)
MFE = floor(working / MFE_SPAN)
leftover = working - MFE × MFE_SPAN
SFE = ceil(leftover / SFE_SPAN) if leftover > 0 else 0

return { small: SFE, medium: MFE, large: LFE }
```

**How it works:** Large emitters cover 1000 m³ each. The remaining volume is scaled by a diminishing multiplier — `20 / (10 + large_count)` — that makes the residual coverage *cheaper* as the ship gets larger. This scaled value is then divided among medium (500 units) and small (250 units) emitters.

**Worked example (volume = 5688):**
1. LFE = floor(5688 / 1000) = 5
2. remainder = 5688 % 1000 = 688
3. working = 688 × 20 / (10 + 5) = 917.33
4. MFE = floor(917.33 / 500) = 1
5. leftover = 917.33 − 500 = 417.33
6. SFE = ceil(417.33 / 250) = 2
7. Result: 2 SFE, 1 MFE, 5 LFE ✓

Only calculated if FTL reactor is selected.

### Mass — BOM Weight Summation

Ship mass is the sum of `bomWeight × quantity` for every component in the bill of materials. This includes selectable modules (1 unit each), hull plates and shields (plate_count units each), auto-computed components (SSC, bridge, crew quarters, FFC, emitters), and optional equipment (1 unit each).

Per-module BOM weights are captured from the game's WebSocket data (`moduleStats.ts`). This produces **exact** mass values — validated with zero error across 24 in-game blueprints.

Mass is NOT a "known unknown" — the previous uncertainty was because absolute per-module volumes were used, which caused cascading errors in auto-computed component counts. The delta model eliminates this.

### Build Time

```
build_time_hours = mass / 50
```

Validated against in-game data.

### Command Bridge

Auto-assigned by the game based on FTL reactor type. Not user-selectable.

```
No FTL reactor → BRS (Short-distance Command Bridge)
RCT or QCR    → BR1 (Command Bridge MK1)
HPR or HYR    → BR2 (Command Bridge MK2)
```

Validated 52/52 ships.

### Crew Quarters

Auto-assigned by the game based on total volume. Not user-selectable.

| Volume ≤ | Crew Quarters | Ticker |
|----------|---------------|--------|
| 834 | Tiny | CQT |
| 2533 | Small | CQS |
| 3587 | Medium | CQM |
| > 3587 | Large | CQL |

Validated 52/52 ships. Note: these thresholds are NOT round numbers. The previous approximation (1000/2000/3000) was wrong for ships near the boundaries.

### FTL Field Controller

```
FFC_count = 1 if FTL reactor equipped, else 0
```

Validated 52/52 ships.

## Data Architecture

### Static Module Catalog

TypeScript object mapping slots → options → properties. Lives in `src/data/modules.ts`.

### Module Performance Stats

Wire-captured data from PrUn's WebSocket traffic. Lives in `src/data/moduleStats.ts`. Contains per-module BOM weight, BOM volume, and modifier values (thrust, cargo capacity, fuel consumption, shielding percentages, etc.).

### Custom Blueprint Storage

Blueprints are stored in the browser's localStorage as JSON. No server-side storage.

## Resolved (from systematic testing — 52 regular ships)

| Item | Resolution |
|------|------------|
| SSC formula | `ceil(V/21)` — 52/52 verified |
| Hull plate formula | `ceil(V^(2/3) / 2.07)` — 52/52 verified |
| Command Bridge assignment | Reactor-dependent: no FTL→BRS, RCT/QCR→BR1, HPR/HYR→BR2 — 52/52 verified |
| Crew Quarters assignment | Volume thresholds: ≤834→CQT, ≤2533→CQS, ≤3587→CQM, >3587→CQL — 52/52 verified |
| FFC rule | 1 if FTL reactor, else 0 — 52/52 verified |
| Emitter algorithm | Diminishing-multiplier: `working = rem × 20/(10+LFE)` — 47/47 FTL ships verified |
| Volume model | Delta model from reference ship (963 m³) — 23 blueprints verified with zero error |
| Mass formula | Exact BOM weight summation — 24 blueprints verified with zero error |
| Build time | `mass / 50` — confirmed |
| HCB volume delta | +4725 from reference — verified |
| Auxiliary module volumes | Do NOT contribute volume. AGS adds 30t mass but volume/SSC/plates/emitters unchanged |
| Stability System ticker | STS (stabilitySupportSystem) — in FIO under "electronic systems" category |
| Vortex modules | Colony ships only — excluded from v1 |
| Shield count = plate count | Confirmed — AWH=157=LHP on 5838m³ ship; APT=90=LHP on 2534m³ ship |
| Blueprint slot layout | Confirmed from screenshots — selectable slots + auto-calculated rows |
| Bridge/crew selectability | NOT user-selectable — auto-assigned by game, formulas derived |
| Hull plate divisor universal | Confirmed — 2.07 works for all plate types |
| Game volume display off-by-one | Occurs on some ships but not all. Use calculated sum for formulas |

## Sources

- **Module performance data:** Wire-captured from PrUn WebSocket traffic via APEX_/PrUn-Link (Feb 2026)
- **Volume delta model:** Derived from 29 isolation blueprints + validated against 23 player blueprints
- **Auto-computed formulas:** Derived from 52 regular ship blueprints via systematic pattern analysis
- **Emitter algorithm structure:** Original greedy algorithm from game developer molp (PrUn Community Forum, Oct 2022); constants and diminishing-multiplier behavior reverse-engineered Feb 2026
- **Shield/plate count parity:** RNGzero's Ship Repair Calc spreadsheet (confirmed via WebSocket data)
- **FIO material data:** FIO API `/material/allmaterials` endpoint
