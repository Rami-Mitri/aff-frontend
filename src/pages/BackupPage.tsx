import { useCallback, useEffect, useState } from "react";
import { DatabaseBackup } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { ErrorBanner } from "@/components/ErrorBanner";
import { api } from "@/services/api";

export function BackupPage() {
  const [items, setItems] = useState<{ name: string; bytes: number }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await api.backups()); } catch (e) { setErr(e instanceof Error ? e.message : "Could not list backups."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    setBusy(true); setErr(null); setOk(null);
    try { const b = await api.createBackup(); setOk(`Backup created and verified: ${b.name}`); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Backup failed."); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      {err && <ErrorBanner message={err} onDismiss={() => setErr(null)} />}
      <PageHeader title="Backup & Restore" subtitle="Consistent snapshots of the live SQLite database, stored on the server outside the source repositories." />
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><DatabaseBackup className="h-4 w-4" />Create backup</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Button disabled={busy} onClick={() => void create()} className="bg-teal-600 hover:bg-teal-700">{busy ? "Backing up…" : "Back up now"}</Button>
          {ok && <p className="text-emerald-700 dark:text-emerald-300">{ok}</p>}
          <ul className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
            {items.length === 0 && <li className="py-2 text-slate-500">No backups yet.</li>}
            {items.slice().reverse().map((b) => <li key={b.name} className="flex justify-between py-2"><span className="font-mono">{b.name}</span><span>{(b.bytes / 1024).toFixed(0)} KB</span></li>)}
          </ul>
        </CardContent>
      </Card>
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader><CardTitle className="text-base">Restore</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>For safety, restoring is done on the server, not from the browser. Stop the API, then run:</p>
          <pre className="overflow-x-auto rounded bg-slate-100 p-2 text-xs dark:bg-slate-900">python3 -m app.cli restore backups/&lt;file&gt;.sqlite</pre>
          <p>The file is validated first and a safety backup of the current database is made before anything is replaced.</p>
        </CardContent>
      </Card>
    </div>
  );
}
