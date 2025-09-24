//dwellwell-client/src/theme/swatches.ts
export type Swatch = { surface: string; surfaceAlt: string; primary: string; accent: string; text: string };

export const THEME_SWATCHES: Record<string, Swatch> = {
  'light:default': { surface:'#FFFFFF', surfaceAlt:'#F6F8FA', primary:'#2563EB', accent:'#0EA5E9', text:'#111827' },
  'dark:default':  { surface:'#111827', surfaceAlt:'#1F2937', primary:'#6366F1', accent:'#14B8A6', text:'#F3F4F6' },
  'light:calm':    { surface:'#FFFFFF', surfaceAlt:'#F0F9FF', primary:'#3B82F6', accent:'#5EEAD4', text:'#111827' },
  'dark:calm':     { surface:'#111827', surfaceAlt:'#1F2937', primary:'#3B82F6', accent:'#5EEAD4', text:'#F3F4F6' },
  'light:bold':    { surface:'#FFFFFF', surfaceAlt:'#FAF5FF', primary:'#D946EF', accent:'#EA580C', text:'#111827' },
  'dark:bold':     { surface:'#111827', surfaceAlt:'#1F2937', primary:'#D946EF', accent:'#EA580C', text:'#F3F4F6' },
  'light:forest':  { surface:'#FFFFFF', surfaceAlt:'#F0FDF4', primary:'#22C55E', accent:'#10B981', text:'#111827' },
  'dark:forest':   { surface:'#111827', surfaceAlt:'#1F2937', primary:'#22C55E', accent:'#10B981', text:'#F3F4F6' },
  'light:solar':   { surface:'#FFFFFF', surfaceAlt:'#FEF9C3', primary:'#F59E0B', accent:'#0369A1', text:'#111827' },
  'dark:solar':    { surface:'#111827', surfaceAlt:'#1F2937', primary:'#F59E0B', accent:'#0369A1', text:'#F3F4F6' },
};
