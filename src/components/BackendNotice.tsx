import { ErrorBanner } from "@/components/ErrorBanner";

/** Shows a persistent notice when the last refresh failed. Data on screen is the last good server snapshot, not a local copy. */
export function BackendNotice({ error }: { error?: string | null }) {
  if (!error) return null;
  return <ErrorBanner message={`${error} Showing the last data received from the server.`} />;
}
