import { useMemo, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { useFleetData } from "@/hooks/useFleetData";
import { api } from "@/services/api";
import { ErrorBanner } from "@/components/ErrorBanner";
import { cn } from "@/lib/utils";
import type { AlertItem, AlertSeverity } from "@/types";

const SEVERITIES: (AlertSeverity | "all")[] = ["all", "critical", "warning", "info"];

export function AlertsPage() {
  const { alerts, vehicles, refresh, error: loadError } = useFleetData();
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AlertSeverity | "all">("all");

  const filtered = useMemo(
    () => alerts.filter((a) => filter === "all" || a.severity === filter),
    [alerts, filter]
  );

  // The backend tracks acknowledgement only; "read" and "acknowledged" are the same server-side state.
  const acknowledge = async (id: string) => {
    try {
      await api.ackAlert(id);
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not acknowledge the alert.");
    }
  };
  const markRead = acknowledge;

  const vehicleName = (id?: string) =>
    id ? vehicles.find((v) => v.id === id)?.name ?? id : "—";

  return (
    <div className="space-y-6">
      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}
      {loadError && <ErrorBanner message={`${loadError} Showing the last data received.`} />}
      <PageHeader
        title="Alerts & Notifications"
        subtitle="Monitor fleet events, acknowledge alerts, and track history."
      />

      <div className="flex flex-wrap gap-1">
        {SEVERITIES.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            className={cn(
              "h-7 px-3 text-xs capitalize",
              filter === s && "bg-teal-600 hover:bg-teal-700"
            )}
            onClick={() => setFilter(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">
            Alerts <span className="text-slate-400">({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Bell className="h-5 w-5" />}
                title="No alerts"
                description="Alerts will appear here when events are detected."
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((a) => (
                <li
                  key={a.id}
                  className={cn(
                    "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                    !a.read && "bg-teal-50/40 dark:bg-teal-500/5"
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          a.severity === "critical"
                            ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
                            : a.severity === "warning"
                            ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
                            : "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }
                      >
                        {a.severity}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {vehicleName(a.vehicleId)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(a.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      {a.message}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!a.read && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs"
                        onClick={() => markRead(a.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Mark read
                      </Button>
                    )}
                    {!a.acknowledged && (
                      <Button
                        size="sm"
                        className="h-7 gap-1 bg-teal-600 text-xs hover:bg-teal-700"
                        onClick={() => acknowledge(a.id)}
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}