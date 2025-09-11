// dwellwell-client/src/hooks/useRoomAutosave.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/utils/api";

type SaveStatus = "idle" | "saving" | "ok" | "error";

type RoomPatch = {
  name?: string | null;
  type?: string | null;
  floor?: number | null;
  details?: Record<string, any>;
};

function stripUndefined(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/**
 * Debounced autosave with patch coalescing and "green glow" signal support.
 * Adds optional debug logs (DEV only) and a visibility-change safety flush.
 */
export function useRoomAutosave(roomId: string | undefined) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedPulse, setSavedPulse] = useState(false);

  const bufferRef = useRef<RoomPatch>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Safety: try to flush when tab becomes hidden (route changes / tab switches)
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        // fire-and-forget; ignore result
        void flush();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const flush = useCallback(async () => {
    if (!roomId) {
      if (import.meta.env.DEV) {
        console.warn("[useRoomAutosave] no roomId; skipping flush");
      }
      return;
    }
    const patch = bufferRef.current;
    bufferRef.current = {};
    if (!Object.keys(patch).length) return;

    try {
      inflightRef.current = true;
      setStatus("saving");

      // Only send defined keys; allow `null` to clear
      const body: any = stripUndefined(patch);
      if ("details" in body && body.details && typeof body.details === "object") {
        body.details = stripUndefined(body.details);
      }

      if (import.meta.env.DEV) {
        console.log("[useRoomAutosave] PUT /rooms/%s", roomId, body);
      }

      await api.put(`/rooms/${roomId}`, body);

      if (!mountedRef.current) return;
      setStatus("ok");
      setSavedPulse(true);
      // brief pulse
      setTimeout(() => mountedRef.current && setSavedPulse(false), 900);
    } catch (err) {
      if (!mountedRef.current) return;
      if (import.meta.env.DEV) {
        console.error("[useRoomAutosave] save failed", err);
      }
      setStatus("error");
    } finally {
      inflightRef.current = false;
    }
  }, [roomId]);

  const scheduleSave = useCallback(
    (patch: RoomPatch) => {
      // Merge into buffer
      bufferRef.current = {
        ...bufferRef.current,
        ...stripUndefined(patch),
        ...(patch.details
          ? { details: { ...(bufferRef.current.details || {}), ...stripUndefined(patch.details) } }
          : {}),
      };

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!inflightRef.current) {
          flush();
        } else {
          // try again soon after inflight returns
          timerRef.current = setTimeout(flush, 250);
        }
      }, 600); // debounce
    },
    [flush]
  );

  return {
    saving: status,
    savedPulse, // true momentarily after save
    scheduleSave,
    flushNow: flush, // handy for an explicit "Save" button or onBlur
  };
}
