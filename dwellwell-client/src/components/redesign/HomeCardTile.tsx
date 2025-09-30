// dwellwell-client/src/components/redesign/HomeCardTile.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "@shared/types/home";
import { resolveHomeImageUrl } from "@/utils/images";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import { DeleteHomeModal } from "@/components/features/DeleteHomeModal";

type TaskSummary = {
  complete: number;
  dueSoon: number;
  overdue: number;
  total: number;
};

type Summary = {
  id: string;
  nickname: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  counts: { rooms: number; vehicles: number; trackables: number };
  taskSummary?: TaskSummary;
};

type Props = {
  home: Home;
  summary?: Summary;
  className?: string;
  onToggleChecked?: (homeId: string, value: boolean) => void;
  onDelete?: (homeId: string) => void;
};

function percent(complete = 0, total = 0) {
  if (!total) return 0; // avoid 100% when there are no tasks
  return Math.round((complete / Math.max(total, 1)) * 100);
}

export default function HomeCardTile({
  home,
  summary,
  className = "",
  onToggleChecked,
  onDelete,
}: Props) {
  const navigate = useNavigate();
  const img = resolveHomeImageUrl(home.imageUrl);
  const [showDelete, setShowDelete] = useState(false);

  const label = useMemo(() => {
    if (home.nickname) return home.nickname!;
    return `${home.address}, ${home.city}, ${home.state}`;
  }, [home]);

  const open = () => navigate(`/app/homes/${home.id}`);

  const ts = summary?.taskSummary;
  const pct = percent(ts?.complete, ts?.total);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") open();
        }}
        className={`overflow-hidden rounded-2xl border border-token bg-card shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer ${className}`}
      >
        <div className="relative h-36 w-full">
          <img src={img} alt={label} title={label} className="h-full w-full object-cover" />
          {!home.isChecked && (
            <span className="absolute top-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
              Not in To-Do
            </span>
          )}
        </div>

        <div className="p-3">
          <p className="text-sm text-muted-foreground line-clamp-1">
            {home.nickname || home.address}
          </p>
          <p className="text-sm font-medium line-clamp-1">
            {home.address}, {home.city}, {home.state}
          </p>

          {/* Maintenance mini-summary */}
          <div className="mt-2">
            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
              <span>✅ {ts?.complete ?? 0}</span>
              <span>🕒 {ts?.dueSoon ?? 0}</span>
              <span>⚠️ {ts?.overdue ?? 0}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-muted">
              <div className="h-1.5 bg-brand-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
            <span>🛋 {summary?.counts.rooms ?? 0} rooms</span>
            <span>🧰 {summary?.counts.trackables ?? 0} trackables</span>
          </div>
        </div>

        {/* Footer actions */}
        <div
          className="flex items-center justify-between gap-3 border-t border-token px-3 py-2 bg-surface-alt/40"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <Switch
              checked={!!home.isChecked}
              onCheckedChange={(val) => onToggleChecked?.(home.id, val)}
            />
            <span className="text-xs text-muted-foreground">Include in To-Do</span>
          </div>

          <button
            title="Delete home"
            className="inline-flex items-center rounded-md border border-token px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Delete
          </button>
        </div>
      </div>

      <DeleteHomeModal
        isOpen={showDelete}
        onCancel={() => setShowDelete(false)}
        onConfirm={() => {
          setShowDelete(false);
          onDelete?.(home.id);
        }}
      />
    </>
  );
}
