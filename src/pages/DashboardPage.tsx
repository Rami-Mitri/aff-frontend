import { Activity, AlertTriangle, Car, CircleDot, Gauge, MapPin, PauseCircle, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { BackendNotice } from "@/components/BackendNotice";
import { EmptyState } from "@/components/EmptyState";
import { useFleetData } from "@/hooks/useFleetData";

export function DashboardPage() {
  const { summary, alerts, trips, vehicles, loading, error, configured } = useFleetData();

  const stats = [
    { label: "Total Vehicles", value: summary.total, icon: Car, tint: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300" },
    { label: "Online", value: summary.online, icon: Wifi, tint: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
    { label: "Offline", value: summary.offline, icon: AlertTriangle, tint: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" },
    { label: "Moving", value: summary.moving, icon: Activity, tint: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" },
    { label: "Stopped", value: summary.stopped, icon: PauseCircle, tint: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    { label: "Idling", value: summary.idling, icon: Gauge, tint: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
    { label: "Active Alerts", value: summary.activeAlerts, icon: AlertTriangle, tint: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300" },
    { label: "Tracked Points", value: vehicles.filter((v) => v.lat != null).length, icon: MapPin, tint: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet Dashboard"
        subtitle="Live overview of your fleet status, alerts, and recent activity."
      />

      <BackendNotice />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-slate-200 shadow-sm dark:border-slate-800">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.tint}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {loading ? "—" : s.value}
                  </div>
                  <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {s.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-slate-200 shadow-sm lg:col-span-2 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Recent Trips</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {trips.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<MapPin className="h-5 w-5" />}
                  title={configured ? "No trips recorded" : "No trips yet"}
                  description={
                    configured
                      ? "Trips will appear here once vehicles begin reporting."
                      : "Add vehicles and trips to see them here."
                  }
                />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {trips.slice(0, 5).map((t) => {
                  const v = vehicles.find((x) => x.id === t.vehicleId);
                  return (
                    <li key={t.id} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {v?.name ?? t.vehicleId}
                        </div>
                        <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {t.startAddress} → {t.endAddress}
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                        <div className="font-semibold text-slate-700 dark:text-slate-200">
                          {t.distanceKm.toFixed(1)} km
                        </div>
                        <div>{t.durationMin} min</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {alerts.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<CircleDot className="h-5 w-5" />}
                  title="No alerts"
                  description="Alerts will appear here when events are detected."
                />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {alerts.slice(0, 5).map((a) => (
                  <li key={a.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
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
                      <span className="text-[11px] text-slate-400">
                        {new Date(a.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {a.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}