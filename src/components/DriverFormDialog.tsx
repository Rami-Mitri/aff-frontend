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
import type { Driver, Vehicle } from "@/types";

interface Props {
  open: boolean;
  initial?: Driver | null;
  vehicles: Vehicle[];
  onClose: () => void;
  onSave: (driver: Driver) => void;
}

interface FormState {
  name: string;
  employeeNo: string;
  phone: string;
  licenseNo: string;
  licenseExpiry: string;
  vehicleId: string;
  notes: string;
  active: boolean;
}

const EMPTY: FormState = {
  name: "",
  employeeNo: "",
  phone: "",
  licenseNo: "",
  licenseExpiry: "",
  vehicleId: "none",
  notes: "",
  active: true,
};

export function DriverFormDialog({ open, initial, vehicles, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name,
        employeeNo: initial.employeeNo ?? "",
        phone: initial.phone,
        licenseNo: initial.licenseNo ?? "",
        licenseExpiry: initial.licenseExpiry ?? "",
        vehicleId: initial.vehicleId ?? "none",
        notes: initial.notes ?? "",
        active: initial.active,
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
    if (!form.name.trim()) next.name = "Full name is required.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    else if (!/^[+\d][\d\s\-()]{5,}$/.test(form.phone.trim()))
      next.phone = "Enter a valid phone number.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const driver: Driver = {
      id: initial?.id ?? `d-${Date.now()}`,
      name: form.name.trim(),
      employeeNo: form.employeeNo.trim() || undefined,
      phone: form.phone.trim(),
      licenseNo: form.licenseNo.trim() || undefined,
      licenseExpiry: form.licenseExpiry || undefined,
      vehicleId: form.vehicleId === "none" ? undefined : form.vehicleId,
      notes: form.notes.trim() || undefined,
      active: form.active,
    };
    onSave(driver);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {initial ? "Edit Driver" : "Add Driver"}
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
            <Label className="mb-1 block">Full Name</Label>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Hassan Khoury"
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block">Employee No</Label>
              <Input
                value={form.employeeNo}
                onChange={(e) => update("employeeNo", e.target.value)}
                placeholder="EMP-001"
              />
            </div>
            <div>
              <Label className="mb-1 block">Phone Number</Label>
              <Input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+961 71 100 100"
              />
              {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block">License No</Label>
              <Input
                value={form.licenseNo}
                onChange={(e) => update("licenseNo", e.target.value)}
                placeholder="LB-1001"
              />
            </div>
            <div>
              <Label className="mb-1 block">License Expiry</Label>
              <Input
                type="date"
                value={form.licenseExpiry}
                onChange={(e) => update("licenseExpiry", e.target.value)}
              />
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
                value={form.active ? "active" : "inactive"}
                onValueChange={(v) => update("active", v === "active")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
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
              {initial ? "Save Changes" : "Add Driver"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}