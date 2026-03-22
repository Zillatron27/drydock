import type { PricingMode, ExchangeFilter } from '../types';
import { EXCHANGES } from './pricing';

export interface DryDockSettings {
  fontSize: 'default' | 'medium' | 'large' | 'xl';
  highContrast: boolean;
  pricingMode: PricingMode;
  cherryPickExchanges: ExchangeFilter;
}

const DEFAULT_EXCHANGE_FILTER: ExchangeFilter = Object.fromEntries(
  EXCHANGES.map(ex => [ex, true]),
);

const DEFAULTS: DryDockSettings = {
  fontSize: 'default',
  highContrast: false,
  pricingMode: 'best_price',
  cherryPickExchanges: { ...DEFAULT_EXCHANGE_FILTER },
};

const STORAGE_KEY = 'drydock_settings';

export function loadSettings(): DryDockSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS, cherryPickExchanges: { ...DEFAULT_EXCHANGE_FILTER } };
    const parsed = JSON.parse(raw) as Partial<DryDockSettings>;
    // Ensure all known exchanges are present; unknown keys default to enabled
    const storedFilter = parsed.cherryPickExchanges;
    const cherryPickExchanges = { ...DEFAULT_EXCHANGE_FILTER };
    if (storedFilter && typeof storedFilter === 'object') {
      for (const ex of EXCHANGES) {
        if (typeof storedFilter[ex] === 'boolean') {
          cherryPickExchanges[ex] = storedFilter[ex];
        }
      }
    }
    return { ...DEFAULTS, ...parsed, cherryPickExchanges };
  } catch {
    return { ...DEFAULTS, cherryPickExchanges: { ...DEFAULT_EXCHANGE_FILTER } };
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
  const defaults = { ...DEFAULTS, cherryPickExchanges: { ...DEFAULT_EXCHANGE_FILTER } };
  saveSettings(defaults);
  applySettings(defaults);
  return defaults;
}
