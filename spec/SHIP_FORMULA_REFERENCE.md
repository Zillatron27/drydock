# Ship Blueprint Formulas — Reference Guide

**Last Updated:** 2026-03-23
**DryDock Version:** 1.3.0
**Validation:** 17+ purpose-built test blueprints plus 52 player ship blueprints

This document describes how Prosperous Universe calculates ship stats from a blueprint's module selections. These formulas were reverse-engineered by building isolation blueprints in-game, varying one module at a time, and recording the results. Every formula has been validated against real in-game data with zero error.

This is the reference used by [DryDock](https://drydock.cc), a community ship blueprint cost calculator.

---

## Volume — The Delta Model

Ship volume is the foundation — most other auto-calculated values derive from it. However, volume can't be calculated by simply adding up per-module volumes. Each module's contribution depends on the full ship configuration because auto-computed components (structure, plates, shields, emitters) cascade from total volume.

Instead, volume is calculated using a **delta model**: start from a known reference ship, then apply per-slot deltas when modules differ from the reference.

### Reference Ship

| Slot | Module | Ticker |
|------|--------|--------|
| STL Engine | Standard | ENG |
| STL Fuel Tank | Small | SSL |
| FTL Reactor | Standard | RCT |
| FTL Fuel Tank | Small | SFL |
| Cargo Bay | Small | SCB |
| Hull Plates | Basic | BHP |

**Reference volume: 963 m³**

### Volume Deltas

For each slot, the delta is the volume difference when swapping from the reference module to the selected module.

**STL Engine**

| Module | Ticker | Delta |
|--------|--------|-------|
| Standard | ENG | 0 |
| Fuel-saving | FSE | −1 |
| Glass | GEN | −1 |
| Advanced | AEN | +3 |
| Hyperthrust | HTE | +7 |

**STL Fuel Tank**

| Module | Ticker | Delta |
|--------|--------|-------|
| Small | SSL | 0 |
| Medium | MSL | +126 |
| Large | LSL | +410 |

**FTL Reactor**

| Module | Ticker | Delta |
|--------|--------|-------|
| Standard | RCT | 0 |
| Quick-charge | QCR | +7 |
| High-power | HPR | +117 |
| Hyper-power | HYR | +127 |

**FTL Fuel Tank**

| Module | Ticker | Delta |
|--------|--------|-------|
| Small | SFL | 0 |
| Medium | MFL | +6 |
| Large | LFL | +18 |

**Cargo Bay**

| Module | Ticker | Delta |
|--------|--------|-------|
| Tiny | TCB | −420 |
| Very Small | VSC | −262 |
| Small | SCB | 0 |
| Medium | MCB | +525 |
| Large | LCB | +1575 |
| High-Load | WCB | +525 |
| High-Volume | VCB | +2625 |
| Huge | HCB | +4725 |

**Hull Plates, Shields, Drones, High-G Seats:** All have **zero volume delta**. These modules affect mass only.

### STL-Only Ships

When both FTL Reactor and FTL Fuel Tank are empty (no FTL capability), apply an additional **−129** volume delta. This removes the reference ship's FTL contribution from the total.

### Calculating Total Volume

```
total_volume = 963 + sum(all applicable deltas)

If no FTL reactor and no FTL fuel tank:
    total_volume += (−129)
```

### Worked Example

**Ship:** FSE + LSL + LCB + LHP, no FTL

```
Reference:           963
FSE (STL Engine):     −1
LSL (STL Fuel Tank): +410
LCB (Cargo Bay):    +1575
LHP (Hull Plates):     0
No FTL:             −129
                    ────
Total:              2818 m³
```

Validated: matches in-game BLU display exactly.

---

## Structure (SSC)

Every ship needs structural components to hold it together. The count scales linearly with volume.

```
SSC_count = ceil(volume / 21)
```

The divisor is **21**, not 20 (a common community assumption that was wrong). Validated across 52 ships.

---

## Hull Plates

The number of hull plates is determined by a surface area approximation. The formula is the same regardless of which plate type is selected — the type only determines the material ticker in the BOM.

```
plate_count = ceil(volume^(2/3) / 2.07)
```

The divisor is **2.07**, not 2.06 or 2.0. Validated across 52 ships with all five plate types.

---

## Shield Components

Each equipped shield type requires the same number of units as the hull plate count.

```
shield_count_per_type = plate_count
```

Only shields the player has selected are included in the BOM. A ship with Heat Shielding and Radiation Shielding equipped gets `plate_count` units of each. A ship with no shields gets none.

---

## Crew Quarters

Crew quarters are auto-assigned based on total ship volume. Not player-selectable.

| Volume | Crew Quarters | Ticker |
|--------|---------------|--------|
| < 1000 | Tiny | CQT |
| < 1750 | Small | CQS |
| < 2750 | Medium | CQM |
| ≥ 2750 | Large | CQL |

The thresholds are **1000, 1750, 2750**. These were determined by building 17 purpose-built test blueprints that systematically varied volume across the full range, with and without FTL modules. The thresholds are universal — they do not differ between STL-only and FTL-capable ships.

### Validation Data

| Volume | CQ (in-game) | Blueprint |
|--------|--------------|-----------|
| 543 | CQT | TCB, FTL |
| 701 | CQT | VSC, FTL |
| 834 | CQT | SCB, no FTL |
| 963 | CQT | Reference (SCB, FTL) |
| 1089 | CQS | SCB + MSL, FTL |
| 1359 | CQS | MCB, no FTL |
| 1488 | CQS | MCB, FTL |
| 1614 | CQS | MCB + MSL, FTL |
| 1769 | CQM | MCB + LSL, no FTL |
| 1898 | CQM | MCB + LSL, FTL |
| 2409 | CQM | LCB, no FTL |
| 2538 | CQM | LCB, FTL |
| 2664 | CQM | LCB + MSL, FTL |
| 2671 | CQM | LCB + MSL + HTE, FTL |
| 2695 | CQM | LCB + MSL + HTE + QCR + LFL, FTL |
| 2780 | CQL | LCB + MSL + HPR + FSE, FTL |
| 2781 | CQL | LCB + MSL + HPR, FTL |
| 2818 | CQL | LCB + LSL + FSE + LHP, no FTL |
| 3588 | CQL | VCB, FTL |
| 5688 | CQL | HCB, FTL |

Every data point fits thresholds of 1000/1750/2750. The tightest brackets are 963/1089 around 1000, 1614/1769 around 1750, and 2695/2780 around 2750. Exact threshold values cannot be tested because the module system produces discrete volumes — there is no module combination that produces a volume of exactly 1000, 1750, or 2750.

---

## Command Bridge

Auto-assigned based on FTL reactor type. Not player-selectable.

| FTL Reactor | Bridge | Ticker |
|-------------|--------|--------|
| None | Short-distance | BRS |
| Standard (RCT) | MK1 | BR1 |
| Quick-charge (QCR) | MK1 | BR1 |
| High-power (HPR) | MK2 | BR2 |
| Hyper-power (HYR) | MK2 | BR2 |

Validated across 52 ships.

---

## FTL Field Controller

```
FFC = 1 if FTL reactor equipped, else 0
```

---

## FTL Emitters — Diminishing-Multiplier Algorithm

FTL ships need field emitters to create the FTL field around the ship. Larger ships need more emitters, but the algorithm isn't simple division — it uses a diminishing multiplier that makes the residual coverage cheaper as the ship gets larger.

Only calculated when an FTL reactor is equipped.

### Constants

| Constant | Value | Meaning |
|----------|-------|---------|
| LFE_SPAN | 1000 | Volume covered by one large emitter |
| MFE_SPAN | 500 | Effective span of medium emitters (in working units) |
| SFE_SPAN | 250 | Effective span of small emitters (in working units) |
| BASE_D | 10 | Base divisor for diminishing multiplier |
| MULTIPLIER | 20 | Numerator for diminishing multiplier |

### Algorithm

```
Step 1: Large emitters cover full 1000 m³ blocks
    LFE = floor(volume / 1000)
    remainder = volume mod 1000

Step 2: If no remainder, done
    If remainder == 0: return { LFE, MFE: 0, SFE: 0 }

Step 3: Scale remainder by diminishing multiplier
    working = (remainder × 20) / (10 + LFE)

Step 4: Medium emitters cover 500-unit blocks of working value
    MFE = floor(working / 500)
    leftover = working − (MFE × 500)

Step 5: Small emitters cover the rest
    SFE = ceil(leftover / 250) if leftover > 0, else 0

Return { LFE, MFE, SFE }
```

### How the Diminishing Multiplier Works

The key insight is in Step 3. The remainder volume is multiplied by `20 / (10 + LFE)`. As the ship gets larger and gains more large emitters, this fraction gets smaller, meaning the residual volume needs proportionally fewer medium and small emitters to cover. This prevents emitter counts from scaling linearly with volume.

### Worked Examples

**Volume = 963 m³** (reference ship)
1. LFE = floor(963 / 1000) = 0
2. remainder = 963
3. working = (963 × 20) / (10 + 0) = 1926
4. MFE = floor(1926 / 500) = 3
5. leftover = 1926 − 1500 = 426
6. SFE = ceil(426 / 250) = 2
7. **Result: 0 LFE, 3 MFE, 2 SFE**

**Volume = 2538 m³** (LCB FTL ship)
1. LFE = floor(2538 / 1000) = 2
2. remainder = 538
3. working = (538 × 20) / (10 + 2) = 896.67
4. MFE = floor(896.67 / 500) = 1
5. leftover = 896.67 − 500 = 396.67
6. SFE = ceil(396.67 / 250) = 2
7. **Result: 2 LFE, 1 MFE, 2 SFE**

**Volume = 5688 m³** (HCB FTL ship)
1. LFE = floor(5688 / 1000) = 5
2. remainder = 688
3. working = (688 × 20) / (10 + 5) = 917.33
4. MFE = floor(917.33 / 500) = 1
5. leftover = 917.33 − 500 = 417.33
6. SFE = ceil(417.33 / 250) = 2
7. **Result: 5 LFE, 1 MFE, 2 SFE**

Validated across 47 FTL ships.

---

## Operating Empty Mass

Ship mass is the exact sum of `bomWeight × quantity` for every component in the bill of materials:

- Selectable modules: 1 unit each
- Hull plates: `plate_count` units
- Each equipped shield type: `plate_count` units
- SSC: `SSC_count` units
- Bridge: 1 unit
- Crew quarters: 1 unit
- FFC: 1 unit (if FTL)
- Emitters: LFE/MFE/SFE counts (if FTL)
- Optional equipment (drones, high-G seats): 1 unit each

Per-module BOM weights are available from the game's data files. This formula produces exact mass values — validated with zero error across 24 in-game blueprints.

---

## Build Time

```
build_time_hours = mass / 50
```

The in-game display rounds to the nearest hour with a `~` prefix.

---

## Complete BOM Assembly

The full Bill of Materials for a ship blueprint is assembled by combining:

1. **Selectable modules** — 1 unit of each selected module (engine, fuel tanks, cargo bay, reactor, shields, drones, seats)
2. **Hull plates** — `plate_count` units of the selected hull plate type
3. **Shield components** — `plate_count` units of each selected shield type
4. **SSC** — `ceil(volume / 21)` structural components
5. **Bridge** — 1 unit of the appropriate bridge type (BRS/BR1/BR2)
6. **Crew quarters** — 1 unit of the appropriate size (CQT/CQS/CQM/CQL)
7. **FFC** — 1 FTL field controller (if FTL reactor equipped)
8. **Emitters** — LFE/MFE/SFE counts from the diminishing-multiplier algorithm (if FTL reactor equipped)

---

## What's NOT Covered

- **Vortex modules** (VOR, VOE, VFT) — colony ship components, excluded from this analysis
- **Habitation Module** (HAM) — colony ship only
- **Operating empty mass formula from first principles** — we can calculate exact mass from BOM weights, but the game may use a different internal formula. The BOM summation approach is validated and accurate.

---

## Sources

- **PrUn Handbook:** [Shipbuilding tutorial](https://handbook.apex.prosperousuniverse.com/tutorials/legacy-tutorials/shipbuilding/index.html) — module descriptions, slot layout, and auto-component explanations.
- **PCT (PrUn Community Derived Information):** [Ship Blueprints](https://pct.fnar.net/ship-blueprints/index.html) — community-maintained wiki with prior work on component volumes, SSC formula, build time, and emitter constants.
- **Module data:** Wire-captured from PrUn WebSocket traffic via APEX_/PrUn-Link (Feb 2026)
- **Volume delta model:** Derived from 29 isolation blueprints, validated against 23 player blueprints (Feb 2026)
- **Auto-computed formulas:** Derived from 52 regular ship blueprints via systematic pattern analysis (Feb 2026)
- **CQ thresholds:** Validated via 17 purpose-built test blueprints with binary search methodology (Mar 2026). Original bug identified by **Shrewdsun** — reported that an LCB STL freighter with a Large STL Fuel Tank was assigned CQL in-game but CQM in DryDock, which led to the discovery that all three CQ boundaries were incorrect.
- **Emitter algorithm structure:** Original description from **molp** ([PrUn Community Forum, Oct 2022](https://com.prosperousuniverse.com/t/minor-issues-and-ship-emitter-count-questions/5196)); constants and diminishing-multiplier behaviour reverse-engineered (Feb 2026)
- **Shield/plate count parity:** **RNGzero**'s Ship Repair Calc spreadsheet, confirmed via WebSocket data

---

*Built by [27bit.dev](https://27bit.dev) for the Prosperous Universe community.*
