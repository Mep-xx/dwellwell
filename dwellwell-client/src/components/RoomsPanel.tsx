// src/components/RoomsPanel.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  UniqueIdentifier,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableRoomCard } from '@/components/SortableRoomCard';
import { EditRoomModal } from '@/components/EditRoomModal';
import { api } from '@/utils/api';
import type { Room } from '@shared/types/room';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import clsx from 'clsx';

/* ================= Floor buckets (Basement→Other) ================= */

type FloorKey = -1 | 1 | 2 | 3 | 99 | 0;

const BUCKETS: { key: FloorKey; id: string; label: string; hint?: string }[] = [
  { key: -1, id: 'floor:-1', label: 'Basement' },
  { key: 1,  id: 'floor:1',  label: '1st Floor' },
  { key: 2,  id: 'floor:2',  label: '2nd Floor' },
  { key: 3,  id: 'floor:3',  label: '3rd Floor' },
  { key: 99, id: 'floor:99', label: 'Attic' },
  { key: 0,  id: 'floor:0',  label: 'Other', hint: 'Garage, exterior, etc.' },
];

const bucketIdSet = new Set(BUCKETS.map(b => b.id));
const bucketKeyById = new Map<string, FloorKey>(BUCKETS.map(b => [b.id, b.key]));
const bucketOrderIndex = new Map<FloorKey, number>(BUCKETS.map((b, i) => [b.key, i]));

function keyForFloor(f?: number | null): FloorKey {
  if (f === -1 || f === 1 || f === 2 || f === 3 || f === 99) return f;
  return 0;
}

function groupByBucket(list: Room[]) {
  const map = new Map<FloorKey, Room[]>();
  BUCKETS.forEach(b => map.set(b.key, []));
  list.forEach(r => map.get(keyForFloor(r.floor))!.push(r));
  return map;
}

function flatten(map: Map<FloorKey, Room[]>) {
  const out: Room[] = [];
  BUCKETS.forEach(({ key }) => out.push(...(map.get(key) ?? [])));
  return out;
}

/** Find the index to insert a new room (for a given floor) in the flat array. */
function findInsertIndexForFloor(flat: Room[], floor: FloorKey): number {
  // 1) after the last item of this bucket, if any
  let lastIdx = -1;
  for (let i = 0; i < flat.length; i++) {
    if (keyForFloor(flat[i].floor) === floor) lastIdx = i;
  }
  if (lastIdx >= 0) return lastIdx + 1;

  // 2) otherwise, before the first item of the next bucket (by bucket order)
  const thisOrder = bucketOrderIndex.get(floor)!;
  for (let i = 0; i < flat.length; i++) {
    const order = bucketOrderIndex.get(keyForFloor(flat[i].floor))!;
    if (order > thisOrder) return i;
  }

  // 3) otherwise append to end
  return flat.length;
}

