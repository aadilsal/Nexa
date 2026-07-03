"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

interface HealthResponse {
  status: string;
  checks: Record<string, { status: string; latencyMs?: number }>;
  timestamp: string;
}

export default function AdminHealthPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-health"],
    queryFn: () => api<HealthResponse>("/admin/health"),
    refetchInterval: 30_000,
  });

  if (isLoading || !data) {
    return <p className="text-muted-foreground">Checking system health...</p>;
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">System Health</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Overall:{" "}
        <span
          className={
            data.status === "healthy" ? "text-green-600" : "text-amber-600"
          }
        >
          {data.status}
        </span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries(data.checks).map(([name, check]) => (
          <Card key={name} className="p-4">
            <CardTitle className="text-base capitalize">{name}</CardTitle>
            <CardDescription>
              {check.status}
              {check.latencyMs !== undefined && ` · ${check.latencyMs}ms`}
            </CardDescription>
          </Card>
        ))}
      </div>
    </div>
  );
}
