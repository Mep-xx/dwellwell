import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@/components/ui/input';
import { RoomTypeSelect } from './RoomTypeSelect';
import { ROOM_TYPE_ICONS } from '@constants';
// ⬇️ replace the old floorHelpers import with the shared floors constants
import {
  floorOptionsWithOther as FLOOR_OPTIONS,
  keyForFloor,
  FloorKey,
} from '@shared/constants/floors';
import { useRoomAutosave } from '@/hooks/useRoomAutosave';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Pencil, Trash2 } from 'lucide-react';

type Room = { id?: string; name: string; type: string; floor?: number | null; detail?: any };
type Props = {
  id: string;
  room: Room;
  onChange: (updated: Room) => void;
  onRemove: () => void;
  onEdit?: () => void;
};

function chipify(detail: any): string[] {
  if (!detail) return [];

  const chips: string[] = [];

  // Surfaces
  if (detail.flooring) chips.push(String(detail.flooring).replaceAll('_', ' '));
  if (detail.wallFinish) chips.push(String(detail.wallFinish).replaceAll('_', ' '));
  if (detail.ceilingType && detail.ceilingType !== 'drywall') {
    chips.push(String(detail.ceilingType).replaceAll('_', ' '));
  }

  // Windows
  const wc = Number.isFinite(detail.windowCount) ? Number(detail.windowCount) : 0;
  if (wc > 0) {
    const wt = detail.windowType && detail.windowType !== 'none'
      ? ` (${String(detail.windowType).replaceAll('_', ' ')})`
      : '';
    chips.push(`${wc} window${wc === 1 ? '' : 's'}${wt}`);
  }
  if (detail.hasExteriorDoor) chips.push('exterior door');

  // HVAC
  if (detail.heatBaseboardHydronic) chips.push('baseboard (hydronic)');
  if (detail.heatBaseboardElectric) chips.push('baseboard (electric)');
  if (detail.heatRadiator) chips.push('radiator heat');
  const sv = Number.isFinite(detail.hvacSupplyVents) ? Number(detail.hvacSupplyVents) : 0;
  const rv = Number.isFinite(detail.hvacReturnVents) ? Number(detail.hvacReturnVents) : 0;
  if (sv > 0 || rv > 0) chips.push(`HVAC S:${sv || 0} R:${rv || 0}`);
  if (detail.hasCeilingFan) chips.push('ceiling fan');
  if (detail.ceilingFixture && detail.ceilingFixture !== 'none') {
    chips.push(String(detail.ceilingFixture).replaceAll('_', ' '));
  }
  const rc = Number.isFinite(detail.recessedLightCount) ? Number(detail.recessedLightCount) : 0;
  if (rc > 0) chips.push(`${rc} recessed`);

  // Electrical
  const oc = Number.isFinite(detail.approxOutletCount) ? Number(detail.approxOutletCount) : 0;
  if (oc > 0) chips.push(`${oc} outlets`);
  if (detail.hasGfci) chips.push('GFCI');

  // Safety
  if (detail.hasSmokeDetector) chips.push('smoke detector');
  if (detail.hasCoDetector) chips.push('CO detector');
  if (detail.hasFireplace) chips.push('fireplace');

  // Plumbing
  const sc = Number.isFinite(detail.sinkCount) ? Number(detail.sinkCount) : 0;
  const tc = Number.isFinite(detail.toiletCount) ? Number(detail.toiletCount) : 0;
  const shc = Number.isFinite(detail.showerCount) ? Number(detail.showerCount) : 0;
  const tubc = Number.isFinite(detail.tubCount) ? Number(detail.tubCount) : 0;
  if (sc > 0) chips.push(`${sc} sink${sc === 1 ? '' : 's'}`);
  if (tc > 0) chips.push(`${tc} toilet${tc === 1 ? '' : 's'}`);
  if (shc > 0) chips.push(`${shc} shower${shc === 1 ? '' : 's'}`);
  if (tubc > 0) chips.push(`${tubc} tub${tubc === 1 ? '' : 's'}`);
  if (detail.hasRadiantFloorHeat) chips.push('radiant floor');

  // Access
  if (detail.hasAtticAccess) chips.push('attic access');
  if (detail.hasCrawlspaceAccess) chips.push('crawlspace access');

  return chips;
}

