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
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove
} from "@dnd-kit/sortable";
import SortableHome from "./SortableHome";

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

type ViewMode = "large" | "tile";

export default function HomesGrid() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [homes, setHomes] = useState<Home[]>([]);
  const [summaries, setSummaries] = useState<Record<string, Summary>>({});
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ViewMode>(() => (localStorage.getItem("homes-view") as ViewMode) || "large");
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // dnd sensors (same feel as Rooms)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // Load homes + summaries
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get<Home[]>("/homes");
        if (cancelled) return;
        setHomes(data);

        const results = await Promise.allSettled(
          data.map((h) => api.get(`/homes/${encodeURIComponent(h.id)}/summary`).then((r) => r.data))
        );

        const byId: Record<string, Summary> = {};
        results.forEach((res) => {
          if (res.status === "fulfilled" && res.value?.id) {
            const v = res.value as any;
            byId[v.id] = {
              ...(v as Summary),
              taskSummary: v.taskSummary ?? {
                complete: v.complete ?? 0,
                dueSoon: v.dueSoon ?? 0,
                overdue: v.overdue ?? 0,
                total: v.total ?? 0,
              },
            };
          }
        });
        if (!cancelled) setSummaries(byId);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setHomes([]);
          setSummaries({});
        }
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

  const filtered = useMemo(() => {
    if (!q.trim()) return homes;
    const term = q.trim().toLowerCase();
    return homes.filter((h) =>
      [h.nickname, h.address, h.city, h.state, h.zip, summaries[h.id]?.nickname]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [homes, q, summaries]);

  // Actions
  const onToggleChecked = async (homeId: string, value: boolean) => {
    const prev = homes;
    setHomes((p) => p.map((h) => (h.id === homeId ? { ...h, isChecked: value } : h)));
    try {
      await api.patch(`/homes/${homeId}`, { isChecked: value });
      toast({
        title: value ? "Included in To-Do" : "Excluded from To-Do",
        description: value
          ? "This home's tasks will appear in your dashboard."
          : "This home's tasks will be hidden from your dashboard.",
      });
    } catch (e) {
      console.error(e);
      setHomes(prev);
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const onDelete = async (homeId: string) => {
    const prev = homes;
    setHomes((p) => p.filter((h) => h.id !== homeId));
    try {
      await api.delete(`/homes/${homeId}`);
      toast({ title: "Home deleted" });
    } catch (e) {
      console.error(e);
      setHomes(prev);
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const onAddFinished = (h: Home) => {
    setShowAdd(false);
    // Newest to top by default (until reordered)
    setHomes((p) => [h, ...p]);
    navigate(`/app/homes/${h.id}`);
  };

  // DnD only enabled when not filtering
  const dndEnabled = !q.trim();

  const onDragEnd = (e: DragEndEvent) => {
    const activeId = e.active.id as string;
    const overId = e.over?.id as string | undefined;
    if (!activeId || !overId || activeId === overId) return;

    // Work with the filtered subset indices (like Rooms)
    const ids = filtered.map((h) => h.id);
    const from = ids.indexOf(activeId);
    const to = ids.indexOf(overId);
    if (from < 0 || to < 0) return;

    // Reorder within the *full* homes array preserving others
    setHomes((prev) => {
      const currentIds = prev.map((h) => h.id);
      const fromIdxInAll = currentIds.indexOf(activeId);
      const toIdxInAll = currentIds.indexOf(overId);
      if (fromIdxInAll < 0 || toIdxInAll < 0) return prev;

      const next = arrayMove(prev, fromIdxInAll, toIdxInAll);

      // Persist
      api.put("/homes/reorder", { homeIds: next.map((h) => h.id) })
        .catch((err) => {
          console.error(err);
          toast({ title: "Failed to save new order", variant: "destructive" });
        });

      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h1 className="text-2xl font-semibold">Your Homes</h1>
          <p className="text-sm text-muted-foreground">Manage properties, rooms, and household items.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search homes…"
              className="h-9 w-52 rounded-lg border border-token bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <button
            onClick={() => setMode("large")}
            title="Large view"
            className={`inline-flex items-center gap-1 rounded-lg border border-token px-2.5 py-1.5 text-sm ${mode === "large" ? "bg-muted" : "hover:bg-muted"}`}
          >
            <Rows className="h-4 w-4" />
            Large
          </button>
          <button
            onClick={() => setMode("tile")}
            title="Tile view"
            className={`inline-flex items-center gap-1 rounded-lg border border-token px-2.5 py-1.5 text-sm ${mode === "tile" ? "bg-muted" : "hover:bg-muted"}`}
          >
            <LayoutGrid className="h-4 w-4" />
            Tiles
          </button>

          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-3 py-1.5 text-sm text-white hover:bg-blue-600"
            title="Add Home"
          >
            <Plus className="h-4 w-4" />
            Add Home
          </button>
        </div>
      </div>

      {/* Loading / Empty / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl border border-token bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 flex justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-dashed border-token bg-muted/20 p-10 text-center">
            <div className="mb-2 text-2xl font-semibold">No homes yet</div>
            <p className="mb-6 text-sm text-muted-foreground">
              Add your first home to start tracking maintenance, rooms, and features. You can always edit details later.
            </p>
            <button
              className="rounded bg-brand-primary px-4 py-2 text-white hover:bg-blue-600"
              onClick={() => setShowAdd(true)}
            >
              + Add Home
            </button>
          </div>
        </div>
      ) : (
        // DnD context only when not filtering
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext
            items={dndEnabled ? filtered.map((h) => h.id) : []}
            strategy={verticalListSortingStrategy}
          >
            {mode === "tile" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((h) => (
                  <SortableHome key={h.id} id={h.id} disabled={!dndEnabled} handleAlign={"left"}>
                    <HomeCardTile
                      home={h}
                      summary={summaries[h.id]}
                      onToggleChecked={onToggleChecked}
                      onDelete={onDelete}
                    />
                  </SortableHome>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filtered.map((h) => (
                  <SortableHome key={h.id} id={h.id} disabled={!dndEnabled} handleAlign="left">
                    <HomeCardLarge
                      home={h}
                      summary={summaries[h.id]}
                      onToggleChecked={onToggleChecked}
                      onDelete={onDelete}
                    />
                  </SortableHome>
                ))}
              </div>
            )}
          </SortableContext>
        </DndContext>
      )}

      <AddHomeWizard
        open={showAdd}
        onOpenChange={setShowAdd}
        onFinished={onAddFinished}
      />
    </div>
  );
}
