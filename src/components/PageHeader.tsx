interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}