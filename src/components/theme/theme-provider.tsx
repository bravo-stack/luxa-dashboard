'use client';

import * as React from 'react';

import {
  isThemeMode,
  type ResolvedTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from '@/lib/theme';

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);
const themeChangeEvent = 'luxa-theme-change';
let memoryMode: ThemeMode = 'system';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return resolveTheme(
    'system',
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
}

function getStoredMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    return isThemeMode(storedTheme) ? storedTheme : 'system';
  } catch {
    return memoryMode;
  }
}

function applyTheme(mode: ThemeMode, resolvedTheme: ResolvedTheme) {
  const root = document.documentElement;

  root.classList.toggle('dark', resolvedTheme === 'dark');
  root.dataset.theme = mode;
  root.dataset.resolvedTheme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
}

function setThemeMode(nextMode: ThemeMode) {
  memoryMode = nextMode;
  applyTheme(nextMode, nextMode === 'system' ? getSystemTheme() : nextMode);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
  } catch {
    // The in-memory preference still works when storage is unavailable.
  }

  window.dispatchEvent(new Event(themeChangeEvent));
}

function subscribeToSystemTheme(onStoreChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onStoreChange);

  return () => media.removeEventListener('change', onStoreChange);
}

function subscribeToStoredMode(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
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
  const hasHydrated = React.useRef(false);
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
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      return;
    }

    applyTheme(mode, resolvedTheme);
  }, [mode, resolvedTheme]);

  const setMode = React.useCallback((nextMode: ThemeMode) => {
    setThemeMode(nextMode);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (context) return context;

  // Keep the control usable during a transient RSC recovery or development refresh.
  const mode = getStoredMode();

  return {
    mode,
    resolvedTheme: mode === 'system' ? getSystemTheme() : mode,
    setMode: setThemeMode,
  };
}