/* ================= Droppable Section ================= */

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
    <div
      className={clsx(
        'rounded-xl border bg-white shadow-sm',
        isOver && 'ring-2 ring-status-info/40'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-t-xl border-b">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-wide">{title}</span>
          {hint && <span className="text-xs text-gray-500">{hint}</span>}
        </div>
        <span className="text-xs bg-white text-gray-700 px-2 py-0.5 rounded-full border">
          {roomCount} {roomCount === 1 ? 'room' : 'rooms'}
        </span>
      </div>

      {/* Body / droppable */}
      <div
        ref={setNodeRef}
        id={id}
        className={clsx(
          'p-2 space-y-2 rounded-b-xl transition-colors',
          roomCount === 0 && 'min-h-[112px] bg-gray-50/60 flex items-center justify-center'
        )}
      >
        {roomCount === 0 ? (
          // Big dashed CTA when empty (centered)
          <button
            type="button"
            onClick={onAdd}
            className="w-full max-w-[560px] border-2 border-dashed rounded-lg px-4 py-8 text-sm text-gray-600 hover:border-status-info/60 hover:bg-white/50 transition flex items-center justify-center gap-2"
          >
            <span className="text-base">➕</span>
            <span className="font-medium">Add Room</span>
            <span className="text-gray-400">(to {title})</span>
          </button>
        ) : (
          <>
            {children}
            {/* Subtle dashed “add” strip at bottom when section already has items */}
            <button
              type="button"
              onClick={onAdd}
              className="w-full border border-dashed rounded-md px-3 py-2 text-xs text-gray-600 hover:border-status-info/60 hover:bg-gray-50 transition"
              aria-label={`Add room to ${title}`}
            >
              + Add Room (to {title})
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= Panel ================= */

type Props = { homeId: string };

export function RoomsPanel({ homeId }: Props) {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editing, setEditing] = useState<Room | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // drag bookkeeping
  const activeIdRef = useRef<UniqueIdentifier | null>(null);
  const fromContainerRef = useRef<string | null>(null);

  // initial load (position order from server)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/rooms', { params: { homeId } });
        setRooms(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [homeId]);

  const reloadRooms = async () => {
    const { data } = await api.get('/rooms', { params: { homeId } });
    setRooms(data);
  };

  // group into buckets (in current list order)
  const buckets = useMemo(() => groupByBucket(rooms), [rooms]);

  // helpers to locate a container for an item
  function findContainerIdForItem(id: UniqueIdentifier): string | null {
    for (const { key, id: containerId } of BUCKETS) {
      const arr = buckets.get(key) ?? [];
      if (arr.some(r => r.id === id)) return containerId;
    }
    return null;
  }

  /* ----- Create in bucket ----- */

  const addRoomInFloor = async (floor: FloorKey) => {
    try {
      const { data: created } = await api.post('/rooms', {
        homeId,
        type: 'Other',
        name: '',
        floor,
      });

      setRooms(prev => {
        const next = [...prev];
        const insertAt = findInsertIndexForFloor(prev, floor);
        next.splice(insertAt, 0, created);
        // persist order
        api.put('/rooms/reorder', { homeId, roomIds: next.map(r => r.id) })
          .catch(() => {/* no-op */});
        return next;
      });
    } catch {
      toast({ title: 'Could not add room', variant: 'destructive' });
    }
  };

  /* ----- DnD handlers ----- */

  const onDragStart = (e: DragStartEvent) => {
    activeIdRef.current = e.active.id;
    fromContainerRef.current = findContainerIdForItem(e.active.id) ?? null;
  };

  const onDragOver = (_e: DragOverEvent) => {};

  const onDragEnd = async (e: DragEndEvent) => {
    const activeId = e.active.id as string;
    const overId = (e.over?.id ?? null) as string | null;
    if (!overId) return;

    const fromContainer = fromContainerRef.current;
    const toContainer = bucketIdSet.has(overId)
      ? overId
      : findContainerIdForItem(overId);

    if (!fromContainer || !toContainer) return;

    const fromKey = bucketKeyById.get(fromContainer)!;
    const toKey = bucketKeyById.get(toContainer)!;

    // clone working buckets
    const working = new Map<FloorKey, Room[]>();
    BUCKETS.forEach(({ key }) => working.set(key, [...(buckets.get(key) ?? [])]));

    // remove from source
    const src = working.get(fromKey)!;
    const fromIdx = src.findIndex(r => r.id === activeId);
    if (fromIdx < 0) return;
    const [moved] = src.splice(fromIdx, 1);

    // compute destination index
    const dest = working.get(toKey)!;
    let destIdx = 0;
    if (bucketIdSet.has(overId)) {
      destIdx = dest.length; // empty area -> append
    } else {
      const overIdx = dest.findIndex(r => r.id === overId);
      destIdx = overIdx < 0 ? dest.length : overIdx;
    }

    // insert and update floor if bucket changed
    dest.splice(destIdx, 0, { ...moved, floor: toKey });

    // flatten to global order and apply optimistically
    const nextFlat = flatten(working);
    setRooms(nextFlat);

    // persist: (1) floor (if bucket changed) (2) global order
    try {
      if (fromKey !== toKey) {
        await api.put(`/rooms/${activeId}`, { floor: toKey });
      }
      await api.put('/rooms/reorder', { homeId, roomIds: nextFlat.map(r => r.id) });
    } catch {
      toast({ title: 'Failed to save new order', variant: 'destructive' });
      await reloadRooms();
    } finally {
      activeIdRef.current = null;
      fromContainerRef.current = null;
    }
  };

  /* ----- Render ----- */

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Rooms ({rooms.length})</h3>
        {/* keep a global add (defaults to 1st floor) */}
        <Button onClick={() => addRoomInFloor(1)}>+ Add Room</Button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
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
                  onAdd={() => addRoomInFloor(key)}
                >
                  <SortableContext items={list.map(r => r.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-2">
                      {list.map(r => (
                        <SortableRoomCard
                          key={r.id}
                          id={r.id}
                          room={r}
                          onChange={(patch) => {
                            // local patch; position left intact
                            setRooms(prev => prev.map(x => (x.id === r.id ? { ...x, ...patch } : x)));
                          }}
                          onEdit={() => {
                            setEditing(r);
                            setModalOpen(true);
                          }}
                          onRemove={async () => {
                            const prior = rooms;
                            setRooms(pr => pr.filter(x => x.id !== r.id));
                            try { await api.delete(`/rooms/${r.id}`); }
                            catch {
                              setRooms(prior);
                              toast({ title: 'Failed to delete room', variant: 'destructive' });
                            }
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DroppableSection>
              );
            })}
          </div>
        </DndContext>
      )}

      {/* Edit modal (opens from card) */}
      <EditRoomModal
        room={editing as any}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={async () => {
          await reloadRooms();
          setModalOpen(false);
        }}
      />
    </div>
  );
}
