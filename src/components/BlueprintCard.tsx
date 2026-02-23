import { useState } from 'react';
import type { Blueprint } from '../types';
import { calculateVolume } from '../formulas';
import styles from './BlueprintCard.module.css';

interface BlueprintCardProps {
  blueprint: Blueprint;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onExport: (e: React.MouseEvent) => Promise<boolean>;
}

export function BlueprintCard({ blueprint, onClick, onDelete, onExport }: BlueprintCardProps) {
  const volume = calculateVolume(blueprint.moduleSelections);
  const materialCount = blueprint.bom.length;
  const [copied, setCopied] = useState(false);

  async function handleExport(e: React.MouseEvent) {
    e.stopPropagation();
    const ok = await onExport(e);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className={`card ${styles.blueprintCard}`} onClick={onClick}>
      <div className={styles.cardHeader}>
        <span className={styles.cardName}>{blueprint.name}</span>
        <div className={styles.cardActions}>
          <button
            className={styles.exportBtn}
            onClick={handleExport}
            title="Export blueprint to clipboard"
            data-copied={copied || undefined}
          >
            {copied ? 'Copied!' : 'Export'}
          </button>
          <button
            className={`danger ${styles.deleteBtn}`}
            onClick={onDelete}
            title="Delete blueprint"
          >
            &times;
          </button>
        </div>
      </div>
      <div className={styles.cardStats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Volume</span>
          <span className={styles.statValue}>{volume.toLocaleString()} m³</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Materials</span>
          <span className={styles.statValue}>{materialCount}</span>
        </div>
      </div>
    </div>
  );
}

interface NewBlueprintCardProps {
  onClick: () => void;
}

export function NewBlueprintCard({ onClick }: NewBlueprintCardProps) {
  return (
    <div className={`card ${styles.blueprintCard} ${styles.newCard}`} onClick={onClick}>
      <span className={styles.plusIcon}>+</span>
      <span className={styles.newLabel}>New Blueprint</span>
    </div>
  );
}
