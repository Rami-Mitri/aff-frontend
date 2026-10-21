import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppShell } from "@/components/AppShell";
import { LoginScreen } from "@/components/LoginScreen";
import { DashboardPage } from "@/pages/DashboardPage";
import { TrackingPage } from "@/pages/TrackingPage";
import { VehiclesPage } from "@/pages/VehiclesPage";
import { DevicesPage } from "@/pages/DevicesPage";
import { DriversPage } from "@/pages/DriversPage";
import { AlertsPage } from "@/pages/AlertsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TripsPage } from "@/pages/TripsPage";
import { GeofencesPage } from "@/pages/GeofencesPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { UsersPage } from "@/pages/UsersPage";
import { AuditPage } from "@/pages/AuditPage";
import { BackupPage } from "@/pages/BackupPage";
import { HelpPage } from "@/pages/HelpPage";

export type PageKey =
  | "dashboard"
  | "tracking"
  | "vehicles"
  | "devices"
  | "drivers"
  | "trips"
  | "geofences"
  | "alerts"
  | "reports"
  | "users"
  | "settings"
  | "audit"
  | "backup"
  | "help";

interface Session {
  name: string;
  email: string;
  role: "super_admin" | "standard_user";
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(api.hasToken());
  const [page, setPage] = useState<PageKey>("dashboard");

  // Restore a session only if the server confirms the stored token is still valid.
  useEffect(() => {
    if (!api.hasToken()) return;
    api
      .me()
      .then((u) => setSession({ name: u.name, email: u.email, role: u.role }))
      .catch(() => setSession(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setSession(null);
    window.addEventListener("aff:unauthorized", onUnauthorized);
    return () => window.removeEventListener("aff:unauthorized", onUnauthorized);
  }, []);

  const handleAuth = async (name: string, email: string) => {
    try {
      const u = await api.me();
      setSession({ name: u.name, email: u.email, role: u.role });
    } catch {
      setSession({ name, email, role: "standard_user" });
    }
  };

  const handleLogout = () => {
    void api.logout().catch(() => undefined);
    setSession(null);
    setPage("dashboard");
  };

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Checking session…</div>;
  }

  if (!session) {
    return <LoginScreen onAuthenticated={handleAuth} />;
  }

  return (
    <AppShell
      page={page}
      onNavigate={setPage}
      user={session}
      onLogout={handleLogout}
    >
      <ErrorBoundary key={page}>
      {page === "dashboard" && <DashboardPage />}
      {page === "tracking" && <TrackingPage />}
      {page === "vehicles" && <VehiclesPage />}
      {page === "devices" && <DevicesPage />}
      {page === "drivers" && <DriversPage />}
      {page === "trips" && <TripsPage />}
      {page === "geofences" && <GeofencesPage />}
      {page === "alerts" && <AlertsPage />}
      {page === "reports" && <ReportsPage />}
      {page === "users" && session.role === "super_admin" && <UsersPage />}
      {page === "settings" && <SettingsPage />}
      {page === "audit" && session.role === "super_admin" && <AuditPage />}
      {page === "backup" && session.role === "super_admin" && <BackupPage />}
      {page === "help" && <HelpPage />}
      </ErrorBoundary>
    </AppShell>
  );
}