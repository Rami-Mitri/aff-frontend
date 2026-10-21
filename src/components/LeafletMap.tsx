import { useEffect, useRef, useState } from "react";
import "@/lib/leafletGlobal"; // must come before the plugin
import "leaflet.markercluster";
import type * as LeafletTypes from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { Geofence, Vehicle } from "@/types";

/** Default public OSM tiles. Fine for light use; see docs for the usage policy and self-hosting a tile server. */
export const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const DEFAULT_ATTRIBUTION = "© OpenStreetMap contributors";

interface Props {
  vehicles: Vehicle[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  geofences?: Geofence[];
  /** Route polyline as [lat, lng] pairs (historical playback). */
  route?: [number, number][];
  tileUrl?: string;
  attribution?: string;
  className?: string;
}

/** The single shared Leaflet global (see lib/leafletGlobal.ts). */
const L = (window as unknown as { L: typeof LeafletTypes }).L;

const COLORS: Record<string, string> = { moving: "#10b981", stopped: "#64748b", idling: "#f59e0b", offline: "#f43f5e" };

function icon(v: Vehicle, selected: boolean) {
  const c = COLORS[v.status] ?? "#64748b";
  const ring = selected ? "box-shadow:0 0 0 4px rgba(45,212,191,.55);" : "";
  const stale = v.deviceStatus && v.deviceStatus !== "reporting" ? "opacity:.65;" : "";
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    html: `<div style="width:22px;height:22px;border-radius:50%;background:${c};border:2px solid #fff;${ring}${stale}box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
  });
}

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] as string));

export function LeafletMap({ vehicles, selectedId, onSelect, geofences = [], route, tileUrl = DEFAULT_TILE_URL, attribution = DEFAULT_ATTRIBUTION, className = "h-96" }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletTypes.Map | null>(null);
  const tiles = useRef<LeafletTypes.TileLayer | null>(null);
  const cluster = useRef<LeafletTypes.LayerGroup | null>(null);
  const fences = useRef<LeafletTypes.LayerGroup | null>(null);
  const routeLayer = useRef<LeafletTypes.LayerGroup | null>(null);
  const fitted = useRef(false);
  const onSelectRef = useRef(onSelect);
  const [tileProblem, setTileProblem] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  onSelectRef.current = onSelect;

  // create the map once. Cleanup is registered even if setup fails halfway, so React's double-run in dev
  // (and any retry) never finds a half-initialised container.
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    let m: LeafletTypes.Map | null = null;
    try {
      // maxZoom must be set on the map itself: the cluster plugin throws if the map has no maxZoom when it is added.
      m = L.map(node, { center: [30, 31], zoom: 5, minZoom: 2, maxZoom: 19, worldCopyJump: true });
      map.current = m;
      fences.current = L.layerGroup().addTo(m);
      routeLayer.current = L.layerGroup().addTo(m);
      // Clustering is an optional nicety: if the plugin is missing or fails, fall back to plain markers.
      const withCluster = L as unknown as { markerClusterGroup?: (o: object) => LeafletTypes.LayerGroup };
      let group: LeafletTypes.LayerGroup | null = null;
      try {
        if (typeof withCluster.markerClusterGroup === "function") group = withCluster.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 50 }).addTo(m);
      } catch (e) {
        console.warn("Marker clustering unavailable, using plain markers:", e);
      }
      cluster.current = group ?? L.layerGroup().addTo(m);
      setMapError(null);
    } catch (e) {
      console.error("Map failed to start:", e);
      setMapError(e instanceof Error ? e.message : String(e));
    }
    return () => {
      try { m?.remove(); } catch { /* already gone */ }
      map.current = null; cluster.current = null; fences.current = null; routeLayer.current = null; tiles.current = null;
      fitted.current = false;
    };
  }, []);

  // tile layer (configurable); tile failures never break the rest of the page
  useEffect(() => {
    if (!map.current) return;
    tiles.current?.remove();
    setTileProblem(false);
    const t = L.tileLayer(tileUrl, { attribution, maxZoom: 19 });
    let errors = 0;
    t.on("tileerror", () => { if (++errors > 3) setTileProblem(true); });
    t.on("tileload", () => { errors = 0; setTileProblem(false); });
    t.addTo(map.current);
    tiles.current = t;
  }, [tileUrl, attribution]);

  // markers
  useEffect(() => {
    const g = cluster.current, m = map.current;
    if (!g || !m) return;
    g.clearLayers();
    const pts: LeafletTypes.LatLngTuple[] = [];
    for (const v of vehicles) {
      if (v.lat == null || v.lng == null) continue;
      const mk = L.marker([v.lat, v.lng], { icon: icon(v, v.id === selectedId), title: v.name });
      const age = v.lastFixAgeS != null ? `${Math.round(v.lastFixAgeS / 60)} min ago` : "no fix";
      mk.bindPopup(`<strong>${esc(v.name)}</strong><br>${esc(v.plate)}<br>${esc(v.deviceStatus ?? v.status)} · ${esc(age)}`);
      mk.on("click", () => onSelectRef.current?.(v.id));
      g.addLayer(mk);
      pts.push([v.lat, v.lng]);
    }
    if (!fitted.current && pts.length) { m.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 15 }); fitted.current = true; }
  }, [vehicles, selectedId]);

  // centre on selection
  useEffect(() => {
    const v = vehicles.find((x) => x.id === selectedId);
    if (v?.lat != null && v.lng != null && map.current) map.current.setView([v.lat, v.lng], Math.max(map.current.getZoom(), 14));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // geofence overlays
  useEffect(() => {
    const g = fences.current;
    if (!g) return;
    g.clearLayers();
    for (const f of geofences) {
      const style = { color: f.active ? "#0d9488" : "#94a3b8", weight: 2, fillOpacity: 0.1 };
      if (f.type === "circle" && f.radiusM) L.circle([f.centerLat, f.centerLng], { ...style, radius: f.radiusM }).bindTooltip(f.name).addTo(g);
      else if (f.type === "polygon" && f.ring?.length) L.polygon(f.ring, style).bindTooltip(f.name).addTo(g);
    }
  }, [geofences]);

  // historical route
  useEffect(() => {
    const g = routeLayer.current, m = map.current;
    if (!g || !m) return;
    g.clearLayers();
    if (route && route.length > 1) {
      const line = L.polyline(route, { color: "#2563eb", weight: 4, opacity: 0.8 }).addTo(g);
      L.circleMarker(route[0], { radius: 7, color: "#16a34a", fillOpacity: 1 }).bindTooltip("Start").addTo(g);
      L.circleMarker(route[route.length - 1], { radius: 7, color: "#dc2626", fillOpacity: 1 }).bindTooltip("End").addTo(g);
      m.fitBounds(line.getBounds(), { padding: [40, 40] });
    }
  }, [route]);

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 ${className}`}>
      <div ref={el} className="h-full w-full" />
      {mapError && (
        <div role="alert" className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/90 p-4 text-center text-sm text-rose-800">
          The map could not start: {mapError}
        </div>
      )}
      {tileProblem && (
        <div className="pointer-events-none absolute left-2 top-2 z-[1000] rounded bg-amber-100 px-2 py-1 text-xs text-amber-900">
          Map tiles are not loading. Markers still work; check the tile server in Settings.
        </div>
      )}
    </div>
  );
}
