//dwellwell-client/src/hooks/useQuickPrompts.ts
import * as React from "react";
import { COMMON_ROOM_PROMPTS, QuickPrompt } from "@shared/constants/quickPrompts";

type RoomLite = { id: string; name?: string | null; type?: string | null };
type TrackableLite = { id: string; roomId?: string | null; kind?: string | null };

function storageKey(homeId: string) {
  return `dw.quickprompts.dismissed.${homeId}`;
}

export function useQuickPrompts(params: {
  homeId: string;
  rooms: RoomLite[];
  trackables: TrackableLite[];
}) {
  const { homeId, rooms, trackables } = params;
  const [dismissed, setDismissed] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(homeId));
      setDismissed(raw ? JSON.parse(raw) : {});
    } catch {}
  }, [homeId]);

  const dismiss = (id: string) => {
    const next = { ...dismissed, [id]: true };
    setDismissed(next);
    try { localStorage.setItem(storageKey(homeId), JSON.stringify(next)); } catch {}
  };

  const existingKindsByRoom = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const t of trackables) {
      if (!t.roomId || !t.kind) continue;
      if (!map.has(t.roomId)) map.set(t.roomId, new Set());
      map.get(t.roomId)!.add(t.kind);
    }
    return map;
  }, [trackables]);

  const nextPrompts: Array<{ room: RoomLite; prompt: QuickPrompt }> = [];
  for (const room of rooms) {
    const rtype = (room.type || "").toLowerCase();
    const candidates = COMMON_ROOM_PROMPTS[rtype] || [];
    const have = existingKindsByRoom.get(room.id) || new Set<string>();
    for (const p of candidates) {
      if (have.has(p.kind)) continue;
      if (dismissed[p.id]) continue;
      nextPrompts.push({ room, prompt: p });
    }
  }

  return { nextPrompts, dismiss };
}
