// src/pages/Homes.tsx
import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { Home } from "@shared/types/home";
import { Room } from "@shared/types/room";
import { useNavigate } from "react-router-dom";

import { HomeCard } from "@/components/HomeCard";
import { DeleteHomeModal } from "@/components/DeleteHomeModal";
import AddHomeWizard from "@/components/AddHomeWizard";
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const waitForTokenAndFetch = async () => {
      const maxAttempts = 10;
      let attempt = 0;

      while (!localStorage.getItem("dwellwell-token") && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 100));
        attempt++;
      }

      if (localStorage.getItem("dwellwell-token")) {
        fetchHomes();
      } else {
        console.warn("⚠️ No token found; skipping homes fetch.");
      }
    };

    waitForTokenAndFetch();
  }, []);

  const fetchHomes = async () => {
    const token = localStorage.getItem("dwellwell-token");
    if (!token) {
      console.warn("⚠️ Tried to make API request with missing token");
      return Promise.reject({ message: "Missing token" });
    }

    try {
      const res = await api.get<ApiHome[]>("/homes");
      const fetchedHomes = res.data;

      const enriched = await Promise.all(
        fetchedHomes.map(async (home) => {
          try {
            const taskSummaryRes = await api.get(`/homes/${home.id}/summary`);
            const taskSummary = taskSummaryRes.data as TaskSummary;
            return {
              ...home,
              taskSummary,
              rooms: home.rooms ?? [],
            } as HomeWithStats;
          } catch (err) {
            console.error(`❌ [ERROR] Enriching home ${home.address}`, err);
            return { ...home, rooms: home.rooms ?? [] } as HomeWithStats;
          }
        })
      );

      setHomes(enriched);
    } catch (err) {
      console.error("❌ [ERROR] Failed to fetch homes:", err);
    }
  };

  const toggleHomeChecked = async (homeId: string, newValue: boolean) => {
    const prev = [...homes];
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
      setHomes(prev);
      toast({
        title: "Error updating home",
        description: "Could not update your selection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (home: Home) => {
    navigate(`/app/homes/${home.id}`); // ✅ correct route
  };

  const confirmDelete = (homeId: string) => setDeleteTargetId(homeId);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/homes/${deleteTargetId}`);
      setHomes((p) => p.filter((h) => h.id !== deleteTargetId));
      setDeleteTargetId(null);
      toast({
        title: "Home deleted",
        description: "This home has been removed.",
        variant: "default",
      });
    } catch (err) {
      console.error("Failed to delete home:", err);
      toast({
        title: "Error deleting home",
        description: "Something went wrong during deletion.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-brand-primary">My Homes</h1>
        <button
          className="rounded bg-brand-primary px-4 py-2 text-white hover:bg-blue-600"
          onClick={() => setShowAddModal(true)}
        >
          + Add Home
        </button>
      </div>

      {/* Empty state */}
      {homes.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center">
          <div className="rounded-2xl border border-dashed p-10 text-center max-w-xl w-full bg-muted/20">
            <div className="text-2xl font-semibold mb-2">No homes yet</div>
            <p className="text-sm text-muted-foreground mb-6">
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
        <div className="flex flex-wrap gap-6">
          {homes.map((home) => (
            <div
              key={home.id}
              className="w-full md:w-[32%] cursor-pointer hover:shadow-md transition outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded-xl"
              onClick={() => navigate(`/app/homes/${home.id}`)} // ✅ correct route
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(`/app/homes/${home.id}`); // ✅ correct route
                }
              }}
            >
              <HomeCard
                home={home}
                summary={home.taskSummary}
                onToggle={toggleHomeChecked}
                onEdit={(h) => navigate(`/app/homes/${h.id}`)} // ✅ correct route
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
          fetchHomes().finally(() => {
            navigate(`/app/homes/${h.id}`); // ✅ correct route after create
          });
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
