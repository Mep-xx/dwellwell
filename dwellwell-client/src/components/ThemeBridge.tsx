// dwellwell-client/src/components/ThemeBridge.tsx
import { useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

type StoredV2 = {
  mode?: "system" | "light" | "dark";
  style?: "default" | "calm" | "bold" | "forest" | "solar";
  accentHex?: string;
  fontScale?: number;
};

const KEY_V2 = "dwellwell.theme.v2";
const KEY_V1 = "dwellwell.theme.v1";

export default function ThemeBridge() {
  const { setTheme } = useTheme();

  useEffect(() => {
    try {
      // 1) One-time migrate v1 -> v2 if needed
      const v2Raw = localStorage.getItem(KEY_V2);
      if (!v2Raw) {
        const v1Raw = localStorage.getItem(KEY_V1);
        if (v1Raw) {
          const v1 = JSON.parse(v1Raw) as StoredV2;
          const migrated: StoredV2 = {
            mode: v1.mode ?? "system",
            style: v1.style ?? "default",
            accentHex: v1.accentHex,
            fontScale: typeof v1.fontScale === "number" ? v1.fontScale : 1,
          };
          localStorage.setItem(KEY_V2, JSON.stringify(migrated));
          // optional: clear v1 to avoid re-reading it
          localStorage.removeItem(KEY_V1);
        }
      }

      // 2) If v2 exists, seed the ThemeContext ONCE (without clobbering later)
      const v2 = localStorage.getItem(KEY_V2);
      if (v2) {
        const s: StoredV2 = JSON.parse(v2);
        setTheme({
          mode: s.mode ?? "system",
          style: s.style ?? "default",
          accentHex: s.accentHex,
          fontScale: typeof s.fontScale === "number" ? s.fontScale : 1,
        });
      }
    } catch {
      /* ignore */
    }
  }, [setTheme]);

  return null;
}
