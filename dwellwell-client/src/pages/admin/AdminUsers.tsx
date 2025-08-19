//dwellwell-client/src/pages/admin/AdminUsers.tsx
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/utils/api';

// Extend conservatively: we don't assume every field exists on your User model.
// This shape matches what our API returns (Prisma .findMany()) but uses optionals.
type AdminUser = {
  id: string;
  email: string;
  role?: 'user' | 'admin' | string;
  name?: string | null;
  isActive?: boolean | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  lastLoginAt?: string | Date | null;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  async function fetchUsers() {
    try {
      setLoading(true);
      const params = query.trim() ? { params: { q: query.trim() } } : undefined;
      const res = await api.get<AdminUser[]>('/admin/users', params);
      setUsers(res.data);
    } catch (e: any) {
      alert(`Failed to load users: ${e?.response?.data?.message ?? e.message}`);
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
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCreate() {
    setEditing(null);
    setIsModalOpen(true);
  }
  function handleEdit(u: AdminUser) {
    setEditing(u);
    setIsModalOpen(true);
  }
  async function handleDelete(id: string) {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (e: any) {
      alert(`Delete failed: ${e?.response?.data?.message ?? e.message}`);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.name ?? '').toLowerCase().includes(q)
    );
  }, [users, query]);

  return (
    <div className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-2xl font-semibold">Users</h2>
        <div className="flex gap-2">
          <input
            className="border rounded px-3 py-2 w-64"
            placeholder="Search email/name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') fetchUsers(); }}
          />
          <button
            onClick={fetchUsers}
            className="px-3 py-2 rounded border hover:bg-gray-50"
          >
            Search
          </button>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + New User
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Active</th>
              <th className="text-left p-2">Created</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={6}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={6}>
                  No users found.
                </td>
              </tr>
            ) : filtered.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.name ?? '—'}</td>
                <td className="p-2 capitalize">{u.role ?? 'user'}</td>
                <td className="p-2">{String(u.isActive ?? true)}</td>
                <td className="p-2 text-xs">
                  {u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}
                </td>
                <td className="p-2">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleEdit(u)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <UserModal
          user={editing}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchUsers}
        />
      )}
    </div>
  );
}

function UserModal(props: {
  user: AdminUser | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user, onClose, onSaved } = props;
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<AdminUser>({
    id: user ? user.id : '',
    email: user ? user.email : '',
    name: user ? (user.name ?? '') : '',
    role: user ? (user.role ?? 'user') : 'user',
    isActive: user ? (user.isActive ?? true) : true,
    createdAt: user ? (user.createdAt ?? null) : null,
    updatedAt: user ? (user.updatedAt ?? null) : null,
    lastLoginAt: user ? (user.lastLoginAt ?? null) : null,
  });

  function setField(k: keyof AdminUser, v: any) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    setSaving(true);
    try {
      // Only send fields we actually allow to change
      const body: any = {
        name: form.name ?? '',
        role: form.role ?? 'user',
        isActive: typeof form.isActive === 'boolean' ? form.isActive : undefined,
        // email: if you want admins to create users, include on POST only
      };

      if (user && user.id) {
        await api.put(`/admin/users/${user.id}`, body);
      } else {
        // Creating: require email
        if (!form.email || !form.email.trim()) {
          alert('Email is required to create a user.');
          setSaving(false);
          return;
        }
        const createBody = { ...body, email: form.email.trim() };
        await api.post('/admin/users', createBody);
      }

      onSaved();
      onClose();
    } catch (e: any) {
      alert(`Save failed: ${e?.response?.data?.message ?? e.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {user ? 'Edit User' : 'New User'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            className="border p-2 rounded md:col-span-2"
            disabled={!!user} // don't let email change when editing existing user
          />

          <input
            type="text"
            placeholder="Name"
            value={form.name ?? ''}
            onChange={(e) => setField('name', e.target.value)}
            className="border p-2 rounded md:col-span-2"
          />

          <select
            value={form.role ?? 'user'}
            onChange={(e) => setField('role', e.target.value)}
            className="border p-2 rounded"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.isActive}
              onChange={(e) => setField('isActive', e.target.checked)}
            />
            Active
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
            disabled={saving || (!user && !form.email)}
          >
            {saving ? 'Saving…' : user ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
