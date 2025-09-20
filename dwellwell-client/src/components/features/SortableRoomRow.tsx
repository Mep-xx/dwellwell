//dwellwell-client/src/components/features/SortableRoomRow.tsx
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { getRoomVisual } from "@/utils/roomVisuals";
import type { Room } from "@shared/types/room";

type Props = {
  id: string;
  room: Room;
  onChange: (patch: Partial<Room>) => void;
  onEdit: () => void;
  onRemove: () => void;
};

export function SortableRoomRow({ id, room, onChange, onEdit, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const visual = getRoomVisual(room.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 shadow-sm"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-400 hover:text-gray-600"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Room icon */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md"
          style={{ backgroundColor: visual.accent + "22" }}
        >
          <visual.Icon className="h-4 w-4 text-gray-700" />
        </div>

        {/* Name + type */}
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{room.name || visual.label}</div>
          <div className="truncate text-xs text-muted-foreground">{visual.label}</div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Edit */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onEdit}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          onClick={onRemove}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
