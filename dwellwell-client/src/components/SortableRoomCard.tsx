// src/components/SortableRoomCard.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from './ui/input';
import { RoomTypeSelect } from './RoomTypeSelect';
import { ROOM_TYPE_ICONS } from '@constants';
import { floorToLabel, labelToFloor } from '@/utils/floorHelpers';
import { useRoomAutosave } from '@/hooks/useRoomAutosave';
import { useEffect, useRef, useState } from 'react';

type Room = { name: string; type: string; floor?: number | null; };
type Props = { id: string; room: Room; onChange: (updated: Room) => void; onRemove: () => void; };

export function SortableRoomCard({ id, room, onChange, onRemove }: Props) {
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
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-2 border rounded bg-white px-3 py-2 shadow-sm hover:shadow-md transition-all w-full">

      {/* Drag handle */}
      <div {...attributes} {...listeners}
        className="cursor-grab pr-2 text-gray-400 select-none" title="Drag to reorder">
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
        value={local.name}
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
        <option value="">Floor</option>
        <option value="Basement">Basement</option>
        <option value="1st Floor">1st Floor</option>
        <option value="2nd Floor">2nd Floor</option>
        <option value="3rd Floor">3rd Floor</option>
        <option value="Attic">Attic</option>
        <option value="Other">Other</option>
      </select>

      {/* Save status */}
      <div className="w-6 text-center" title={
        saving === 'saving' ? 'Saving…' : saving === 'ok' ? 'Saved' : saving === 'error' ? 'Save failed' : 'Idle'
      }>
        {saving === 'saving' && '⏳'}
        {saving === 'ok' && '✅'}
        {saving === 'error' && '⚠️'}
      </div>

      {/* Delete */}
      <button onClick={onRemove} className="text-red-500 hover:text-red-700 text-xl px-2" title="Remove room">
        ✕
      </button>
    </div>
  );
}
