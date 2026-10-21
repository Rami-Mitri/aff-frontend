import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Device, Driver, Vehicle, VehicleStatus } from "@/types";

interface Props {
  open: boolean;
  initial?: Vehicle | null;
  drivers: Driver[];
  devices: Device[];
  existingPlates: string[];
  onClose: () => void;
  onSave: (vehicle: Vehicle) => void;
}

interface FormState {
  name: string;
  plate: string;
  type: string;
  make: string;
  model: string;
  year: string;
  color: string;
  department: string;
  driverId: string;
  deviceId: string;
  status: VehicleStatus;
  active: boolean;
  notes: string;
}

const EMPTY: FormState = {
  name: "",
  plate: "",
  type: "Truck",
  make: "",
  model: "",
  year: "",
  color: "",
  department: "Distribution",
  driverId: "none",
  deviceId: "none",
  status: "offline",
  active: true,
  notes: "",
};

export function VehicleFormDialog({
  open,
  initial,
  drivers,
  devices,
  existingPlates,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name,
        plate: initial.plate,
        type: initial.type,
        make: initial.make,
        model: initial.model,
        year: initial.year ? String(initial.year) : "",
        color: initial.color ?? "",
        department: initial.department,
        driverId: initial.driverId ?? "none",
        deviceId: initial.deviceId ?? "none",
        status: initial.status,
        active: initial.active,
        notes: initial.notes ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [open, initial]);

  if (!open) return null;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Vehicle name is required.";
    if (!form.plate.trim()) next.plate = "Registration number is required.";
    else if (
      existingPlates
        .map((p) => p.toLowerCase())
        .includes(form.plate.trim().toLowerCase()) &&
      form.plate.trim().toLowerCase() !== initial?.plate.toLowerCase()
    )
      next.plate = "This registration number already exists.";
    if (!form.make.trim()) next.make = "Make is required.";
    if (!form.model.trim()) next.model = "Model is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const vehicle: Vehicle = {
      id: initial?.id ?? `v-${Date.now()}`,
      name: form.name.trim(),
      plate: form.plate.trim(),
      type: form.type,
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year ? Number(form.year) : undefined,
      color: form.color.trim() || undefined,
      department: form.department,
      driverId: form.driverId === "none" ? undefined : form.driverId,
      deviceId: form.deviceId === "none" ? undefined : form.deviceId,
      status: form.status,
      active: form.active,
      notes: form.notes.trim() || undefined,
      lat: initial?.lat,
      lng: initial?.lng,
      speed: initial?.speed,
      heading: initial?.heading,
      ignition: initial?.ignition,
      battery: initial?.battery,
      lastUpdate: initial?.lastUpdate,
    };
    onSave(vehicle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {initial ? "Edit Vehicle" : "Add Vehicle"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block">Vehicle Name</Label>
              <Input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. AFF-01 Distribution"
              />
              {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
            </div>
            <div>
              <Label className="mb-1 block">Registration Number</Label>
              <Input
                value={form.plate}
                onChange={(e) => update("plate", e.target.value)}
                placeholder="TRK-1001"
              />
              {errors.plate && <p className="mt-1 text-xs text-rose-600">{errors.plate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-1 block">Type</Label>
              <Select value={form.type} onValueChange={(v) => update("type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Truck", "Tanker", "Van", "Pickup", "Car", "Other"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Make</Label>
              <Input
                value={form.make}
                onChange={(e) => update("make", e.target.value)}
                placeholder="Isuzu"
              />
              {errors.make && <p className="mt-1 text-xs text-rose-600">{errors.make}</p>}
            </div>
            <div>
              <Label className="mb-1 block">Model</Label>
              <Input
                value={form.model}
                onChange={(e) => update("model", e.target.value)}
                placeholder="NPR"
              />
              {errors.model && <p className="mt-1 text-xs text-rose-600">{errors.model}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-1 block">Model Year</Label>
              <Input
                type="number"
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
                placeholder="2022"
              />
            </div>
            <div>
              <Label className="mb-1 block">Color</Label>
              <Input
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
                placeholder="White"
              />
            </div>
            <div>
              <Label className="mb-1 block">Department</Label>
              <Select value={form.department} onValueChange={(v) => update("department", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Distribution", "Supply", "Sales", "Maintenance", "Management"].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block">Assigned Driver</Label>
              <Select value={form.driverId} onValueChange={(v) => update("driverId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Assigned GPS Device</Label>
              <Select value={form.deviceId} onValueChange={(v) => update("deviceId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {devices.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} · {d.imei}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => update("status", v as VehicleStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moving">Moving</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                  <SelectItem value="idling">Idling</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Active</Label>
              <Select
                value={form.active ? "yes" : "no"}
                onValueChange={(v) => update("active", v === "yes")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Active</SelectItem>
                  <SelectItem value="no">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-1 block">Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
              {initial ? "Save Changes" : "Add Vehicle"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}