# Ship Blueprint Formulas — Reference Guide

**Last Updated:** 2026-08-06
**DryDock Version:** 1.5.1
**Validation:** 65 purpose-built in-game blueprints across two campaigns — 41 (Feb–Mar 2026: module isolation swaps + CQ threshold search; 17 appear in the CQ validation table below) and 24 (Aug 2026: fraction survey + boundary probes, `src/formulas/__tests__/ingame_ships.test.ts`) — plus 52 real ship configurations and the 561-combination PUNoted test table (`src/formulas/__tests__/punoted_lookup.test.ts`)

This document describes how Prosperous Universe calculates ship stats from a blueprint's module selections. These formulas were reverse-engineered by building isolation blueprints in-game, varying one module at a time and recording the results. Formula's have been validated against the in-game data but may still contain errors. 

This model is used by [DryDock](https://drydock.cc).

---

## Volume

Most auto-calculated values derive from the ship's Volume. However, this can't be calculated by simply adding up per-module volumes. Each module's contribution depends on the full ship configuration because auto-computed components (structure, hull plates, shields, emitters) cascade from total volume.

Instead, volume is calculated using a **delta model**: starting from a known reference ship, then applying per-slot deltas when modules differ from the reference.

**Internal volumes are fractional; the display floors.** Several module volumes are half-integers, so the internal total can end in .5. The BLU screen shows `floor(total)`, and all downstream values (SSC, hull plates, crew quarters) are computed from the **floored** integer — proven by the HTE STL-only ship: internal 1050.5, displayed 1050, and in-game SSC is 50 = ceil(1050/21), not ceil(1050.5/21) = 51.

This also explains a systematic error in the March 2026 data: rows whose internal volume ended in .5 (701, 1359, 1485, 1488, 1614, 543, 1769, 3588, 5688) were recorded **rounded up** — they came off the wire as fractional values and were rounded at documentation time, while the in-game display floors. The internal values were correct; the recorded integers were 1 high.

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

Every delta below was pinned by a dedicated in-game blueprint in the August 2026 survey (each fractional module paired with a known half-integer "carrier" like AEN or HPR so the floor makes the fraction observable).

**STL Engine**

| Module | Ticker | Delta |
|--------|--------|-------|
| Standard | ENG | 0 |
| Fuel-saving | FSE | −1 |
| Glass | GEN | −1 |
| Advanced | AEN | +3.5 |
| Hyperthrust | HTE | +6.5 |

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
| High-power | HPR | +117.5 |
| Hyper-power | HYR | +127.5 |

**FTL Fuel Tank**

| Module | Ticker | Delta |
|--------|--------|-------|
| Small | SFL | 0 |
| Medium | MFL | +6 |
| Large | LFL | +17.5 |

**Cargo Bay**

| Module | Ticker | Delta |
|--------|--------|-------|
| Tiny | TCB | −420.5 |
| Very Small | VSC | −263 |
| Small | SCB | 0 |
| Medium | MCB | +524.5 |
| Large | LCB | +1575 |
| High-Load | WCB | +524.5 |
| High-Volume | VCB | +2624.5 |
| Huge | HCB | +4724.5 |

**Hull Plates, Shields, Drones, High-G Seats:** All have **zero volume delta**. These modules affect mass only.

### STL-Only Ships

When both FTL Reactor and FTL Fuel Tank modules aren't fitted (no FTL capability), apply an additional **−129** volume delta. This removes the reference ship's FTL contribution from the total, including swapping the reference BR1 bridge for the smaller BRS.

**Bridge feedback:** the bridge is itself a volume-bearing component (BRS 64, BR1 100, BR2 274), so the bridge rule feeds back into total volume. The −129 delta assumes a BRS bridge — the usual case for STL-only ships. When the ship's engine forces a BR2 bridge instead (AEN/HTE, see Command Bridge below), add the BR2−BRS difference of **+210**. This coupling is why issue #7's ships were wrong about volume, crew quarters, and plates simultaneously.

### Calculating Total Volume

```
total_volume = 963 + sum(all applicable deltas)

If no FTL reactor and no FTL fuel tank:
    total_volume += (−129)
    If bridge is BR2 (AEN/HTE engine):
        total_volume += 210

displayed_volume = floor(total_volume)
```

All downstream formulas (SSC, plates, crew quarters, mass) consume `displayed_volume`.

### Example

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

Validated: matches in-game BLU display.

---

## Structure (SSC)

Every ship needs structural components - The count scales linearly with volume.

```
SSC_count = ceil(volume / 21)
```

Validated: across 52 blueprints.

---

## Hull Plates

The number of hull plates is determined by a surface area approximation. The formula is the same regardless of which plate type is selected.

```
plate_count = ceil(volume^(2/3) / 2.07)
```

Validated: across 52 ships with all five plate types.

---

## Shield Components

Each equipped shield type requires the same number of units as the hull plate count.

```
shield_count_per_type = plate_count
```

A ship with Heat Shielding and Radiation Shielding equipped gets `plate_count` units of each. A ship with no shields gets none.

---

## Crew Quarters

Crew quarters are auto-assigned based on total ship volume. Not player-selectable.

| Volume | Crew Quarters | Ticker |
|--------|---------------|--------|
| < 945 | Tiny | CQT |
| < 1700 | Small | CQS |
| < 2700 | Medium | CQM |
| ≥ 2700 | Large | CQL |

The thresholds are **945, 1700, 2700**, applied to the floored display volume. They are universal — they do not differ between STL-only and FTL-capable ships.

**Boundary evidence (Aug 2026 in-game survey):**

- **T1:** 943 → CQT and 947 → CQS observed in-game, so T1 ∈ {944…947}. No module combination produces a volume of 944–946, so any value in that set behaves identically; **945** is recorded as the likely dev value. The community-reported 950 (issue #6) was refuted by the 947 → CQS ship.
- **T2 = 1700:** a 1731 m³ ship shows CQM in-game (would be CQS under the old 1750).
- **T3 = 2700:** a 2748 m³ ship (AEN no-FTL, BR2 bridge feedback — the only reachable volume in the 2696–2780 dead band) shows CQL in-game (would be CQM under 2750).

**History:** earlier versions used 1000/1750/2750, derived from 17 purpose-built test blueprints. Every blueprint in that set fits multiple threshold hypotheses *except* one recorded observation of the reference ship (963 → CQT) which turned out to be **wrong data** — community reports (issues #4/#5/#6), the PUNoted test table, and the reference ship's own wire-captured mass all show 963 → CQS. Supporting proofs:

- The reference ship's wire-captured operating empty mass is **827.8 t**; its BOM only sums to 827.8 with CQS (25 t), not CQT (12.5 t).
- PUNoted's 561-combination test table has 0 mismatches against these thresholds and 108 against 1000/1750/2750.

### Validation Data

| Volume | CQ (in-game) | Blueprint |
|--------|--------------|-----------|
| 543 | CQT | TCB, FTL |
| 701 | CQT | VSC, FTL |
| 834 | CQT | SCB, no FTL |
| 952 | CQS | smallest CQS case in the PUNoted table |
| 963 | CQS | Reference (SCB, FTL) — issue #5's "starter ship"; earlier CQT observation here was wrong data |
| 1089 | CQS | SCB + MSL, FTL |
| 1359 | CQS | MCB, no FTL |
| 1488 | CQS | MCB, FTL |
| 1614 | CQS | MCB + MSL, FTL |
| 1633 | CQS | largest CQS case in the PUNoted table |
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

March 2026 rows above whose internal volume ends in .5 (701, 1359, 1488, 1614, 1769, 3588, 5688) are recorded 1 high — see the rounding note under Volume. Their CQ observations remain valid. The definitive boundary ships (943, 947, 949, 1731, 2748) live in `src/formulas/__tests__/ingame_ships.test.ts` together with the full 24-blueprint August 2026 survey.

---

## Command Bridge

Auto-assigned. Not player-selectable.

A ship is **FTL-capable** only when both an FTL reactor *and* an FTL fuel tank are fitted. FTL-capable ships get their bridge from the reactor type; all other ships get BRS, except the two largest STL engines which force a BR2 (issue #7, community rule from SLKLS, confirmed in-game by raylu):

| Configuration | Bridge | Ticker |
|---------------|--------|--------|
| FTL: Standard (RCT) or Quick-charge (QCR) reactor | MK1 | BR1 |
| FTL: High-power (HPR) or Hyper-power (HYR) reactor | MK2 | BR2 |
| Non-FTL: Advanced (AEN) or Hyperthrust (HTE) engine | MK2 | BR2 |
| Non-FTL: any other engine | Short-distance | BRS |

The bridge contributes to total volume (see "Bridge feedback" under Volume): a non-FTL ship with an AEN/HTE engine is **+210 m³** larger than the plain delta model predicts, which cascades into crew quarters, hull plates, and SSC.

**BRP note:** PUNoted's formulas replace the bridge ticker with "BRP" when a basic radiation shield is equipped. Their own test data contradicts this — the "BRP" ships have identical volume and build time to their BR1/BR2 twins, and the mass delta is exactly the shield-plate weight difference, so the physical bridge is unchanged (BRP is the basic radiation shield plate's ticker). DryDock does not model a BRP bridge.

Validated: across 52 blueprints (FTL rule) + community rule and in-game blueprint for the STL branch.

---

## FTL Field Controller

```
FFC = 1 if FTL reactor equipped, else 0
```

---

## FTL Emitters — Diminishing-Multiplier Algorithm

FTL ships need field emitters. Larger ships need more emitters, but the algorithm isn't simple division — it uses a diminishing multiplier that makes the residual coverage cheaper as the ship gets larger.

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

### Examples

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

Validated: across 47 FTL blueprints.

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

This formula produces exact mass values — validated across 24 in-game blueprints.

---

## Build Time

```
build_time_hours = mass / 50
```

The in-game display rounds to the nearest hour.

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
- **PCT (PrUn Community Derived Information):** [Ship Blueprints](https://pct.fnar.net/ship-blueprints/index.html) — community-maintained wiki with prior work on component volumes, SSC formula, build time and emitter constants.
- **Module data:** Wire-captured from PrUn WebSocket traffic via APEX_/PrUn-Link (Feb 2026)
- **Volume delta model:** Derived from 29 isolation blueprints, validated against 23 player blueprints (Feb 2026)
- **Auto-computed formulas:** Derived from 52 regular ship blueprints via systematic pattern analysis (Feb 2026)
- **CQ thresholds:** Validated via 17 purpose-built test blueprints with binary search methodology (Mar 2026). Bug identified by **Shrewdsun** — reported that an LCB STL freighter with a Large STL Fuel Tank was assigned CQL in-game but CQM in DryDock, which led to the discovery that all three CQ boundaries were incorrect.
- **Fractional volume model, bridge rule, final CQ thresholds:** 24-blueprint in-game survey (Aug 2026), pinning every module's fractional volume, the floor() display rule, the bridge/volume feedback, and boundaries 945/1700/2700. Bugs reported by **raylu**, **SLKLS**, and **xSupeFly** (issues #4–#7); cross-validated against **xflasar**'s PUNoted test table (MIT).
- **Emitter algorithm structure:** Original description from **molp** ([PrUn Community Forum, Oct 2022](https://com.prosperousuniverse.com/t/minor-issues-and-ship-emitter-count-questions/5196)); constants and diminishing-multiplier behaviour reverse-engineered (Feb 2026)
- **Shield/plate count parity:** **RNGzero**'s Ship Repair Calc spreadsheet, confirmed via WebSocket data

---

*Built by [27bit.dev](https://27bit.dev), assisted by [Claude](https://claude.ai) for the Prosperous Universe community.*
