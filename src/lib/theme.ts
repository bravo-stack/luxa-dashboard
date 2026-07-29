export const THEME_STORAGE_KEY = 'luxa-theme';

export const themeModes = ['light', 'dark', 'system'] as const;

export type ThemeMode = (typeof themeModes)[number];
export type ResolvedTheme = Exclude<ThemeMode, 'system'>;

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && themeModes.includes(value as ThemeMode);
}

export function resolveTheme(mode: ThemeMode, prefersDark: boolean): ResolvedTheme {
  return mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
}

/**
 * Runs while the document head is being parsed so persisted theme state is
 * applied before the browser can paint the page.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){var m='system';try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');if(s==='light'||s==='dark'||s==='system')m=s}catch(e){}var d=m==='dark';if(m==='system')try{d=matchMedia('(prefers-color-scheme: dark)').matches}catch(e){}var r=document.documentElement,t=d?'dark':'light';r.classList.toggle('dark',d);r.dataset.theme=m;r.dataset.resolvedTheme=t;r.style.colorScheme=t})();`;
