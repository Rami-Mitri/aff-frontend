import { HelpCircle, Info, Server, MapPin, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

export function HelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & About"
        subtitle="Application information, deployment guidance, and known limitations."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4 text-teal-600" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>
              <strong>AFF Vehicle Tracking App</strong> — a fleet management platform for
              Aromatic Flavours &amp; Fragrances.
            </p>
            <p>Owner / Administrator: Rami Metri</p>
            <p>Phone: 01222245865</p>
            <p>Email: RMetri@AF-F.com</p>
            <p className="text-xs text-slate-500">Version 1.0.0</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4 text-teal-600" />
              Deployment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>
              The frontend can be deployed to any static host (GitHub Pages, Netlify, Vercel).
              Set <span className="font-mono text-xs">VITE_API_BASE_URL</span> to point to the
              deployed FastAPI backend.
            </p>
            <p>
              The backend must run on a server with persistent writable storage for{" "}
              <span className="font-mono text-xs">aff_vehicle_tracking.sqlite</span>.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-teal-600" />
              GPS Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>
              Configure a GPS provider (e.g. Traccar) on the backend. Credentials are stored
              server-side and never exposed to the browser.
            </p>
            <p>
              Google Maps requires a restricted browser API key served by the backend. If the
              key is missing, a clear setup message is displayed.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-teal-600" />
              Known Limitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <ul className="list-disc space-y-1 pl-5">
              <li>All data lives on the server database. The browser only keeps your sign-in token.</li>
              <li>Real GPS tracking requires a deployed backend and configured provider.</li>
              <li>Browser background GPS is not reliable on mobile operating systems.</li>
              <li>Email/SMS notifications require configured external providers.</li>
              <li>SQLite is not recommended for high-concurrency write workloads.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
        <HelpCircle className="h-4 w-4" />
        © 2026 Aromatic Flavours &amp; Fragrances. All Rights Reserved.
      </div>
    </div>
  );
}