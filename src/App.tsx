import { useState, useCallback } from 'react';
import type { Blueprint, ModuleSelections } from './types';
import { calculateBOM } from './formulas';
import Header from './components/Header';
import { BlueprintCard, NewBlueprintCard } from './components/BlueprintCard';
import BlueprintEditor from './components/BlueprintEditor';
import ShipyardDetail from './components/ShipyardDetail';

const STORAGE_KEY = 'drydock_blueprints';

function loadBlueprints(): Blueprint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Blueprint[];
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

  function handleCancel() {
    setEditorOpen(false);
    setEditingId(null);
  }

  return (
    <div className="app">
      <Header />

      <main className="main">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gap-md)', marginBottom: 'var(--gap-xl)' }}>
          {blueprints.map(bp => (
            <BlueprintCard
              key={bp.id}
              blueprint={bp}
              onClick={() => handleCardClick(bp.id)}
              onDelete={e => handleDelete(e, bp.id)}
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
            <ShipyardDetail
              blueprintName={selectedBlueprint.name}
              bom={selectedBlueprint.bom}
            />
          </div>
        )}

        {blueprints.length === 0 && !selectedBlueprint && (
          <div style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            padding: 'var(--gap-xl) 0',
          }}>
            Click + to create your first blueprint
          </div>
        )}
      </main>

      <footer className="footer">
        <span>DryDock v0.2.0</span>
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
    </div>
  );
}
