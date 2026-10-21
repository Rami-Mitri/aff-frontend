import { useCallback, useEffect, useRef, useState } from "react";
import { api, type FleetBundle } from "@/services/api";
import type { AlertItem, AuditEntry, DashboardSummary, Device, Driver, Geofence, Trip, Vehicle } from "@/types";

export interface FleetDataState {
  loading: boolean;
  /** Last load error. Previously loaded data stays visible while this is set; it is never replaced by fake data. */
  error: string | null;
  configured: boolean;
  source: "backend";
  vehicles: Vehicle[];
  devices: Device[];
  drivers: Driver[];
  trips: Trip[];
  geofences: Geofence[];
  alerts: AlertItem[];
  audit: AuditEntry[];
  summary: DashboardSummary;
  counts: Record<string, number>;
  lastUpdated: string | null;
  refresh: () => Promise<void>;
}

const EMPTY: FleetBundle = { vehicles: [], devices: [], drivers: [], trips: [], geofences: [], alerts: [], audit: [], counts: {}, serverTime: "" };
const POLL_MS = 10_000;

function summarize(b: FleetBundle): DashboardSummary {
  const v = b.vehicles.filter((x) => x.active);
  return {
    total: v.length,
    online: v.filter((x) => x.status !== "offline").length,
    offline: v.filter((x) => x.status === "offline").length,
    moving: v.filter((x) => x.status === "moving").length,
    stopped: v.filter((x) => x.status === "stopped").length,
    idling: 0, // idling needs ignition data, which phones do not provide
    activeAlerts: b.alerts.filter((a) => !a.acknowledged).length,
  };
}

export function useFleetData(): FleetDataState {
  const [bundle, setBundle] = useState<FleetBundle>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const b = await api.loadFleet();
      if (!alive.current) return;
      setBundle(b);
      setError(null);
      setLastUpdated(b.serverTime);
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : "Failed to load fleet data.");
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void refresh();
    const t = window.setInterval(() => { if (!document.hidden) void refresh(); }, POLL_MS);
    return () => { alive.current = false; window.clearInterval(t); };
  }, [refresh]);

  return { loading, error, configured: true, source: "backend", ...bundle, summary: summarize(bundle), lastUpdated, refresh };
}
