// dwellwell-client/src/pages/admin/AdminHomes.tsx
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/utils/api';

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
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [resp, setResp] = useState<HomesListResponse | null>(null);

  const items = resp?.items ?? [];

  async function fetchHomes(p = page) {
    try {
      setLoading(true);
      const params: any = { page: p };
      if (query.trim()) params.q = query.trim();
      const { data } = await api.get<HomesListResponse>('/admin/homes', { params }); // no /api
      setResp(data);
      if (p !== page) setPage(p);
    } catch (e: any) {
      alert(`Failed to load homes: ${e?.response?.data?.message ?? e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const hasToken = !!localStorage.getItem('dwellwell-token');
    if (!hasToken) {
      window.location.href = '/login';
      return;
    }
    fetchHomes(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((h) => {
      const addr = `${h.address ?? ''} ${h.city ?? ''} ${h.state ?? ''}`.toLowerCase();
      const owner = (h.user?.email ?? '').toLowerCase();
      return addr.includes(q) || owner.includes(q);
    });
  }, [items, query]);

  return (
    <div className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-2xl font-semibold">Homes</h2>
        <div className="flex gap-2">
          <input
            className="border rounded px-3 py-2 w-72"
            placeholder="Search address or owner email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchHomes(1);
            }}
          />
          <button onClick={() => fetchHomes(1)} className="px-3 py-2 rounded border hover:bg-gray-50">
            Search
          </button>
          <button
            onClick={() => {
              setQuery('');
              fetchHomes(1);
            }}
            className="px-3 py-2 rounded border hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100">
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
              <tr><td className="p-3" colSpan={5}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={5}>
                  No homes found.
                </td>
              </tr>
            ) : (
              filtered.map((h) => {
                const address = h.address || '—';
                const owner = h.user?.email || '—';
                const loc = [h.city, h.state].filter(Boolean).join(', ');
                const created =
                  h.createdAt ? new Date(h.createdAt).toLocaleString() : '—';
                const counts =
                  `${(h.roomsCount ?? 0)} rooms • ${(h.trackablesCount ?? 0)} trackables`;

                return (
                  <tr key={h.id} className="border-t align-top">
                    <td className="p-2">
                      <div className="font-medium">{address}</div>
                    </td>
                    <td className="p-2">{owner}</td>
                    <td className="p-2">{loc || '—'}</td>
                    <td className="p-2 text-xs">{created}</td>
                    <td className="p-2">
                      <div className="flex justify-end text-xs text-gray-700">{counts}</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {resp && resp.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => fetchHomes(page - 1)}
          >
            Prev
          </button>
          <div className="text-sm">
            Page {resp.page} / {resp.totalPages} • {resp.total} total
          </div>
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            disabled={page >= resp.totalPages}
            onClick={() => fetchHomes(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
