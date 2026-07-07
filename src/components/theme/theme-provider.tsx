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

  const storedTheme = window.localStorage.getItem(storageKey);

  return storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
    ? storedTheme
    : 'system';
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode;
}

function applyTheme(mode: ThemeMode) {
  const resolvedTheme = resolveTheme(mode);

  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.dataset.theme = mode;

  return resolvedTheme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<ThemeMode>(() => getStoredMode());
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(() =>
    resolveTheme(getStoredMode()),
  );

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (mode === 'system') {
        setResolvedTheme(applyTheme('system'));
      }
    };

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  const setMode = React.useCallback((nextMode: ThemeMode) => {
    window.localStorage.setItem(storageKey, nextMode);
    setModeState(nextMode);
    setResolvedTheme(applyTheme(nextMode));
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

export const themeBootstrapScript = `
(() => {
  try {
    const stored = localStorage.getItem('${storageKey}');
    const mode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.dataset.theme = mode;
  } catch (_) {}
})();
`;
