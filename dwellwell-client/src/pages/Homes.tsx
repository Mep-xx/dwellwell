import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { api } from '@/utils/api';
import { Home } from '@shared/types/home';
import { AddHomeModal } from '@/components/AddHomeModal';

export default function HomesPage() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [selectedHomes, setSelectedHomes] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    async function fetchHomes() {
      try {
        const res = await api.get('/api/homes');
        setHomes(res.data);
        setSelectedHomes(new Set(res.data.map((h: Home) => h.id)));
      } catch (err) {
        console.error('Failed to fetch homes:', err);
      }
    }
    fetchHomes();
  }, []);

  const toggleHome = (homeId: string) => {
    setSelectedHomes((prev) => {
      const updated = new Set(prev);
      updated.has(homeId) ? updated.delete(homeId) : updated.add(homeId);
      return updated;
    });
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {homes.map((home) => (
          <div
            key={home.id}
            className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-xl shadow border bg-white"
          >
            <img
              src={home.imageUrl}
              alt={home.address}
              className="w-full md:w-48 h-32 object-cover rounded-md"
            />
            <div className="flex-1 space-y-1">
              <h2 className="text-xl font-semibold">{home.address}</h2>
              <p className="text-sm text-muted-foreground">
                {home.city}, {home.state}
              </p>
              <p className="text-sm text-muted-foreground">
                {home.squareFeet.toLocaleString()} sq. ft. &nbsp; • &nbsp; {home.lotSize} acres
              </p>
              <p className="text-sm text-muted-foreground">Built in {home.yearBuilt}</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Checkbox
                checked={selectedHomes.has(home.id)}
                onCheckedChange={() => toggleHome(home.id)}
              />
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          </div>
        ))}
      </div>
      
      <AddHomeModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
