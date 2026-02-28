import { useState } from 'react';
import type { DryDockSettings } from '../services/settings';
import { loadSettings, saveSettings, applySettings, resetSettings } from '../services/settings';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<DryDockSettings>(loadSettings);

  function update(next: DryDockSettings) {
    setSettings(next);
    saveSettings(next);
    applySettings(next);
  }

  function handleFontSize(fontSize: DryDockSettings['fontSize']) {
    update({ ...settings, fontSize });
  }

  function handleContrast(highContrast: boolean) {
    update({ ...settings, highContrast });
  }

  function handleReset() {
    setSettings(resetSettings());
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Settings</span>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.settingSection}>
            <div className="panel-header">Font Size</div>
            <div className={styles.optionRow}>
              <button
                className={settings.fontSize === 'default' ? 'primary' : ''}
                onClick={() => handleFontSize('default')}
              >
                Default
              </button>
              <button
                className={settings.fontSize === 'medium' ? 'primary' : ''}
                onClick={() => handleFontSize('medium')}
              >
                Medium
              </button>
              <button
                className={settings.fontSize === 'large' ? 'primary' : ''}
                onClick={() => handleFontSize('large')}
              >
                Large
              </button>
              <button
                className={settings.fontSize === 'xl' ? 'primary' : ''}
                onClick={() => handleFontSize('xl')}
              >
                Extra Large
              </button>
            </div>
            <div className={styles.previewBlock}>
              MCG 1x STL fuel tank, 2x cargo bay — 49,273 NCC @ MOR-I
            </div>
          </div>

          <div className={styles.settingSection}>
            <div className="panel-header">Contrast</div>
            <div className={styles.optionRow}>
              <button
                className={!settings.highContrast ? 'primary' : ''}
                onClick={() => handleContrast(false)}
              >
                Normal
              </button>
              <button
                className={settings.highContrast ? 'primary' : ''}
                onClick={() => handleContrast(true)}
              >
                High Contrast
              </button>
            </div>
            <div className={styles.previewBlock}>
              <span style={{ color: 'var(--text-primary)' }}>Primary text</span>
              {' / '}
              <span style={{ color: 'var(--text-secondary)' }}>Secondary text</span>
              {' / '}
              <span style={{ color: 'var(--text-muted)' }}>Muted text</span>
              <div style={{ marginTop: 'var(--gap-xs)', borderTop: '1px solid var(--border)', paddingTop: 'var(--gap-xs)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Border sample above</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.footerLeft}>
            <button className="danger" onClick={handleReset}>Reset to Defaults</button>
          </div>
          <div className={styles.footerRight}>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
