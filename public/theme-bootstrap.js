(() => {
  try {
    const stored = localStorage.getItem('luxa-theme');
    const mode =
      stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.dataset.theme = mode;
  } catch {
    // The CSS light default remains usable if browser storage is unavailable.
  }
})();
