// dwellwell-client/src/components/features/SortableRoomRow.tsx
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
  /** Optional overall count of tasks scoped to this room */
  total?: number;
  /** Optional count of trackables in this room */
  trackables?: number;

  onEdit: () => void;
  onRemove: () => void;
  onViewTasks: () => void;
  onOpenRoom: () => void;
  /** Optional: show an inline “Add trackable” link for this room */
  onAddTrackable?: () => void;
};

function Badge({
  children,
  tone = "neutral",
  title,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "danger" | "warn" | "info";
  title?: string;
}) {
  const cls =
    tone === "danger"
      ? "bg-red-50 text-red-700 border-red-200"
      : tone === "warn"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : tone === "info"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span
      title={title}
      className={`text-[11px] rounded px-2 py-0.5 border ${cls} whitespace-nowrap`}
    >
      {children}
    </span>
  );
}

export const SortableRoomRow = forwardRef<HTMLDivElement, Props>(function SortableRoomRow(
  { id, room, overdue, dueSoon, total = 0, trackables = 0, onEdit, onRemove, onViewTasks, onOpenRoom, onAddTrackable },
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
      {/* drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab select-none text-xl h-9 w-9 flex items-center justify-center rounded border bg-gray-50"
        title="Drag to reorder"
        aria-label="Drag handle"
      >
        ⋮⋮
      </button>

      {/* main */}
      <div
        className="group flex-1 min-w-0 rounded-md px-1 py-0.5 hover:bg-muted/40 transition cursor-pointer"
        onClick={onOpenRoom}
        aria-label={`Open ${room.name}`}
      >
        <div className="flex items-center gap-2">
          <span className="h-9 w-9 rounded bg-gray-50 border flex items-center justify-center text-xl shrink-0">
            {ROOM_TYPE_ICONS[room.type as any] ?? "🛋️"}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium underline decoration-transparent group-hover:decoration-current truncate">
                {room.name || room.type}
              </span>
              {/* counters */}
              {overdue > 0 && <Badge tone="danger" title="Overdue">{overdue} overdue</Badge>}
              {dueSoon > 0 && <Badge tone="warn" title="Due within 7 days">{dueSoon} due soon</Badge>}
              <Badge tone="neutral" title="Total tasks in this room">{total} total</Badge>
              <Badge tone="info" title="Trackables in this room">{trackables} trackables</Badge>
            </div>

            {/* optional quick add trackable */}
            {onAddTrackable && (
              <button
                onClick={(e) => { e.stopPropagation(); onAddTrackable(); }}
                className="mt-1 text-xs text-blue-700 hover:underline"
              >
                + Add trackable
              </button>
            )}
          </div>

          {/* actions */}
          <div className="ml-2 flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onViewTasks(); }}
              className="text-xs rounded border px-2 py-1 hover:bg-muted/40"
              title="View tasks"
            >
              Tasks
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenRoom(); }}
              className="text-xs rounded border px-2 py-1 hover:bg-muted/40"
              title="Open room"
            >
              Open
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="text-xs rounded border px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100"
              title="Remove room"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
