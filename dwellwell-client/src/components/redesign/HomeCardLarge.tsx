// dwellwell-client/src/components/redesign/HomeCardLarge.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "@shared/types/home";
import { resolveHomeImageUrl } from "@/utils/images";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";

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
};

type Props = {
  home: Home;
  summary?: Summary;
  className?: string;
  onToggleChecked?: (homeId: string, value: boolean) => void;
  onDelete?: (homeId: string) => void;
};

export default function HomeCardLarge({
  home,
  summary,
  className = "",
  onToggleChecked,
  onDelete,
}: Props) {
  const navigate = useNavigate();
  const img = resolveHomeImageUrl(home.imageUrl);

  const label = useMemo(() => {
    if (summary?.nickname) return summary.nickname!;
    if (home.nickname) return home.nickname!;
    return `${home.address}, ${home.city}, ${home.state}`;
  }, [summary, home]);

  const open = () => navigate(`/app/homes/${home.id}`);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") open();
      }}
      className={`grid grid-cols-12 gap-0 overflow-hidden rounded-2xl border bg-background shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${className}`}
    >
      <div className="col-span-12 md:col-span-5 relative h-44 md:h-full">
        <img src={img} alt={label} title={label} className="h-full w-full object-cover" />
        {!home.isChecked && (
          <span className="absolute top-2 left-2 rounded bg-gray-900/80 px-2 py-0.5 text-[11px] text-white">
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
                  className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground"
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

          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-lg border py-2">
              <div className="text-xl font-semibold">{summary?.counts.rooms ?? 0}</div>
              <div className="text-[11px] text-muted-foreground">Rooms</div>
            </div>
            <div className="rounded-lg border py-2">
              <div className="text-xl font-semibold">{summary?.counts.trackables ?? 0}</div>
              <div className="text-[11px] text-muted-foreground">Trackables</div>
            </div>
            <div className="rounded-lg border py-2">
              <div className="text-xl font-semibold">{summary?.counts.vehicles ?? 0}</div>
              <div className="text-[11px] text-muted-foreground">Vehicles</div>
            </div>
          </div>
        </div>

        {/* Footer actions (clicks should not bubble and navigate) */}
        <div
          className="flex items-center justify-between gap-3 border-t px-4 py-3"
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
            className="inline-flex items-center rounded-md border px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50"
            onClick={() => onDelete?.(home.id)}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
