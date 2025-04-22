import { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { Home } from '@shared/types/home';
import { AddHomeModal } from '@/components/AddHomeModal';
import { useToast } from '@/components/ui/use-toast';
import { HomeCard } from '@/components/HomeCard';
import { Room } from '@shared/types/room';

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
  const { toast } = useToast();

  const fetchHomes = async () => {
    try {
      const res = await api.get('/api/homes');
      const fetchedHomes: Home[] = res.data;

      const enriched = await Promise.all(
        fetchedHomes.map(async (home) => {
          try {
            const [summaryRes, roomsRes] = await Promise.all([
              api.get(`/api/homes/${home.id}/task-summary`),
              api.get(`/api/rooms/home/${home.id}`)
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
    try {
      setHomes((prev) =>
        prev.map((home) =>
          home.id === homeId ? { ...home, isChecked: newValue } : home
        )
      );

      await api.patch(`/api/homes/${homeId}`, { isChecked: newValue });

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
      fetchHomes();
    }
  };

  const handleEdit = (home: Home) => {
    console.log('Edit clicked:', home);
    // You can show a modal pre-filled here
  };

  const handleDelete = async (homeId: string) => {
    if (!confirm('Are you sure you want to delete this home?')) return;

    try {
      await api.delete(`/api/homes/${homeId}`);
      setHomes((prev) => prev.filter((h) => h.id !== homeId));
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {homes.map((home) => (
          <HomeCard
            key={home.id}
            home={home}
            summary={home.taskSummary}
            onToggle={toggleHomeChecked}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <AddHomeModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          fetchHomes();
        }}
      />
    </div>
  );
}
