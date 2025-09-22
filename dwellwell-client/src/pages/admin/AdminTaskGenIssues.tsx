//dwellwell-client/src/pages/admin/AdminTaskGenIssues.tsx
import { useEffect, useState } from "react";
import { api } from "@/utils/api";

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
};

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

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Task Generation Issues</h1>
        <div className="flex gap-2">
          <input
            className="border rounded px-3 py-2"
            placeholder="Search message…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <button className="px-4 py-2 bg-black text-white rounded" onClick={load}>Apply</button>
        </div>
      </div>

      <div className="rounded border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Created</th>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">User</th>
              <th className="p-2 text-left">Home / Room / Trackable</th>
              <th className="p-2 text-left">Message</th>
            </tr>
          </thead>
          <tbody>
            {issues.length === 0 ? (
              <tr><td className="p-3 text-gray-500" colSpan={6}>No issues 🎉</td></tr>
            ) : issues.map(i => (
              <tr key={i.id} className="border-t align-top">
                <td className="p-2">{new Date(i.createdAt).toLocaleString()}</td>
                <td className="p-2">{i.code}</td>
                <td className="p-2">{i.status}</td>
                <td className="p-2">{i.userId}</td>
                <td className="p-2">
                  <div>Home: {i.homeId || "—"}</div>
                  <div>Room: {i.roomId || "—"}</div>
                  <div>Trackable: {i.trackableId || "—"}</div>
                </td>
                <td className="p-2 whitespace-pre-wrap">{i.message || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
