import { useEffect, useState, useCallback } from 'react';
import { api } from '@/utils/api';
import TrackableModal from '../components/TrackableModal';
import TrackableTaskModal from '../components/TrackableTaskModal';
import type { Trackable as BaseTrackable } from '@shared/types/trackable';
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from '@shared/types/task';
import { useHome } from '@/context/HomeContext';

type TrackableStatus = 'IN_USE' | 'PAUSED' | 'RETIRED';
type Trackable = BaseTrackable & { status?: TrackableStatus };

type CreateTrackableDTO = {
  id?: string;
  userDefinedName: string;
  brand?: string;
  model?: string;
  type?: string;
  category?: string;
  serialNumber?: string;
  imageUrl?: string;
  notes?: string;
  applianceCatalogId?: string;
  roomId?: string | null;
  homeId?: string | null; // optional - if a home is selected we'll pass it, otherwise omitted
};

export default function Trackables() {
  const { toast } = useToast();
  const { selectedHomeId } = useHome();

  const [trackables, setTrackables] = useState<Trackable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingTrackable, setEditingTrackable] = useState<CreateTrackableDTO | null>(null);

  const [viewTasksFor, setViewTasksFor] = useState<string | null>(null);
  const [trackableTasks, setTrackableTasks] = useState<Task[]>([]);

  const fetchTrackables = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params: any = {};
      // If a home is selected, we *optionally* filter by it. Otherwise, fetch all trackables for the user.
      if (selectedHomeId) params.homeId = selectedHomeId;

      const res = await api.get('/trackables', { params });
      if (Array.isArray(res.data)) {
        setTrackables(res.data as Trackable[]);
      } else {
        console.warn('⚠️ Unexpected response shape:', res.data);
        setTrackables([]);
      }
    } catch (err) {
      console.error('❌ Failed to load trackables:', err);
      setErrorMsg('Failed to load trackables.');
      setTrackables([]);
    } finally {
      setLoading(false);
    }
  }, [selectedHomeId]);

  useEffect(() => {
    fetchTrackables();
  }, [fetchTrackables]);

  const handleSave = async (dto: CreateTrackableDTO) => {
    try {
      const payload: CreateTrackableDTO = { ...dto };
      // if a home is selected, we pass it; otherwise, leave undefined so the trackable is home-less
      if (selectedHomeId) payload.homeId = selectedHomeId;

      const res = await api.post('/trackables', payload);
      const created = (res.data?.trackable ?? res.data) as Trackable;
      const withStatus: Trackable = { status: 'IN_USE', ...created };

      setTrackables(prev => [withStatus, ...prev]);
      setShowModal(false);
      toast({
        title: "Trackable added",
        description: withStatus.userDefinedName || "Item created successfully.",
      });
    } catch (err) {
      console.error('Failed to save trackable:', err);
      toast({
        title: "Error saving trackable",
        description: "Something went wrong while saving.",
        variant: "destructive",
      });
    }
  };

  const handleViewTasks = async (trackableId: string) => {
    try {
      const res = await api.get('/tasks', { params: { trackableId } });
      setTrackableTasks(res.data);
      setViewTasksFor(trackableId);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trackable? Consider retiring it instead to keep history.')) return;
    try {
      await api.delete(`/trackables/${id}`);
      setTrackables(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Trackable deleted",
        description: "The trackable was successfully removed.",
        variant: "destructive",
      });
    } catch (err) {
      console.error('Failed to delete trackable:', err);
      toast({
        title: "Error deleting trackable",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePause = async (id: string) => {
    try {
      await api.post(`/trackables/${id}/pause`);
      setTrackables(prev => prev.map(x => x.id === id ? { ...x, status: 'PAUSED' } : x));
      toast({ title: "Paused", description: "This item is paused. Its tasks won’t bug you." });
    } catch (e) {
      console.error(e);
      toast({ title: "Could not pause", variant: "destructive" });
    }
  };

  const handleResume = async (id: string) => {
    try {
      await api.post(`/trackables/${id}/resume`, { mode: 'forward' });
      setTrackables(prev => prev.map(x => x.id === id ? { ...x, status: 'IN_USE' } : x));
      toast({ title: "Resumed", description: "We’ll schedule tasks going forward." });
    } catch (e) {
      console.error(e);
      toast({ title: "Could not resume", variant: "destructive" });
    }
  };

  const handleRetire = async (id: string) => {
    const ok = confirm('Retire this item? Tasks will be archived, and you can revive it later.');
    if (!ok) return;
    try {
      await api.post(`/trackables/${id}/retire`, { reason: 'BROKEN' });
      setTrackables(prev => prev.map(x => x.id === id ? { ...x, status: 'RETIRED' } : x));
      toast({ title: "Retired", description: "Item retired; its tasks were archived." });
    } catch (e) {
      console.error(e);
      toast({ title: "Could not retire", variant: "destructive" });
    }
  };

  const handleRevive = async (id: string) => {
    try {
      await api.post(`/trackables/${id}/revive`, { mode: 'forward' });
      setTrackables(prev => prev.map(x => x.id === id ? { ...x, status: 'IN_USE' } : x));
      toast({ title: "Tracking again", description: "Tasks reactivated with forward-only scheduling." });
    } catch (e) {
      console.error(e);
      toast({ title: "Could not revive", variant: "destructive" });
    }
  };

  const selectedTrackable = viewTasksFor ? trackables.find(t => t.id === viewTasksFor) : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-brand-primary">🧰 Trackables</h1>
        <button
          className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => {
            setEditingTrackable(null);
            setShowModal(true);
          }}
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
        // Empty state like Homes — but focused on adding a trackable
        <div className="mt-16 flex flex-col items-center justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
            <div className="mb-2 text-2xl font-semibold">No trackables yet</div>
            <p className="mb-6 text-sm text-muted-foreground">
              Add an appliance, tool, or home item to start scheduling maintenance and keeping manuals, videos, and parts all in one place.
            </p>
            <button
              className="rounded bg-brand-primary px-4 py-2 text-white hover:bg-blue-600"
              onClick={() => {
                setEditingTrackable(null);
                setShowModal(true);
              }}
            >
              + Add Trackable
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {trackables.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                layout
                className="rounded-xl border bg-card text-card-foreground shadow p-4"
              >
                {t.imageUrl && (
                  <img
                    src={t.imageUrl}
                    alt={t.userDefinedName}
                    className="w-24 h-24 object-contain mb-2"
                  />
                )}

                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {t.userDefinedName}
                  {t.status && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        t.status === 'IN_USE'
                          ? 'bg-green-100 text-green-700'
                          : t.status === 'PAUSED'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  )}
                </h2>

                <p className="text-sm text-gray-600">{t.type}</p>
                <p className="text-xs text-gray-500">{t.brand} {t.model}</p>

                <div className="flex flex-wrap gap-4 mt-3">
                  <button
                    className="text-sm text-blue-600"
                    onClick={() => {
                      setEditingTrackable({
                        id: t.id,
                        userDefinedName: t.userDefinedName,
                        brand: t.brand,
                        model: t.model,
                        type: t.type,
                        category: t.category,
                        serialNumber: t.serialNumber,
                        imageUrl: t.imageUrl,
                        notes: t.notes,
                        applianceCatalogId: t.applianceCatalogId,
                        roomId: t.roomId ?? undefined,
                        homeId: t.homeId ?? undefined,
                      });
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </button>

                  <button
                    className="text-sm text-indigo-600"
                    onClick={() => handleViewTasks(t.id)}
                  >
                    View Tasks
                  </button>

                  {t.status !== 'PAUSED' && t.status !== 'RETIRED' && (
                    <button className="text-sm text-amber-700" onClick={() => handlePause(t.id)}>
                      Pause
                    </button>
                  )}

                  {t.status === 'PAUSED' && (
                    <button className="text-sm text-emerald-700" onClick={() => handleResume(t.id)}>
                      Resume
                    </button>
                  )}

                  {t.status !== 'RETIRED' ? (
                    <button className="text-sm text-red-600" onClick={() => handleRetire(t.id)}>
                      Retire
                    </button>
                  ) : (
                    <button className="text-sm text-emerald-700" onClick={() => handleRevive(t.id)}>
                      Begin Tracking Again
                    </button>
                  )}

                  <button
                    className="text-sm text-gray-500"
                    onClick={() => handleDelete(t.id)}
                    title="Hard delete (not recommended; retire to keep history)"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <TrackableModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        initialData={editingTrackable}
      />

      <TrackableTaskModal
        isOpen={!!viewTasksFor}
        onClose={() => {
          setViewTasksFor(null);
          setTrackableTasks([]);
        }}
        tasks={trackableTasks}
        trackableName={selectedTrackable?.userDefinedName || ''}
      />
    </div>
  );
}
