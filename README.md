# AFF Vehicle Tracking — Frontend (public repo)

React + TypeScript + Vite + Tailwind. Talks to the backend only through `src/services/api.ts`.
No secrets belong in this repo; the API address is configured with `VITE_API_BASE_URL` (empty = same origin).

## Setup
    npm install
    cp .env.example .env                                         # leave empty when using the dev proxy
    npm run dev                                                  # proxies /api to http://127.0.0.1:8000
    npm run typecheck && npm run build                           # output in dist/

## What it does
Real sign-in (server-verified session), live map (Leaflet + OpenStreetMap-compatible tiles, marker clustering,
geofence overlays, 24 h route), vehicles / drivers / GPS devices with enrollment codes, trips, geofences (circle and
polygon), alerts with acknowledge, reports, users, settings, audit log, backups. Data refreshes every 10 s.
If the server cannot be reached the UI shows an error and keeps the last data received; it never switches to fake data.

## Status
- The six UI primitives (`src/components/ui/`: badge, button, card, input, label, select) are included, dependency-free (React only), and were
  exercised in a real headless Chromium: 21 checks pass (select by mouse and keyboard, type-ahead, Escape/Tab/outside-click, disabled and
  loading buttons, label binding, late-loaded options).
- `src/services/api.ts` was run against a live backend process: 20 end-to-end checks pass (login, roles, enrollment, assignments, GPS ->
  vehicle position, geofences, alerts, settings, backups, expired session, server down).
- NOT yet run by me: `npm install`, `npm run typecheck`, `npm run build` (no network in my sandbox). An approximate strict type-check with stand-in
  React types found and fixed one real problem (three unused old components imported a missing type); the real check may still report small issues.
- Pages were not click-tested in a browser; Leaflet map, lucide icons and Tailwind styling are unverified visually.
Admin-only pages are hidden for standard users, but permissions are enforced by the backend.
Trip start/end are shown as coordinates (no geocoding service is used).

## GitHub Pages deployment
This repository includes a GitHub Actions workflow that compiles the Vite/React source and publishes `dist/`.
Do not use the repository's **main branch / root** as a Pages source; choose **GitHub Actions** under
Settings → Pages. The API must be deployed separately and reachable over HTTPS. In the repository settings,
add a repository variable named `VITE_API_BASE_URL` containing the public backend base URL (for example,
`https://api.example.com`, with no trailing slash). Until a real backend URL is configured, the frontend
may load but login and live data will not work. Never put passwords, tokens, or database files in this repo.
