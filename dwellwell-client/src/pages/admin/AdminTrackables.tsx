// dwellwell-client/src/pages/admin/AdminTrackables.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type AdminTrackableItem = {
  id: string;
  createdAt: string;
  imageUrl?: string | null;
  serialNumber?: string | null;
  userDefinedName?: string | null;
  brand?: string | null;
  model?: string | null;
  type?: string | null;
  category?: string | null;
  home: { id: string; address: string | null; city: string | null; state: string | null };
  user: { id: string; email: string };
  resourceCount: number;
};

type ListResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: AdminTrackableItem[];
};

type Resource = {
  id: string;
  type: "pdf" | "video";
  name: string;
  filePath?: string | null;
  url?: string | null;
  createdAt: string;
};

export default function AdminTrackables() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [resp, setResp] = useState<ListResponse | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState<string | null>(null);

  const displayItems = resp?.items ?? [];

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function fetchList() {
    try {
      setError(null);
      const params: any = { page };
      if (q.trim()) params.q = q.trim();
      if (type) params.type = type;
      const { data } = await api.get<ListResponse>("/admin/trackables", { params });
      setResp(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message);
    }
  }

  useEffect(() => {
    if (!activeId) return;
    api
      .get<Resource[]>(`/admin/trackables/${activeId}/resources`)
      .then((r) => setResources(r.data))
      .catch((e) => setError(e?.response?.data?.message ?? e.message));
  }, [activeId]);

  const activeItem = useMemo(
    () => displayItems.find((i) => i.id === activeId) || null,
    [activeId, displayItems]
  );

  async function uploadPdf(file: File) {
    if (!activeId) return;
    const fd = new FormData();
    fd.append("file", file);
    await api.post(`/admin/trackables/${activeId}/resources/upload`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const { data } = await api.get<Resource[]>(`/admin/trackables/${activeId}/resources`);
    setResources(data);
  }

  async function addVideoUrl(name: string, url: string) {
    if (!activeId) return;
    await api.post(`/admin/trackables/${activeId}/resources/url`, {
      name: name || "Video",
      url,
      type: "video",
    });
    const { data } = await api.get<Resource[]>(`/admin/trackables/${activeId}/resources`);
    setResources(data);
  }

  async function removeResource(id: string) {
    await api.delete(`/admin/trackables/resources/${id}`);
    setResources((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-semibold">Trackables</h1>

      {error && <div className="text-red-600">Error: {error}</div>}

      {/* Filters */}
      <form
        className="flex gap-2 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          fetchList();
        }}
      >
        <div className="flex flex-col">
          <label className="text-sm mb-1 text-muted-foreground">Search</label>
          <Input
            placeholder="Brand, model, serial…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1 text-muted-foreground">Type</label>
          <Input
            placeholder="HVAC, Dishwasher…"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
        </div>
        <Button type="submit">Apply</Button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* List */}
        <Card className="md:col-span-1 rounded-2xl p-4">
          <h2 className="font-medium mb-3">All Trackables</h2>
          <ul className="space-y-1 max-h-[70vh] overflow-auto pr-1">
            {displayItems.map((t) => {
              const displayName =
                t.userDefinedName || [t.brand, t.model].filter(Boolean).join(" ") || "(unnamed)";
              const subtitle = `${t.type || t.category || "—"} • ${t.home.address || t.user.email}`;
              const active = activeId === t.id;
              return (
                <li key={t.id}>
                  <button
                    className={[
                      "w-full text-left px-2 py-2 rounded-md transition",
                      active ? "bg-muted" : "hover:bg-muted/60",
                    ].join(" ")}
                    onClick={() => setActiveId(t.id)}
                    title={displayName}
                  >
                    <div className="font-medium truncate">{displayName}</div>
                    <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
                  </button>
                </li>
              );
            })}
            {displayItems.length === 0 && <li className="text-muted-foreground">No results.</li>}
          </ul>

          {/* Pagination */}
          {resp && resp.totalPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <Button
                variant="outline"
                className="px-2 py-1"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Prev
              </Button>
              <div className="text-sm">
                Page {resp.page} / {resp.totalPages}
              </div>
              <Button
                variant="outline"
                className="px-2 py-1"
                disabled={page >= resp.totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, resp.totalPages))}
              >
                Next
              </Button>
            </div>
          )}
        </Card>

        {/* Resource panel */}
        <Card className="md:col-span-2 rounded-2xl p-4">
          {!activeItem ? (
            <div className="text-muted-foreground">Select a trackable to manage resources.</div>
          ) : (
            <>
              <h2 className="font-medium mb-3">
                Resources for{" "}
                <span className="font-semibold">
                  {activeItem.userDefinedName ||
                    [activeItem.brand, activeItem.model].filter(Boolean).join(" ") ||
                    "(unnamed)"}
                </span>
              </h2>

              {/* Upload PDF */}
              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm text-muted-foreground">Upload Manual (PDF):</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => e.target.files && uploadPdf(e.target.files[0])}
                />
              </div>

              {/* Add video URL */}
              <AddVideoForm onAdd={addVideoUrl} />

              <div className="rounded-2xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Link</th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="p-3">{r.name}</td>
                        <td className="p-3 uppercase">{r.type}</td>
                        <td className="p-3">
                          {r.type === "pdf" && r.filePath && (
                            <a
                              className="text-primary underline"
                              href={`/${r.filePath}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open
                            </a>
                          )}
                          {r.type === "video" && r.url && (
                            <a
                              className="text-primary underline"
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open
                            </a>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            className="text-red-600 hover:underline"
                            onClick={() => removeResource(r.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {resources.length === 0 && (
                      <tr>
                        <td className="p-3 text-muted-foreground" colSpan={4}>
                          No resources yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function AddVideoForm({ onAdd }: { onAdd: (name: string, url: string) => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  return (
    <form
      className="flex gap-2 items-end mb-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!url) return;
        onAdd(name || "Video", url);
        setName("");
        setUrl("");
      }}
    >
      <div className="flex flex-col">
        <label className="text-sm mb-1 text-muted-foreground">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="YouTube teardown" />
      </div>
      <div className="flex-1 flex flex-col">
        <label className="text-sm mb-1 text-muted-foreground">Video URL</label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
      </div>
      <Button>Add</Button>
    </form>
  );
}
