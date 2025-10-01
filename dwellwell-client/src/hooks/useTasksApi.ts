//dwellwell-client/src/hooks/useTasksApi.ts
// dwellwell-client/src/hooks/useTasksApi.ts
import { useCallback } from "react";

export type TaskListItem = {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "COMPLETED" | "SKIPPED";
  dueDate: string | null;
  completedAt: string | null;

  estimatedTimeMinutes: number | null;

  // scope
  homeId: string | null;
  roomId: string | null;
  roomName: string | null;
  trackableId: string | null;
  itemName: string;

  // trackable adornments
  trackableBrand?: string | null;
  trackableModel?: string | null;
  trackableType?: string | null;

  category: string;
  icon?: string | null;
  createdAt?: string;
};

export type TaskDetail = {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: "PENDING" | "COMPLETED" | "SKIPPED";
    dueDate: string | null;
    completedDate: string | null;
    estimatedTimeMinutes: number | null;
    estimatedCost: number | null;
    criticality: "low" | "medium" | "high";
    recurrenceInterval: string;
    canDefer: boolean;
    deferLimitDays: number;
    canBeOutsourced: boolean;
    category: string | null;
    imageUrl?: string | null;
    icon?: string | null;

    // These may exist in some list endpoints; keep them optional to avoid TS errors
    pausedAt?: string | null;
    archivedAt?: string | null;
  };
  context: {
    room?: { id: string; name: string; homeId: string } | null;
    trackable?: {
      id: string;
      userDefinedName?: string | null;
      brand?: string | null;
      model?: string | null;
      roomId?: string | null;
      homeId?: string | null;
    } | null;
  };
  template: {
    id: string;
    title: string;
    summary: string | null;
    version: number;
    state: "DRAFT" | "VERIFIED";
    estimatedTimeMinutes: number | null;
    estimatedCost: number | null;
    imageUrl?: string | null;
    icon?: string | null;
    category?: string | null;
  } | null;
  content: {
    steps: any[];
    equipmentNeeded: any[];
    resources: Array<{ label?: string; url?: string; type?: string }>;
    parts: Array<{ label?: string; url?: string; type?: string }>;
  };
};

function ok(res: Response) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

// Attach token automatically for every call
async function fetchJson(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = (() => {
    try { return localStorage.getItem("dwellwell-token"); } catch { return null; }
  })();

  const headers = new Headers(init.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(input, {
    ...init,
    headers,
    credentials: "include",
  }).then(ok);

  return res.json();
}

export function useTasksApi() {
  const listTasks = useCallback(
    async (opts: {
      status?: "active" | "completed" | "overdue" | "dueSoon";
      limit?: number;
      homeId?: string;
      roomId?: string;
      trackableId?: string;
      sort?: "dueDate" | "-completedAt";
    } = {}): Promise<TaskListItem[]> => {
      const params = new URLSearchParams();
      if (opts.status) params.set("status", opts.status);
      if (opts.limit) params.set("limit", String(opts.limit));
      if (opts.homeId) params.set("homeId", opts.homeId);
      if (opts.roomId) params.set("roomId", opts.roomId);
      if (opts.trackableId) params.set("trackableId", opts.trackableId);
      if (opts.sort) params.set("sort", opts.sort);
      return fetchJson(`/api/tasks?${params.toString()}`);
    },
    []
  );

  const getDetail = useCallback(async (taskId: string): Promise<TaskDetail> => {
    return fetchJson(`/api/tasks/${encodeURIComponent(taskId)}`);
  }, []);

  const complete = useCallback(async (taskId: string) => {
    return fetchJson(`/api/tasks/${encodeURIComponent(taskId)}/complete`, { method: "POST" });
  }, []);

  const snooze = useCallback(async (taskId: string, days: number) => {
    return fetchJson(`/api/tasks/${encodeURIComponent(taskId)}/snooze`, {
      method: "POST",
      body: JSON.stringify({ days }),
    });
  }, []);

  const pause = useCallback(async (taskId: string) => {
    return fetchJson(`/api/tasks/${encodeURIComponent(taskId)}/pause`, { method: "POST" });
  }, []);

  const resume = useCallback(async (taskId: string, mode: "forward" | "now" = "forward") => {
    return fetchJson(`/api/tasks/${encodeURIComponent(taskId)}/resume`, {
      method: "POST",
      body: JSON.stringify({ mode }),
    });
  }, []);

  const archive = useCallback(async (taskId: string) => {
    return fetchJson(`/api/tasks/${encodeURIComponent(taskId)}/archive`, { method: "POST" });
  }, []);

  const unarchive = useCallback(async (taskId: string, mode: "forward" | "now" = "forward") => {
    return fetchJson(`/api/tasks/${encodeURIComponent(taskId)}/unarchive`, {
      method: "POST",
      body: JSON.stringify({ mode }),
    });
  }, []);

  return {
    listTasks,
    getDetail,
    complete,
    snooze,
    pause,
    resume,
    archive,
    unarchive,
  };
}
