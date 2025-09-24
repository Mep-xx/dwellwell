// dwellwell-client/src/components/ThemeBridge.tsx
import { useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

type Stored = {
  mode?: 'system' | 'light' | 'dark';
  style?: 'default' | 'calm' | 'bold' | 'forest' | 'solar';
  accentHex?: string;
  fontScale?: number;
};

export default function ThemeBridge() {
  const { setTheme } = useTheme();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('dwellwell.theme.v1');
      if (raw) {
        const s: Stored = JSON.parse(raw);
        setTheme({
          mode: s.mode ?? 'system',
          style: s.style ?? 'default',
          accentHex: s.accentHex,
          fontScale: s.fontScale ?? 1,
        });
      }
    } catch {
      /* ignore */
    }
  }, [setTheme]);

  return null;
}
