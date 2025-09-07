//dwellwell-client/src/components/RoomsPanel.tsx
import { useEffect, useMemo, useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableRoomCard } from '@/components/SortableRoomCard';
import { api } from '@/utils/api';
import type { Room } from '@shared/types/room';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

type Props = { homeId: string };

export function RoomsPanel({ homeId }: Props) {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Load rooms
  useEffect(() => {
    (async () => {
      const { data } = await api.get('/rooms', { params: { homeId } });
      setRooms(data);
    })();
  }, [homeId]);

  // Autosave reorder on drop
  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rooms.findIndex(r => r.id === active.id);
    const newIndex = rooms.findIndex(r => r.id === over.id);
    const next = arrayMove(rooms, oldIndex, newIndex);
    setRooms(next); // optimistic

    try {
      await api.put('/rooms/reorder', { homeId, roomIds: next.map(r => r.id) });
    } catch (e) {
      // revert on error
      setRooms(rooms);
      toast({ title: 'Failed to save order', variant: 'destructive' });
    }
  };

  const updateOne = (id: string, patch: Partial<Room>) => {
    setRooms(prev => prev.map(r => (r.id === id ? { ...r, ...patch } as Room : r)));
  };

  const removeOne = async (id: string) => {
    const prior = rooms;
    setRooms(pr => pr.filter(r => r.id !== id));
    try {
      await api.delete(`/rooms/${id}`);
    } catch {
      setRooms(prior);
      toast({ title: 'Failed to delete room', variant: 'destructive' });
    }
  };

  const addRoom = async () => {
    try {
      const { data } = await api.post('/rooms', { homeId, type: 'Other', name: '' });
      setRooms(prev => [...prev, data]);
    } catch {
      toast({ title: 'Could not add room', variant: 'destructive' });
    }
  };

  const ids = useMemo(() => rooms.map(r => r.id), [rooms]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Rooms ({rooms.length})</h3>
        <Button onClick={addRoom}>+ Add Room</Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {rooms.map(r => (
              <SortableRoomCard
                key={r.id}
                id={r.id}
                room={r}
                onChange={(u) => updateOne(r.id, u)}
                onRemove={() => removeOne(r.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
