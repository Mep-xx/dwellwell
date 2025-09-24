import { useEffect } from 'react';

export function useTheming(theme: 'LIGHT'|'DARK'|'SYSTEM', accentColor: string, fontScale: number) {
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'DARK' || (theme === 'SYSTEM' && prefersDark);
    root.classList.toggle('dark', isDark);
    root.style.setProperty('--accent', accentColor);
    root.style.setProperty('--font-scale', String(fontScale));
  }, [theme, accentColor, fontScale]);
}
