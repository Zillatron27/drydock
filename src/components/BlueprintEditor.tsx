import { useState, useMemo } from 'react';
import type { ModuleSelections, Blueprint } from '../types';
import type { ModuleSlot } from '../types';
import {
  calculateVolume,
  calculateSSC,
  calculatePlates,
  calculateEmitters,
  getBridge,
  getCrewQuarters,
  calculateBOM,
} from '../formulas';
import {
  driveSlots,
  cargoSlots,
  hullSlots,
  optionalSlots,
} from '../data/modules';
import StatsPanel from './StatsPanel';
import { encodeBlueprint } from '../services/permalink';
import { copyToClipboard } from '../services/blueprint_io';
import styles from './BlueprintEditor.module.css';

// Map slot name → ModuleSelections key
const SLOT_KEY_MAP: Record<string, keyof ModuleSelections> = {
  'STL Engine': 'stlEngine',
  'STL Fuel Tank': 'stlFuelTank',
  'FTL Reactor': 'ftlReactor',
  'FTL Fuel Tank': 'ftlFuelTank',
  'Cargo Bay': 'cargoBay',
  'Hull Plates': 'hullPlates',
  'Heat Shielding': 'heatShielding',
  'Whipple Shielding': 'whippleShielding',
  'Stability System': 'stabilitySystem',
  'Radiation Shielding': 'radiationShielding',
  'Self-repair Drones': 'selfRepairDrones',
  'High-G Seats': 'highGSeats',
};

const DEFAULT_SELECTIONS: ModuleSelections = {
  stlEngine: 'ENG',
  stlFuelTank: 'SSL',
  ftlReactor: null,
  ftlFuelTank: null,
  cargoBay: 'SCB',
  hullPlates: 'BHP',
  heatShielding: null,
  whippleShielding: null,
  stabilitySystem: null,
  radiationShielding: null,
  selfRepairDrones: null,
  highGSeats: null,
};

interface BlueprintEditorProps {
  existingBlueprint?: Blueprint;
  onSave: (name: string, selections: ModuleSelections) => void;
  onCancel: () => void;
}

export default function BlueprintEditor({ existingBlueprint, onSave, onCancel }: BlueprintEditorProps) {
  const [name, setName] = useState(existingBlueprint?.name ?? '');
  const [selections, setSelections] = useState<ModuleSelections>(
    existingBlueprint?.moduleSelections ?? DEFAULT_SELECTIONS
  );
  const [shared, setShared] = useState(false);

  const volume = useMemo(() => calculateVolume(selections), [selections]);
  const ssc = useMemo(() => calculateSSC(volume), [volume]);
  const plates = useMemo(() => calculatePlates(volume), [volume]);
  const emitters = useMemo(() => calculateEmitters(volume), [volume]);
  const bridge = useMemo(() => getBridge(selections.ftlReactor), [selections.ftlReactor]);
  const crew = useMemo(() => getCrewQuarters(volume), [volume]);
  const hasFTL = selections.ftlReactor !== null;

  function handleSlotChange(slot: ModuleSlot, value: string) {
    const key = SLOT_KEY_MAP[slot.name];
    if (!key) return;
    setSelections(prev => ({
      ...prev,
      [key]: value === '' ? null : value,
    }));
  }

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, selections);
  }

  async function handleShare() {
    const url = encodeBlueprint(selections, name.trim() || undefined);
    const ok = await copyToClipboard(url);
    if (ok) {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  function renderSlot(slot: ModuleSlot) {
    const key = SLOT_KEY_MAP[slot.name];
    if (!key) return null;
    const current = selections[key] ?? '';

    return (
      <div key={slot.name} className={styles.slotRow}>
        <span className={styles.slotLabel}>{slot.name}</span>
        <select
          className={styles.slotSelect}
          value={current}
          onChange={e => handleSlotChange(slot, e.target.value)}
        >
          {!slot.required && <option value="">—</option>}
          {slot.options.map(opt => (
            <option key={opt.ticker} value={opt.ticker}>
              {opt.name} ({opt.ticker})
            </option>
          ))}
        </select>
      </div>
    );
  }

  function renderSection(title: string, slots: readonly ModuleSlot[]) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{title}</div>
        {slots.map(renderSlot)}
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.editor} onClick={e => e.stopPropagation()}>
        <div className={styles.editorHeader}>
          <span className={styles.editorTitle}>
            {existingBlueprint ? 'Edit Blueprint' : 'New Blueprint'}
          </span>
          <button className={styles.closeBtn} onClick={onCancel}>&times;</button>
        </div>

        <div className={styles.editorBody}>
          <input
            type="text"
            className={styles.nameInput}
            placeholder="Blueprint name..."
            value={name}
            onChange={e => setName(e.target.value)}
          />

          {renderSection('Drive System', [...driveSlots])}
          {renderSection('Cargo', [...cargoSlots])}
          {renderSection('Hull & Shielding', [...hullSlots])}
          {renderSection('Optional Equipment', [...optionalSlots])}

          <StatsPanel selections={selections} />

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Auto-calculated Components</div>
            <div className={styles.autoSection}>
              <AutoRow label="Structure (SSC)" value={ssc} />
              <AutoRow label={`Hull Plates (${selections.hullPlates})`} value={plates} />
              {selections.heatShielding && (
                <AutoRow label={`Heat Shield (${selections.heatShielding})`} value={plates} />
              )}
              {selections.whippleShielding && (
                <AutoRow label={`Whipple Shield (${selections.whippleShielding})`} value={plates} />
              )}
              {selections.radiationShielding && (
                <AutoRow label={`Rad Shield (${selections.radiationShielding})`} value={plates} />
              )}
              {hasFTL && <AutoRow label="FTL Field Controller (FFC)" value={1} />}
              {hasFTL && emitters.large > 0 && (
                <AutoRow label="Large FTL Emitters (LFE)" value={emitters.large} />
              )}
              {hasFTL && emitters.medium > 0 && (
                <AutoRow label="Medium FTL Emitters (MFE)" value={emitters.medium} />
              )}
              {hasFTL && emitters.small > 0 && (
                <AutoRow label="Small FTL Emitters (SFE)" value={emitters.small} />
              )}
              <AutoRow label={`Bridge (${bridge})`} value={1} />
              <AutoRow label={`Crew Quarters (${crew})`} value={1} />
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              BOM Preview ({calculateBOM(selections).length} materials)
            </div>
            <BOMPreview selections={selections} />
          </div>
        </div>

        <div className={styles.editorFooter}>
          <button onClick={handleShare}>
            {shared ? 'Link copied!' : 'Share'}
          </button>
          <button onClick={onCancel}>Cancel</button>
          <button className="primary" onClick={handleSave} disabled={!name.trim()}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function AutoRow({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return (
    <div className={styles.autoRow}>
      <span className={styles.autoLabel}>{label}</span>
      <span className={styles.autoValue}>
        ×{value}
        {detail && <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>{detail}</span>}
      </span>
    </div>
  );
}

function BOMPreview({ selections }: { selections: ModuleSelections }) {
  const bom = useMemo(() => calculateBOM(selections), [selections]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gap-sm)' }}>
      {bom.map(entry => {
        const catClass = `cat-${entry.category.replace(/_/g, '-')}`;
        return (
          <span key={entry.ticker} className={`ticker-badge ${catClass}`}>
            {entry.quantity}× {entry.ticker}
          </span>
        );
      })}
    </div>
  );
}
