// dwellwell-client/src/components/features/QuickPromptsBar.tsx
import * as React from "react";
import { useQuickPrompts } from "@/hooks/useQuickPrompts";
import { apiQuick } from "@/utils/apiQuick";
import { CheckCircle2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type RoomLite = { id: string; name?: string | null; type?: string | null };
type TrackableLite = { id: string; roomId?: string | null; kind?: string | null };

type Props = {
  homeId: string;
  rooms: RoomLite[];
  trackables: TrackableLite[];
  onCreated?: (trackableId: string) => void;
  onAddDetails?: (args: { roomId: string; kind: string; category?: string | null }) => void;
  className?: string;
};

export default function QuickPromptsBar({
  homeId, rooms, trackables, onCreated, onAddDetails, className,
}: Props) {
  const { nextPrompts, dismiss } = useQuickPrompts({ homeId, rooms, trackables });

  const queue = nextPrompts;
  const [idx, setIdx] = React.useState(0);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (idx > queue.length - 1) setIdx(0);
  }, [queue.length, idx]);

  if (queue.length === 0) return null;
  const current = queue[idx];
  const total = queue.length;

  async function handleYes() {
    if (!current) return;
    setBusy(true);
    try {
      const { room, prompt } = current;
      const { data } = await apiQuick.trackables.quickCreate({
        roomId: room.id,
        kind: prompt.kind,
        category: prompt.category ?? null,
        userDefinedName: null,
      });
      onCreated?.(data.id);
    } finally {
      setBusy(false);
      dismiss(current.prompt.id);
      const nextLen = total - 1;
      setIdx((i) => (i >= nextLen ? Math.max(0, nextLen - 1) : i));
    }
  }

  function handleNoOrSkip() {
    if (!current) return;
    dismiss(current.prompt.id);
    const nextLen = total - 1;
    setIdx((i) => (i >= nextLen ? Math.max(0, nextLen - 1) : i));
  }

  function handleAddDetails() {
    if (!current) return;
    const { room, prompt } = current;
    onAddDetails?.({ roomId: room.id, kind: prompt.kind, category: prompt.category ?? null });
  }

  const prev = () => setIdx((i) => (i <= 0 ? 0 : i - 1));
  const next = () => setIdx((i) => (i >= total - 1 ? i : i + 1));

  const roomLabel = current.room.name || current.room.type || "Room";
  const roomEmoji = getRoomEmoji(current.room.type || current.room.name || "");

  return (
    <div
      className={cn(
        "w-full max-w-full rounded-xl border border-transparent bg-transparent",
        "px-2 py-2 text-[13px] leading-6",
        className
      )}
    >
      {/* Header: room chip + pager */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-7 w-7 rounded border bg-muted/40 flex items-center justify-center text-base shrink-0">
            {roomEmoji}
          </span>
          <span className="truncate">{roomLabel}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <IconButton label="Previous prompt" onClick={prev} disabled={idx === 0}>
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <span className="px-1 text-xs tabular-nums text-muted-foreground">{idx + 1}/{total}</span>
          <IconButton label="Next prompt" onClick={next} disabled={idx >= total - 1}>
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {/* Question (wraps) */}
      <div className="mt-1 text-sm font-medium leading-snug whitespace-normal break-words">
        {current.prompt.label}
      </div>

      {/* Actions */}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <ActionLink onClick={handleYes} disabled={busy}>
          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Yes
        </ActionLink>
        <DividerDot />
        <ActionLink onClick={handleNoOrSkip} disabled={busy}>
          <X className="mr-1 h-3.5 w-3.5" /> No
        </ActionLink>
        <DividerDot />
        <ActionLink onClick={handleAddDetails} disabled={busy}>
          Add details
        </ActionLink>
      </div>
    </div>
  );
}

/* ---------- tiny helpers ---------- */

function getRoomEmoji(label: string) {
  const l = label.toLowerCase();
  if (l.includes("bath")) return "🛁";
  if (l.includes("kitchen")) return "🍳";
  if (l.includes("bed")) return "🛏️";
  if (l.includes("laundry")) return "🧺";
  if (l.includes("garage")) return "🚗";
  if (l.includes("hvac") || l.includes("utility") || l.includes("mechan")) return "⚙️";
  if (l.includes("yard") || l.includes("garden") || l.includes("patio") || l.includes("deck")) return "🌿";
  return "🏠";
}

function ActionLink({
  children, onClick, disabled, className,
}: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center whitespace-nowrap",
        "text-[13px] font-medium text-brand-primary/90 hover:text-brand-primary",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 rounded-sm",
        className
      )}
    >
      {children}
    </button>
  );
}

function IconButton({
  children, onClick, disabled, label, className,
}: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; label: string; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        "h-6 w-6 text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40",
        className
      )}
    >
      {children}
    </button>
  );
}

function DividerDot() {
  return <span className="mx-0.5 text-slate-400 dark:text-slate-500">·</span>;
}
