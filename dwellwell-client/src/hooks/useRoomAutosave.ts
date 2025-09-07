// src/hooks/useRoomAutosave.ts
import { useRef, useState } from "react";
import { api } from "@/utils/api";

type RoomPatch = {
  // no `id` here; we inject it from the hook arg
  name?: string;
  type?: string;
  floor?: number | null;
  position?: number;
  hasFireplace?: boolean;
  hasBoiler?: boolean;
  hasSmokeDetector?: boolean;
};

type Payload = RoomPatch & { id: string };

export function useRoomAutosave(roomId: string) {
  // In browser builds setTimeout returns a number, not NodeJS.Timeout
  const timer = useRef<number | null>(null);
  const lastPayload = useRef<Payload | null>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | "ok" | "error">("idle");

  function scheduleSave(patch: RoomPatch, delay = 450) {
    lastPayload.current = { id: roomId, ...patch };

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
