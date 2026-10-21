import { useEffect, useMemo, useState } from "react";
import { MapPin, Search, Gauge, Battery, Radio, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { BackendNotice } from "@/components/BackendNotice";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { useFleetData } from "@/hooks/useFleetData";
import { LeafletMap, DEFAULT_ATTRIBUTION, DEFAULT_TILE_URL } from "@/components/LeafletMap";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";
import type { VehicleStatus } from "@/types";

const FILTERS: { key: VehicleStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "moving", label: "Moving" },
  { key: "stopped", label: "Stopped" },
  { key: "idling", label: "Idling" },
  { key: "offline", label: "Offline" },
];

export function TrackingPage() {
  const { vehicles, geofences, loading, error } = useFleetData();
  const [tile, setTile] = useState({ url: DEFAULT_TILE_URL, attribution: DEFAULT_ATTRIBUTION });
  const [route, setRoute] = useState<[number, number][] | undefined>();
  const [routeMsg, setRouteMsg] = useState<string | null>(null);

  useEffect(() => {
    api.settings().then((st) => {
      if (typeof st.tile_url === "string") setTile({ url: st.tile_url, attribution: String(st.tile_attribution ?? DEFAULT_ATTRIBUTION) });
    }).catch(() => undefined); // keep the default OSM tiles if settings cannot be read
  }, []);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<VehicleStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      vehicles.filter((v) => {
        const matchesQ =
          v.name.toLowerCase().includes(q.toLowerCase()) ||
          v.plate.toLowerCase().includes(q.toLowerCase());
        const matchesF = filter === "all" || v.status === filter;
        return matchesQ && matchesF;
      }),
    [vehicles, q, filter]
  );

  const selected = vehicles.find((v) => v.id === selectedId) ?? null;

  const showRoute = async (deviceId: string) => {
    try {
      const h = await api.deviceHistory(deviceId, new Date(Date.now() - 24 * 3600 * 1000).toISOString());
      setRoute(h.items.length > 1 ? h.items.map((p): [number, number] => [p.lat, p.lng]) : undefined);
      setRouteMsg(h.items.length > 1 ? (h.truncated ? "Showing the first 5000 points of the period." : `${h.items.length} points`) : "No route recorded in the last 24 hours.");
    } catch (e) {
      setRouteMsg(e instanceof Error ? e.message : "Could not load the route.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Vehicle Tracking"
        subtitle="Real-time positions, status, and telemetry from connected GPS devices."
      />

      <BackendNotice error={error} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-slate-200 shadow-sm lg:col-span-2 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base">Map</CardTitle>
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <Button
                  key={f.key}
                  size="sm"
                  variant={filter === f.key ? "default" : "outline"}
                  className={cn(
                    "h-7 px-2 text-xs",
                    filter === f.key && "bg-teal-600 hover:bg-teal-700"
                  )}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <LeafletMap
              vehicles={filtered}
              geofences={geofences}
              selectedId={selectedId}
              onSelect={setSelectedId}
              route={route}
              tileUrl={tile.url}
              attribution={tile.attribution}
              className="h-[28rem]"
            />
            {!loading && vehicles.every((v) => v.lat == null) && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                No positions yet. Vehicles appear once an enrolled phone with tracking started reports a location.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">
              {selected ? selected.name : "Vehicle Details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selected ? (
              <EmptyState
                icon={<MapPin className="h-5 w-5" />}
                title="Select a vehicle"
                description="Choose a vehicle from the list to view its details."
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Status</span>
                  <StatusPill status={selected.status} />
                </div>
                <DetailRow label="Plate" value={selected.plate} />
                <DetailRow label="Type" value={`${selected.make} ${selected.model}`} />
                <DetailRow
                  label="Coordinates"
                  value={
                    selected.lat != null && selected.lng != null
                      ? `${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`
                      : "—"
                  }
                />
                <DetailRow
                  label="Speed"
                  value={selected.speed != null ? `${selected.speed} km/h` : "—"}
                  icon={<Gauge className="h-3.5 w-3.5" />}
                />
                <DetailRow label="Device status" value={(selected.deviceStatus ?? "no device").replace(/_/g, " ")} icon={<Radio className="h-3.5 w-3.5" />} />
                <DetailRow
                  label="Fix age"
                  value={selected.lastFixAgeS != null ? (selected.lastFixAgeS < 120 ? `${selected.lastFixAgeS}s` : `${Math.round(selected.lastFixAgeS / 60)} min`) : "—"}
                  icon={<Clock className="h-3.5 w-3.5" />}
                />
                <DetailRow label="GPS accuracy" value={selected.accuracy != null ? `±${Math.round(selected.accuracy)} m` : "—"} />
                <DetailRow
                  label="Battery"
                  value={selected.battery != null ? `${selected.battery}%` : "—"}
                  icon={<Battery className="h-3.5 w-3.5" />}
                />
                <DetailRow
                  label="Last Update"
                  value={
                    selected.lastUpdate
                      ? new Date(selected.lastUpdate).toLocaleString()
                      : "—"
                  }
                />
                {selected.deviceId && (
                  <div className="space-y-1 pt-1">
                    <Button size="sm" variant="outline" className="w-full" onClick={() => void showRoute(selected.deviceId!)}>
                      Show last 24 h route
                    </Button>
                    {route && (
                      <Button size="sm" variant="ghost" className="w-full" onClick={() => { setRoute(undefined); setRouteMsg(null); }}>
                        Hide route
                      </Button>
                    )}
                    {routeMsg && <p className="text-xs text-slate-500">{routeMsg}</p>}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

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
              placeholder="Search vehicle or plate..."
              className="ltr:pl-9 rtl:pr-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading vehicles…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<MapPin className="h-5 w-5" />}
                title="No vehicles"
                description="No vehicles match your filters, or none have been added yet."
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((v) => (
                <li key={v.id}>
                  <button
                    onClick={() => setSelectedId(v.id)}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40",
                      selectedId === v.id && "bg-teal-50/60 dark:bg-teal-500/5"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {v.name}
                      </div>
                      <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {v.plate} · {v.department}
                      </div>
                    </div>
                    <StatusPill status={v.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 dark:border-slate-800">
      <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </span>
      <span className="text-xs font-medium text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  );
}