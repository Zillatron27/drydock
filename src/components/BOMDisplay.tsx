import type { BOMEntry, MaterialCategory } from '../types';
import styles from './BOMDisplay.module.css';

interface BOMDisplayProps {
  bom: BOMEntry[];
}

// Group order for display
const CATEGORY_ORDER: MaterialCategory[] = [
  'ship_engines',
  'fuels',
  'ship_kits',
  'ship_parts',
  'ship_shields',
  'electronic_systems',
  'construction_materials',
  'metals',
  'alloys',
  'elements',
  'plastics',
  'minerals',
  'chemicals',
];

const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  ship_engines: 'Ship Engines',
  fuels: 'Fuels',
  ship_kits: 'Ship Kits',
  ship_parts: 'Ship Parts',
  ship_shields: 'Ship Shields',
  electronic_systems: 'Electronic Systems',
  construction_materials: 'Construction Materials',
  metals: 'Metals',
  alloys: 'Alloys',
  elements: 'Elements',
  plastics: 'Plastics',
  minerals: 'Minerals',
  chemicals: 'Chemicals',
};

export default function BOMDisplay({ bom }: BOMDisplayProps) {
  // Group by category
  const grouped = new Map<MaterialCategory, BOMEntry[]>();
  for (const entry of bom) {
    const list = grouped.get(entry.category) ?? [];
    list.push(entry);
    grouped.set(entry.category, list);
  }

  const totalItems = bom.reduce((sum, e) => sum + e.quantity, 0);

  return (
    <div className={styles.bomDisplay}>
      <div className={styles.bomHeader}>
        <span className="panel-header">Bill of Materials</span>
        <span className={styles.bomSummary}>
          {bom.length} materials, {totalItems.toLocaleString()} total units
        </span>
      </div>

      <div className={styles.bomGroups}>
        {CATEGORY_ORDER.map(cat => {
          const entries = grouped.get(cat);
          if (!entries) return null;
          const catClass = `cat-${cat.replace(/_/g, '-')}`;

          return (
            <div key={cat} className={styles.bomGroup}>
              <div className={`${styles.groupLabel} ${catClass}`}>
                {CATEGORY_LABELS[cat]}
              </div>
              <div className={styles.groupItems}>
                {entries.map(entry => (
                  <div key={entry.ticker} className={styles.bomEntry}>
                    <span className={`ticker-badge ${catClass}`}>{entry.ticker}</span>
                    <span className={styles.entryName}>{entry.name}</span>
                    <span className={styles.entryQty}>×{entry.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
