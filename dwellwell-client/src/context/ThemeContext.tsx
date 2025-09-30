// dwellwell-client/src/context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyTheme, restoreTheme, saveTheme } from "@/theme/applyTheme";

export type BaseMode = "light" | "dark" | "system";
export type StyleFamily = "default" | "calm" | "bold" | "forest" | "solar";

export type ThemeState = {
  mode: BaseMode;
  style: StyleFamily;
  accentHex?: string; // reserved for future, not required now
  fontScale?: number; // reserved for future, not required now
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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize from storage and paint ASAP
  const [theme, setThemeState] = useState<ThemeState>(() => restoreTheme());

  // Apply + persist on change
  useEffect(() => {
    applyTheme({ mode: theme.mode, style: theme.style });
    saveTheme({ mode: theme.mode, style: theme.style });
    // Optional: fontScale/accentHex could be wired to CSS custom props later
  }, [theme.mode, theme.style]);

  const value = useMemo<ThemeCtx>(
    () => ({
      theme,
      setTheme: setThemeState,
      setMode: (m) => setThemeState((t) => ({ ...t, mode: m })),
      setStyle: (s) => setThemeState((t) => ({ ...t, style: s })),
      setAccentHex: (hex) => setThemeState((t) => ({ ...t, accentHex: hex })),
      setFontScale: (n) => setThemeState((t) => ({ ...t, fontScale: n })),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
