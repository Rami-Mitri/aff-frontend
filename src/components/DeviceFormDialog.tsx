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
import type { Device, DeviceStatus, Vehicle } from "@/types";

interface Props {
  open: boolean;
  initial?: Device | null;
  vehicles: Vehicle[];
  existingImeis: string[];
  onClose: () => void;
  onSave: (device: Device) => void;
}

interface FormState {
  name: string;
  imei: string;
  provider: string;
  vehicleId: string;
  status: DeviceStatus;
  installedAt: string;
  notes: string;
}

const EMPTY: FormState = {
  name: "",
  imei: "",
  provider: "Android phone",
  vehicleId: "none",
  status: "unknown",
  installedAt: "",
  notes: "",
};

export function DeviceFormDialog({
  open,
  initial,
  vehicles,
  existingImeis,
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
        imei: initial.imei,
        provider: initial.provider,
        vehicleId: initial.vehicleId ?? "none",
        status: initial.status,
        installedAt: initial.installedAt ?? "",
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
    if (!form.name.trim()) next.name = "Device name is required.";
    const imei = form.imei.trim();
    if (imei && !/^\d{15}$/.test(imei)) next.imei = "IMEI must be exactly 15 digits (leave empty if unknown).";
    else if (
      imei &&
      existingImeis.map((i) => i.toLowerCase()).includes(imei.toLowerCase()) &&
      imei.toLowerCase() !== initial?.imei.toLowerCase()
    )
      next.imei = "This IMEI already exists.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const device: Device = {
      id: initial?.id ?? `dev-${Date.now()}`,
      name: form.name.trim(),
      imei: form.imei.trim(),
      provider: form.provider.trim(),
      vehicleId: form.vehicleId === "none" ? undefined : form.vehicleId,
      status: form.status,
      installedAt: form.installedAt || undefined,
      notes: form.notes.trim() || undefined,
      lastComm: initial?.lastComm,
    };
    onSave(device);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {initial ? "Edit Device" : "Add Device"}
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
          <div>
            <Label className="mb-1 block">Device Name</Label>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Teltonika FMB920"
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block">IMEI (optional)</Label>
              <Input
                value={form.imei}
                onChange={(e) => update("imei", e.target.value)}
                placeholder="356938035643809"
              />
              {errors.imei && <p className="mt-1 text-xs text-rose-600">{errors.imei}</p>}
            </div>
            <div>
              <Label className="mb-1 block">Provider</Label>
              <Select value={form.provider} onValueChange={(v) => update("provider", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Android phone"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block">Assigned Vehicle</Label>
              <Select value={form.vehicleId} onValueChange={(v) => update("vehicleId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} · {v.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => update("status", v as DeviceStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block">Installation Date</Label>
              <Input
                type="date"
                value={form.installedAt}
                onChange={(e) => update("installedAt", e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 block">Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
              {initial ? "Save Changes" : "Add Device"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}