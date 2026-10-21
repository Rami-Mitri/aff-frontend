import { AlertTriangle, X } from "lucide-react";

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">{message}</div>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Dismiss" className="shrink-0 opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
