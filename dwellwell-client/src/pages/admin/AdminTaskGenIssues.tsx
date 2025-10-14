// dwellwell-client/src/pages/admin/AdminTaskGenIssues.tsx
import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Issue = {
  id: string;
  userId: string;
  homeId?: string | null;
  roomId?: string | null;
  trackableId?: string | null;
  code: "no_matching_template" | "enrichment_lookup_failed" | "template_eval_error" | "upsert_error";
  status: "open" | "in_progress" | "resolved";
  message?: string | null;
  createdAt: string;

  // enriched
  user?: { id: string; email: string } | null;
  home?: { id: string; address: string | null; city: string | null; state: string | null } | null;
  room?: { id: string; name: string | null; type: string | null } | null;
  trackable?: {
    id: string;
    userDefinedName: string | null;
    applianceCatalog?: { brand: string | null; model: string | null; type: string | null } | null;
  } | null;
};

function StatusBadge({ status }: { status: Issue["status"] }) {
  const map: Record<Issue["status"], string> = {
    open: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100",
    in_progress: "bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100",
    resolved: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100",
  };
  return <span className={`text-xs px-2 py-0.5 rounded ${map[status]}`}>{status.replace("_", " ")}</span>;
}

export default function AdminTaskGenIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  async function load() {
    const { data } = await api.get<Issue[]>("/admin/task-generation-issues", {
      params: { q: q || undefined, status: status || undefined },
    });
    setIssues(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function retry(id: string) {
    await api.post(`/admin/task-generation-issues/${id}/retry`);
    load();
  }
  async function resolve(id: string) {
    await api.post(`/admin/task-generation-issues/${id}/resolve`);
    load();
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Task Generation Issues</h1>
        <div className="flex gap-2">
          <Input
            className="w-64"
            placeholder="Search message…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="border rounded-md px-3 py-2 bg-background"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <Button onClick={load}>Apply</Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="p-2 text-left">Created</th>
                <th className="p-2 text-left">Code</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">User / Context</th>
                <th className="p-2 text-left">Message & Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.length === 0 ? (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={5}>
                    No issues 🎉
                  </td>
                </tr>
              ) : (
                issues.map((i) => {
                  const homeStr = i.home
                    ? [i.home.address, i.home.city, i.home.state].filter(Boolean).join(", ")
                    : "—";
                  const trackableStr = i.trackable
                    ? i.trackable.userDefinedName ||
                      [i.trackable.applianceCatalog?.brand, i.trackable.applianceCatalog?.model]
                        .filter(Boolean).join(" ") ||
                      i.trackable.id
                    : "—";

                  return (
                    <tr key={i.id} className="border-t align-top">
                      <td className="p-2">{new Date(i.createdAt).toLocaleString()}</td>
                      <td className="p-2">{i.code}</td>
                      <td className="p-2">
                        <StatusBadge status={i.status} />
                      </td>
                      <td className="p-2">
                        <div className="text-xs">{i.user?.email ?? i.userId}</div>
                        <div className="text-xs text-muted-foreground">Home: {homeStr}</div>
                        <div className="text-xs text-muted-foreground">
                          Room: {i.room ? `${i.room.name ?? ""} (${i.room.type ?? ""})` : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">Trackable: {trackableStr}</div>
                      </td>
                      <td className="p-2 whitespace-pre-wrap">
                        {i.message || "—"}
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => retry(i.id)}>
                            Retry
                          </Button>
                          <Button size="sm" onClick={() => resolve(i.id)}>
                            Mark resolved
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
