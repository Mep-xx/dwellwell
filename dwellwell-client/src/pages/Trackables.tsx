import { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import TrackableModal from '../components/TrackableModal';
import TrackableTaskModal from '../components/TrackableTaskModal';
import type { Trackable } from '@shared/types/trackable';
import { toast } from "../components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from '@shared/types/task';
import { useHome } from '@/context/HomeContext';

export default function Trackables() {
  const [trackables, setTrackables] = useState<Trackable[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTrackable, setEditingTrackable] = useState<Trackable | null>(null);
  const [viewTasksFor, setViewTasksFor] = useState<string | null>(null);
  const [trackableTasks, setTrackableTasks] = useState<Task[]>([]);
  const { selectedHomeId } = useHome();

  useEffect(() => {
    if (!selectedHomeId) return;

    const token = localStorage.getItem("dwellwell-token");
    console.log("👤 Auth Token at time of fetch:", token);

    api.get('/api/trackables', {
      params: { homeId: selectedHomeId },
    })
      .then(res => {
        if (Array.isArray(res.data)) {
          console.log('✅ Received trackables:', res.data);
          setTrackables(res.data);
        } else {
          console.warn('⚠️ Unexpected response shape:', res.data);
          setTrackables([]);
        }
      })
      .catch(err => {
        console.error('❌ Failed to load trackables:', err);
        setTrackables([]);
      });
  }, [selectedHomeId]);

  const handleSave = async (newTrackable: Trackable) => {
    if (!selectedHomeId) return;

    try {
      const res = await api.post('/api/trackables', {
        ...newTrackable,
        homeId: selectedHomeId,
      });

      console.log('Trackable POST response:', res.data);
      setTrackables(prev => [...prev, res.data.trackable]);
      setShowModal(false);
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
      const res = await api.get('/api/tasks', {
        params: { trackableId }
      });

      console.log('Fetched tasks for', trackableId, res.data);
      setTrackableTasks(res.data);
      setViewTasksFor(trackableId);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trackable?')) return;

    try {
      await api.delete(`/api/trackables/${id}`);
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

  const selectedTrackable = viewTasksFor ? trackables.find(t => t.id === viewTasksFor) : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-brand-primary">Trackables</h1>
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
              <h2 className="text-lg font-semibold">{t.userDefinedName}</h2>
              <p className="text-sm text-gray-600">{t.type}</p>
              <p className="text-xs text-gray-500">{t.brand} {t.model}</p>

              <div className="flex gap-4 mt-3">
                <button
                  className="text-sm text-blue-600"
                  onClick={() => {
                    setEditingTrackable(t);
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
                <button
                  className="text-sm text-red-600"
                  onClick={() => handleDelete(t.id)}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
