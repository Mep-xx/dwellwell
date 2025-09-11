// src/hooks/useRoomAutosave.ts
import { useEffect, useRef, useState } from "react";
import { api } from "@/utils/api";

type RoomPatch = {
  // no `id` here; we inject it from the hook arg
  name?: string | null;
  type?: string | null;
  floor?: number | null;
  position?: number;
  // allow nested detail saves
  details?: Record<string, any>;
};

type Payload = RoomPatch & { id: string };

export function useRoomAutosave(roomId: string) {
  const timer = useRef<number | null>(null);
  const lastPayload = useRef<Payload | null>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | "ok" | "error">("idle");

  // If the roomId changes (e.g., param resolves), clear any pending send that used the old id
  useEffect(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  function scheduleSave(patch: RoomPatch, delay = 450) {
    if (!roomId) return; // nothing to do until we know the id
    // Clean undefined keys so we don't trip server validators
    const cleaned: Record<string, any> = {};
    Object.entries(patch).forEach(([k, v]) => {
      if (v !== undefined) cleaned[k] = v;
    });

    lastPayload.current = { id: roomId, ...(cleaned as RoomPatch) };

    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        setSaving("saving");
        await api.put(`/rooms/${roomId}`, lastPayload.current);
        setSaving("ok");
        window.setTimeout(() => setSaving("idle"), 800);
      } catch {
        setSaving("error");
      }
    }, delay);
  }

  function cancelPending() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }

  return { saving, scheduleSave, cancelPending };
}
