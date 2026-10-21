# Services

`api.ts` is the only place that talks to the backend (`VITE_API_BASE_URL`, empty = same origin).
It adapts backend records to the UI types. There is no local/demo data source: if the server is
unreachable the UI shows an error and keeps the last data received from the server.
The previous browser-only implementation is kept in `_legacy/` for reference and is not built.
