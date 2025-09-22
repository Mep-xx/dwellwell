import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2, ListChecks, ExternalLink } from "lucide-react";
import { getRoomVisual } from "@/utils/roomVisuals";
import type { Room } from "@shared/types/room";

type Props = {
  id: string;
  room: Room & { floor?: number | null };
  overdue?: number;
  dueSoon?: number;
  onEdit?: () => void;
  onRemove?: () => void;
  onViewTasks?: () => void;
  onOpenRoom?: () => void; // open dedicated room page (or filtered task view)
};

export function SortableRoomRow({
  id,
  room,
  overdue = 0,
  dueSoon = 0,
  onEdit,
  onRemove,
  onViewTasks,
  onOpenRoom,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  // Use original visual shape: { Icon, label, accent }
  const visual = getRoomVisual(room.type || room.name || "Room");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-xl border bg-white px-3 py-2"
    >
      <div className="flex min-w-0 items-center gap-3">
        {/* drag handle */}
        <button
          className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 cursor-grab"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* room icon (component + accent tint) */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-white"
          style={{ backgroundColor: (visual.accent ?? "#E5E7EB") + "22" }} // light tint
        >
          {/* @ts-expect-error dynamic component from getRoomVisual */}
          <visual.Icon className="h-4 w-4 text-gray-700" />
        </div>

        {/* name / type; click to open room page */}
        <div className="min-w-0">
          <button
            onClick={onOpenRoom}
            className="block max-w-full truncate text-left text-sm font-medium hover:underline"
            title="Open room"
          >
            {room.name || visual.label}
          </button>
          <div className="text-xs text-muted-foreground truncate">{visual.label}</div>
        </div>
      </div>

      {/* right side actions */}
      <div className="ml-3 flex shrink-0 items-center gap-2">
        {/* small badges */}
        {(overdue > 0 || dueSoon > 0) && (
          <div className="mr-1 flex items-center gap-1">
            {overdue > 0 && (
              <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] text-red-700 border border-red-200">
                {overdue} overdue
              </span>
            )}
            {dueSoon > 0 && (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700 border border-amber-200">
                {dueSoon} due soon
              </span>
            )}
          </div>
        )}

        <Button size="sm" variant="outline" className="gap-1" onClick={onViewTasks} title="View tasks for this room">
          <ListChecks className="h-4 w-4" />
          Tasks
        </Button>

        <Button size="sm" variant="outline" className="gap-1" onClick={onOpenRoom} title="Open room page">
          <ExternalLink className="h-4 w-4" />
          Open
        </Button>

        <Button size="sm" variant="outline" className="gap-1" onClick={onEdit} title="Edit room">
          <Pencil className="h-4 w-4" />
          Edit
        </Button>

        <Button size="sm" variant="destructive" className="gap-1" onClick={onRemove} title="Delete room">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
