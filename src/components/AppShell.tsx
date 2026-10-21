import { useState } from "react";
import {
  LayoutDashboard,
  MapPin,
  Car,
  Radio,
  Users,
  Route,
  Hexagon,
  Bell,
  FileBarChart,
  ShieldCheck,
  Settings,
  ScrollText,
  DatabaseBackup,
  HelpCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PageKey } from "@/App";

interface Props {
  page: PageKey;
  onNavigate: (p: PageKey) => void;
  user: { name: string; email: string; role?: "super_admin" | "standard_user" };
  onLogout: () => void;
  children: React.ReactNode;
}

const NAV: { key: PageKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "tracking", label: "Live Tracking", icon: MapPin },
  { key: "vehicles", label: "Vehicles", icon: Car },
  { key: "devices", label: "GPS Devices", icon: Radio },
  { key: "drivers", label: "Drivers", icon: Users },
  { key: "trips", label: "Trip History", icon: Route },
  { key: "geofences", label: "Geofences", icon: Hexagon },
  { key: "alerts", label: "Alerts", icon: Bell },
  { key: "reports", label: "Reports", icon: FileBarChart },
  { key: "users", label: "Users & Permissions", icon: ShieldCheck },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "audit", label: "Audit Logs", icon: ScrollText },
  { key: "backup", label: "Backup & Restore", icon: DatabaseBackup },
  { key: "help", label: "Help & About", icon: HelpCircle },
];

const ADMIN_ONLY: PageKey[] = ["users", "audit", "backup"];

export function AppShell({ page, onNavigate, user, onLogout, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
      {NAV.filter((i) => user.role === "super_admin" || !ADMIN_ONLY.includes(i.key)).map((item) => {
        const Icon = item.icon;
        const active = page === item.key;
        return (
          <button
            key={item.key}
            onClick={() => {
              onNavigate(item.key);
              setMobileOpen(false);
            }}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-teal-500/15 text-teal-200"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 lg:flex">
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 font-bold text-teal-300">
            A
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">
              AFF Vehicle Tracking
            </div>
            <div className="truncate text-[11px] text-slate-400">
              Aromatic Flavours &amp; Fragrances
            </div>
          </div>
        </div>
        {nav}
        <div className="border-t border-slate-800 p-3">
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500/20 text-xs font-semibold text-teal-300">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-white">{user.name}</div>
              <div className="truncate text-[10px] text-slate-400">{user.email}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 flex w-64 flex-col bg-slate-900 ltr:left-0 rtl:right-0">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
              <div className="text-sm font-semibold text-white">AFF Tracking</div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-800"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {NAV.find((n) => n.key === page)?.label ?? "Dashboard"}
              </div>
              <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                AFF Vehicle Tracking App
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-medium text-teal-700 dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-300 sm:inline">
              Super Admin
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-700">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        <footer className="border-t border-slate-200 px-4 py-4 text-center text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:px-6">
          © 2026 Aromatic Flavours &amp; Fragrances. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
}