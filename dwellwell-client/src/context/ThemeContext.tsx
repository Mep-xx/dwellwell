//dwellwell-client/src/context/ThemeContext.tsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { BaseMode, StyleFamily } from '../theme/themes';
import { themeId } from '../theme/themes';

type ThemeState = { mode: BaseMode; style: StyleFamily };
type ThemeContextValue = {
  theme: ThemeState;
  setTheme: (next: ThemeState) => void;
  setMode: (mode: BaseMode) => void;
  setStyle: (style: StyleFamily) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = 'dwellwell.theme.v1';

function applyThemeToDocument({ mode, style }: ThemeState) {
  const html = document.documentElement;

  // remove old theme-* classes
  Array.from(html.classList)
    .filter((c) => c.startsWith('theme-'))
    .forEach((c) => html.classList.remove(c));

  // dark / light
  if (mode === 'dark') html.classList.add('dark');
  else html.classList.remove('dark');

  // style family
  if (style !== 'default') html.classList.add(`theme-${style}`);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as ThemeState;
    } catch {}
    return { mode: 'light', style: 'default' };
  });

  useEffect(() => {
    applyThemeToDocument(theme);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (next) => setThemeState(next),
      setMode: (mode) => setThemeState((t) => ({ ...t, mode })),
      setStyle: (style) => setThemeState((t) => ({ ...t, style })),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
