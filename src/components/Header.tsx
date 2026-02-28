import { useState } from 'react';
import { VERSION } from '../version';

interface HeaderProps {
  loading?: boolean;
  blueprintCount: number;
  onImport: () => void;
  onExportAll: () => Promise<boolean>;
  onDownloadAll: () => void;
  onLoadPresets: () => void;
  onSettings: () => void;
}

export default function Header({
  loading = false,
  blueprintCount,
  onImport,
  onExportAll,
  onDownloadAll,
  onLoadPresets,
  onSettings,
}: HeaderProps) {
  const [copied, setCopied] = useState(false);

  async function handleExportAll() {
    const ok = await onExportAll();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <header className="header">
      <div className="header-brand">
        <div className={`header-icon ${loading ? 'loading' : ''}`}>
          <svg width="28" height="28" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon
              className="hex-outer"
              points="64,14 110,38 110,90 64,114 18,90 18,38"
              stroke="var(--accent-dim)" strokeWidth="3" fill="none"
            />
            <polygon
              className="hex-inner"
              points="64,38 86,51 86,77 64,90 42,77 42,51"
              stroke="var(--accent)" strokeWidth="2.5" fill="rgba(212,164,58,0.04)"
              transform="rotate(90 64 64)"
            />
          </svg>
        </div>
        <h1 className="logo">DRYDOCK</h1>
        <span className="tagline">Ship Blueprint Calculator</span>
      </div>
      <div className="header-actions">
        <button onClick={onLoadPresets}>
          Load Examples
        </button>
        <button onClick={onImport}>Import</button>
        <button
          onClick={handleExportAll}
          disabled={blueprintCount === 0}
        >
          {copied ? 'Copied!' : 'Export All'}
        </button>
        <button
          onClick={onDownloadAll}
          disabled={blueprintCount === 0}
          title="Download all blueprints as .json file"
          style={{ fontSize: '1.3rem', lineHeight: 1 }}
        >
          &#8615;
        </button>
        <button onClick={onSettings}>
          SET
        </button>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>v{VERSION}</span>
      </div>
    </header>
  );
}
