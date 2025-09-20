//dwellwell-client/src/components/redesign/RoomEditModal.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { FloorKey, floorLabel } from "@shared/constants/floors";

type Room = {
  id?: string;
  homeId: string;
  name: string;
  type: string;
  floor: FloorKey | null;
  detail?: any;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** If provided, we edit; if undefined, we create */
  room?: Partial<Room> & { homeId: string };
  onSaved?: (saved: Room) => void;
};

// simple local list until you want something richer
const ROOM_TYPES = [
  "Bedroom",
  "Bathroom",
  "Kitchen",
  "Living Room",
  "Dining Room",
  "Office",
  "Laundry",
  "Closet",
  "Garage",
  "Other",
];

export default function RoomEditModal({ open, onClose, room, onSaved }: Props) {
  const { toast } = useToast();
  const isEdit = !!room?.id;

  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(room?.name ?? "");
  const [type, setType] = useState(room?.type ?? "");
  const [floor, setFloor] = useState<FloorKey | null>(
    (room?.floor as FloorKey) ?? 1
  );

  useEffect(() => {
    if (!open) return;
    setName(room?.name ?? "");
    setType(room?.type ?? "");
    setFloor(((room?.floor as FloorKey) ?? 1) as FloorKey);
  }, [open, room?.id]);

  if (!open) return null;

  const save = async () => {
    if (!room?.homeId) return;
    setBusy(true);
    try {
      const payload = { homeId: room.homeId, name, type: type || "Other", floor };
      const { data } = isEdit
        ? await api.put(`/rooms/${room!.id}`, payload)
        : await api.post(`/rooms`, payload);

      onSaved?.(data);
      toast({ title: isEdit ? "Room updated" : "Room created" });
      onClose();
    } catch (e: any) {
      toast({
        title: "Save failed",
        description:
          e?.response?.data?.message || "Server rejected the update.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur">
      <div className="w-full max-w-lg rounded-2xl border bg-background shadow-lg">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-sm font-semibold">
            {isEdit ? "Edit Room" : "Add Room"}
          </h2>
          <Button size="sm" variant="ghost" onClick={onClose} disabled={busy} aria-label="Close">
            ✕
          </Button>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">Name</label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Primary Bathroom"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">Type</label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="" disabled>
                Select type…
              </option>
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Floor</label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
              value={String(floor ?? "")}
              onChange={(e) => setFloor(Number(e.target.value) as FloorKey)}
            >
              {[-1, 0, 1, 2, 3].map((f) => (
                <option key={f} value={f}>
                  {floorLabel(f as FloorKey)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t p-4">
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={busy || !name || !type}>
            {isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}