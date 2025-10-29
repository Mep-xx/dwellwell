// dwellwell-client/src/pages/Trackables.tsx
// (unchanged from your last message; included here for convenience)
import { useEffect, useState, useCallback } from "react";
import { api } from "@/utils/api";
import TrackableModal from "@/components/features/TrackableModal";
import { useToast } from "@/components/ui/use-toast";
import { AnimatePresence } from "framer-motion";
import { useHome } from "@/context/HomeContext";
import TrackableCard, { TrackableSummary } from "@/components/features/TrackableCard";
import type { CreateTrackableDTO } from "@/components/features/TrackableModal";

type Props = {};

export default function Trackables(_: Props) {
  const { toast } = useToast();
  const { selectedHomeId } = useHome();

  const [trackables, setTrackables] = useState<TrackableSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingTrackable, setEditingTrackable] = useState<CreateTrackableDTO | null>(null);

  const fetchTrackables = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params: any = {};
      if (selectedHomeId) params.homeId = selectedHomeId;
      params.include = "summary";
      const res = await api.get("/trackables", { params });

      const raw = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
      const coerce = (it: any): TrackableSummary => ({
        id: it.id,
        userDefinedName: it.userDefinedName ?? "Untitled",
        imageUrl: it.imageUrl ?? null,
        type: it.type ?? null,
        brand: it.brand ?? null,
        model: it.model ?? null,
        category: it.category ?? null,
        status: it.status ?? "IN_USE",
        pausedAt: it.pausedAt ?? null,
        retiredAt: it.retiredAt ?? null,
        nextDueDate: it.nextDueDate ?? null,
        counts: it.counts ?? { overdue: 0, dueSoon: 0, active: 0 },
        roomName: it.roomName ?? null,
        homeName: it.homeName ?? null,
        lastCompletedAt: it.lastCompletedAt ?? null,
      });

      setTrackables(raw.map(coerce));
    } catch (err) {
      console.error("❌ Failed to load trackables:", err);
      setErrorMsg("Failed to load trackables.");
      setTrackables([]);
    } finally {
      setLoading(false);
    }
  }, [selectedHomeId]);

  useEffect(() => { fetchTrackables(); }, [fetchTrackables]);

  const handleSave = async (dto: CreateTrackableDTO) => {
    try {
      const payload: CreateTrackableDTO = { ...dto };
      if (selectedHomeId && !payload.homeId) payload.homeId = selectedHomeId;

      if (dto.id) {
        // UPDATE existing
        const res = await api.put(`/trackables/${dto.id}`, payload);
        const updated = (res.data?.trackable ?? res.data) as any;

        setTrackables(prev =>
          prev.map(t => t.id === updated.id
            ? {
                ...t,
                userDefinedName: updated.userDefinedName ?? t.userDefinedName,
                brand: updated.brand ?? t.brand,
                model: updated.model ?? t.model,
                type: updated.type ?? t.type,
                category: updated.category ?? t.category,
                imageUrl: updated.imageUrl ?? t.imageUrl,
                roomName: updated.roomName ?? t.roomName,
                homeName: updated.homeName ?? t.homeName,
                counts: updated.counts ?? t.counts,
                nextDueDate: updated.nextDueDate ?? t.nextDueDate,
              }
            : t
          )
        );

        toast({ title: "Trackable updated", description: updated.userDefinedName || "Changes saved." });
      } else {
        // CREATE new
        const res = await api.post('/trackables', payload);
        const created = (res.data?.trackable ?? res.data) as any;

        const summary: TrackableSummary = {
          id: created.id,
          userDefinedName: created.userDefinedName,
          imageUrl: created.imageUrl ?? null,
          type: created.type ?? null,
          brand: created.brand ?? null,
          model: created.model ?? null,
          category: created.category ?? null,
          status: "IN_USE",
          nextDueDate: created.nextDueDate ?? null,
          counts: created.counts ?? { overdue: 0, dueSoon: 0, active: 0 },
          roomName: created.roomName ?? null,
          homeName: created.homeName ?? null,
          lastCompletedAt: created.lastCompletedAt ?? null,
          pausedAt: created.pausedAt ?? null,
          retiredAt: created.retiredAt ?? null,
        };

        setTrackables(prev => [summary, ...prev]);
        toast({ title: "Trackable added", description: summary.userDefinedName || "Item created." });
      }
    } catch (err) {
      console.error("Failed to save trackable:", err);
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setShowModal(false);
      setEditingTrackable(null);
    }
  };

  const onEdited = (patch: Partial<TrackableSummary> & { id: string }) => {
    setTrackables(prev => prev.map(t => t.id === patch.id ? { ...t, ...patch } : t));
  };

  const onRemoved = (id: string) => setTrackables(prev => prev.filter(t => t.id !== id));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-brand-primary">🧰 Trackables</h1>
        <button
          className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => { setEditingTrackable(null); setShowModal(true); }}
        >
          + Add Trackable
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 w-full animate-pulse rounded-xl border bg-muted/30" />
          ))}
        </div>
      ) : trackables.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
            <div className="mb-2 text-2xl font-semibold">No trackables yet</div>
            <p className="mb-6 text-sm text-muted-foreground">
              Add an appliance, tool, or home item to start scheduling maintenance and keeping manuals, videos, and parts all in one place.
            </p>
            <button
              className="rounded bg-brand-primary px-4 py-2 text-white hover:bg-blue-600"
              onClick={() => { setEditingTrackable(null); setShowModal(true); }}
            >
              + Add Trackable
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          <AnimatePresence>
            {trackables.map((t) => (
              <TrackableCard
                key={t.id}
                data={t}
                onEdited={onEdited}
                onRemoved={onRemoved}
                onOpenEdit={(id) => {
                  const curr = trackables.find(x => x.id === id);
                  if (!curr) return;
                  setEditingTrackable({
                    id: curr.id,
                    userDefinedName: curr.userDefinedName,
                    brand: curr.brand ?? undefined,
                    model: curr.model ?? undefined,
                    type: curr.type ?? undefined,
                    category: curr.category ?? undefined,
                    serialNumber: (curr as any).serialNumber,
                    applianceCatalogId: (curr as any).applianceCatalogId,
                    roomId: (curr as any).roomId ?? undefined,
                    homeId: (curr as any).homeId ?? undefined,
                  });
                  setShowModal(true);
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <TrackableModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingTrackable(null); }}
        onSave={handleSave}
        initialData={editingTrackable}
      />
    </div>
  );
}
