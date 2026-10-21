import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  return (
    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      <WifiOff className="h-3.5 w-3.5" />
      <span>
        You are offline. Live tracking and server operations are unavailable until the
        connection is restored.
      </span>
    </div>
  );
}