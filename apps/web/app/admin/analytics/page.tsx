"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function AdminAnalyticsPage() {
  const { data: features } = useQuery({
    queryKey: ["admin-analytics-features"],
    queryFn: () =>
      api<Array<{ event: string; count: number }>>("/admin/analytics/features"),
  });

  const { data: pages } = useQuery({
    queryKey: ["admin-analytics-pages"],
    queryFn: () =>
      api<Array<{ path: string; count: number }>>("/admin/analytics/pages"),
  });

  const { data: funnels } = useQuery({
    queryKey: ["admin-analytics-funnels"],
    queryFn: () =>
      api<Array<{ step: string; count: number }>>("/admin/analytics/funnels"),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Product Analytics</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 lg:col-span-2">
          <CardTitle className="mb-4">Onboarding funnel (30 days)</CardTitle>
          {!funnels?.length ? (
            <p className="text-sm text-muted-foreground">No funnel data yet.</p>
          ) : (
            <ul className="space-y-2">
              {funnels.map((step, i) => {
                const prev = i > 0 ? funnels[i - 1]!.count : null;
                const rate =
                  prev && prev > 0
                    ? Math.round((step.count / prev) * 100)
                    : null;
                return (
                  <li key={step.step} className="flex justify-between text-sm">
                    <span>{step.step}</span>
                    <span className="font-medium">
                      {step.count}
                      {rate !== null && (
                        <span className="ml-2 text-muted-foreground">
                          ({rate}%)
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <CardTitle className="mb-4">Feature usage (7 days)</CardTitle>
          {!features?.length ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {features.map((f) => (
                <li key={f.event} className="flex justify-between text-sm">
                  <span>{f.event}</span>
                  <span className="font-medium">{f.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <CardTitle className="mb-4">Page views (7 days)</CardTitle>
          {!pages?.length ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {pages.slice(0, 15).map((p) => (
                <li key={p.path} className="flex justify-between text-sm">
                  <span className="truncate">{p.path}</span>
                  <span className="ml-2 font-medium">{p.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
