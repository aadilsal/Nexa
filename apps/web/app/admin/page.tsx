"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

interface Overview {
  totalUsers: number;
  openTickets: number;
  errorsLast24h: number;
  dau: number;
  newUsersToday: number;
  topEvents: Array<{ event: string; count: number }>;
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => api<Overview>("/admin/metrics/overview"),
  });

  if (isLoading || !data) {
    return <p className="text-muted-foreground">Loading metrics...</p>;
  }

  const stats = [
    { label: "Total Users", value: data.totalUsers },
    { label: "DAU", value: data.dau },
    { label: "New Today", value: data.newUsersToday },
    { label: "Open Tickets", value: data.openTickets },
    { label: "Errors (24h)", value: data.errorsLast24h },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Operations Dashboard</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="text-3xl">{stat.value}</CardTitle>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <CardTitle className="mb-4">Top events (7 days)</CardTitle>
        {data.topEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.topEvents.map((e) => (
              <li
                key={e.event}
                className="flex justify-between text-sm"
              >
                <span>{e.event}</span>
                <span className="font-medium">{e.count}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
