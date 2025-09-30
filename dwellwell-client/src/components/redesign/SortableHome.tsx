// dwellwell-client/src/components/redesign/SortableHome.tsx
import { CSSProperties, PropsWithChildren } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

type Props = PropsWithChildren<{
  id: string;
  disabled?: boolean;
  handleAlign?: "left" | "right";
}>;

export default function SortableHome({ id, disabled, handleAlign = "right", children }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : undefined,
  };

  const stop = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {!disabled && (
        <button
          type="button"
          title="Drag to reorder"
          onMouseDown={stop}
          onClick={stop}
          className={`absolute top-2 ${handleAlign === "right" ? "right-2" : "left-2"} z-10 inline-flex items-center justify-center rounded-md border border-token bg-card/90 p-1 text-muted-foreground shadow-sm hover:bg-card focus:outline-none focus:ring-2 focus:ring-brand-primary`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
}
