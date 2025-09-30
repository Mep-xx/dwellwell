// dwellwell-client/src/theme/applyTheme.ts
import type { BaseMode, StyleFamily } from "@/context/ThemeContext";

export type ThemePersist = { mode: BaseMode; style: StyleFamily };

const STORAGE_KEY = "dwellwell.theme.v2";
const FAMILIES: StyleFamily[] = ["default", "calm", "bold", "forest", "solar"];

/** Resolve whether the page should be dark given a mode. */
function isDarkFor(mode: BaseMode) {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return !!window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
}

/** Apply classes/attributes to <html> so CSS variables in global.css take effect. */
export function applyTheme(next: ThemePersist) {
  const html = document.documentElement;

  // Toggle dark class (Tailwind dark variants + our tokens)
  html.classList.toggle("dark", isDarkFor(next.mode));

  // Replace any previous theme-* family class
  FAMILIES.forEach((f) => html.classList.remove(`theme-${f}`));
  if (next.style !== "default") html.classList.add(`theme-${next.style}`);

  // Helpful attributes for debugging/analytics
  html.setAttribute("data-theme-mode", next.mode);
  html.setAttribute("data-theme-family", next.style);

  // If using "system", keep a live listener for OS changes.
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  // @ts-expect-error store handler on the element
  const prevHandler = html.__dwThemeSystemHandler as ((e: MediaQueryListEvent) => void) | undefined;
  if (prevHandler && media) media.removeEventListener("change", prevHandler);

  if (next.mode === "system" && media) {
    const handler = (e: MediaQueryListEvent) => {
      html.classList.toggle("dark", e.matches);
    };
    media.addEventListener("change", handler);
    // @ts-expect-error
    html.__dwThemeSystemHandler = handler;
  } else {
    // @ts-expect-error
    html.__dwThemeSystemHandler = null;
  }
}

export function saveTheme(next: ThemePersist) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function restoreTheme(): ThemePersist {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ThemePersist;
      applyTheme(parsed);
      return parsed;
    }
  } catch {}
  const def: ThemePersist = { mode: "system", style: "default" };
  applyTheme(def);
  return def;
}
