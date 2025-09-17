// dwellwell-client/src/pages/Homes.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/utils/api";
import type { Home } from "@shared/types/home";
import type { Room } from "@shared/types/room";
import { useNavigate } from "react-router-dom";

import { HomeCard } from "@/components/features/HomeCard";
import { DeleteHomeModal } from "@/components/features/DeleteHomeModal";
import AddHomeWizard from "@/components/features/AddHomeWizard";
import { useToast } from "@/components/ui/use-toast";

type TaskSummary = {
  complete: number;
  dueSoon: number;
  overdue: number;
  total: number;
};

type HomeWithStats = Home & {
  taskSummary?: TaskSummary;
  rooms?: Room[];
};

type ApiHome = Home & { rooms?: Room[] };

export default function HomesPage() {
  const [homes, setHomes] = useState<HomeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  // --- derived, stable sort (nickname/address) ---
  const sortedHomes = useMemo(() => {
    return [...homes].sort((a, b) => {
      const ax = (a.nickname || a.address || "").toLowerCase().trim();
      const bx = (b.nickname || b.address || "").toLowerCase().trim();
      return ax.localeCompare(bx);
    });
  }, [homes]);

  useEffect(() => {
    let mounted = true;

    const fetchHomes = async () => {
      setLoading(true);
      setErrorMsg(null);

      const token = localStorage.getItem("dwellwell-token");
      if (!token) {
        setLoading(false);
        setErrorMsg("Missing auth token; please sign in again.");
        return;
      }

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await api.get<ApiHome[]>("/homes", {
          signal: ctrl.signal as any,
        });
        const fetched = res.data;

        const enriched = await Promise.all(
          fetched.map(async (home) => {
            try {
              const { data: taskSummary } = await api.get(
                `/homes/${home.id}/summary`,
                { signal: ctrl.signal as any }
              );
              return { ...home, taskSummary, rooms: home.rooms ?? [] };
            } catch {
              return { ...home, rooms: home.rooms ?? [] };
            }
          })
        );

        if (mounted) {
          setHomes(enriched);
          setLoading(false);
        }
      } catch (err: any) {
        if (!mounted) return;
        if (err?.name === "CanceledError" || err?.message === "canceled") return;
        console.error("❌ [ERROR] Failed to fetch homes:", err);
        setErrorMsg("Failed to load homes.");
        setLoading(false);
      }
    };

    fetchHomes();

    return () => {
      mounted = false;
      abortRef.current?.abort();
    };
  }, []);

  const toggleHomeChecked = async (homeId: string, newValue: boolean) => {
    const prev = homes;
    try {
      setHomes((p) =>
        p.map((h) => (h.id === homeId ? { ...h, isChecked: newValue } : h))
      );
      await api.patch(`/homes/${homeId}`, { isChecked: newValue });

      toast({
        title: newValue
          ? "Home included in to-do list"
          : "Home excluded from to-do list",
        description: newValue
          ? "Tasks for this home will now appear in your maintenance dashboard."
          : "This home’s tasks will be hidden from your maintenance dashboard.",
        variant: newValue ? "success" : "info",
      });
    } catch (err) {
      console.error("Failed to update isChecked:", err);
      setHomes(prev); // rollback
      toast({
        title: "Error updating home",
        description: "Could not update your selection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (homeId: string) => setDeleteTargetId(homeId);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    const targetId = deleteTargetId;
    setDeleteTargetId(null);

    const prev = homes;
    setHomes((p) => p.filter((h) => h.id !== targetId));

    try {
      await api.delete(`/homes/${targetId}`);
      toast({
        title: "Home deleted",
        description: "This home has been removed.",
        variant: "default",
      });
    } catch (err) {
      console.error("Failed to delete home:", err);
      setHomes(prev); // rollback
      toast({
        title: "Error deleting home",
        description: "Something went wrong during deletion.",
        variant: "destructive",
      });
    }
  };

  const openHome = (homeId: string) => navigate(`/app/homes/${homeId}`);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-brand-primary">🏡 My Homes</h1>
        <button
          className="rounded bg-brand-primary px-4 py-2 text-white hover:bg-blue-600"
          onClick={() => setShowAddModal(true)}
        >
          + Add Home
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-56 w-full animate-pulse rounded-xl border bg-muted/30"
            />
          ))}
        </div>
      ) : homes.length === 0 ? (
        // Empty state
        <div className="mt-16 flex flex-col items-center justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
            <div className="mb-2 text-2xl font-semibold">No homes yet</div>
            <p className="mb-6 text-sm text-muted-foreground">
              Add your first home to start tracking maintenance, rooms, and
              features. You can always edit details later.
            </p>
            <button
              className="rounded bg-brand-primary px-4 py-2 text-white hover:bg-blue-600"
              onClick={() => setShowAddModal(true)}
            >
              + Add Home
            </button>
          </div>
        </div>
      ) : (
        // Grid of homes
        <div className="flex flex-wrap gap-6">
          {sortedHomes.map((home) => (
            <div
              key={home.id}
              className="w-full cursor-pointer rounded-xl outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 md:w-[32%]"
              onClick={() => openHome(home.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openHome(home.id);
              }}
            >
              <HomeCard
                home={home}
                summary={home.taskSummary}
                onToggle={toggleHomeChecked}
                onEdit={(h) => openHome(h.id)}
                onDelete={(id) => confirmDelete(id)}
              />
            </div>
          ))}
        </div>
      )}

      <AddHomeWizard
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onFinished={(h) => {
          setShowAddModal(false);
          openHome(h.id); // navigate straight to new home
        }}
      />

      <DeleteHomeModal
        isOpen={!!deleteTargetId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
