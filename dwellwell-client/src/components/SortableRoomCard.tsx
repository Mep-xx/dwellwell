// src/components/SortableRoomCard.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from './ui/input';
import { RoomTypeSelect } from './RoomTypeSelect';
import { ROOM_TYPE_ICONS } from '@constants';
import { floorToLabel, labelToFloor } from '@/utils/floorHelpers';
import { useRoomAutosave } from '@/hooks/useRoomAutosave';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Pencil, Trash2 } from 'lucide-react';

type Room = { id?: string; name: string; type: string; floor?: number | null };
type Props = {
  id: string;
  room: Room;
  onChange: (updated: Room) => void;
  onRemove: () => void;
  onEdit?: () => void;
};

export function SortableRoomCard({ id, room, onChange, onRemove, onEdit }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const { saving, scheduleSave } = useRoomAutosave(id);

  const [local, setLocal] = useState(room);
  const lastSavedRef = useRef(room);

  useEffect(() => {
    setLocal(room);
    lastSavedRef.current = room;
  }, [room.name, room.type, room.floor]);

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'relative flex items-center gap-2 border rounded bg-white px-3 py-2 shadow-sm transition-all w-full',
        'hover:shadow-md',
        saving === 'ok' && 'animate-pulse-green',
        saving === 'error' ? 'border-red-500 animate-shake' : 'border-gray-200'
      )}
      aria-live="polite"
      aria-busy={saving === 'saving'}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab pr-2 text-gray-400 select-none"
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

      {/* Floor */}
      <select
        value={floorToLabel(local.floor ?? undefined)}
        onChange={(e) => commit({ floor: labelToFloor(e.target.value) ?? null })}
        className="border rounded px-2 py-1 text-sm"
        title="Floor"
      >
        <option value="Basement">Basement</option>
        <option value="1st Floor">1st Floor</option>
        <option value="2nd Floor">2nd Floor</option>
        <option value="3rd Floor">3rd Floor</option>
        <option value="Attic">Attic</option>
        <option value="Other">Other</option>
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
          className="p-1 rounded hover:bg-gray-100"
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
  );
}
