"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  targetId: string | null;
  reason: string | null;
  createdAt: string;
}

export default function AdminAuditPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => api<AuditLog[]>("/admin/audit-logs"),
  });

  if (isLoading) {
    return <p className="text-muted-foreground">Loading audit logs...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Admin Audit Logs</h1>

      <div className="space-y-2">
        {logs?.map((log) => (
          <Card key={log.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-sm">{log.action}</CardTitle>
                <CardDescription>
                  {log.adminEmail}
                  {log.targetId && ` · ${log.targetId}`}
                </CardDescription>
                {log.reason && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {log.reason}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
