import { useMemo, useState } from "react";
import { Plus, Search, Car, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatusPill } from "@/components/StatusPill";
import { VehicleFormDialog } from "@/components/VehicleFormDialog";
import { useFleetData } from "@/hooks/useFleetData";
import { api } from "@/services/api";
import { ErrorBanner } from "@/components/ErrorBanner";
import type { Vehicle } from "@/types";

export function VehiclesPage() {
  const { vehicles, drivers, devices, refresh, error: loadError } = useFleetData();
  const [actionError, setActionError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Vehicle | null>(null);

  const filtered = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          v.name.toLowerCase().includes(q.toLowerCase()) ||
          v.plate.toLowerCase().includes(q.toLowerCase()) ||
          v.department.toLowerCase().includes(q.toLowerCase())
      ),
    [vehicles, q]
  );

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setDialogOpen(true);
  };

  const fail = (e: unknown) => setActionError(e instanceof Error ? e.message : "The operation failed.");

  const handleSave = async (vehicle: Vehicle) => {
    try {
      await api.saveVehicle(vehicle, vehicles.find((v) => v.id === vehicle.id));
      setDialogOpen(false);
      setEditing(null);
      await refresh();
    } catch (e) {
      fail(e);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await api.archiveVehicle(pendingDelete.id);
      await refresh();
    } catch (e) {
      fail(e);
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}
      {loadError && <ErrorBanner message={`${loadError} Showing the last data received.`} />}
      <PageHeader
        title="Vehicle Management"
        subtitle="Register vehicles, assign drivers and GPS devices, and manage fleet records."
        actions={
          <Button onClick={openAdd} className="gap-1.5 bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        }
      />

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">
            Vehicles <span className="text-slate-400">({filtered.length})</span>
          </CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ltr:left-3 rtl:right-3" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, plate, department..."
              className="ltr:pl-9 rtl:pr-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Car className="h-5 w-5" />}
                title="No vehicles found"
                description="Add a vehicle to start managing your fleet."
                action={
                  <Button onClick={openAdd} className="gap-1.5 bg-teal-600 hover:bg-teal-700">
                    <Plus className="h-4 w-4" />
                    Add Vehicle
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Vehicle</th>
                    <th className="px-4 py-3 font-medium">Plate</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((v) => (
                    <tr
                      key={v.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {v.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {v.plate}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {v.make} {v.model}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {v.department}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={v.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(v)}
                            aria-label="Edit vehicle"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPendingDelete(v)}
                            aria-label="Delete vehicle"
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

      <VehicleFormDialog
        open={dialogOpen}
        initial={editing}
        drivers={drivers}
        devices={devices}
        existingPlates={vehicles.map((v) => v.plate)}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete vehicle?"
        message={
          pendingDelete
            ? `This will remove "${pendingDelete.name}" (${pendingDelete.plate}). This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}