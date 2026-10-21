import type {
  AlertItem, AlertType, AppUser, AuditEntry, Device, DeviceStatus, Driver, Geofence, Trip, Vehicle, VehicleStatus,
} from "@/types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Empty VITE_API_BASE_URL means same-origin (frontend served behind the same reverse proxy as the API). */
const BASE = ((import.meta.env?.VITE_API_BASE_URL as string | undefined) ?? "").replace(/\/$/, "");
const TOKEN_KEY = "aff.token";
const MOVING_MPS = 1.5;

function token(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

async function raw(path: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection and the API address.", 0);
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { const b = await res.json(); if (b?.error) msg = String(b.error); } catch { /* not JSON */ }
    if (res.status === 401 && path !== "/api/auth/login") {
      try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
      window.dispatchEvent(new Event("aff:unauthorized"));
    }
    throw new ApiError(msg, res.status);
  }
  return res;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await raw(path, init);
  return (await res.json()) as T;
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

// ---- backend wire types ----
interface BFix { lat: number; lng: number; accuracy_m: number | null; speed_mps: number | null; heading_deg: number | null; battery: number | null; captured_at: string }
interface BDevice { id: string; name: string; state: string; status: string; imei?: string | null; last_seen_at: string | null; last_battery: number | null; created_at: string; last_fix: BFix | null; last_fix_age_s: number | null; vehicle_id: string | null; driver_id: string | null }
interface BVehicle { id: string; registration_no: string; name: string | null; vehicle_type: string | null; department: string | null; make: string | null; model: string | null; year: number | null; color: string | null; status: string; notes: string | null }
interface BDriver { id: string; full_name: string; employee_no: string | null; phone?: string | null; license_no?: string | null; license_expiry?: string | null; status: string; notes?: string | null }
interface BTrip { device_id: string; vehicle_id: string | null; start_at: string; end_at: string; duration_s: number; start_lat: number; start_lng: number; end_lat: number; end_lng: number; distance_m_est: number; avg_speed_mps_est: number | null; max_speed_mps: number }
interface BFence { id: string; name: string; kind: "circle" | "polygon"; geometry: { lat?: number; lng?: number; radius_m?: number; ring?: [number, number][] }; enabled: number; device_ids: string[] }
interface BAlert { id: string; type: string; severity: "info" | "warning" | "critical"; device_id: string | null; message: string; created_at: string; acknowledged_at: string | null }
interface BAudit { id: number; ts: string; actor_user_id: string | null; actor_device_id: string | null; action: string; target: string | null; outcome: string }
interface BUser { id: string; email: string; name: string; role: AppUser["role"]; active: number }
interface Page<T> { items: T[]; total: number }

async function listAll<T>(path: string): Promise<T[]> {
  const out: T[] = [];
  const sep = path.includes("?") ? "&" : "?";
  for (let offset = 0, i = 0; i < 100; i++) {
    const p = await request<Page<T>>(`${path}${sep}limit=200&offset=${offset}`);
    out.push(...p.items);
    offset += p.items.length;
    if (p.items.length === 0 || offset >= p.total) break;
  }
  return out;
}

// ---- adapters (backend -> existing UI types) ----
function vehicleStatus(dev: BDevice | undefined): VehicleStatus {
  if (!dev || dev.status !== "reporting") return "offline";
  return (dev.last_fix?.speed_mps ?? 0) >= MOVING_MPS ? "moving" : "stopped";
}

function toDevice(d: BDevice): Device {
  const status: DeviceStatus = d.status === "not_enrolled" ? "unknown" : d.status === "offline" || d.status === "inactive" ? "offline" : "online";
  return { id: d.id, name: d.name, imei: d.imei ?? "", provider: "Android phone", vehicleId: d.vehicle_id ?? undefined, status, lastComm: d.last_seen_at ?? undefined, installedAt: d.created_at, state: d.state, statusDetail: d.status };
}

function toVehicle(v: BVehicle, dev: BDevice | undefined): Vehicle {
  const f = dev?.last_fix;
  return {
    id: v.id, name: v.name || [v.make, v.model].filter(Boolean).join(" ") || v.registration_no, plate: v.registration_no,
    type: v.vehicle_type ?? "", make: v.make ?? "", model: v.model ?? "", year: v.year ?? undefined, color: v.color ?? undefined,
    department: v.department ?? "", driverId: dev?.driver_id ?? undefined, deviceId: dev?.id, status: vehicleStatus(dev),
    active: v.status === "active", notes: v.notes ?? undefined,
    lat: f?.lat, lng: f?.lng, speed: f?.speed_mps != null ? Math.round(f.speed_mps * 3.6) : undefined, heading: f?.heading_deg ?? undefined,
    battery: dev?.last_battery ?? undefined, lastUpdate: f?.captured_at, deviceStatus: dev?.status, lastFixAgeS: dev?.last_fix_age_s ?? undefined, accuracy: f?.accuracy_m ?? undefined,
  };
}

function toDriver(d: BDriver, devs: BDevice[]): Driver {
  const dev = devs.find((x) => x.driver_id === d.id);
  return { id: d.id, name: d.full_name, employeeNo: d.employee_no ?? undefined, phone: d.phone ?? "", licenseNo: d.license_no ?? undefined, licenseExpiry: d.license_expiry ?? undefined, vehicleId: dev?.vehicle_id ?? undefined, notes: d.notes ?? undefined, active: d.status === "active" };
}

const ALERT_TYPES: Record<string, AlertType> = { geofence_enter: "geofence_enter", geofence_exit: "geofence_exit", speed: "overspeed", device_offline: "device_offline", stale_location: "stale_data" };

function toAlert(a: BAlert, devs: BDevice[]): AlertItem {
  const ack = a.acknowledged_at != null;
  return { id: a.id, type: ALERT_TYPES[a.type] ?? "system", severity: a.severity, vehicleId: devs.find((d) => d.id === a.device_id)?.vehicle_id ?? undefined, message: a.message, createdAt: a.created_at, read: ack, acknowledged: ack };
}

function toFence(g: BFence, devs: BDevice[]): Geofence {
  const vehicleIds = g.device_ids.map((id) => devs.find((d) => d.id === id)?.vehicle_id).filter((x): x is string => !!x);
  const ring = g.geometry.ring;
  const c = ring && ring.length ? [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length] : [g.geometry.lat ?? 0, g.geometry.lng ?? 0];
  return { id: g.id, name: g.name, type: g.kind, centerLat: c[0], centerLng: c[1], radiusM: g.geometry.radius_m, ring, vehicleIds, active: !!g.enabled, severity: "info" };
}

const coord = (lat: number, lng: number) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
function toTrip(t: BTrip): Trip {
  return {
    id: `${t.device_id}:${t.start_at}`, vehicleId: t.vehicle_id ?? "", startTime: t.start_at, endTime: t.end_at,
    startAddress: coord(t.start_lat, t.start_lng), endAddress: coord(t.end_lat, t.end_lng),
    distanceKm: Math.round(t.distance_m_est / 10) / 100, maxSpeed: Math.round(t.max_speed_mps * 3.6),
    avgSpeed: Math.round((t.avg_speed_mps_est ?? 0) * 3.6), durationMin: Math.round(t.duration_s / 60),
  };
}

export interface FleetBundle {
  vehicles: Vehicle[]; devices: Device[]; drivers: Driver[]; trips: Trip[]; geofences: Geofence[]; alerts: AlertItem[]; audit: AuditEntry[];
  counts: Record<string, number>; serverTime: string;
}

async function optionalAdmin<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch (e) { if (e instanceof ApiError && e.status === 403) return fallback; throw e; }
}

