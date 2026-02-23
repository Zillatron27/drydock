import type { ModuleSelections } from '../types';
import {
  calculateVolume,
  calculateMass,
  calculateBuildTime,
  calculateEmitters,
} from '../formulas';
import { moduleStats } from '../data/moduleStats';
import styles from './StatsPanel.module.css';

interface StatsPanelProps {
  selections: ModuleSelections;
}

function getModifier(ticker: string | null, key: string): number {
  if (!ticker) return 0;
  return moduleStats[ticker]?.modifiers[key] ?? 0;
}

function formatBuildTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}

export default function StatsPanel({ selections }: StatsPanelProps) {
  const volume = calculateVolume(selections);
  const mass = calculateMass(selections, volume);
  const buildTime = calculateBuildTime(mass);
  const hasFTL = selections.ftlReactor !== null;
  const emitters = hasFTL ? calculateEmitters(volume) : null;

  // Max G: hull base + seat increase
  const maxG = getModifier(selections.hullPlates, 'MAX_G_FACTOR')
    + getModifier(selections.highGSeats, 'MAX_G_FACTOR_INCREASE');

  // Cargo
  const cargoVolume = getModifier(selections.cargoBay, 'CARGO_CAPACITY_VOLUME');
  const cargoWeight = getModifier(selections.cargoBay, 'CARGO_CAPACITY_WEIGHT');

  // STL
  const stlUsage = getModifier(selections.stlEngine, 'STL_USAGE');
  const stlFuel = getModifier(selections.stlFuelTank, 'STL_FUEL_CAPACITY');

  // FTL
  const ftlPower = getModifier(selections.ftlReactor, 'FTL_POWER');
  const ftlCharge = getModifier(selections.ftlReactor, 'FTL_CHARGE_FACTOR');
  const ftlFuel = getModifier(selections.ftlFuelTank, 'FTL_FUEL_CAPACITY');

  // Emitter totals
  let emitterVolumeSpan = 0;
  let emitterPowerReq = 0;
  if (emitters) {
    emitterVolumeSpan =
      emitters.large * getModifier('LFE', 'FTL_VOLUME_SPAN') +
      emitters.medium * getModifier('MFE', 'FTL_VOLUME_SPAN') +
      emitters.small * getModifier('SFE', 'FTL_VOLUME_SPAN');
    emitterPowerReq =
      emitters.large * getModifier('LFE', 'POWER_REQUIREMENT') +
      emitters.medium * getModifier('MFE', 'POWER_REQUIREMENT') +
      emitters.small * getModifier('SFE', 'POWER_REQUIREMENT');
  }

  // Shielding — aggregate across all contributing modules
  const shieldGeneral =
    getModifier(selections.hullPlates, 'SHIELDING_GENERAL') +
    getModifier(selections.selfRepairDrones, 'SHIELDING_GENERAL');
  const shieldHeat = getModifier(selections.heatShielding, 'SHIELDING_HEAT');
  const shieldWhipple = getModifier(selections.whippleShielding, 'SHIELDING_WHIPPLE');
  const shieldGravity = getModifier(selections.stabilitySystem, 'SHIELDING_GRAVITY');
  const shieldRadiation = getModifier(selections.radiationShielding, 'SHIELDING_RADIATION');

  const hasShielding = shieldGeneral !== 0 || shieldHeat > 0 || shieldWhipple > 0
    || shieldGravity > 0 || shieldRadiation > 0;

  // Format emitter breakdown: "2L 1M 3S"
  const emitterLabel = emitters
    ? [
        emitters.large > 0 ? `${emitters.large}L` : '',
        emitters.medium > 0 ? `${emitters.medium}M` : '',
        emitters.small > 0 ? `${emitters.small}S` : '',
      ].filter(Boolean).join(' ')
    : '';

  return (
    <div className={styles.panel}>
      {/* Ship Overview */}
      <div className={styles.section}>
        <span className={styles.sectionHeader}>Ship Overview</span>
        <div className={styles.statsGrid}>
          <Stat label="Volume" value={`${volume.toLocaleString()} m³`} />
          <Stat label="Mass" value={`${mass.toLocaleString(undefined, { maximumFractionDigits: 1 })} t`} />
          <Stat label="Build Time" value={formatBuildTime(buildTime)} />
          <Stat label="Max G" value={`${maxG} g`} />
        </div>
      </div>

      {/* Cargo */}
      <div className={styles.section}>
        <span className={styles.sectionHeader}>Cargo</span>
        <div className={styles.statsGrid}>
          <Stat label="Volume Capacity" value={`${cargoVolume.toLocaleString()} m³`} />
          <Stat label="Weight Capacity" value={`${cargoWeight.toLocaleString()} t`} />
        </div>
      </div>

      {/* STL Drive */}
      <div className={styles.section}>
        <span className={styles.sectionHeader}>STL Drive</span>
        <div className={styles.statsGrid}>
          <Stat label="Fuel Usage" value={`${stlUsage} units/s`} />
          <Stat label="Fuel Capacity" value={stlFuel.toLocaleString()} />
        </div>
      </div>

      {/* FTL Drive — only if reactor equipped */}
      {hasFTL && (
        <div className={styles.section}>
          <span className={styles.sectionHeader}>FTL Drive</span>
          <div className={styles.statsGrid}>
            <Stat label="Reactor Power" value={ftlPower.toLocaleString()} />
            <Stat label="Charge Factor" value={String(ftlCharge)} />
            <Stat label="Fuel Capacity" value={ftlFuel.toLocaleString()} />
            <Stat label="Emitters" value={emitterLabel} />
            <Stat label="Volume Span" value={emitterVolumeSpan.toLocaleString()} />
            <Stat label="Power Required" value={emitterPowerReq.toLocaleString()} />
          </div>
        </div>
      )}

      {/* Shielding — only show if any equipped */}
      {hasShielding && (
        <div className={styles.section}>
          <span className={styles.sectionHeader}>Shielding</span>
          <div className={styles.statsGrid}>
            {shieldGeneral !== 0 && <Stat label="General" value={formatPercent(shieldGeneral)} />}
            {shieldHeat > 0 && <Stat label="Heat" value={formatPercent(shieldHeat)} />}
            {shieldWhipple > 0 && <Stat label="Whipple" value={formatPercent(shieldWhipple)} />}
            {shieldGravity > 0 && <Stat label="Gravity" value={formatPercent(shieldGravity)} />}
            {shieldRadiation > 0 && <Stat label="Radiation" value={formatPercent(shieldRadiation)} />}
          </div>
        </div>
      )}
    </div>
  );
}
