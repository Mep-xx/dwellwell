// dwellwell-client/src/hooks/useUserPrefs.ts
import { useCallback, useEffect, useState } from "react";

/** View modes for task detail */
export type TaskDetailView = "drawer" | "card";

const KEY = "dwellwell.taskDetailView";

function getInitial(): TaskDetailView {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "drawer" || raw === "card") return raw;
  } catch {}
  return "drawer";
}

/**
 * Simple client-side prefs with localStorage persistence.
 * If you later expose an API (e.g. /api/me/settings), you can
 * hydrate here and POST on change—no call sites change.
 */
export function useUserPrefs() {
  const [taskDetailView, setTaskDetailViewState] = useState<TaskDetailView>(getInitial);

  useEffect(() => {
    try { localStorage.setItem(KEY, taskDetailView); } catch {}
  }, [taskDetailView]);

  const setTaskDetailView = useCallback((mode: TaskDetailView) => {
    setTaskDetailViewState(mode);
  }, []);

  return {
    taskDetailView,
    setTaskDetailView,
  };
}
