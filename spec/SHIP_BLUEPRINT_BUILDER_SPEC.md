# Ship Blueprint Builder — Feature Spec

## What Is This?

A custom ship blueprint cost calculator. Users design a ship by selecting modules from dropdowns (mirroring the in-game BLU command), the system calculates the full BOM, then prices it across all 6 exchanges with cherry-pick sourcing and ACT package generation.

This is a candidate for extraction as a standalone public tool. The Shipyard service already does all the pricing/sourcing work — this feature adds the blueprint *input* layer.

## Why Build This?

The existing Shipyard page requires hardcoded blueprints. Users can't price arbitrary ship designs without manually entering a BOM. The in-game blueprint editor shows you what materials you need, but doesn't tell you where to buy them cheaply or generate action packages for purchasing.

No existing community tool does this. PrunPlanner has base planning but no ship BOM cost analysis. The repair calc spreadsheet handles damage costs but not construction sourcing.

## User Flow

1. **Shipyard page** shows existing blueprint cards plus an empty card with "+" icon
2. User clicks "+" → **Blueprint Editor modal** opens
3. User selects modules from dropdowns (same layout categories as in-game BLU command)
4. System calculates derived components (structure, hull plates, shields, emitters, bridge, crew) in real-time as selections change
5. **Preview section** at bottom shows the full BOM with material counts
6. User names the blueprint and clicks **Save**
7. Blueprint appears as a new card alongside hardcoded blueprints
8. Clicking it triggers the existing Shipyard analysis — exchange cards, cherry-pick, ACT packages

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

Note: FIO has 8 cargo bay tickers. PCT lists 7 sizes. HCB (hugeCargoBay) may be a distinct size not in the original PCT table — **verify volume in-game**.

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

**NV1/NV2** (navigation) and **THP/ATP** (thermal protection) are crafting intermediates consumed in bridge and heat shield recipes — not blueprint slots. **FIR/RAG** are consumed in reactor recipes. **HAM** (Habitation Module) and **DOU** (Drone Operations Unit) appear in the blueprint as auto-calculated fields ("not required"), not user-selectable slots — likely colony ship features.

### Section 2: Auto-calculated Components (read-only display)

These are computed from the module selections and displayed as read-only rows:

| Component | Formula | Material | Condition |
|-----------|---------|----------|-----------|
| Structure | `ceil(volume / 21)` | SSC | Always |
| Hull Plates | `ceil(volume^(2/3) / 2.07)` | Same as hull plate selection | Always |
| Shield Components | `ceil(volume^(2/3) / 2.07)` per type | Same as each shield selection | Per equipped shield |
| FTL Field Controller | 1 | FFC | If FTL reactor equipped |
| Small FTL Emitters | Emitter algorithm | SFE | If FTL reactor equipped |
| Medium FTL Emitters | Emitter algorithm | MFE | If FTL reactor equipped |
| Large FTL Emitters | Emitter algorithm | LFE | If FTL reactor equipped |
| Command Bridge | 1 | BRS/BR1/BR2 (by FTL reactor type) | Always |
| Crew Quarters | 1 | CQT/CQS/CQM/CQL (by volume thresholds) | Always |
| Habitation Modules | ? | HAM | Colony ships only (not required for freighters) |

