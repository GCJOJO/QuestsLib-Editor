// Thème de l'interface : clair, sombre, ou celui du système. Appliqué via data-theme sur <html>.
import { useSyncExternalStore } from 'react';

export type ThemeChoice = 'system' | 'light' | 'dark';
const STORAGE_KEY = 'questslib-editor.theme';

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // Stockage indisponible.
  }
  return 'system';
}

let current: ThemeChoice = read();
const listeners = new Set<() => void>();
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function apply() {
  if (typeof document === 'undefined') return;
  const resolved = current === 'system' ? (media?.matches ? 'dark' : 'light') : current;
  document.documentElement.dataset.theme = resolved;
}
apply();
media?.addEventListener('change', () => {
  if (current === 'system') apply();
});

export function setTheme(theme: ThemeChoice) {
  current = theme;
  apply();
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Valable pour cette session seulement.
  }
  listeners.forEach((l) => l());
}

export function useTheme(): ThemeChoice {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}
