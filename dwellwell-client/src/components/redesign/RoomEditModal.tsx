// dwellwell-client/src/components/redesign/RoomEditModal.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { FloorKey, floorLabel } from "@shared/constants/floors";
import { ROOM_TYPES, ROOM_TYPE_ICONS } from "@shared/constants/roomTypes";

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

export default function RoomEditModal({ open, onClose, room, onSaved }: Props) {
  const { toast } = useToast();
  const isEdit = !!room?.id;

  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(room?.name ?? "");
  const [type, setType] = useState(room?.type ?? "");
  const [floor, setFloor] = useState<FloorKey | null>((room?.floor as FloorKey) ?? 1);
  const [query, setQuery] = useState("");

  // Reset form when opening / changing target room
  useEffect(() => {
    if (!open) return;
    setName(room?.name ?? "");
    setType(room?.type ?? "");
    setFloor(((room?.floor as FloorKey) ?? 1) as FloorKey);
    setQuery("");
  }, [open, room?.id]);

  // Filter list — must be declared before any early return so hook order is stable
  const filteredTypes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? ROOM_TYPES.filter((t) => t.toLowerCase().includes(q)) : ROOM_TYPES;
  }, [query]);

  const save = useCallback(async () => {
    if (!room?.homeId) return;
    setBusy(true);
    try {
      const payload = { homeId: room.homeId, name: name.trim(), type: (type || "Other").trim(), floor };
      const { data } = isEdit
        ? await api.put(`/rooms/${room!.id}`, payload)
        : await api.post(`/rooms`, payload);

      // Fire and forget taskgen
      try { await api.post(`/tasks/taskgen/room/${data.id}`); } catch {}

      onSaved?.(data);
      toast({ title: isEdit ? "Room updated" : "Room created" });
      onClose();
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.response?.data?.message || "Server rejected the update.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }, [room?.homeId, room?.id, isEdit, name, type, floor, onClose, onSaved, toast]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Early return AFTER all hooks have been called this render
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50" // solid overlay; no blur/transparency on card
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl rounded-2xl border bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-base font-semibold">
            {isEdit ? "Edit Room" : "Add Room"}
          </h2>
          <Button size="sm" variant="ghost" onClick={onClose} disabled={busy} aria-label="Close">
            ✕
          </Button>
        </div>

        {/* Body */}
        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">Name</label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Primary Bathroom"
              autoFocus
            />
          </div>

          {/* Rich room-type picker */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">Type</label>
            <div className="rounded-lg border">
              <div className="border-b p-2">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Search room types…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="max-h-48 overflow-auto p-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm ${
                      type === t
                        ? "border-brand-primary ring-1 ring-brand-primary/40 bg-brand-primary/5"
                        : "hover:bg-muted/40"
                    }`}
                    title={t}
                  >
                    <span className="text-base">{ROOM_TYPE_ICONS[t] || "🏠"}</span>
                    <span className="truncate">{t}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Selected: <span className="font-medium">{type || "—"}</span>
            </div>
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

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={busy || !name.trim() || !type.trim()}>
            {isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
