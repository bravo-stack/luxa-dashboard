import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

import {
  isThemeMode,
  resolveTheme,
  THEME_BOOTSTRAP_SCRIPT,
  THEME_STORAGE_KEY,
} from './theme';

function runThemeBootstrap({
  storedMode,
  prefersDark,
  storageThrows = false,
}: {
  storedMode: string | null;
  prefersDark: boolean;
  storageThrows?: boolean;
}) {
  const dataset: Record<string, string> = {};
  const style: Record<string, string> = {};
  const classes = new Set<string>();

  vm.runInNewContext(THEME_BOOTSTRAP_SCRIPT, {
    document: {
      documentElement: {
        classList: {
          toggle(className: string, force: boolean) {
            if (force) classes.add(className);
            else classes.delete(className);
          },
        },
        dataset,
        style,
      },
    },
    localStorage: {
      getItem(key: string) {
        expect(key).toBe(THEME_STORAGE_KEY);
        if (storageThrows) throw new Error('Storage is unavailable');
        return storedMode;
      },
    },
    matchMedia() {
      return { matches: prefersDark };
    },
  });

  return { classes, dataset, style };
}

describe('theme preferences', () => {
  it.each([
    ['light', true, 'light'],
    ['dark', false, 'dark'],
    ['system', true, 'dark'],
    ['system', false, 'light'],
  ] as const)('resolves %s with prefersDark=%s to %s', (mode, prefersDark, expected) => {
    expect(resolveTheme(mode, prefersDark)).toBe(expected);
  });

  it.each(['light', 'dark', 'system'])('accepts the supported %s mode', (mode) => {
    expect(isThemeMode(mode)).toBe(true);
  });

  it('rejects missing and invalid preferences', () => {
    expect(isThemeMode(null)).toBe(false);
    expect(isThemeMode('midnight')).toBe(false);
  });
});

describe('theme bootstrap', () => {
  it('applies a persisted dark theme before hydration', () => {
    const result = runThemeBootstrap({ storedMode: 'dark', prefersDark: false });

    expect(result.classes.has('dark')).toBe(true);
    expect(result.dataset).toEqual({ theme: 'dark', resolvedTheme: 'dark' });
    expect(result.style.colorScheme).toBe('dark');
  });

  it('keeps an explicit light preference on a dark system', () => {
    const result = runThemeBootstrap({ storedMode: 'light', prefersDark: true });

    expect(result.classes.has('dark')).toBe(false);
    expect(result.dataset).toEqual({ theme: 'light', resolvedTheme: 'light' });
    expect(result.style.colorScheme).toBe('light');
  });

  it('uses the system preference when storage is empty or unavailable', () => {
    const withoutPreference = runThemeBootstrap({
      storedMode: null,
      prefersDark: true,
    });
    const withoutStorage = runThemeBootstrap({
      storedMode: null,
      prefersDark: true,
      storageThrows: true,
    });

    expect(withoutPreference.dataset).toEqual({
      theme: 'system',
      resolvedTheme: 'dark',
    });
    expect(withoutStorage.dataset).toEqual(withoutPreference.dataset);
    expect(withoutStorage.classes.has('dark')).toBe(true);
  });
});
