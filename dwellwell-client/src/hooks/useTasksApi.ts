//dwellwell-client/src/hooks/useTasksApi.ts
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

export type TaskPlanResponse = {
  planText: string;
  estTotalMinutes?: number | null;
  tagline?: string | null;
};

export type TaskPlanInputTask = Pick<
  TaskListItem,
  | "id"
  | "title"
  | "roomName"
  | "itemName"
  | "estimatedTimeMinutes"
  | "status"
  | "dueDate"
>;

function ok(res: Response) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

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

  // Some endpoints may return empty 204
  if (res.status === 204) return null;
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

  const getTaskPlan = useCallback(
    async (tasks: TaskPlanInputTask[]): Promise<TaskPlanResponse> => {
      return fetchJson("/api/ai/task-plan", {
        method: "POST",
        body: JSON.stringify({ tasks }),
      });
    },
    []
  );

  const complete = useCallback(async (taskId: string) => {
    return fetchJson(`/api/tasks/${encodeURIComponent(taskId)}/complete`, { method: "POST" });
  }, []);

  const uncomplete = useCallback(async (taskId: string) => {
    return fetchJson(`/api/tasks/${encodeURIComponent(taskId)}/uncomplete`, { method: "POST" });
  }, []);

  const snooze = useCallback(async (taskId: string, days: number) => {
    return fetchJson(`/api/tasks/${encodeURIComponent(taskId)}/snooze`, {
      method: "POST",
      body: JSON.stringify({ days }),
    });
  }, []);

  // NEW: Skip the current occurrence (server should set status -> SKIPPED or move fwd)
  const skip = useCallback(async (taskId: string) => {
    return fetchJson(`/api/tasks/${encodeURIComponent(taskId)}/skip`, { method: "POST" });
  }, []);

  // NEW: Generic patch (used earlier for “defer” -> change dueDate, etc.)
  const updateTask = useCallback(async (taskId: string, patch: Partial<TaskListItem>) => {
    return fetchJson(`/api/tasks/${encodeURIComponent(taskId)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
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
    uncomplete,
    snooze,
    skip,         // ← added
    updateTask,   // ← added
    pause,
    resume,
    archive,
    unarchive,
    getTaskPlan,
  };
}
