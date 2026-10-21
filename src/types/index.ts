export type Role = "super_admin" | "standard_user";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}

export type VehicleStatus = "moving" | "stopped" | "idling" | "offline";
export type DeviceStatus = "online" | "offline" | "unknown";

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  type: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  department: string;
  driverId?: string;
  deviceId?: string;
  status: VehicleStatus;
  active: boolean;
  notes?: string;
  lat?: number;
  lng?: number;
  speed?: number;
  heading?: number;
  ignition?: boolean;
  battery?: number;
  lastUpdate?: string;
  /** Real device state from the backend: reporting, stale_location, offline, ... */
  deviceStatus?: string;
  lastFixAgeS?: number;
  accuracy?: number;
}

export interface Device {
  id: string;
  name: string;
  imei: string;
  provider: string;
  vehicleId?: string;
  status: DeviceStatus;
  lastComm?: string;
  installedAt?: string;
  notes?: string;
  /** Backend lifecycle: pending (not enrolled) | active | inactive | lost | retired */
  state?: string;
  /** Detailed live status: reporting, stale_location, offline, permission_denied, ... */
  statusDetail?: string;
}

export interface Driver {
  id: string;
  name: string;
  employeeNo?: string;
  phone: string;
  licenseNo?: string;
  licenseExpiry?: string;
  vehicleId?: string;
  notes?: string;
  active: boolean;
}

export interface Trip {
  id: string;
  vehicleId: string;
  startTime: string;
  endTime: string;
  startAddress: string;
  endAddress: string;
  distanceKm: number;
  maxSpeed: number;
  avgSpeed: number;
  durationMin: number;
}

export type GeofenceType = "circle" | "polygon";
export type AlertSeverity = "info" | "warning" | "critical";

export interface Geofence {
  id: string;
  name: string;
  description?: string;
  type: GeofenceType;
  centerLat: number;
  centerLng: number;
  radiusM?: number;
  /** Polygon vertices as [lat, lng]; used when type === "polygon". */
  ring?: [number, number][];
  vehicleIds: string[];
  active: boolean;
  severity: AlertSeverity;
}

export type AlertType =
  | "geofence_enter"
  | "geofence_exit"
  | "overspeed"
  | "device_offline"
  | "stale_data"
  | "sos"
  | "system";

export interface AlertItem {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  vehicleId?: string;
  message: string;
  createdAt: string;
  read: boolean;
  acknowledged: boolean;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
}

export interface DashboardSummary {
  total: number;
  online: number;
  offline: number;
  moving: number;
  stopped: number;
  idling: number;
  activeAlerts: number;
}