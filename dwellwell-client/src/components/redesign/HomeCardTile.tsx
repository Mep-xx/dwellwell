// dwellwell-client/src/components/redesign/HomeCardTile.tsx
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
  counts: { rooms: number; vehicles: number; trackables: number };
};

type Props = {
  home: Home;
  summary?: Summary;
  className?: string;
  onToggleChecked?: (homeId: string, value: boolean) => void;
  onDelete?: (homeId: string) => void;
};

export default function HomeCardTile({
  home,
  summary,
  className = "",
  onToggleChecked,
  onDelete,
}: Props) {
  const navigate = useNavigate();
  const img = resolveHomeImageUrl(home.imageUrl);

  const label = useMemo(() => {
    if (home.nickname) return home.nickname!;
    return `${home.address}, ${home.city}, ${home.state}`;
  }, [home]);

  const open = () => navigate(`/app/homes/${home.id}`);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") open();
      }}
      className={`overflow-hidden rounded-2xl border bg-background shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer ${className}`}
    >
      <div className="relative h-36 w-full">
        <img src={img} alt={label} title={label} className="h-full w-full object-cover" />
        {!home.isChecked && (
          <span className="absolute top-2 left-2 rounded bg-gray-900/80 px-2 py-0.5 text-[11px] text-white">
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
        <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
          <span>🛋 {summary?.counts.rooms ?? 0} rooms</span>
          <span>🧰 {summary?.counts.trackables ?? 0} trackables</span>
        </div>
      </div>

      {/* Footer actions (don’t bubble) */}
      <div
        className="flex items-center justify-between gap-3 border-t px-3 py-2"
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
          className="inline-flex items-center rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
          onClick={() => onDelete?.(home.id)}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );
}
