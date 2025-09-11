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
import { api } from '@/utils/api';
import type { Room } from '@shared/types/room';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

/* ================= Floor buckets (Basement→Other) ================= */

type FloorKey = -1 | 1 | 2 | 3 | 99 | 0;

const BUCKETS: { key: FloorKey; id: string; label: string; hint?: string }[] = [
  { key: -1, id: 'floor:-1', label: 'Basement' },
  { key: 1, id: 'floor:1', label: '1st Floor' },
  { key: 2, id: 'floor:2', label: '2nd Floor' },
  { key: 3, id: 'floor:3', label: '3rd Floor' },
  { key: 99, id: 'floor:99', label: 'Attic' },
  { key: 0, id: 'floor:0', label: 'Other', hint: 'Garage, exterior, etc.' },
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
  list.forEach(r => map.get(keyForFloor((r as any).floor))!.push(r));
  return map;
}

function flatten(map: Map<FloorKey, Room[]>) {
  const out: Room[] = [];
  BUCKETS.forEach(({ key }) => out.push(...(map.get(key) ?? [])));
  return out;
}

/** Find the index to insert a new room (for a given floor) in the flat array. */
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
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const activeIdRef = useRef<UniqueIdentifier | null>(null);
  const fromContainerRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/rooms', { params: { homeId, includeDetails: true } });
        setRooms(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [homeId]);

  const reloadRooms = async () => {
    const { data } = await api.get('/rooms', { params: { homeId, includeDetails: true } });
    setRooms(data);
  };

  const buckets = useMemo(() => groupByBucket(rooms), [rooms]);

  function findContainerIdForItem(id: UniqueIdentifier): string | null {
    for (const { key, id: containerId } of BUCKETS) {
      const arr = buckets.get(key) ?? [];
      if (arr.some(r => (r as any).id === id)) return containerId;
    }
    return null;
  }

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
        api.put('/rooms/reorder', { homeId, roomIds: next.map((r: any) => r.id) })
          .catch(() => {/* no-op */});
        return next;
      });
    } catch {
      toast({ title: 'Could not add room', variant: 'destructive' });
    }
  };

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

    const working = new Map<FloorKey, Room[]>();
    BUCKETS.forEach(({ key }) => working.set(key, [...(buckets.get(key) ?? [])]));

    const src = working.get(fromKey)!;
    const fromIdx = (src as any[]).findIndex((r) => (r as any).id === activeId);
    if (fromIdx < 0) return;
    const [moved] = (src as any[]).splice(fromIdx, 1);

    const dest = working.get(toKey)!;
    let destIdx = 0;
    if (bucketIdSet.has(overId)) {
      destIdx = dest.length;
    } else {
      const overIdx = (dest as any[]).findIndex((r) => (r as any).id === overId);
      destIdx = overIdx < 0 ? dest.length : overIdx;
    }

    (dest as any[]).splice(destIdx, 0, { ...(moved as any), floor: toKey });

    const nextFlat = flatten(working);
    setRooms(nextFlat);

    try {
      if (fromKey !== toKey) {
        await api.put(`/rooms/${activeId}`, { floor: toKey });
      }
      await api.put('/rooms/reorder', { homeId, roomIds: nextFlat.map((r: any) => r.id) });
    } catch {
      toast({ title: 'Failed to save new order', variant: 'destructive' });
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
                  <SortableContext items={list.map((r: any) => r.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-2">
                      {list.map((r: any) => (
                        <SortableRoomCard
                          key={r.id}
                          id={r.id}
                          room={r}
                          onChange={(patch) => {
                            setRooms(prev => prev.map((x: any) => (x.id === r.id ? { ...x, ...patch } : x)));
                          }}
                          // Edit button -> go straight to Room page
                          onEdit={() => navigate(`/app/rooms/${r.id}`, { state: { room: r } })}
                          onRemove={async () => {
                            const prior = rooms as any[];
                            setRooms(pr => (pr as any[]).filter((x: any) => x.id !== r.id) as any);
                            try { await api.delete(`/rooms/${r.id}`); }
                            catch {
                              setRooms(prior as any);
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
    </div>
  );
}
