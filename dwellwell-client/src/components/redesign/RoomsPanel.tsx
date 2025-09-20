//dwellwell-client/src/components/redesign/RoomsPanel.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { api } from "@/utils/api";
import type { Room } from "@shared/types/room";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import clsx from "clsx";
import {
  BUCKETS,
  FloorKey,
  bucketIdSet,
  bucketKeyById,
  bucketOrderIndex,
  keyForFloor,
} from "@shared/constants/floors";
import RoomEditModal from "@/components/redesign/RoomEditModal";
import { SortableRoomRow } from "@/components/features/SortableRoomRow";
import { useNavigate } from "react-router-dom";

/* ---------- helpers (unchanged) ---------- */
function groupByBucket(list: Room[]) {
  const map = new Map<FloorKey, Room[]>();
  BUCKETS.forEach((b) => map.set(b.key, []));
  list.forEach((r) => map.get(keyForFloor((r as any).floor))!.push(r));
  return map;
}
function flatten(map: Map<FloorKey, Room[]>) {
  const out: Room[] = [];
  BUCKETS.forEach(({ key }) => out.push(...(map.get(key) ?? [])));
  return out;
}
function findInsertIndexForFloor(flat: Room[], floor: FloorKey): number {
  let lastIdx = -1;
  for (let i = 0; i < flat.length; i++) {
    if (keyForFloor((flat[i] as any).floor) === floor) lastIdx = i;
  }
  if (lastIdx >= 0) return lastIdx + 1;
  const thisOrder = bucketOrderIndex.get(floor)!;
  for (let i = 0; i < flat.length; i++) {
    const order = bucketOrderIndex.get(keyForFloor((flat[i] as any).floor))!;
    if (order > thisOrder) return i;
  }
  return flat.length;
}

