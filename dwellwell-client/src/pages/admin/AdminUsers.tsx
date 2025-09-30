// dwellwell-client/src/pages/admin/AdminUsers.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Profile = {
  firstName?: string | null;
  lastName?: string | null;
  timezone?: string | null;
  units?: "imperial" | "metric" | null;
  householdRole?: "owner" | "renter" | "property_manager" | null;
  diySkill?: "none" | "beginner" | "intermediate" | "pro" | null;
};

type AdminUser = {
  id: string;
  email: string;
  role?: "user" | "admin" | string;
  createdAt?: string | Date | null;
  defaultHomeId?: string | null;
  defaultHome?: { id: string; address: string; city: string; state: string } | null;
  profile?: Profile | null;
};

type AdminUsersResponse = {
  items: AdminUser[];
  total: number;
  take?: number;
  skip?: number;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  async function fetchUsers() {
    try {
      setLoading(true);
      const params = query.trim() ? { params: { q: query.trim() } } : undefined;
      const res = await api.get<AdminUsersResponse | AdminUser[]>("/admin/users", params);
      const data = res.data as any;
      const items: AdminUser[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      const t: number = Array.isArray(data) ? items.length : Number(data?.total ?? items.length);
      setUsers(items);
      setTotal(t);
    } catch (e: any) {
      alert(`Failed to load users: ${e?.response?.data?.message ?? e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
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
    if (!confirm("Delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (e: any) {
      alert(`Delete failed: ${e?.response?.data?.message ?? e.message}`);
    }
  }

  const filtered = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) => {
      const name = [u.profile?.firstName ?? "", u.profile?.lastName ?? ""].join(" ").trim();
      return (u.email ?? "").toLowerCase().includes(q) || name.toLowerCase().includes(q);
    });
  }, [users, query]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold">
          Users {total ? <span className="text-muted-foreground font-normal">({total})</span> : null}
        </h2>
        <div className="flex gap-2">
          <Input
            className="w-64"
            placeholder="Search email/name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchUsers();
            }}
          />
          <Button variant="secondary" onClick={fetchUsers}>
            Search
          </Button>
          <Button onClick={handleCreate}>+ New User</Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-muted/40">
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
                  <td className="p-6 text-center text-muted-foreground" colSpan={5}>
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const name =
                    [u.profile?.firstName ?? "", u.profile?.lastName ?? ""].join(" ").trim() || "—";
                  return (
                    <tr key={u.id} className="border-t">
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{name}</td>
                      <td className="p-2 capitalize">{u.role ?? "user"}</td>
                      <td className="p-2 text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}
                      </td>
                      <td className="p-2">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleEdit(u)}
                            className="text-primary hover:underline"
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <UserModal user={editing} onClose={() => setIsModalOpen(false)} onSaved={fetchUsers} />
      )}
    </div>
  );
}

function UserModal(props: { user: AdminUser | null; onClose: () => void; onSaved: () => void }) {
  const { user, onClose, onSaved } = props;
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<AdminUser & { profile: Profile; password?: string }>(() => ({
    id: user ? user.id : "",
    email: user ? user.email : "",
    role: user ? user.role ?? "user" : "user",
    createdAt: user ? user.createdAt ?? null : null,
    defaultHomeId: user?.defaultHomeId ?? null,
    defaultHome: user?.defaultHome ?? null,
    profile: {
      firstName: user?.profile?.firstName ?? "",
      lastName: user?.profile?.lastName ?? "",
      timezone: user?.profile?.timezone ?? "",
      units: (user?.profile?.units as any) ?? "imperial",
      householdRole: (user?.profile?.householdRole as any) ?? "owner",
      diySkill: (user?.profile?.diySkill as any) ?? "beginner",
    },
    password: "",
  }));

  function setField<K extends keyof (AdminUser & { profile: Profile; password?: string })>(k: K, v: any) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }
  function setProfile<K extends keyof Profile>(k: K, v: any) {
    setForm((prev) => ({ ...prev, profile: { ...prev.profile, [k]: v } }));
  }

  async function save() {
    setSaving(true);
    try {
      if (user && user.id) {
        const body: any = { role: form.role ?? "user" };
        await api.put(`/admin/users/${user.id}`, body);
      } else {
        if (!form.email || !form.email.trim()) {
          alert("Email is required to create a user.");
          setSaving(false);
          return;
        }
        const payload: any = { email: form.email.trim(), role: form.role ?? "user" };
        if (form.password && form.password.length >= 6) {
          payload.password = form.password;
        }
        await api.post("/admin/users", payload);
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "New User"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            disabled={!!user}
            className="md:col-span-2"
          />

          {!user && (
            <Input
              type="password"
              placeholder="Password (min 6 chars)"
              value={form.password ?? ""}
              onChange={(e) => setField("password", e.target.value)}
              className="md:col-span-2"
            />
          )}

          <select
            value={form.role ?? "user"}
            onChange={(e) => setField("role", e.target.value)}
            className="border p-2 rounded-md bg-background"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>

          <Input
            placeholder="First name"
            value={form.profile.firstName ?? ""}
            onChange={(e) => setProfile("firstName", e.target.value)}
            disabled
            title="Profile editing not wired on the API yet"
          />
          <Input
            placeholder="Last name"
            value={form.profile.lastName ?? ""}
            onChange={(e) => setProfile("lastName", e.target.value)}
            disabled
            title="Profile editing not wired on the API yet"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || (!user && !form.email)}>
            {saving ? "Saving…" : user ? "Save" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
