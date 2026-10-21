import { useMemo, useState } from "react";
import { Route, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { useFleetData } from "@/hooks/useFleetData";

export function TripsPage() {
  const { trips, vehicles } = useFleetData();
  const [vehicleId, setVehicleId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(
    () =>
      trips.filter((t) => {
        if (vehicleId !== "all" && t.vehicleId !== vehicleId) return false;
        if (from && new Date(t.startTime) < new Date(from)) return false;
        if (to && new Date(t.endTime) > new Date(to)) return false;
        return true;
      }),
    [trips, vehicleId, from, to]
  );

  const vehicleName = (id: string) => vehicles.find((v) => v.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trip History"
        subtitle="Review historical trips, distances, and durations. Values are shown only when supported by the data source."
      />

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label className="mb-1 block">Vehicle</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All vehicles</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block">From</Label>
            <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block">To</Label>
            <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">
            Trips <span className="text-slate-400">({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Route className="h-5 w-5" />}
                title="No trips found"
                description="Adjust filters or wait for vehicles to report trip data."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Vehicle</th>
                    <th className="px-4 py-3 font-medium">Route</th>
                    <th className="px-4 py-3 font-medium">Start</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Distance</th>
                    <th className="px-4 py-3 font-medium">Max / Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {vehicleName(t.vehicleId)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate">
                            {t.startAddress} → {t.endAddress}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {new Date(t.startTime).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {t.durationMin} min
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {t.distanceKm.toFixed(1)} km
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {t.maxSpeed} / {t.avgSpeed} km/h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}