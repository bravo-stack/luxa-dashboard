'use client';

import * as React from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);
const storageKey = 'luxa-theme';
const themeChangeEvent = 'luxa-theme-change';
let memoryMode: ThemeMode = 'system';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    const storedTheme = window.localStorage.getItem(storageKey);

    return storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
      ? storedTheme
      : memoryMode;
  } catch {
    return memoryMode;
  }
}

function applyTheme(mode: ThemeMode, resolvedTheme: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.dataset.theme = mode;
}

function subscribeToSystemTheme(onStoreChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onStoreChange);

  return () => media.removeEventListener('change', onStoreChange);
}

function subscribeToStoredMode(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) {
      onStoreChange();
    }
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener(themeChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(themeChangeEvent, onStoreChange);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = React.useSyncExternalStore(
    subscribeToStoredMode,
    getStoredMode,
    (): ThemeMode => 'system',
  );
  const systemTheme = React.useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    (): ResolvedTheme => 'light',
  );
  const resolvedTheme = mode === 'system' ? systemTheme : mode;

  React.useLayoutEffect(() => {
    applyTheme(mode, resolvedTheme);
  }, [mode, resolvedTheme]);

  const setMode = React.useCallback((nextMode: ThemeMode) => {
    memoryMode = nextMode;

    try {
      window.localStorage.setItem(storageKey, nextMode);
    } catch {
      // The in-memory preference still works when storage is unavailable.
    }

    window.dispatchEvent(new Event(themeChangeEvent));
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
