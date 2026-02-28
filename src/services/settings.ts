export interface DryDockSettings {
  fontSize: 'default' | 'medium' | 'large' | 'xl';
  highContrast: boolean;
}

const DEFAULTS: DryDockSettings = {
  fontSize: 'default',
  highContrast: false,
};

const STORAGE_KEY = 'drydock_settings';

export function loadSettings(): DryDockSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<DryDockSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: DryDockSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function applySettings(settings: DryDockSettings): void {
  const root = document.documentElement;

  if (settings.fontSize === 'default') {
    root.removeAttribute('data-font-size');
  } else {
    root.setAttribute('data-font-size', settings.fontSize);
  }

  if (settings.highContrast) {
    root.setAttribute('data-high-contrast', 'true');
  } else {
    root.removeAttribute('data-high-contrast');
  }
}

export function resetSettings(): DryDockSettings {
  const defaults = { ...DEFAULTS };
  saveSettings(defaults);
  applySettings(defaults);
  return defaults;
}
