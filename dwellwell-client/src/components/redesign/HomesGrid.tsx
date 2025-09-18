// dwellwell-client/src/components/redesign/HomesGrid.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, Rows, Plus } from "lucide-react";
import { Home } from "@shared/types/home";
import { api } from "@/utils/api";
import HomeCardLarge from "./HomeCardLarge";
import HomeCardTile from "./HomeCardTile";
import AddHomeWizard from "@/components/features/AddHomeWizard";
import { useToast } from "@/components/ui/use-toast";

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

type ViewMode = "large" | "tile";

export default function HomesGrid() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [summaries, setSummaries] = useState<Record<string, Summary>>({});
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ViewMode>(
    () => (localStorage.getItem("homes-view") as ViewMode) || "large"
  );
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load homes (+ summaries)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get<Home[]>("/homes");
        if (cancelled) return;
        setHomes(data);

        const results = await Promise.allSettled(
          data.map((h) =>
            api.get(`/homes/${encodeURIComponent(h.id)}/summary`).then((r) => r.data)
          )
        );
        const byId: Record<string, Summary> = {};
        results.forEach((res) => {
          if (res.status === "fulfilled" && res.value?.id) {
            byId[res.value.id] = res.value as Summary;
          }
        });
        if (!cancelled) setSummaries(byId);
      } catch {
        if (!cancelled) setHomes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist view mode
  useEffect(() => {
    localStorage.setItem("homes-view", mode);
  }, [mode]);

  // Actions
  const toggleHomeChecked = async (homeId: string, value: boolean) => {
    const prev = homes;
    try {
      setHomes((p) => p.map((h) => (h.id === homeId ? { ...h, isChecked: value } : h)));
      await api.patch(`/homes/${homeId}`, { isChecked: value });
      toast({
        title: value ? "Home included" : "Home excluded",
        description: value
          ? "Tasks for this home will appear in your dashboard."
          : "Tasks for this home will be hidden from your dashboard.",
      });
    } catch {
      setHomes(prev);
      toast({
        title: "Failed to update",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteHome = async (homeId: string) => {
    const prev = homes;
    setHomes((p) => p.filter((h) => h.id !== homeId));
    try {
      await api.delete(`/homes/${homeId}`);
      toast({ title: "Home deleted" });
    } catch {
      setHomes(prev);
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  // Filter
  const filtered = useMemo(() => {
    if (!q.trim()) return homes;
    const term = q.trim().toLowerCase();
    return homes.filter((h) =>
      [h.nickname, h.address, h.city, h.state, h.zip, summaries[h.id]?.nickname]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [homes, q, summaries]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h1 className="text-2xl font-semibold">Your Homes</h1>
          <p className="text-sm text-muted-foreground">
            Manage properties, rooms, and household items.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search homes…"
              className="h-9 w-52 rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <button
            onClick={() => setMode("large")}
            title="Large view"
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm ${
              mode === "large" ? "bg-muted" : "hover:bg-muted"
            }`}
          >
            <Rows className="h-4 w-4" />
            Large
          </button>
          <button
            onClick={() => setMode("tile")}
            title="Tile view"
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm ${
              mode === "tile" ? "bg-muted" : "hover:bg-muted"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Tiles
          </button>

          {/* + Add Home (same spot for both modes) */}
          <button
            onClick={() => setShowAdd(true)}
            className="ml-1 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:bg-blue-600"
            title="Add Home"
          >
            <Plus className="h-4 w-4" />
            Add Home
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl border bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        // Empty state like original Homes.tsx
        <div className="mt-16 flex flex-col items-center justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
            <div className="mb-2 text-2xl font-semibold">No homes yet</div>
            <p className="mb-6 text-sm text-muted-foreground">
              Add your first home to start tracking maintenance, rooms, and features.
              You can always edit details later.
            </p>
            <button
              className="rounded bg-brand-primary px-4 py-2 text-white hover:bg-blue-600"
              onClick={() => setShowAdd(true)}
            >
              + Add Home
            </button>
          </div>
        </div>
      ) : mode === "tile" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((h) => (
            <HomeCardTile
              key={h.id}
              home={h}
              summary={summaries[h.id]}
              onToggleChecked={toggleHomeChecked}
              onDelete={deleteHome}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((h) => (
            <HomeCardLarge
              key={h.id}
              home={h}
              summary={summaries[h.id]}
              onToggleChecked={toggleHomeChecked}
              onDelete={deleteHome}
            />
          ))}
        </div>
      )}

      {/* Modal: Add Home */}
      <AddHomeWizard
        open={showAdd}
        onOpenChange={setShowAdd}
        onFinished={(home) => {
          setShowAdd(false);
          // quick optimistic add
          setHomes((p) => [home, ...p]);
          navigate(`/app/homes/${home.id}`);
        }}
      />
    </div>
  );
}