**Bridge and crew quarters are auto-calculated** — see [Command Bridge & Crew Quarters](#command-bridge--crew-quarters) for formulas.

### Section 3: BOM Preview

Real-time material list with quantities, updated as selections change. Same badge-style display as the in-game BLU command bottom section.

## Core Calculations

### Volume

Total ship volume = sum of all component volumes.

**Cargo Bay volumes:**

| Option | Ticker | Volume (m³) |
|--------|--------|-------------|
| Tiny | TCB | 105 |
| Very Small | VSC | 263 |
| Small | SCB | 525 |
| Medium | MCB | 1050 |
| Large | LCB | 2100 |
| High-Load | WCB | 1050 |
| High-Volume | VCB | 3150 |
| Huge | HCB | 5250 |

Note: Game displays total volume as 1 less than calculated (e.g. shows 5837 when components sum to 5838). All formulas use the calculated sum, not the displayed value. Verified: floor(5838/21)=278 matches screenshot SSC count.

**FTL Fuel Tank volumes:**

| Option | Ticker | Volume (m³) |
|--------|--------|-------------|
| None | — | 0 |
| Small | SFL | 3 |
| Medium | MFL | 9 |
| Large | LFL | 21 |

**STL Fuel Tank volumes:**

| Option | Ticker | Volume (m³) |
|--------|--------|-------------|
| Small | SSL | 70 |
| Medium | MSL | 196 |
| Large | LSL | 480 |

**FTL Reactor volumes:**

| Option | Ticker | Volume (m³) |
|--------|--------|-------------|
| None | — | 0 |
| Standard | RCT | 126 |
| Quick-charge | QCR | 133 |
| High-power | HPR | 243 |
| Hyper-power | HYR | 253 |

**STL Engine volumes:**

| Option | Ticker | Volume (m³) |
|--------|--------|-------------|
| Standard | ENG | 239 |
| Fuel-saving | FSE | 238 |
| Glass | GEN | 238 |
| Advanced | AEN | 452 |
| Hyperthrust | HTE | 456 |

Source: PrUn Community Derived Information (pct.fnar.net/ship-blueprints)

### Structure (SSC)

```
SSC_count = ceil(total_volume / 21)
```

**CORRECTED:** Original formula was `floor()`, which happened to match the first 5 ships because their volumes fell near exact multiples of 21. Systematic testing with 13 ships proved `ceil()` — the HPR test (vol=1079, 1079/21=51.38) produces ceil=52 matching the game, while round=51 and floor=51 are wrong. Verified 13/13.

### Hull Plates

```
plate_count = ceil(total_volume ^ (2/3) / 2.07)
```

**CORRECTED:** Original formula used `round()` with divisor 2.06. Systematic testing with 13 ships (both BHP and LHP) revealed `ceil()` with divisor ~2.07 is exact. The `round(V^(2/3)/2.06)` formula failed on 2 of 13 ships (RCT test vol=962: predicted 47, actual 48; 3k1k vol=1638: predicted 67, actual 68). `ceil(V^(2/3)/2.07)` matches all 13 ships perfectly. Range 2.066–2.073 all work; 2.07 chosen as cleanest value.

The plate count is the same regardless of plate type (BHP, LHP, RHP, HHP, AHP). Confirmed across both BHP and LHP ships. The type only determines which material ticker goes into the BOM.

### Shield Components

Each equipped shield type adds materials equal to the plate count:

```
shield_count = plate_count  (same formula, same count)
```

Only shields the user selected are included. A ship with no shields has no shield materials. A ship with all 3 shield types gets 3 × plate_count additional materials (one line per shield type).

Verified via repair calculator data (all 3 test ships show shield count = plate count).

### FTL Emitters

Algorithm provided by game developer (molp) on the official PrUn forum, with corrected span values from community member SLKLS (verified Feb 2026):

```python
def calc_emitters(volume):
    large = 0    # LFE
    medium = 0   # MFE
    small = 0    # SFE
    covered = 0.0

    while covered + 1050 <= volume:
        large += 1
        covered += 1050

    while covered + 260 <= volume:
        medium += 1
        covered += 260

    while covered < volume:
        small += 1
        covered += 100

    return small, medium, large
```

Only calculated if FTL reactor is selected. Verified against 6 ships (4 Dan's + 2 forum examples). All match exactly.

### Build Time

```
build_time_hours = operating_empty_mass / 50
```

Source: PCT community data. Operating empty mass calculation is the one remaining area of complexity — mass depends on component selections in non-linear ways (see PCT mass tables). For v1, display build time as "~Xh" estimated, or omit until mass formula is fully verified.

### Command Bridge & Crew Quarters

**These are auto-assigned by the game — NOT user-selectable.** Formulas verified against 13 ships.

#### Command Bridge (depends on FTL reactor type)

```python
def get_bridge(ftl_reactor):
    if ftl_reactor is None:
        return "BRS"  # Short-distance Command Bridge
    elif ftl_reactor in ("RCT", "QCR"):
        return "BR1"  # Command Bridge MK1
    elif ftl_reactor in ("HPR", "HYR"):
        return "BR2"  # Command Bridge MK2
```

| FTL Reactor | Bridge | Verified |
|-------------|--------|----------|
| None | BRS (Short-distance) | 7 ships |
| RCT (Standard) | BR1 (MK1) | 1 ship |
| QCR (Quick-charge) | BR1 (MK1) | 3 ships |
| HPR (High-power) | BR2 (MK2) | 1 ship |
| HYR (Hyper-power) | BR2 (MK2) | 1 ship |

#### Crew Quarters (depends on volume)

```python
def get_crew_quarters(volume):
    if volume < 1000:
        return "CQT"  # Crew Quarters (Tiny)
    elif volume < 2000:
        return "CQS"  # Crew Quarters (Small)
    elif volume < 3000:
        return "CQM"  # Crew Quarters (Medium)
    else:
        return "CQL"  # Crew Quarters (Large)
```

| Volume Range | Crew Quarters | Verified |
|-------------|---------------|----------|
| < 1000 | CQT (Tiny) | 2 ships |
| 1000–1999 | CQS (Small) | 3 ships |
| 2000–2999 | CQM (Medium) | 3 ships |
| ≥ 3000 | CQL (Large) | 3 ships |

Both formulas verified 13/13 across all test ships.

## Data Architecture

### Static Module Catalog

TypeScript object mapping slots → options → properties. Lives in `src/data/modules.ts`.

### Custom Blueprint Storage

For the standalone public tool, blueprints are stored in the browser's localStorage as JSON. No server-side storage.

### Integration with Existing Shipyard Service

N/A for standalone tool — DryDock is independent from APEX_.

## Known Unknowns

| Item | Status | Impact |
|------|--------|--------|
| Operating empty mass formula | Mass depends on module combos non-linearly | Low — build time is informational only |

All other unknowns have been resolved through systematic testing.

## Resolved (from screenshot verification — 13 ships tested)

| Item | Resolution |
|------|------------|
| SSC formula | **`ceil(V/21)`** — not `floor()` as originally derived. 13/13 verified |
| Hull plate formula | **`ceil(V^(2/3) / 2.07)`** — not `round(V^(2/3) / 2.06)`. 13/13 verified across BHP and LHP |
| Command Bridge assignment | **Reactor-dependent:** no FTL→BRS, RCT/QCR→BR1, HPR/HYR→BR2. 13/13 verified |
| Crew Quarters assignment | **Volume thresholds:** <1000→CQT, 1000-1999→CQS, 2000-2999→CQM, ≥3000→CQL. 11/11 verified |
| HCB volume | **5250** — verified: component sum=5838, ceil(5838/21)=278 ✓ |
| Auxiliary module volumes | **Do NOT contribute volume.** AGS adds 30t mass but volume/SSC/plates/emitters unchanged |
| Stability System ticker | **STS** (stabilitySupportSystem) — in FIO under "electronic systems" category |
| Vortex modules | **Colony ships only** — excluded from v1 |
| Shield count = plate count | **Confirmed** — AWH=157=LHP on 5838m³ ship; APT=90=LHP on 2534m³ ship |
| Blueprint slot layout | **Confirmed from screenshots** — selectable slots + auto-calculated rows |
| Bridge/crew selectability | **NOT user-selectable** — auto-assigned by game, formulas derived |
| Hull plate divisor universal | **Confirmed** — 2.07 works for both BHP and LHP |
| Game volume display off-by-one | Occurs on some ships (5838→5837, 1638→1637) but not all. Use calculated sum for formulas |

## Sources

- **Component volumes:** pct.fnar.net/ship-blueprints (PrUn Community Derived Information)
- **SSC formula:** pct.fnar.net — `floor(volume / 21)`
- **LHP/AWH formula:** Derived from Dan's 5 ships — `round(volume^(2/3) / 2.06)`
- **Emitter algorithm:** Game developer molp, PrUn Community Forum (Oct 2022), corrected spans by SLKLS (Feb 2026)
- **Emitter spans:** LFE=1050, MFE=260, SFE=100
- **Build time:** PCT — `operating_empty_mass / 50`
- **Shield/plate count parity:** RNGzero's Ship Repair Calc spreadsheet
- **Dev blog context:** Development Logs #244, #252, #259, #260, #261
