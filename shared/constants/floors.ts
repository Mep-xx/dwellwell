// @shared/constants/floors.ts

/** Keep this in sync with backend expectations (ints like -1, 1, 2, 3, 99, 0). */
export type FloorKey = -1 | 1 | 2 | 3 | 99 | 0;

export const BUCKETS: { key: FloorKey; id: string; label: string; hint?: string }[] = [
  { key: -1, id: 'floor:-1', label: 'Basement' },
  { key: 1,  id: 'floor:1',  label: '1st Floor' },
  { key: 2,  id: 'floor:2',  label: '2nd Floor' },
  { key: 3,  id: 'floor:3',  label: '3rd Floor' },
  { key: 99, id: 'floor:99', label: 'Attic' },
  { key: 0,  id: 'floor:0',  label: 'Other', hint: 'Garage, exterior, etc.' },
];

/** Handy select options for forms. */
export const floorOptions = BUCKETS
  .filter(b => b.key !== 0) // omit "Other" from most in-room selects if you prefer
  .map(b => ({ value: b.key, label: b.label.replace(' Floor', '') })) as {
    value: FloorKey; label: string;
  }[];

/** If you *do* want "Other" as a selectable option in some places: */
export const floorOptionsWithOther = BUCKETS.map(b => ({
  value: b.key,
  label: b.key === 1 || b.key === 2 || b.key === 3
    ? b.label.replace(' Floor', '')
    : b.label,
})) as { value: FloorKey; label: string }[];

export const bucketIdSet = new Set(BUCKETS.map(b => b.id));
export const bucketKeyById = new Map<string, FloorKey>(BUCKETS.map(b => [b.id, b.key]));
export const bucketOrderIndex = new Map<FloorKey, number>(BUCKETS.map((b, i) => [b.key, i]));

/** Coerce arbitrary floor ints/null into a known FloorKey bucket. */
export function keyForFloor(f?: number | null): FloorKey {
  if (f === -1 || f === 1 || f === 2 || f === 3 || f === 99) return f;
  return 0;
}

export function floorLabel(n?: number | null) {
  if (n === null || n === undefined) return "No floor set";
  return BUCKETS.find(b => b.key === n)?.label ?? `Floor ${n}`;
}
