import { useState, useCallback } from 'react';
import type { Blueprint, ModuleSelections } from './types';
import { calculateBOM } from './formulas';
import { PRESET_BLUEPRINTS } from './data/presets';
import Header from './components/Header';
import { VERSION } from './version';
import { BlueprintCard, NewBlueprintCard } from './components/BlueprintCard';
import BlueprintEditor from './components/BlueprintEditor';
import ShipyardDetail from './components/ShipyardDetail';
import StatsPanel from './components/StatsPanel';
import ImportModal from './components/ImportModal';
import {
  exportBlueprint,
  exportCollection,
  copyToClipboard,
  downloadAsFile,
  buildExportFilename,
} from './services/blueprint_io';

const STORAGE_KEY = 'drydock_blueprints';
const PRESETS_LOADED_KEY = 'drydock_presets_loaded';

function generatePresetsAsBlueprints(): Blueprint[] {
  return PRESET_BLUEPRINTS.map(preset => ({
    id: crypto.randomUUID(),
    name: preset.name,
    moduleSelections: preset.modules,
    bom: calculateBOM(preset.modules),
  }));
}

function loadBlueprints(): Blueprint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Blueprint[];
      if (parsed.length > 0) return parsed;
    }
    // No blueprints — seed presets on first visit only
    if (localStorage.getItem(PRESETS_LOADED_KEY) !== 'true') {
      const seeded = generatePresetsAsBlueprints();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      localStorage.setItem(PRESETS_LOADED_KEY, 'true');
      return seeded;
    }
    return [];
  } catch {
    return [];
  }
}

function saveBlueprints(blueprints: Blueprint[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprints));
}

export default function App() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>(loadBlueprints);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const selectedBlueprint = blueprints.find(b => b.id === selectedId) ?? null;
  const editingBlueprint = blueprints.find(b => b.id === editingId);

  const persist = useCallback((next: Blueprint[]) => {
    setBlueprints(next);
    saveBlueprints(next);
  }, []);

  function handleNewClick() {
    setEditingId(null);
    setEditorOpen(true);
  }

  function handleCardClick(id: string) {
    setSelectedId(prev => prev === id ? null : id);
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const next = blueprints.filter(b => b.id !== id);
    persist(next);
    if (selectedId === id) setSelectedId(null);
  }

  function handleEdit(id: string) {
    setEditingId(id);
    setEditorOpen(true);
  }

  function handleSave(name: string, selections: ModuleSelections) {
    const bom = calculateBOM(selections);

    if (editingId) {
      const next = blueprints.map(b =>
        b.id === editingId ? { ...b, name, moduleSelections: selections, bom } : b
      );
      persist(next);
    } else {
      const newBlueprint: Blueprint = {
        id: crypto.randomUUID(),
        name,
        moduleSelections: selections,
        bom,
      };
      persist([...blueprints, newBlueprint]);
      setSelectedId(newBlueprint.id);
    }

    setEditorOpen(false);
    setEditingId(null);
  }

  async function handleExport(e: React.MouseEvent, blueprint: Blueprint): Promise<boolean> {
    e.stopPropagation();
    const json = JSON.stringify(exportBlueprint(blueprint), null, 2);
    return copyToClipboard(json);
  }

  async function handleExportAll(): Promise<boolean> {
    const json = JSON.stringify(exportCollection(blueprints), null, 2);
    return copyToClipboard(json);
  }

  function handleDownloadAll(): void {
    const json = JSON.stringify(exportCollection(blueprints), null, 2);
    downloadAsFile(json, buildExportFilename('collection'));
  }

  function handleImportConfirm(entries: Array<{ name: string; modules: ModuleSelections }>) {
    const newBlueprints = entries.map(entry => ({
      id: crypto.randomUUID(),
      name: entry.name,
      moduleSelections: entry.modules,
      bom: calculateBOM(entry.modules),
    }));
    persist([...blueprints, ...newBlueprints]);
    setImportOpen(false);
  }

  function handleCancel() {
    setEditorOpen(false);
    setEditingId(null);
  }

  function handleLoadPresets() {
    const existingNames = new Set(blueprints.map(b => b.name));
    const presets = generatePresetsAsBlueprints().map(bp => ({
      ...bp,
      name: existingNames.has(bp.name) ? `${bp.name} (preset)` : bp.name,
    }));
    persist([...blueprints, ...presets]);
  }

  return (
    <div className="app">
      <Header
        loading={pricesLoading}
        blueprintCount={blueprints.length}
        onImport={() => setImportOpen(true)}
        onExportAll={handleExportAll}
        onDownloadAll={handleDownloadAll}
        onLoadPresets={handleLoadPresets}
      />

      <main className="main">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gap-md)', marginBottom: 'var(--gap-xl)' }}>
          {blueprints.map(bp => (
            <BlueprintCard
              key={bp.id}
              blueprint={bp}
              onClick={() => handleCardClick(bp.id)}
              onDelete={e => handleDelete(e, bp.id)}
              onExport={e => handleExport(e, bp)}
            />
          ))}
          <NewBlueprintCard onClick={handleNewClick} />
        </div>

        {selectedBlueprint && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-md)' }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                color: 'var(--accent)',
              }}>
                {selectedBlueprint.name}
              </h2>
              <button onClick={() => handleEdit(selectedBlueprint.id)}>Edit</button>
            </div>
            <StatsPanel selections={selectedBlueprint.moduleSelections} />
            <ShipyardDetail
              blueprintName={selectedBlueprint.name}
              bom={selectedBlueprint.bom}
              onLoadingChange={setPricesLoading}
            />
          </div>
        )}

        {blueprints.length === 0 && !selectedBlueprint && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--gap-md)',
            padding: 'var(--gap-xl) 0',
          }}>
            <button className="primary" onClick={handleNewClick}>+ New Blueprint</button>
            <button onClick={handleLoadPresets}>Load example ships</button>
          </div>
        )}
      </main>

      <footer className="footer">
        <span>DryDock v{VERSION}</span>
        <span className="separator">|</span>
        <span>27bit industries</span>
      </footer>

      {editorOpen && (
        <BlueprintEditor
          existingBlueprint={editingBlueprint}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {importOpen && (
        <ImportModal
          existingNames={blueprints.map(b => b.name)}
          onImport={handleImportConfirm}
          onCancel={() => setImportOpen(false)}
        />
      )}
    </div>
  );
}
