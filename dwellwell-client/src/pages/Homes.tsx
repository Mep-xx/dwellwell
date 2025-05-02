// src/pages/Homes.tsx

import { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { Home } from '@shared/types/home';
import { AddHomeWizard } from '@/components/AddHomeWizard';
import { EditHomeModal } from '@/components/EditHomeModal';
import { DeleteHomeModal } from '@/components/DeleteHomeModal';
import { HomeCard } from '@/components/HomeCard';
import { Room } from '@shared/types/room';
import { useToast } from '@/components/ui/use-toast';

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
  const [editTargetHome, setEditTargetHome] = useState<Home | null>(null);

  const { toast } = useToast();

  const fetchHomes = async () => {
    try {
      const res = await api.get('/api/homes');
      const fetchedHomes: Home[] = res.data;

      const enrichedHomes = await Promise.all(
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

      setHomes(enrichedHomes);
    } catch (err) {
      console.error('Failed to fetch homes:', err);
    }
  };

  useEffect(() => {
    fetchHomes();
  }, []);

  const toggleHomeChecked = async (homeId: string, newValue: boolean) => {
    const previousHomes = [...homes];

    try {
      setHomes((prev) =>
        prev.map((home) =>
          home.id === homeId ? { ...home, isChecked: newValue } : home
        )
      );

      await api.patch(`/api/homes/${homeId}/check`, { isChecked: newValue });

      toast({
        title: newValue
          ? 'Home included in to-do list'
          : 'Home excluded from to-do list',
        description: newValue
          ? 'Tasks for this home will now appear in your maintenance dashboard.'
          : 'This home’s tasks will be hidden from your maintenance dashboard.',
        variant: newValue ? 'success' : 'info',
      });
    } catch (err) {
      console.error('Failed to update isChecked:', err);
      setHomes(previousHomes);
      toast({
        title: 'Error updating home',
        description: 'Could not update your selection. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (home: Home) => {
    setEditTargetHome(home);
  };

  const handleSaveEdit = async (updatedFields: Partial<Home>) => {
    if (!editTargetHome?.id) return;

    try {
      await api.patch(`/api/homes/${editTargetHome.id}`, {
        nickname: updatedFields.nickname,
        squareFeet: updatedFields.squareFeet,
        lotSize: updatedFields.lotSize,
        yearBuilt: updatedFields.yearBuilt,
        architecturalStyle: updatedFields.architecturalStyle,
        imageUrl: updatedFields.imageUrl,
      });

      await fetchHomes();
      setEditTargetHome(null);

      toast({
        title: 'Home updated',
        description: 'Your changes have been saved.',
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
      await api.delete(`/api/homes/${deleteTargetId}`);

      setHomes((prev) => prev.filter((home) => home.id !== deleteTargetId));
      setDeleteTargetId(null);

      toast({
        title: 'Home deleted',
        description: 'This home has been removed.',
        variant: 'default',
      });
    } catch (err) {
      console.error('Failed to delete home:', err);
      toast({
        title: 'Error deleting home',
        description: 'Something went wrong during deletion.',
        variant: 'destructive',
      });
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
              onDelete={() => confirmDelete(home.id)}
            />
          </div>
        ))}
      </div>

      <AddHomeWizard
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onComplete={fetchHomes}
      />

      {/* <AddHomeModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          fetchHomes();
        }}
      /> */}

      <DeleteHomeModal
        isOpen={!!deleteTargetId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {editTargetHome && (
        <EditHomeModal
          isOpen={!!editTargetHome}
          home={editTargetHome}
          onSave={handleSaveEdit}
          onCancel={() => setEditTargetHome(null)}
        />
      )}
    </div>
  );
}