export const api = {
  baseUrl: BASE,
  isConfigured: () => true,
  hasToken: () => token() !== null,

  login: async (email: string, password: string) => {
    const res = await request<{ user: AppUser; token: string }>("/api/auth/login", json("POST", { email, password }));
    try { localStorage.setItem(TOKEN_KEY, res.token); } catch { throw new ApiError("Browser storage is blocked; cannot keep you signed in.", 0); }
    return res;
  },
  logout: async () => {
    try { await request<void>("/api/auth/logout", json("POST")); } finally { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } }
  },
  me: () => request<AppUser>("/api/auth/me"),

  /** One consistent snapshot of everything the pages need. Throws on failure; never substitutes local data. */
  loadFleet: async (): Promise<FleetBundle> => {
    const [cur, vehicles, drivers, trips, fences, alerts, audit, users] = await Promise.all([
      request<{ items: BDevice[]; counts: Record<string, number>; server_time: string }>("/api/locations/current?limit=5000"),
      listAll<BVehicle>("/api/vehicles?include_archived=1"),
      listAll<BDriver>("/api/drivers"),
      request<{ items: BTrip[] }>("/api/trips"),
      request<{ items: BFence[] }>("/api/geofences"),
      listAll<BAlert>("/api/alerts"),
      optionalAdmin(request<Page<BAudit>>("/api/audit?limit=200"), { items: [], total: 0 }),
      optionalAdmin(request<{ items: BUser[] }>("/api/users"), { items: [] }),
    ]);
    const devs = cur.items;
    const names = new Map(users.items.map((u) => [u.id, u.email]));
    return {
      vehicles: vehicles.map((v) => toVehicle(v, devs.find((d) => d.vehicle_id === v.id))),
      devices: devs.map(toDevice), drivers: drivers.map((d) => toDriver(d, devs)), trips: trips.items.map(toTrip),
      geofences: fences.items.map((g) => toFence(g, devs)), alerts: alerts.map((a) => toAlert(a, devs)),
      audit: audit.items.map((a) => ({ id: String(a.id), actor: (a.actor_user_id && names.get(a.actor_user_id)) || a.actor_user_id || (a.actor_device_id ? `device:${a.actor_device_id.slice(0, 8)}` : "system"), action: a.action + (a.outcome !== "ok" ? ` (${a.outcome})` : ""), target: a.target ?? "", timestamp: a.ts, ip: "" })),
      counts: cur.counts, serverTime: cur.server_time,
    };
  },

  // ---- devices ----
  saveDevice: async (d: Device, prev?: Device): Promise<{ enrollmentToken?: string; enrollmentExpiresAt?: string; id: string }> => {
    const imei = d.imei.trim() || null;
    if (!prev) {
      const res = await request<{ device: { id: string }; enrollment_token: string; enrollment_expires_at: string }>("/api/devices", json("POST", { name: d.name, imei }));
      if (d.vehicleId) await request("/api/devices/" + res.device.id + "/assign", json("POST", { vehicle_id: d.vehicleId, driver_id: null }));
      return { id: res.device.id, enrollmentToken: res.enrollment_token, enrollmentExpiresAt: res.enrollment_expires_at };
    }
    await request(`/api/devices/${d.id}`, json("PATCH", { name: d.name, imei }));
    if ((d.vehicleId ?? null) !== (prev.vehicleId ?? null)) await request(`/api/devices/${d.id}/assign`, json("POST", { vehicle_id: d.vehicleId ?? null, driver_id: null }));
    return { id: d.id };
  },
  newEnrollmentToken: (id: string) => request<{ enrollment_token: string; enrollment_expires_at: string }>(`/api/devices/${id}/enrollment-token`, json("POST")),
  revokeDevice: (id: string) => request(`/api/devices/${id}/revoke`, json("POST", { lost: true })),
  retireDevice: (id: string) => request(`/api/devices/${id}`, json("DELETE")),

  // ---- vehicles ----
  saveVehicle: async (v: Vehicle, prev?: Vehicle): Promise<void> => {
    if (v.driverId && !v.deviceId) throw new ApiError("A driver can only be assigned together with a tracking device.", 422);
    const body = { registration_no: v.plate, name: v.name, vehicle_type: v.type, make: v.make, model: v.model, year: v.year ?? null, color: v.color ?? null, department: v.department, notes: v.notes ?? null };
    let id = v.id;
    if (prev) await request(`/api/vehicles/${v.id}`, json("PATCH", { ...body, status: v.active ? "active" : "archived" }));
    else id = (await request<{ id: string }>("/api/vehicles", json("POST", body))).id;
    const before = prev?.deviceId ?? null, after = v.deviceId ?? null;
    if (before !== after || (prev?.driverId ?? null) !== (v.driverId ?? null)) {
      if (before && before !== after) await request(`/api/devices/${before}/assign`, json("POST", { vehicle_id: null, driver_id: null }));
      if (after) await request(`/api/devices/${after}/assign`, json("POST", { vehicle_id: id, driver_id: v.driverId ?? null }));
    }
  },
  archiveVehicle: (id: string) => request(`/api/vehicles/${id}`, json("DELETE")),

  // ---- drivers ----
  saveDriver: async (d: Driver, prev: Driver | undefined, devices: Device[]): Promise<void> => {
    const body = { full_name: d.name, employee_no: d.employeeNo ?? null, phone: d.phone || null, license_no: d.licenseNo ?? null, license_expiry: d.licenseExpiry ?? null, notes: d.notes ?? null };
    let id = d.id;
    if (prev) await request(`/api/drivers/${d.id}`, json("PATCH", { ...body, status: d.active ? "active" : "inactive" }));
    else id = (await request<{ id: string }>("/api/drivers", json("POST", body))).id;
    if ((prev?.vehicleId ?? null) !== (d.vehicleId ?? null) && d.vehicleId) {
      const dev = devices.find((x) => x.vehicleId === d.vehicleId);
      if (!dev) throw new ApiError("Driver saved, but the chosen vehicle has no tracking device yet. Assign a device to the vehicle first.", 422);
      await request(`/api/devices/${dev.id}/assign`, json("POST", { vehicle_id: d.vehicleId, driver_id: id }));
    }
  },
  deactivateDriver: (id: string) => request(`/api/drivers/${id}`, json("DELETE")),

  // ---- alerts ----
  ackAlert: (id: string) => request(`/api/alerts/${id}/ack`, json("POST")),

  // ---- geofences ----
  saveGeofence: async (g: Geofence, devices: Device[]): Promise<void> => {
    const device_ids = g.vehicleIds.map((vid) => devices.find((d) => d.vehicleId === vid)?.id).filter((x): x is string => !!x);
    const geometry = g.type === "circle" ? { lat: g.centerLat, lng: g.centerLng, radius_m: g.radiusM } : { ring: g.ring };
    const body = { name: g.name, kind: g.type, geometry, enabled: g.active, device_ids };
    const exists = g.id !== "";
    await request(exists ? `/api/geofences/${g.id}` : "/api/geofences", json(exists ? "PUT" : "POST", body));
  },
  deleteGeofence: (id: string) => request(`/api/geofences/${id}`, json("DELETE")),

  // ---- settings, users, backups ----
  settings: () => request<Record<string, unknown>>("/api/settings"),
  saveSettings: (s: Record<string, unknown>) => request<Record<string, unknown>>("/api/settings", json("PUT", s)),
  users: async (): Promise<AppUser[]> => (await request<{ items: BUser[] }>("/api/users")).items.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: !!u.active })),
  createUser: (u: { email: string; name: string; password: string; role: AppUser["role"] }) => request("/api/users", json("POST", u)),
  setUserActive: (id: string, active: boolean) => request(`/api/users/${id}`, json("PATCH", { active })),
  backups: async () => (await request<{ items: { name: string; bytes: number }[] }>("/api/backups")).items,
  createBackup: () => request<{ name: string }>("/api/backups", json("POST")),

  /** Download a CSV report (authenticated fetch -> blob). */
  downloadReport: async (kind: "devices" | "alerts" | "locations" | "audit", params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await raw(`/api/reports/${kind}.csv${qs ? `?${qs}` : ""}`);
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url; a.download = `aff-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  },
  deviceHistory: async (id: string, fromIso?: string, toIso?: string) => {
    const q = new URLSearchParams({ limit: "5000", ...(fromIso ? { from: fromIso } : {}), ...(toIso ? { to: toIso } : {}) });
    return (await request<{ items: { lat: number; lng: number; captured_at: string; speed_mps: number | null }[]; truncated: boolean }>(`/api/devices/${id}/locations?${q}`));
  },
};
