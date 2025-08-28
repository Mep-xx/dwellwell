// src/components/SortableRoomCard.tsx

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from './ui/input';
import { RoomTypeSelect } from './RoomTypeSelect';
import { ROOM_TYPE_ICONS } from '@shared/constants';
import { floorToLabel, labelToFloor } from '@/utils/floorHelpers';

type Room = {
  name: string;
  type: string;
  floor?: number;
};

type Props = {
  id: string;
  room: Room;
  onChange: (updated: Room) => void;
  onRemove: () => void;
};

export function SortableRoomCard({ id, room, onChange, onRemove }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 border rounded bg-white px-3 py-2 shadow-sm hover:shadow-md transition-all"
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
      <div className="text-xl">{ROOM_TYPE_ICONS[room.type] ?? '📦'}</div>

      {/* Room Type Select */}
      <RoomTypeSelect
        value={room.type}
        label=""
        onChange={(type) => onChange({ ...room, type })}
      />

      {/* Nickname Input */}
      <Input
        placeholder="Name (optional)"
        value={room.name}
        onChange={(e) => onChange({ ...room, name: e.target.value })}
        className="flex-1"
      />

      {/* Floor Selector */}
      <select
        value={floorToLabel(room.floor)}
        onChange={(e) =>
          onChange({ ...room, floor: labelToFloor(e.target.value) ?? undefined })
        }
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="">Floor</option>
        <option value="Basement">Basement</option>
        <option value="1st Floor">1st Floor</option>
        <option value="2nd Floor">2nd Floor</option>
        <option value="3rd Floor">3rd Floor</option>
        <option value="Attic">Attic</option>
        <option value="Other">Other</option>
      </select>

      {/* Delete button */}
      <button
        onClick={onRemove}
        className="text-red-500 hover:text-red-700 text-xl px-2"
        title="Remove room"
      >
        ✕
      </button>
    </div>
  );
}
