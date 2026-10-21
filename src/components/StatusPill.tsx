import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DeviceStatus, VehicleStatus } from "@/types";

type Status = VehicleStatus | DeviceStatus;

const MAP: Record<Status, { label: string; className: string }> = {
  moving: {
    label: "Moving",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  stopped: {
    label: "Stopped",
    className:
      "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  idling: {
    label: "Idling",
    className:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300",
  },
  offline: {
    label: "Offline",
    className:
      "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300",
  },
  online: {
    label: "Online",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  unknown: {
    label: "Unknown",
    className:
      "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
};

export function StatusPill({ status }: { status: Status }) {
  const cfg = MAP[status] ?? MAP.unknown;
  return (
    <Badge variant="outline" className={cn("gap-1", cfg.className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {cfg.label}
    </Badge>
  );
}