export function SortableRoomCard({ id, room, onChange, onRemove, onEdit }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const { saving, scheduleSave } = useRoomAutosave(id);

  const [local, setLocal] = useState(room);
  const lastSavedRef = useRef(room);

  useEffect(() => {
    setLocal(room);
    lastSavedRef.current = room;
  }, [room.name, room.type, room.floor, room.detail]);

  const commit = (patch: Partial<Room>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange(next);
    scheduleSave(patch as any);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setLocal(lastSavedRef.current);
      onChange(lastSavedRef.current);
      (e.currentTarget as HTMLInputElement).blur();
    }
    if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
  };

  const chips = chipify((local as any).detail);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'relative border border-token rounded bg-card text-body px-3 py-2 shadow-sm transition-all w-full',
        'hover:shadow-md',
        saving === 'ok' && 'animate-pulse-green',
        saving === 'error' ? 'border-red-500 animate-shake' : 'border-token'
      )}
      aria-live="polite"
      aria-busy={saving === 'saving'}
    >
      {/* Top row: controls */}
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab pr-2 text-muted select-none"
          title="Drag to reorder"
        >
          ☰
        </div>

        {/* Icon */}
        <div className="text-xl">{ROOM_TYPE_ICONS[local.type] ?? '📦'}</div>

        {/* Room Type */}
        <RoomTypeSelect
          value={local.type}
          onChange={(type) => commit({ type })}
          className="min-w-[180px]"
        />

        {/* Nickname */}
        <Input
          placeholder="Name (optional)"
          value={local.name ?? ''}
          onChange={(e) => setLocal({ ...local, name: e.target.value })}
          onBlur={(e) => commit({ name: e.target.value })}
          onKeyDown={onKeyDown}
          className="flex-1"
        />

        {/* Floor (shared constants) */}
        <select
          value={String(keyForFloor(local.floor ?? null))}
          onChange={(e) => {
            const v = e.target.value === '' ? null : (Number(e.target.value) as FloorKey);
            commit({ floor: v });
          }}
          className="border rounded px-2 py-1 text-sm"
          title="Floor"
        >
          <option value="">(Select…)</option>
          {FLOOR_OPTIONS.map((opt) => (
            <option key={opt.value} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Status feedback */}
        <div className="w-6 h-5 flex items-center justify-center ml-1">
          {saving === 'saving' && (
            <span
              className="inline-block h-4 w-4 rounded-full border-2 border-status-info border-t-transparent animate-spin"
              aria-label="Saving"
            />
          )}
          {saving === 'ok' && (
            <span
              className="text-status-success font-bold animate-fade-out"
              aria-label="Saved"
            >
              ✔
            </span>
          )}
          {saving === 'error' && (
            <span className="text-status-danger font-bold" aria-label="Save failed">
              ❗
            </span>
          )}
        </div>

        {/* Actions */}
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-1 rounded hover:bg-surface-alt/60"
            title="Edit room"
            aria-label="Edit room"
          >
            <Pencil className="w-5 h-5 text-gray-700" />
          </button>
        )}
        <button
          onClick={onRemove}
          className="p-1 rounded hover:bg-red-50"
          title="Remove room"
          aria-label="Remove room"
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      </div>

      {/* Bottom row: summary chips */}
      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.slice(0, 10).map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="text-[11px] leading-5 px-2 py-0.5 rounded-full border border-token bg-surface-alt text-body"
              title={c}
            >
              {c}
            </span>
          ))}
          {chips.length > 10 && (
            <span className="text-[11px] leading-5 px-2 py-0.5 rounded-full border border-token bg-surface-alt text-body">
              +{chips.length - 10} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
