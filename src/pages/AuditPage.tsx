import { ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { useFleetData } from "@/hooks/useFleetData";

export function AuditPage() {
  const { audit } = useFleetData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle="Security-relevant actions recorded by the backend. Local mode shows limited entries."
      />

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">
            Entries <span className="text-slate-400">({audit.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {audit.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<ScrollText className="h-5 w-5" />}
                title="No audit entries"
                description="Audit entries will appear here once the backend is connected."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Actor</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                    <th className="px-4 py-3 font-medium">IP</th>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {audit.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{a.actor}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {a.action}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.target}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{a.ip}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {new Date(a.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}