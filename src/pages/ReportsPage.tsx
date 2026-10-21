import { useMemo, useState } from "react";
import { FileBarChart, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

function escapeCsv(value: string): string {
  // Neutralise spreadsheet formulas (CSV injection), then quote when needed.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function ReportsPage() {
  const { vehicles, trips, alerts, devices } = useFleetData();
  const [type, setType] = useState("fleet");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = useMemo(() => {
    if (type === "fleet") {
      return vehicles.map((v) => ({
        Vehicle: v.name,
        Plate: v.plate,
        Status: v.status,
        Department: v.department,
        LastUpdate: v.lastUpdate ?? "—",
      }));
    }
    if (type === "trips") {
      return trips
        .filter((t) => {
          if (from && new Date(t.startTime) < new Date(from)) return false;
          if (to && new Date(t.endTime) > new Date(to)) return false;
          return true;
        })
        .map((t) => ({
          Vehicle: vehicles.find((v) => v.id === t.vehicleId)?.name ?? t.vehicleId,
          Start: t.startTime,
          End: t.endTime,
          DistanceKm: String(t.distanceKm),
          DurationMin: String(t.durationMin),
        }));
    }
    if (type === "alerts") {
      return alerts.map((a) => ({
        Severity: a.severity,
        Type: a.type,
        Vehicle: a.vehicleId ?? "—",
        Message: a.message,
        CreatedAt: a.createdAt,
      }));
    }
    return devices.map((d) => ({
      Device: d.name,
      IMEI: d.imei,
      Provider: d.provider,
      Status: d.status,
      LastComm: d.lastComm ?? "—",
    }));
  }, [type, vehicles, trips, alerts, devices, from, to]);

  const exportCsv = () => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const lines = [
      headers.map(escapeCsv).join(","),
      ...rows.map((r) =>
        headers.map((h) => escapeCsv(String((r as Record<string, string>)[h] ?? ""))).join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aff-${type}-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Exports"
        subtitle="Generate reports from real retrieved data. Empty datasets are handled gracefully."
        actions={
          <Button
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="gap-1.5 bg-teal-600 hover:bg-teal-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Report Options</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label className="mb-1 block">Report Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fleet">Fleet Status</SelectItem>
                <SelectItem value="trips">Trip History</SelectItem>
                <SelectItem value="alerts">Alert History</SelectItem>
                <SelectItem value="devices">Device Connectivity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">
            Preview <span className="text-slate-400">({rows.length} rows)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<FileBarChart className="h-5 w-5" />}
                title="No data for this report"
                description="Adjust filters or wait for data to become available."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                  <tr>
                    {Object.keys(rows[0]).map((h) => (
                      <th key={h} className="px-4 py-3 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      {Object.values(r).map((v, j) => (
                        <td
                          key={j}
                          className="px-4 py-3 text-slate-600 dark:text-slate-300"
                        >
                          {String(v)}
                        </td>
                      ))}
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