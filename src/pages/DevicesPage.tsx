import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { Plus, Search, Radio, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatusPill } from "@/components/StatusPill";
import { DeviceFormDialog } from "@/components/DeviceFormDialog";
import { useFleetData } from "@/hooks/useFleetData";
import { api } from "@/services/api";
import { ErrorBanner } from "@/components/ErrorBanner";
import type { Device } from "@/types";

export function DevicesPage() {
  const { devices, vehicles, refresh, error: loadError } = useFleetData();
  const [actionError, setActionError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<{ name: string; token: string; expires: string } | null>(null);
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Device | null>(null);

  const filtered = useMemo(
    () =>
      devices.filter(
        (d) =>
          d.name.toLowerCase().includes(q.toLowerCase()) ||
          d.imei.includes(q) ||
          d.provider.toLowerCase().includes(q.toLowerCase())
      ),
    [devices, q]
  );

  const vehicleName = (id?: string) => {
    if (!id) return "Unassigned";
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.name} · ${v.plate}` : "Unassigned";
  };

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (d: Device) => {
    setEditing(d);
    setDialogOpen(true);
  };

  const fail = (e: unknown) => setActionError(e instanceof Error ? e.message : "The operation failed.");

  const handleSave = async (device: Device) => {
    try {
      const prev = devices.find((d) => d.id === device.id);
      const res = await api.saveDevice(device, prev);
      if (res.enrollmentToken) setEnrollment({ name: device.name, token: res.enrollmentToken, expires: res.enrollmentExpiresAt ?? "" });
      setDialogOpen(false);
      setEditing(null);
      await refresh();
    } catch (e) {
      fail(e);
    }
  };

  const reissue = async (d: Device) => {
    try {
      const t = await api.newEnrollmentToken(d.id);
      setEnrollment({ name: d.name, token: t.enrollment_token, expires: t.enrollment_expires_at });
    } catch (e) {
      fail(e);
    }
  };

  const revoke = async (d: Device) => {
    try {
      await api.revokeDevice(d.id);
      await refresh();
    } catch (e) {
      fail(e);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await api.retireDevice(pendingDelete.id);
      setPendingDelete(null);
      await refresh();
    } catch (e) {
      fail(e);
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}
      {loadError && <ErrorBanner message={`${loadError} Showing the last data received.`} />}
      {enrollment && (
        <Card className="border-teal-300 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/30">
          <CardContent className="space-y-2 pt-4 text-sm">
            <div className="font-semibold">Enrollment code for “{enrollment.name}”</div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Enter this one-time code, together with the server address{api.baseUrl ? ` (${api.baseUrl})` : ` (${window.location.origin})`}, in the AFF Tracker app on the phone. It works once and expires in 15 minutes. It will not be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="break-all rounded bg-white px-2 py-1 font-mono text-xs dark:bg-slate-900">{enrollment.token}</code>
              <Button size="sm" variant="outline" onClick={() => void navigator.clipboard?.writeText(enrollment.token)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEnrollment(null)}>Done</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <PageHeader
        title="GPS Device Management"
        subtitle="Register devices, assign them to vehicles, and monitor connectivity."
        actions={
          <Button onClick={openAdd} className="gap-1.5 bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4" />
            Add Device
          </Button>
        }
      />

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">
            Devices <span className="text-slate-400">({filtered.length})</span>
          </CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ltr:left-3 rtl:right-3" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, IMEI, provider..."
              className="ltr:pl-9 rtl:pr-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Radio className="h-5 w-5" />}
                title="No devices found"
                description="Add a GPS device to start tracking vehicles."
                action={
                  <Button onClick={openAdd} className="gap-1.5 bg-teal-600 hover:bg-teal-700">
                    <Plus className="h-4 w-4" />
                    Add Device
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Device</th>
                    <th className="px-4 py-3 font-medium">IMEI</th>
                    <th className="px-4 py-3 font-medium">Provider</th>
                    <th className="px-4 py-3 font-medium">Vehicle</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((d) => (
                    <tr
                      key={d.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {d.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {d.imei}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {d.provider}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {vehicleName(d.vehicleId)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={d.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {d.state !== "retired" && d.state !== "lost" && (
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => void reissue(d)}>
                              {d.state === "pending" ? "Enrollment code" : "Re-enroll"}
                            </Button>
                          )}
                          {d.state === "active" && (
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-rose-600" onClick={() => void revoke(d)}>
                              Revoke
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(d)}
                            aria-label="Edit device"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPendingDelete(d)}
                            aria-label="Retire device"
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <DeviceFormDialog
        open={dialogOpen}
        initial={editing}
        vehicles={vehicles}
        existingImeis={devices.map((d) => d.imei)}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete device?"
        message={
          pendingDelete
            ? `This will remove "${pendingDelete.name}" (${pendingDelete.imei}). This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}