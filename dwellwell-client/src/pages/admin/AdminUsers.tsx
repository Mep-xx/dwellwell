// dwellwell-client/src/pages/admin/AdminUsers.tsx
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/utils/api';

type Profile = {
  firstName?: string | null;
  lastName?: string | null;
  timezone?: string | null;
  units?: 'imperial' | 'metric' | null;
  householdRole?: 'owner' | 'renter' | 'property_manager' | null;
  diySkill?: 'none' | 'beginner' | 'intermediate' | 'pro' | null;
};

type AdminUser = {
  id: string;
  email: string;
  role?: 'user' | 'admin' | string;
  createdAt?: string | Date | null;
  defaultHomeId?: string | null;
  defaultHome?: { id: string; address: string; city: string; state: string } | null;
  profile?: Profile | null;
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
    return users.filter((u) => {
      const name = [u.profile?.firstName ?? '', u.profile?.lastName ?? ''].join(' ').trim();
      return (u.email ?? '').toLowerCase().includes(q) || name.toLowerCase().includes(q);
    });
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchUsers();
            }}
          />
          <button onClick={fetchUsers} className="px-3 py-2 rounded border hover:bg-gray-50">
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
              <th className="text-left p-2">Created</th>
              <th className="text-right p-2">Actions</th>
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
                <td className="p-6 text-center text-gray-500" colSpan={5}>
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const name =
                  [u.profile?.firstName ?? '', u.profile?.lastName ?? ''].join(' ').trim() || '—';
                return (
                  <tr key={u.id} className="border-t">
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{name}</td>
                    <td className="p-2 capitalize">{u.role ?? 'user'}</td>
                    <td className="p-2 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="p-2">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleEdit(u)} className="text-blue-600 hover:underline">
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <UserModal user={editing} onClose={() => setIsModalOpen(false)} onSaved={fetchUsers} />
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

  const [form, setForm] = useState<AdminUser & { profile: Profile }>(() => ({
    id: user ? user.id : '',
    email: user ? user.email : '',
    role: user ? (user.role ?? 'user') : 'user',
    createdAt: user ? (user.createdAt ?? null) : null,
    defaultHomeId: user?.defaultHomeId ?? null,
    defaultHome: user?.defaultHome ?? null,
    profile: {
      firstName: user?.profile?.firstName ?? '',
      lastName: user?.profile?.lastName ?? '',
      timezone: user?.profile?.timezone ?? '',
      units: (user?.profile?.units as any) ?? 'imperial',
      householdRole: (user?.profile?.householdRole as any) ?? 'owner',
      diySkill: (user?.profile?.diySkill as any) ?? 'beginner',
    },
  }));

  function setField<K extends keyof (AdminUser & { profile: Profile })>(k: K, v: any) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }
  function setProfile<K extends keyof Profile>(k: K, v: any) {
    setForm((prev) => ({ ...prev, profile: { ...prev.profile, [k]: v } }));
  }

  async function save() {
    setSaving(true);
    try {
      const body: any = {
        role: form.role ?? 'user',
        firstName: form.profile.firstName ?? undefined,
        lastName: form.profile.lastName ?? undefined,
        timezone: form.profile.timezone ?? undefined,
        units: form.profile.units ?? undefined,
        householdRole: form.profile.householdRole ?? undefined,
        diySkill: form.profile.diySkill ?? undefined,
      };

      if (user && user.id) {
        await api.put(`/admin/users/${user.id}`, body);
      } else {
        if (!form.email || !form.email.trim()) {
          alert('Email is required to create a user.');
          setSaving(false);
          return;
        }
        await api.post('/admin/users', { email: form.email.trim(), role: body.role });
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
          <h3 className="text-lg font-semibold">{user ? 'Edit User' : 'New User'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            className="border p-2 rounded md:col-span-2"
            disabled={!!user}
          />

          <input
            type="text"
            placeholder="First name"
            value={form.profile.firstName ?? ''}
            onChange={(e) => setProfile('firstName', e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Last name"
            value={form.profile.lastName ?? ''}
            onChange={(e) => setProfile('lastName', e.target.value)}
            className="border p-2 rounded"
          />

          <select
            value={form.role ?? 'user'}
            onChange={(e) => setField('role', e.target.value)}
            className="border p-2 rounded"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>

          <input
            type="text"
            placeholder="Timezone (e.g., America/New_York)"
            value={form.profile.timezone ?? ''}
            onChange={(e) => setProfile('timezone', e.target.value)}
            className="border p-2 rounded"
          />

          <select
            value={form.profile.units ?? 'imperial'}
            onChange={(e) => setProfile('units', e.target.value as any)}
            className="border p-2 rounded"
          >
            <option value="imperial">imperial</option>
            <option value="metric">metric</option>
          </select>

          <select
            value={form.profile.householdRole ?? 'owner'}
            onChange={(e) => setProfile('householdRole', e.target.value as any)}
            className="border p-2 rounded"
          >
            <option value="owner">owner</option>
            <option value="renter">renter</option>
            <option value="property_manager">property manager</option>
          </select>

          <select
            value={form.profile.diySkill ?? 'beginner'}
            onChange={(e) => setProfile('diySkill', e.target.value as any)}
            className="border p-2 rounded"
          >
            <option value="none">none</option>
            <option value="beginner">beginner</option>
            <option value="intermediate">intermediate</option>
            <option value="pro">pro</option>
          </select>
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
