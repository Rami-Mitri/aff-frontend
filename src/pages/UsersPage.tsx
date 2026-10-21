import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { ErrorBanner } from "@/components/ErrorBanner";
import { api } from "@/services/api";
import type { AppUser } from "@/types";

export function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "standard_user" as AppUser["role"] });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setUsers(await api.users()); } catch (e) { setErr(e instanceof Error ? e.message : "Could not load users."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    setBusy(true); setErr(null);
    try {
      if (form.password.length < 12) throw new Error("Password must be at least 12 characters.");
      await api.createUser(form);
      setForm({ email: "", name: "", password: "", role: "standard_user" });
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not create the user."); }
    finally { setBusy(false); }
  };

  const toggle = async (u: AppUser) => {
    try { await api.setUserActive(u.id, !u.active); await load(); } catch (e) { setErr(e instanceof Error ? e.message : "Could not update the user."); }
  };

  return (
    <div className="space-y-6">
      {err && <ErrorBanner message={err} onDismiss={() => setErr(null)} />}
      <PageHeader title="Users & Permissions" subtitle="Super Admins manage everything; Standard Users get read access and can acknowledge alerts. Enforced by the server." />
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader><CardTitle className="text-base">Add user</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <div><Label className="mb-1 block">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="mb-1 block">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label className="mb-1 block">Password (12+)</Label><Input type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div>
            <Label className="mb-1 block">Role</Label>
            <select className="h-9 w-full rounded-md border border-slate-300 bg-transparent px-2 text-sm dark:border-slate-700" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AppUser["role"] })}>
              <option value="standard_user">Standard User</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div className="flex items-end"><Button disabled={busy || !form.email || !form.name} onClick={() => void create()} className="w-full bg-teal-600 hover:bg-teal-700">Create</Button></div>
        </CardContent>
      </Card>
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardContent className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">{u.name}</div>
                <div className="truncate text-xs text-slate-500">{u.email} · {u.role === "super_admin" ? "Super Admin" : "Standard User"}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => void toggle(u)}>{u.active ? "Deactivate" : "Activate"}</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
