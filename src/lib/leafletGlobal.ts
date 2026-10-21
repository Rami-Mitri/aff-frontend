import * as Leaflet from "leaflet";

/**
 * leaflet.markercluster is a plugin that attaches itself to a global, mutable `L`.
 * Under Vite the imported Leaflet module can be a different (read-only) object than that global, which makes
 * `L.markerClusterGroup` undefined and crashes the page. This module makes sure ONE mutable `L` exists and is
 * shared; import it BEFORE "leaflet.markercluster".
 */
const w = window as unknown as { L?: Record<string, unknown> };
if (!w.L || typeof w.L !== "object" || !("FeatureGroup" in w.L) || Object.isFrozen(w.L)) {
  // Depending on how Vite bundles Leaflet, the classes are either on the namespace or on its default export.
  const ns = Leaflet as unknown as Record<string, unknown> & { default?: Record<string, unknown> };
  const base = "FeatureGroup" in ns ? ns : (ns.default ?? ns);
  w.L = { ...base };
}
export {};
