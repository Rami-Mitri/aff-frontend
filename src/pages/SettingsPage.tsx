import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { ErrorBanner } from "@/components/ErrorBanner";
import { api } from "@/services/api";

type Kind = "text" | "number" | "nullable-number";
const FIELDS: { key: string; label: string; hint: string; kind: Kind }[] = [
  { key: "app_name", label: "Application name", hint: "Shown in the interface.", kind: "text" },
  { key: "timezone", label: "Display timezone", hint: "IANA name, e.g. Africa/Cairo. Data is always stored in UTC.", kind: "text" },
  { key: "gps_interval_s", label: "GPS reporting interval (s)", hint: "How often phones record a location (min 2). Lower = more battery.", kind: "number" },
  { key: "stale_after_s", label: "Stale location after (s)", hint: "A fix older than this is shown as stale, not live.", kind: "number" },
  { key: "offline_after_s", label: "Offline after (s)", hint: "No heartbeat or upload for this long = offline.", kind: "number" },
  { key: "low_battery_pct", label: "Low battery alert (%)", hint: "", kind: "number" },
  { key: "speed_limit_kmh", label: "Speed alert (km/h)", hint: "Leave empty to disable.", kind: "nullable-number" },
  { key: "max_accuracy_m", label: "Ignore fixes less accurate than (m)", hint: "Used for geofences and trips.", kind: "number" },
  { key: "trip_stop_after_s", label: "Trip ends after standing still (s)", hint: "", kind: "number" },
  { key: "trip_min_move_m", label: "Minimum trip distance (m)", hint: "Shorter movements are treated as GPS noise.", kind: "number" },
  { key: "retention_days", label: "Keep GPS history (days)", hint: "0 = keep forever. Older points are deleted by the server once a day-sweep runs.", kind: "number" },
  { key: "tile_url", label: "Map tile URL", hint: "https with {z}/{x}/{y}. Public OSM tiles have a usage policy; use your own tile server for large fleets.", kind: "text" },
  { key: "tile_attribution", label: "Map attribution", hint: "Required by most tile providers.", kind: "text" },
];

export function SettingsPage() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [admin, setAdmin] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.settings(), api.me()])
      .then(([s, me]) => {
        setVals(Object.fromEntries(FIELDS.map((f) => [f.key, s[f.key] == null ? "" : String(s[f.key])])));
        setAdmin(me.role === "super_admin");
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load settings."));
  }, []);

  const save = async () => {
    setBusy(true); setErr(null); setSaved(false);
    try {
      const body: Record<string, unknown> = {};
      for (const f of FIELDS) {
        const v = (vals[f.key] ?? "").trim();
        if (f.kind === "text") body[f.key] = v;
        else if (v === "" && f.kind === "nullable-number") body[f.key] = null;
        else if (v === "" || !Number.isFinite(Number(v))) throw new Error(`${f.label} must be a number.`);
        else body[f.key] = Number(v);
      }
      const res = await api.saveSettings(body); // only shows success after the server accepted and stored it
      setVals(Object.fromEntries(FIELDS.map((f) => [f.key, res[f.key] == null ? "" : String(res[f.key])])));
      setSaved(true);
    } catch (e) { setErr(e instanceof Error ? e.message : "Saving failed."); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      {err && <ErrorBanner message={err} onDismiss={() => setErr(null)} />}
      <PageHeader title="Settings" subtitle={admin ? "Stored on the server; phones pick up the reporting interval on their next sync." : "Read-only. Only Super Admins can change settings."} />
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader><CardTitle className="text-base">System settings</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <Label className="mb-1 block">{f.label}</Label>
              <Input disabled={!admin} value={vals[f.key] ?? ""} onChange={(e) => { setSaved(false); setVals({ ...vals, [f.key]: e.target.value }); }} />
              {f.hint && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{f.hint}</p>}
            </div>
          ))}
          {admin && (
            <div className="md:col-span-2 flex items-center gap-3">
              <Button disabled={busy} onClick={() => void save()} className="bg-teal-600 hover:bg-teal-700">{busy ? "Saving…" : "Save settings"}</Button>
              {saved && <span className="text-sm text-emerald-700 dark:text-emerald-300">Saved on the server.</span>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
