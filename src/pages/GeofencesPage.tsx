import { useState } from "react";
import { Hexagon, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LeafletMap } from "@/components/LeafletMap";
import { useFleetData } from "@/hooks/useFleetData";
import { api } from "@/services/api";
import type { Geofence } from "@/types";

interface Form { id: string; name: string; type: "circle" | "polygon"; lat: string; lng: string; radius: string; ring: string; active: boolean; vehicleIds: string[] }
const BLANK: Form = { id: "", name: "", type: "circle", lat: "", lng: "", radius: "200", ring: "", active: true, vehicleIds: [] };

function parseForm(f: Form): Geofence {
  if (!f.name.trim()) throw new Error("Name is required.");
  if (f.type === "circle") {
    const lat = Number(f.lat), lng = Number(f.lng), r = Number(f.radius);
    if (!f.lat || !f.lng || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error("Enter a valid latitude (-90..90) and longitude (-180..180).");
    if (!Number.isFinite(r) || r < 1 || r > 100000) throw new Error("Radius must be between 1 and 100000 metres.");
    return { id: f.id, name: f.name.trim(), type: "circle", centerLat: lat, centerLng: lng, radiusM: r, vehicleIds: f.vehicleIds, active: f.active, severity: "info" };
  }
  const ring = f.ring.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => l.split(/[,\s]+/).map(Number) as [number, number]);
  if (ring.length < 3 || ring.some((p) => p.length !== 2 || p.some((n) => !Number.isFinite(n)) || Math.abs(p[0]) > 90 || Math.abs(p[1]) > 180)) throw new Error("Polygon needs at least 3 lines of 'latitude, longitude'.");
  return { id: f.id, name: f.name.trim(), type: "polygon", centerLat: ring[0][0], centerLng: ring[0][1], ring, vehicleIds: f.vehicleIds, active: f.active, severity: "info" };
}

export function GeofencesPage() {
  const { geofences, vehicles, devices, refresh, error: loadError } = useFleetData();
  const [form, setForm] = useState<Form | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const trackable = vehicles.filter((v) => v.deviceId);

  const edit = (g: Geofence) =>
    setForm({ id: g.id, name: g.name, type: g.type, lat: String(g.centerLat), lng: String(g.centerLng), radius: String(g.radiusM ?? 200), ring: (g.ring ?? []).map((p) => p.join(", ")).join("\n"), active: g.active, vehicleIds: g.vehicleIds });

  const save = async () => {
    if (!form) return;
    setBusy(true); setErr(null);
    try {
      await api.saveGeofence(parseForm(form), devices);
      setForm(null);
      await refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not save the geofence."); }
    finally { setBusy(false); }
  };

  const remove = async (g: Geofence) => {
    if (!window.confirm(`Delete geofence “${g.name}”?`)) return;
    try { await api.deleteGeofence(g.id); await refresh(); } catch (e) { setErr(e instanceof Error ? e.message : "Could not delete."); }
  };

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <div className="space-y-6">
      {err && <ErrorBanner message={err} onDismiss={() => setErr(null)} />}
      {loadError && <ErrorBanner message={`${loadError} Showing the last data received.`} />}
      <PageHeader
        title="Geofences"
        subtitle="Zones that raise an alert when a tracked phone enters or leaves. Detected on the server from real GPS fixes."
        actions={
          <Button onClick={() => setForm({ ...BLANK })} className="gap-1.5 bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4" />
            New Geofence
          </Button>
        }
      />

      {form && (
        <Card className="border-teal-300 dark:border-teal-800">
          <CardHeader><CardTitle className="text-base">{form.id ? "Edit geofence" : "New geofence"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><Label className="mb-1 block">Name</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div>
                <Label className="mb-1 block">Shape</Label>
                <select className="h-9 w-full rounded-md border border-slate-300 bg-transparent px-2 text-sm dark:border-slate-700" value={form.type} onChange={(e) => set("type", e.target.value as Form["type"])}>
                  <option value="circle">Circle</option>
                  <option value="polygon">Polygon</option>
                </select>
              </div>
            </div>
            {form.type === "circle" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div><Label className="mb-1 block">Latitude</Label><Input inputMode="decimal" value={form.lat} onChange={(e) => set("lat", e.target.value)} placeholder="31.2001" /></div>
                <div><Label className="mb-1 block">Longitude</Label><Input inputMode="decimal" value={form.lng} onChange={(e) => set("lng", e.target.value)} placeholder="29.9187" /></div>
                <div><Label className="mb-1 block">Radius (m)</Label><Input inputMode="numeric" value={form.radius} onChange={(e) => set("radius", e.target.value)} /></div>
              </div>
            ) : (
              <div>
                <Label className="mb-1 block">Vertices (one “latitude, longitude” per line, at least 3)</Label>
                <textarea className="h-28 w-full rounded-md border border-slate-300 bg-transparent p-2 font-mono text-xs dark:border-slate-700" value={form.ring} onChange={(e) => set("ring", e.target.value)} />
              </div>
            )}
            <div>
              <Label className="mb-1 block">Applies to vehicles with a tracking device</Label>
              {trackable.length === 0 ? <p className="text-xs text-slate-500">No vehicle has a tracking device yet.</p> : (
                <div className="flex flex-wrap gap-3">
                  {trackable.map((v) => (
                    <label key={v.id} className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" checked={form.vehicleIds.includes(v.id)} onChange={(e) => set("vehicleIds", e.target.checked ? [...form.vehicleIds, v.id] : form.vehicleIds.filter((x) => x !== v.id))} />
                      {v.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Enabled (entry and exit alerts)</label>
            <div className="flex gap-2">
              <Button disabled={busy} onClick={() => void save()} className="bg-teal-600 hover:bg-teal-700">{busy ? "Saving…" : "Save"}</Button>
              <Button variant="outline" onClick={() => { setForm(null); setErr(null); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {geofences.length > 0 && <LeafletMap vehicles={vehicles} geofences={geofences} className="h-72" />}

      {geofences.length === 0 ? (
        <EmptyState icon={<Hexagon className="h-5 w-5" />} title="No geofences" description="Create a geofence to get alerts when a phone enters or leaves an area." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {geofences.map((g) => (
            <Card key={g.id} className="border-slate-200 shadow-sm dark:border-slate-800">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-base">{g.name}</CardTitle>
                <Badge variant="outline">{g.active ? "Active" : "Disabled"}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between"><span>Shape</span><span className="font-medium capitalize">{g.type}</span></div>
                <div className="flex justify-between"><span>{g.type === "circle" ? "Center" : "First vertex"}</span><span className="font-mono">{g.centerLat.toFixed(4)}, {g.centerLng.toFixed(4)}</span></div>
                {g.radiusM != null && <div className="flex justify-between"><span>Radius</span><span className="font-medium">{g.radiusM} m</span></div>}
                <div className="flex justify-between"><span>Vehicles</span><span className="font-medium">{g.vehicleIds.map((id) => vehicles.find((v) => v.id === id)?.name ?? id).join(", ") || "—"}</span></div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => edit(g)}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => void remove(g)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
