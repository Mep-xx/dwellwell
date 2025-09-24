//dwellwell-client/src/context/ThemeContext.tsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type BaseMode = 'light' | 'dark' | 'system';
export type StyleFamily = 'default' | 'calm' | 'bold' | 'forest' | 'solar';

export type ThemeState = {
  mode: BaseMode;         // user intent (system/light/dark)
  style: StyleFamily;     // family overlay (optional)
  accentHex?: string;     // e.g. "#D946EF"
  fontScale?: number;     // 0.75 -> 1.5
};

type ThemeCtx = {
  theme: ThemeState;
  setTheme: (t: ThemeState) => void;
  setMode: (m: BaseMode) => void;
  setStyle: (s: StyleFamily) => void;
  setAccentHex: (hex?: string) => void;
  setFontScale: (n?: number) => void;
};

const ThemeContext = createContext<ThemeCtx | undefined>(undefined);
const STORAGE_KEY = 'dwellwell.theme.v1';

function hexToRgb(hex?: string): [number, number, number] | null {
  if (!hex) return null;
  const m = hex.trim().replace('#','');
  const v = m.length === 3
    ? m.split('').map(c => c + c).join('')
    : m;
  if (!/^[0-9a-fA-F]{6}$/.test(v)) return null;
  const r = parseInt(v.slice(0,2),16);
  const g = parseInt(v.slice(2,4),16);
  const b = parseInt(v.slice(4,6),16);
  return [r,g,b];
}

function applyToDocument(theme: ThemeState) {
  const html = document.documentElement;

  // Clean previous theme-* classes
  for (const c of Array.from(html.classList)) {
    if (c.startsWith('theme-')) html.classList.remove(c);
  }

  // Resolve mode (system -> prefers-color-scheme)
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const resolved: 'light' | 'dark' =
    theme.mode === 'system' ? (systemDark ? 'dark' : 'light') : theme.mode;

  // Toggle .dark and data attributes
  html.classList.toggle('dark', resolved === 'dark');
  html.setAttribute('data-color-mode', resolved);
  html.classList.add(`theme-${theme.style || 'default'}`);
  html.setAttribute('data-style-family', theme.style || 'default');

  // Accent + scale (optional)
  const root = document.documentElement;
  if (theme.accentHex) {
    // Accept hex like #RRGGBB
    const m = theme.accentHex.replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(m)) {
      const r = parseInt(m.slice(0, 2), 16);
      const g = parseInt(m.slice(2, 4), 16);
      const b = parseInt(m.slice(4, 6), 16);
      root.style.setProperty('--primary', `${r} ${g} ${b}`);
      root.style.setProperty('--accent', `${r} ${g} ${b}`);
    }
  } else {
    root.style.removeProperty('--primary');
    root.style.removeProperty('--accent');
  }

  if (theme.fontScale && theme.fontScale > 0) {
    root.style.setProperty('--font-scale', String(theme.fontScale));
  } else {
    root.style.removeProperty('--font-scale');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as ThemeState;
    } catch {}
    return { mode: 'system', style: 'default' };
  });

  // react to system changes if user chose SYSTEM
  useEffect(() => {
    if (theme.mode !== 'system') return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const handler = () => applyToDocument(theme);
    mq?.addEventListener?.('change', handler);
    return () => mq?.removeEventListener?.('change', handler);
  }, [theme.mode]);

  useEffect(() => {
    applyToDocument(theme);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }, [theme]);

  const value = useMemo<ThemeCtx>(() => ({
    theme,
    setTheme: setThemeState,
    setMode: (m) => setThemeState(t => ({ ...t, mode: m })),
    setStyle: (s) => setThemeState(t => ({ ...t, style: s })),
    setAccentHex: (hex) => setThemeState(t => ({ ...t, accentHex: hex })),
    setFontScale: (n) => setThemeState(t => ({ ...t, fontScale: n })),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