/* ---------- droppable section (quieter) ---------- */
function DroppableSection({
  id,
  title,
  hint,
  roomCount,
  onAdd,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  roomCount: number;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <section
      className={clsx(
        "rounded-xl border bg-white shadow-sm",
        isOver && "ring-2 ring-brand-primary/30"
      )}
    >
      <header className="flex items-center justify-between rounded-t-xl border-b bg-muted/40 px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{title}</span>
          {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
        </div>
        <span className="text-xs rounded-full border bg-white px-2 py-0.5 text-foreground/80">
          {roomCount} {roomCount === 1 ? "room" : "rooms"}
        </span>
      </header>

      <div
        ref={setNodeRef}
        id={id}
        className={clsx(
          "p-2 space-y-2 rounded-b-xl transition-colors",
          roomCount === 0 &&
            "min-h-[112px] bg-muted/20 flex items-center justify-center"
        )}
      >
        {roomCount === 0 ? (
          <button
            type="button"
            onClick={onAdd}
            className="flex w-full max-w-[560px] items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-sm text-muted-foreground hover:border-brand-primary/50 hover:bg-background/50"
          >
            <span className="text-base">➕</span>
            <span className="font-medium">Add Room</span>
            <span className="text-muted-foreground">(to {title})</span>
          </button>
        ) : (
          <>
            {children}
            <button
              type="button"
              onClick={onAdd}
              className="w-full rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground hover:border-brand-primary/50 hover:bg-muted/20"
              aria-label={`Add room to ${title}`}
            >
              + Add Room (to {title})
            </button>
          </>
        )}
      </div>
    </section>
  );
}

/* ================= Panel ================= */
type Props = { homeId: string; tasksByRoom?: Record<string, { overdue: number; soon: number }> };

export default function RoomsPanel({ homeId, tasksByRoom }: Props) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const activeIdRef = useRef<UniqueIdentifier | null>(null);
  const fromContainerRef = useRef<string | null>(null);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | undefined>(undefined);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/rooms", {
          params: { homeId, includeDetails: true },
        });
        setRooms(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [homeId]);

  const reloadRooms = async () => {
    const { data } = await api.get("/rooms", {
      params: { homeId, includeDetails: true },
    });
    setRooms(data);
  };

  const buckets = useMemo(() => groupByBucket(rooms), [rooms]);

  function findContainerIdForItem(id: UniqueIdentifier): string | null {
    for (const { key, id: containerId } of BUCKETS) {
      const arr = buckets.get(key) ?? [];
      if (arr.some((r) => (r as any).id === id)) return containerId;
    }
    return null;
  }

  const openCreateFor = (floor: FloorKey) => {
    setEditingRoom({ homeId, floor, type: "Other", name: "" });
    setModalOpen(true);
  };

  const openEdit = (r: any) => {
    setEditingRoom({ ...r, homeId });
    setModalOpen(true);
  };

  const onDragStart = (e: DragStartEvent) => {
    activeIdRef.current = e.active.id;
    fromContainerRef.current = findContainerIdForItem(e.active.id) ?? null;
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const activeId = e.active.id as string;
    const overId = (e.over?.id ?? null) as string | null;
    if (!overId) return;

    const fromContainer = fromContainerRef.current;
    const toContainer = bucketIdSet.has(overId) ? overId : findContainerIdForItem(overId);
    if (!fromContainer || !toContainer) return;

    const fromKey = bucketKeyById.get(fromContainer)!;
    const toKey = bucketKeyById.get(toContainer)!;

    const working = new Map<FloorKey, Room[]>();
    BUCKETS.forEach(({ key }) => working.set(key, [...(buckets.get(key) ?? [])]));

    const src = working.get(fromKey)!;
    const fromIdx = (src as any[]).findIndex((r) => (r as any).id === activeId);
    if (fromIdx < 0) return;
    const [moved] = (src as any[]).splice(fromIdx, 1);

    const dest = working.get(toKey)!;
    const overIdx = (dest as any[]).findIndex((r) => (r as any).id === overId);
    const destIdx = bucketIdSet.has(overId) || overIdx < 0 ? dest.length : overIdx;

    (dest as any[]).splice(destIdx, 0, { ...(moved as any), floor: toKey });

    const nextFlat = flatten(working);
    setRooms(nextFlat);

    try {
      if (fromKey !== toKey) {
        await api.put(`/rooms/${activeId}`, { floor: toKey });
      }
      await api.put("/rooms/reorder", {
        homeId,
        roomIds: nextFlat.map((r: any) => r.id),
      });
    } catch {
      toast({ title: "Failed to save new order", variant: "destructive" });
      await reloadRooms();
    } finally {
      activeIdRef.current = null;
      fromContainerRef.current = null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Rooms ({rooms.length})</h3>
        <Button onClick={() => openCreateFor(1)}>+ Add Room</Button>
      </div>

      <RoomEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        room={editingRoom}
        onSaved={async () => { await reloadRooms(); }}
      />

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="space-y-4">
            {BUCKETS.map(({ id, key, label, hint }) => {
              const list = buckets.get(key) ?? [];
              return (
                <DroppableSection
                  key={id}
                  id={id}
                  title={label}
                  hint={hint}
                  roomCount={list.length}
                  onAdd={() => openCreateFor(key)}
                >
                  <SortableContext
                    items={list.map((r: any) => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2">
                      {list.map((r: any) => {
                        const stats = tasksByRoom?.[r.id] ?? { overdue: 0, soon: 0 };
                        return (
                          <SortableRoomRow
                            key={r.id}
                            id={r.id}
                            room={r}
                            overdue={stats.overdue}
                            dueSoon={stats.soon}
                            onEdit={() => openEdit(r)}
                            onRemove={async () => {
                              const prior = rooms as any[];
                              setRooms((pr) => (pr as any[]).filter((x: any) => x.id !== r.id) as any);
                              try {
                                await api.delete(`/rooms/${r.id}`);
                              } catch {
                                setRooms(prior as any);
                                toast({ title: "Failed to delete room", variant: "destructive" });
                              }
                            }}
                            onViewTasks={() => navigate(`/app/tasks?roomId=${encodeURIComponent(r.id)}`)}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DroppableSection>
              );
            })}
          </div>
        </DndContext>
      )}
    </div>
  );
}
