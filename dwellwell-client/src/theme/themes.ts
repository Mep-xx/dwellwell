//dwellwell-client/src/theme/themes.ts
export type BaseMode = 'light' | 'dark';
export type StyleFamily = 'default' | 'calm' | 'bold' | 'forest' | 'solar';

export type ThemeChoice = {
  id: string;         // "dark:bold"
  label: string;      // "Dark · Bold"
  mode: BaseMode;
  style: StyleFamily;
};

export const THEME_CHOICES: ThemeChoice[] = [
  { id: 'light:default', label: 'Light · Default', mode: 'light', style: 'default' },
  { id: 'dark:default',  label: 'Dark · Default',  mode: 'dark',  style: 'default' },
  { id: 'light:calm',    label: 'Light · Calm',    mode: 'light', style: 'calm' },
  { id: 'dark:calm',     label: 'Dark · Calm',     mode: 'dark',  style: 'calm' },
  { id: 'light:bold',    label: 'Light · Bold',    mode: 'light', style: 'bold' },
  { id: 'dark:bold',     label: 'Dark · Bold',     mode: 'dark',  style: 'bold' },
  { id: 'light:forest',  label: 'Light · Forest',  mode: 'light', style: 'forest' },
  { id: 'dark:forest',   label: 'Dark · Forest',   mode: 'dark',  style: 'forest' },
  { id: 'light:solar',   label: 'Light · Solar',   mode: 'light', style: 'solar' },
  { id: 'dark:solar',    label: 'Dark · Solar',    mode: 'dark',  style: 'solar' },
];

export function themeId(mode: BaseMode, style: StyleFamily) {
  return `${mode}:${style}`;
}
