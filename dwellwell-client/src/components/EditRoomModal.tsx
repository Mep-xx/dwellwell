// dwellwell-client/src/components/EditRoomModal.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/utils/api";
import type { Room } from "@shared/types/room"; // relies on tsconfig + vite aliases
import { useToast } from "@/components/ui/use-toast";
import { RoomTypeSelect } from "@/components/RoomTypeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ====================== Types & helpers ======================= */

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

// Floors we support
type FloorKey = -1 | 0 | 1 | 2 | 3 | 99;

const FLOOR_LABELS: Record<FloorKey, string> = {
  [-1]: "Basement",
  0: "Other",
  1: "1st Floor",
  2: "2nd Floor",
  3: "3rd Floor",
  99: "Attic",
};

const LABEL_TO_FLOOR: Record<string, FloorKey> = {
  Basement: -1,
  "1st Floor": 1,
  "2nd Floor": 2,
  "3rd Floor": 3,
  Attic: 99,
  Other: 0,
};

function floorNumberToLabel(floor?: number | null): string {
  if (floor == null) return "";
  return (FLOOR_LABELS as Record<number, string>)[floor] ?? "";
}

function floorLabelToNumber(label: string): number | null {
  return label in LABEL_TO_FLOOR ? LABEL_TO_FLOOR[label] : null;
}

/* ========================== Component ========================= */

export function EditRoomModal({ room, isOpen, onClose, onSave }: Props) {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [floorLabel, setFloorLabel] = useState("");
  const [fireplace, setFireplace] = useState(false);
  const [boiler, setBoiler] = useState(false);
  const [smoke, setSmoke] = useState(false);
  const [userTasks, setUserTasks] = useState<RoomTask[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Normalize initial form values when room or open state changes
  useEffect(() => {
    if (!isOpen || !room) return;

    setName(room.name ?? "");
    setType(room.type ?? "");
    setFloorLabel(floorNumberToLabel(room.floor ?? null));
    setFireplace(Boolean((room as any).hasFireplace));
    setBoiler(Boolean((room as any).hasBoiler));
    setSmoke(Boolean((room as any).hasSmokeDetector));

    // fetch tasks for this room
    (async () => {
      setLoadingTasks(true);
      try {
        const { data } = await api.get(`/rooms/${room.id}/tasks`);
        // Expecting: RoomTask[]
        setUserTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load room tasks", err);
        toast({ title: "Failed to load tasks", variant: "destructive" });
        setUserTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    })();
  }, [isOpen, room?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const floorOptions = useMemo(
    () => ["Basement", "1st Floor", "2nd Floor", "3rd Floor", "Attic", "Other"] as const,
    []
  );

  const toggleTask = (taskId: string) => {
    setUserTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, disabled: !t.disabled } : t))
    );
  };

  const handleSubmit = async () => {
    if (!room?.id) return;
    setSaving(true);
    try {
      await api.put(`/rooms/${room.id}`, {
        name,
        type,
        floor: floorLabelToNumber(floorLabel),
        hasFireplace: fireplace,
        hasBoiler: boiler,
        hasSmokeDetector: smoke,
      });

      if (userTasks.length) {
        const disabledTaskIds = userTasks.filter((t) => t.disabled).map((t) => t.id);
        await api.put(`/rooms/${room.id}/tasks`, { disabledTaskIds });
      }

      onSave();
      onClose();
      toast({ title: "Room updated" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error updating room", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Only close when requested to close (Dialog onOpenChange gives boolean)
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-primary">Edit Room</DialogTitle>
          <DialogDescription>
            Update the room’s details and features. This helps DwellWell generate better reminders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Room Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Nickname (optional)</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Primary Bathroom"
            />
          </div>

          {/* Room Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Room Type</label>
            <RoomTypeSelect value={type} onChange={setType} />
          </div>

          {/* Floor Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-1">Floor</label>
            <select
              value={floorLabel}
              onChange={(e) => setFloorLabel(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Select Floor</option>
              {floorOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Features</label>
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
          <div className="space-y-2 pt-2">
            <label className="block text-sm font-medium">Tracked Tasks</label>
            <div className="border rounded p-2 max-h-48 overflow-y-auto space-y-2">
              {loadingTasks ? (
                <p className="text-xs text-muted-foreground italic">Loading…</p>
              ) : userTasks.length ? (
                userTasks.map((task) => (
                  <label key={task.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!task.disabled}
                      onChange={() => toggleTask(task.id)}
                    />
                    {task.title}
                  </label>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No tasks assigned to this room.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
