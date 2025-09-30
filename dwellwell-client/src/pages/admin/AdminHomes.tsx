// dwellwell-client/src/pages/admin/AdminHomes.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type AdminHome = {
  id: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  createdAt?: string | Date | null;
  user?: { id: string; email: string } | null;
  userId?: string | null;
  roomsCount?: number;
  trackablesCount?: number;
};

type HomesListResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: AdminHome[];
};

export default function AdminHomes() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [resp, setResp] = useState<HomesListResponse | null>(null);

  const items = resp?.items ?? [];

  async function fetchHomes(p = page) {
    try {
      setLoading(true);
      const params: any = { page: p };
      if (query.trim()) params.q = query.trim();
      const { data } = await api.get<HomesListResponse>("/admin/homes", { params });
      setResp(data);
      if (p !== page) setPage(p);
    } catch (e: any) {
      alert(`Failed to load homes: ${e?.response?.data?.message ?? e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const hasToken = !!localStorage.getItem("dwellwell-token");
    if (!hasToken) {
      window.location.href = "/login";
      return;
    }
    fetchHomes(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((h) => {
      const addr = `${h.address ?? ""} ${h.city ?? ""} ${h.state ?? ""}`.toLowerCase();
      const owner = (h.user?.email ?? "").toLowerCase();
      return addr.includes(q) || owner.includes(q);
    });
  }, [items, query]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold">Homes</h2>
        <div className="flex gap-2">
          <Input
            className="w-72"
            placeholder="Search address or owner email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchHomes(1);
            }}
          />
          <Button variant="secondary" onClick={() => fetchHomes(1)}>
            Search
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setQuery("");
              fetchHomes(1);
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left p-2">Address</th>
                <th className="text-left p-2">Owner</th>
                <th className="text-left p-2">Location</th>
                <th className="text-left p-2">Created</th>
                <th className="text-right p-2">Counts</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-3" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="p-6 text-center text-muted-foreground" colSpan={5}>
                    No homes found.
                  </td>
                </tr>
              ) : (
                filtered.map((h) => {
                  const address = h.address || "—";
                  const owner = h.user?.email || "—";
                  const loc = [h.city, h.state].filter(Boolean).join(", ");
                  const created = h.createdAt ? new Date(h.createdAt).toLocaleString() : "—";
                  const counts = `${h.roomsCount ?? 0} rooms • ${h.trackablesCount ?? 0} trackables`;

                  return (
                    <tr key={h.id} className="border-t align-top">
                      <td className="p-2">
                        <div className="font-medium">{address}</div>
                      </td>
                      <td className="p-2">{owner}</td>
                      <td className="p-2">{loc || "—"}</td>
                      <td className="p-2 text-xs">{created}</td>
                      <td className="p-2">
                        <div className="flex justify-end text-xs text-muted-foreground">{counts}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {resp && resp.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            className="px-2 py-1"
            disabled={page <= 1}
            onClick={() => fetchHomes(page - 1)}
          >
            Prev
          </Button>
          <div className="text-sm">
            Page {resp.page} / {resp.totalPages} • {resp.total} total
          </div>
          <Button
            variant="outline"
            className="px-2 py-1"
            disabled={page >= resp.totalPages}
            onClick={() => fetchHomes(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
