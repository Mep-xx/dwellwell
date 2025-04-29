import { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { Home } from '@shared/types/home';
import { AddHomeModal } from '@/components/AddHomeModal';
import { useToast } from '@/components/ui/use-toast';
import { HomeCard } from '@/components/HomeCard';
import { Room } from '@shared/types/room';
import { DeleteHomeModal } from '@/components/DeleteHomeModal';
import { EditHomeModal } from '@/components/EditHomeModal';

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

export default function HomesPage() {
  const [homes, setHomes] = useState<HomeWithStats[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const [editTargetHome, setEditTargetHome] = useState<Home | null>(null);


  const fetchHomes = async () => {
    try {
      const res = await api.get('/api/homes');
      const fetchedHomes: Home[] = res.data;

      const enriched = await Promise.all(
        fetchedHomes.map(async (home) => {
          try {
            const [summaryRes, roomsRes] = await Promise.all([
              api.get(`/api/homes/${home.id}/task-summary`),
              api.get(`/api/rooms/home/${home.id}`),
            ]);

            return {
              ...home,
              taskSummary: summaryRes.data as TaskSummary,
              rooms: roomsRes.data as Room[],
            };
          } catch (err) {
            console.error(`Failed to enrich home ${home.address}`, err);
            return home;
          }
        })
      );

      setHomes(enriched);
    } catch (err) {
      console.error('Failed to fetch homes:', err);
    }
  };

  useEffect(() => {
    fetchHomes();
  }, []);

  const toggleHomeChecked = async (homeId: string, newValue: boolean) => {
    // Save the previous state for rollback
    const previousHomes = [...homes];

    try {
      // Optimistically update UI
      setHomes((prev) =>
        prev.map((home) =>
          home.id === homeId ? { ...home, isChecked: newValue } : home
        )
      );

      // Call correct API
      await api.patch(`/api/homes/${homeId}/check`, { isChecked: newValue });

      toast({
        title: newValue
          ? 'Home included in to-do list'
          : 'Home excluded from to-do list',
        description: newValue
          ? 'Tasks for this home will now appear in your maintenance dashboard.'
          : 'This home’s tasks will be hidden from your current to-do list.',
        variant: newValue ? 'success' : 'info',
      });

    } catch (err) {
      console.error('Failed to update home checked state:', err);

      // Rollback to previous state if error
      setHomes(previousHomes);

      toast({
        title: 'Error updating home',
        description: 'We were unable to update your selection. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (home: Home) => {
    setEditTargetHome(home);
  };

  const handleSaveEdit = async (updatedFields: Partial<Home>) => {
    if (!updatedFields.id) return;

    try {
      await api.patch(`/api/homes/${updatedFields.id}`, {
        nickname: updatedFields.nickname,
        squareFeet: updatedFields.squareFeet,
        lotSize: updatedFields.lotSize,
        yearBuilt: updatedFields.yearBuilt,
        architecturalStyle: updatedFields.architecturalStyle,
      });
      fetchHomes();
      setEditTargetHome(null);
      toast({
        title: 'Home updated',
        description: 'Your home details have been saved.',
        variant: 'success',
      });
    } catch (err) {
      console.error('Failed to update home:', err);
      toast({
        title: 'Error updating home',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };


  const confirmDelete = (homeId: string) => {
    setDeleteTargetId(homeId);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;

    try {
      setDeleting(true);
      await api.delete(`/api/homes/${deleteTargetId}`);
      setHomes((prev) => prev.filter((h) => h.id !== deleteTargetId));
      setDeleteTargetId(null);
      toast({
        title: 'Home deleted',
        description: 'This home has been removed from your dashboard.',
        variant: 'destructive',
      });
    } catch (err) {
      console.error('Failed to delete home:', err);
      toast({
        title: 'Error deleting home',
        description: 'Something went wrong while deleting.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-primary">My Homes</h1>
        <button
          className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => setShowAddModal(true)}
        >
          + Add Home
        </button>
      </div>

      <div className="flex flex-wrap gap-6">
        {homes.map((home) => (
          <div key={home.id} className="w-full md:w-[32%]">
            <HomeCard
              home={home}
              summary={home.taskSummary}
              onToggle={toggleHomeChecked}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        ))}
      </div>

      <AddHomeModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          fetchHomes();
        }}
      />

      <DeleteHomeModal
        isOpen={!!deleteTargetId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      <EditHomeModal
        isOpen={!!editTargetHome}
        home={editTargetHome}
        onSave={handleSaveEdit}
        onCancel={() => setEditTargetHome(null)}
      />
    </div>
  );
}
