import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import TrackableModal from '../components/TrackableModal';
import TrackableTaskModal from '../components/TrackableTaskModal';
import type { Trackable } from '../../../dwellwell-api/src/shared/types/trackable';
import type { Task } from '../../../dwellwell-api/src/shared/types/task';

export default function Trackables() {
  const [trackables, setTrackables] = useState<Trackable[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTrackable, setEditingTrackable] = useState<Trackable | null>(null);
  const [viewTasksFor, setViewTasksFor] = useState<string | null>(null);
  const [trackableTasks, setTrackableTasks] = useState<Task[]>([]);

  useEffect(() => {
    api.get('/trackables')
      .then(res => {
        if (Array.isArray(res.data)) {
          console.log('Received trackables:', res.data); // 🔍 Add this
          setTrackables(res.data);
        } else {
          console.warn('Unexpected response shape:', res.data);
          setTrackables([]);
        }
      })
      .catch(err => {
        console.error('Failed to load trackables:', err);
        setTrackables([]);
      });
  }, []);
  

  const handleSave = async (newTrackable: Trackable) => {
    try {
      const res = await api.post('/trackables', newTrackable);
      console.log('Trackable POST response:', res.data); // 🔍 See what you’re getting
      setTrackables(prev => [...prev, res.data.trackable]);
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save trackable:', err);
    }
  };

  const handleViewTasks = async (trackableId: string) => {
    try {
      const res = await api.get('/tasks', {
        params: { trackableId }
      });
      console.log('Fetched tasks for', trackableId, res.data);

      setTrackableTasks(res.data);
      console.log('Viewing tasks for trackable:', selectedTrackable);

      setViewTasksFor(trackableId);
      
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
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
        {trackables.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-xl shadow border border-gray-200 p-4 flex flex-col items-center text-center hover:shadow-md transition"
          >
            {t.image && (
              <img
                src={t.image}
                alt={t.name}
                className="w-24 h-24 object-contain mb-2"
              />
            )}
            <h2 className="text-lg font-semibold">{t.name}</h2>
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
            </div>
          </div>
        ))}
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
        trackableName={selectedTrackable?.name || ''}
      />
    </div>
  );
}
