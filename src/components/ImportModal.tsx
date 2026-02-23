import { useState, useCallback } from 'react';
import type { ModuleSelections, ImportResult } from '../types';
import { validateImport, resolveNameCollisions } from '../services/blueprint_io';
import styles from './ImportModal.module.css';

interface ImportModalProps {
  existingNames: string[];
  onImport: (entries: Array<{ name: string; modules: ModuleSelections }>) => void;
  onCancel: () => void;
}

const PLACEHOLDER = `Paste blueprint JSON here, e.g.:
{
  "type": "drydock-blueprint",
  "version": "1.0",
  "name": "My Ship",
  "modules": { ... }
}`;

export default function ImportModal({ existingNames, onImport, onCancel }: ImportModalProps) {
  const [rawInput, setRawInput] = useState('');
  const [validationResult, setValidationResult] = useState<ImportResult | null>(null);

  const runValidation = useCallback((text: string) => {
    const trimmed = text.trim();
    if (trimmed === '') {
      setValidationResult(null);
      return;
    }
    setValidationResult(validateImport(trimmed));
  }, []);

  function handleTextChange(value: string) {
    setRawInput(value);
    runValidation(value);
  }

  function handleFileLoad(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setRawInput(text);
      runValidation(text);
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (!validationResult?.success) return;
    const names = validationResult.entries.map(e => e.name);
    const resolved = resolveNameCollisions(names, existingNames);
    const entries = validationResult.entries.map((entry, i) => ({
      ...entry,
      name: resolved[i]!,
    }));
    onImport(entries);
  }

  // Preview: show resolved names if there are collisions
  const previewNames = validationResult?.success
    ? resolveNameCollisions(
        validationResult.entries.map(e => e.name),
        existingNames,
      )
    : [];

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Import Blueprint</span>
          <button className={styles.closeBtn} onClick={onCancel}>&times;</button>
        </div>

        <div className={styles.modalBody}>
          <textarea
            className={styles.importTextarea}
            placeholder={PLACEHOLDER}
            value={rawInput}
            onChange={e => handleTextChange(e.target.value)}
          />

          <div className={styles.fileRow}>
            <span>or load from file:</span>
            <input type="file" accept=".json" onChange={handleFileLoad} />
          </div>

          {validationResult && !validationResult.success && (
            <div className={styles.validationError}>{validationResult.error}</div>
          )}

          {validationResult?.success && validationResult.entries.length === 0 && (
            <div className={styles.validationSuccess}>
              Valid collection, but contains no blueprints.
            </div>
          )}

          {validationResult?.success && validationResult.entries.length > 0 && (
            <div className={styles.validationSuccess}>
              {validationResult.entries.length === 1 ? '1 blueprint' : `${validationResult.entries.length} blueprints`} ready to import:
              <div className={styles.previewInfo}>
                {previewNames.map((name, i) => {
                  const original = validationResult.entries[i]!.name;
                  const renamed = name !== original;
                  return (
                    <span key={i}>
                      {name}
                      {renamed && <span style={{ color: 'var(--text-muted)' }}> (renamed from "{original}")</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onCancel}>Cancel</button>
          <button
            className="primary"
            onClick={handleImport}
            disabled={!validationResult?.success || validationResult.entries.length === 0}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
