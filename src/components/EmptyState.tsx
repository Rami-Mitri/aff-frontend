import { cn } from "@/lib/utils";

interface Props {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-900/40",
        className
      )}
    >
      {icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400">
          {icon}
        </div>
      )}
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</div>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}