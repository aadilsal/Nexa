"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

interface ErrorReport {
  id: string;
  source: string;
  errorType: string;
  message: string;
  route: string | null;
  count: number;
  lastSeenAt: string;
}

interface SlowEndpoint {
  path: string;
  method: string;
  count: number;
  maxMs: number;
  avgMs: number;
}

export default function AdminErrorsPage() {
  const { data: errors } = useQuery({
    queryKey: ["admin-errors"],
    queryFn: () => api<ErrorReport[]>("/admin/errors"),
  });

  const { data: slow } = useQuery({
    queryKey: ["admin-slow-endpoints"],
    queryFn: () => api<SlowEndpoint[]>("/admin/metrics/slow-endpoints"),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Error Monitoring</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <CardTitle className="mb-4">Recent errors</CardTitle>
          {!errors?.length ? (
            <p className="text-sm text-muted-foreground">No errors recorded.</p>
          ) : (
            <ul className="space-y-3">
              {errors.map((err) => (
                <li key={err.id} className="border-b border-border pb-3 text-sm">
                  <p className="font-medium">{err.errorType}</p>
                  <p className="text-muted-foreground">{err.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {err.source} · {err.count}x ·{" "}
                    {new Date(err.lastSeenAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <CardTitle className="mb-4">Slow endpoints (24h)</CardTitle>
          {!slow?.length ? (
            <p className="text-sm text-muted-foreground">No slow requests.</p>
          ) : (
            <ul className="space-y-2">
              {slow.map((s) => (
                <li key={`${s.method}-${s.path}`} className="flex justify-between text-sm">
                  <span className="truncate">
                    {s.method} {s.path}
                  </span>
                  <span className="ml-2 shrink-0 text-muted-foreground">
                    max {s.maxMs}ms · {s.count}x
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
