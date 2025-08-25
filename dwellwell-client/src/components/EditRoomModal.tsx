import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { api } from '@/utils/api';
import { Room } from '@shared/types/room';
import { useToast } from '@/components/ui/use-toast';
import { RoomTypeSelect } from '@/components/RoomTypeSelect';
import { Button } from '@/components/ui/button';

type Props = {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
};

type RoomTask = {
  id: string;
  title: string;
  disabled: boolean;
};

// Normalize floor string ➜ number to match Prisma schema
const normalizeFloor = (floorLabel: string): number | null => {
  switch (floorLabel) {
    case 'Basement':
      return -1;
    case '1st Floor':
      return 1;
    case '2nd Floor':
      return 2;
    case '3rd Floor':
      return 3;
    case 'Attic':
      return 99;
    case 'Other':
      return 0;
    default:
      return null;
  }
};

export function EditRoomModal({ room, isOpen, onClose, onSave }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [floor, setFloor] = useState('');
  const [fireplace, setFireplace] = useState(false);
  const [boiler, setBoiler] = useState(false);
  const [smoke, setSmoke] = useState(false);
  const [userTasks, setUserTasks] = useState<RoomTask[]>([]);

  useEffect(() => {
    if (room) {
      setName(room.name || '');
      setType(room.type || '');
      setFloor(
        typeof room.floor === 'number'
          ? {
              [-1]: 'Basement',
              0: 'Other',
              1: '1st Floor',
              2: '2nd Floor',
              3: '3rd Floor',
              99: 'Attic',
            }[room.floor] || ''
          : ''
      );
      setFireplace(room.hasFireplace || false);
      setBoiler(room.hasBoiler || false);
      setSmoke(room.hasSmokeDetector || false);

      api
        .get(`/rooms/${room.id}/tasks`)
        .then((res) => setUserTasks(res.data))
        .catch((err) => {
          console.error('Failed to load room tasks', err);
          toast({ title: 'Failed to load tasks', variant: 'destructive' });
        });
    }
  }, [room]);

  const toggleTask = (taskId: string) => {
    setUserTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, disabled: !task.disabled } : task
      )
    );
  };

  const handleSubmit = async () => {
    try {
      await api.put(`/rooms/${room?.id}`, {
        name,
        type,
        floor: normalizeFloor(floor),
        hasFireplace: fireplace,
        hasBoiler: boiler,
        hasSmokeDetector: smoke,
      });

      await api.put(`/rooms/${room?.id}/tasks`, {
        disabledTaskIds: userTasks.filter((t) => t.disabled).map((t) => t.id),
      });

      onSave();
      onClose();
      toast({ title: 'Room updated', variant: 'success' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error updating room', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-primary">Edit Room</DialogTitle>
          <DialogDescription>
            Update the room’s details and features. This helps DwellWell generate better reminders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Room Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nickname (optional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Master Bathroom"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          {/* Room Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
            <RoomTypeSelect value={type} onChange={setType} />
          </div>

          {/* Floor Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
            <select
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Select Floor</option>
              <option value="Basement">Basement</option>
              <option value="1st Floor">1st Floor</option>
              <option value="2nd Floor">2nd Floor</option>
              <option value="3rd Floor">3rd Floor</option>
              <option value="Attic">Attic</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Features</label>
            <div className="flex flex-col gap-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={fireplace}
                  onChange={(e) => setFireplace(e.target.checked)}
                />
                <span className="text-orange-500">🔥</span>
                Fireplace
              </label>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={boiler}
                  onChange={(e) => setBoiler(e.target.checked)}
                />
                <span className="text-red-500">♨️</span>
                Boiler
              </label>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={smoke}
                  onChange={(e) => setSmoke(e.target.checked)}
                />
                <span className="text-gray-500">🔔</span>
                Smoke Detector
              </label>
            </div>
          </div>

          {/* Tracked Tasks */}
          <div className="space-y-2 pt-4">
            <label className="block text-sm font-medium text-gray-700">Tracked Tasks</label>
            <div className="border rounded p-2 max-h-48 overflow-y-auto space-y-2">
              {userTasks.map((task) => (
                <label key={task.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!task.disabled}
                    onChange={() => toggleTask(task.id)}
                  />
                  {task.title}
                </label>
              ))}
              {userTasks.length === 0 && (
                <p className="text-xs text-gray-500 italic">No tasks assigned to this room.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="default" onClick={handleSubmit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
