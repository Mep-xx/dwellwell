// dwellwell-client/src/components/redesign/HomeCardLarge.tsx
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
  squareFeet: number | null;
  yearBuilt: number | null;
  hasCentralAir: boolean;
  hasBaseboard: boolean;
  features: string[];
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

export default function HomeCardLarge({
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
    if (summary?.nickname) return summary.nickname!;
    if (home.nickname) return home.nickname!;
    return `${home.address}, ${home.city}, ${home.state}`;
  }, [summary, home]);

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
        className={`grid grid-cols-12 gap-0 overflow-hidden rounded-2xl border border-token bg-card shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${className}`}
      >
        <div className="col-span-12 md:col-span-5 relative h-44 md:h-full">
          <img src={img} alt={label} title={label} className="h-full w-full object-cover" />
          {!home.isChecked && (
            <span className="absolute top-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
              Not in To-Do
            </span>
          )}
        </div>

        <div className="col-span-12 md:col-span-7 flex flex-col">
          <div className="flex-1 p-4 md:p-6">
            <p className="text-xs text-muted-foreground">
              {home.city}, {home.state} {home.zip}
            </p>
            <h3 className="mt-0.5 text-lg font-semibold leading-tight">{label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary?.squareFeet ? `${summary.squareFeet.toLocaleString()} sq ft` : "—"} •{" "}
              {summary?.yearBuilt ? `Built ${summary.yearBuilt}` : "Year n/a"}
            </p>

            {Array.isArray(summary?.features) && summary!.features.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {summary!.features.slice(0, 6).map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-token px-2 py-0.5 text-[11px] text-muted-foreground bg-card"
                  >
                    {f}
                  </span>
                ))}
                {summary!.features.length > 6 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    +{summary!.features.length - 6} more
                  </span>
                )}
              </div>
            )}

            {/* Maintenance summary */}
            <div className="mt-4">
              <div className="text-sm font-medium">
                🏅 Maintenance Score: {pct}% Complete
              </div>
              <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>✅ {ts?.complete ?? 0} done</span>
                <span>🕒 {ts?.dueSoon ?? 0} due soon</span>
                <span>⚠️ {ts?.overdue ?? 0} overdue</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded bg-muted">
                <div
                  className="h-2 bg-brand-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Counts (Vehicles removed) */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
              <div className="rounded-lg border border-token py-2">
                <div className="text-xl font-semibold">{summary?.counts.rooms ?? 0}</div>
                <div className="text-[11px] text-muted-foreground">Rooms</div>
              </div>
              <div className="rounded-lg border border-token py-2">
                <div className="text-xl font-semibold">{summary?.counts.trackables ?? 0}</div>
                <div className="text-[11px] text-muted-foreground">Trackables</div>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div
            className="flex items-center justify-between gap-3 border-t border-token px-4 py-3 bg-surface-alt/40"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Switch
                checked={!!home.isChecked}
                onCheckedChange={(val) => onToggleChecked?.(home.id, val)}
              />
              <span className="text-sm text-muted-foreground">Include in To-Do</span>
            </div>

            <button
              title="Delete home"
              className="inline-flex items-center rounded-md border border-token px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </button>
          </div>
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
