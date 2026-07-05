"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, Ticket, Users } from "lucide-react";
import { PageHeader } from "@/components/widgets/page-header";
import { StatCard } from "@/components/widgets/stat-card";
import { DashboardSkeleton } from "@/components/widgets/dashboard-skeleton";
import { EmptyState } from "@/components/widgets/empty-state";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    return <DashboardSkeleton />;
  }

  return (
    <>
      <PageHeader
        title="Operations dashboard"
        description="Real-time platform health, user activity, and support queue."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total users" value={data.totalUsers} icon={Users} />
        <StatCard label="DAU" value={data.dau} icon={Activity} />
        <StatCard label="New today" value={data.newUsersToday} />
        <StatCard label="Open tickets" value={data.openTickets} icon={Ticket} />
        <StatCard
          label="Errors (24h)"
          value={data.errorsLast24h}
          icon={AlertTriangle}
          className={data.errorsLast24h > 0 ? "border-destructive/30" : undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top events (7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topEvents.length === 0 ? (
            <EmptyState
              title="No events yet"
              description="Analytics events will appear here as users interact with Nexa."
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.topEvents.map((e) => (
                <li
                  key={e.event}
                  className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0"
                >
                  <span className="font-mono text-muted-foreground">{e.event}</span>
                  <span className="font-semibold tabular-nums">{e.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
