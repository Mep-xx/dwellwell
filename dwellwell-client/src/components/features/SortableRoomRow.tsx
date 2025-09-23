//dwellwell-client/src/components/features/SortableRoomRow.tsx
import { forwardRef } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import type { Room } from "@shared/types/room";
import { ROOM_TYPE_ICONS } from "@shared/constants/roomTypes";

type Props = {
  id: string;
  room: Room;
  overdue: number;
  dueSoon: number;
  onEdit: () => void;
  onRemove: () => void;
  onViewTasks: () => void;
  onOpenRoom: () => void;
  /** Optional: show an inline “Add trackable” link for this room */
  onAddTrackable?: () => void;
};

export const SortableRoomRow = forwardRef<HTMLDivElement, Props>(function SortableRoomRow(
  { id, room, overdue, dueSoon, onEdit, onRemove, onViewTasks, onOpenRoom, onAddTrackable },
  ref
) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={(node) => { setNodeRef(node); if (typeof ref === "function") ref(node as any); }}
      style={style}
      className="rounded-xl border bg-white p-3 flex items-start gap-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab select-none text-xl h-9 w-9 flex items-center justify-center rounded border bg-gray-50"
        title="Drag to reorder"
        aria-label="Drag handle"
      >
        ⋮⋮
      </button>

      <div
        className="group flex-1 min-w-0 rounded-md px-1 py-0.5 hover:bg-muted/40 transition cursor-pointer"
        onClick={onOpenRoom}
        aria-label={`Open ${room.name}`}
      >
        <div className="flex items-center gap-2">
          <span className="h-9 w-9 rounded bg-gray-50 border flex items-center justify-center text-xl">
            {ROOM_TYPE_ICONS[room.type as any] ?? "🛋️"}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {/* Looks like a link + remains clickable */}
              <span className="font-medium underline decoration-transparent group-hover:decoration-current truncate">
                {room.name}
              </span>
              <span className="text-[10px] rounded px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200">{overdue} overdue</span>
              <span className="text-[10px] rounded px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">{dueSoon} due soon</span>
            </div>
          </div>

          {/* explicit open affordance */}
          <button
            onClick={(e) => { e.stopPropagation(); onOpenRoom(); }}
            className="ml-2 text-xs rounded border px-2 py-1 hover:bg-muted/40"
          >
            Open
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="ml-2 text-xs rounded border px-2 py-1 hover:bg-muted/40 bg-red-50 text-red-700 border border-red-200">Remove</button>
        </div>
      </div>
    </div>
  );
});
