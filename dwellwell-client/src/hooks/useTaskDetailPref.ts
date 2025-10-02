// dwellwell-client/src/hooks/useTaskDetailPref.ts
import { useSyncExternalStore } from "react";

export type TaskDetailView = "drawer" | "card";
const KEY = "dwellwell.taskDetailView";
const EVT = "dw:task-detail-pref-changed";

function read(): TaskDetailView {
  try {
    const v = localStorage.getItem(KEY);
    return v === "card" ? "card" : "drawer";
  } catch {
    return "drawer";
  }
}

function subscribe(cb: () => void) {
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function useTaskDetailPref(): TaskDetailView {
  return useSyncExternalStore(subscribe, read, read);
}

export function setTaskDetailPref(next: TaskDetailView) {
  try {
    localStorage.setItem(KEY, next);
    window.dispatchEvent(new Event(EVT));
  } catch {}
}
