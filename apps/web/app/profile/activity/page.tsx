"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { Card, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function ActivityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () =>
      api<{ logs: Array<{ id: string; action: string; createdAt: string }> }>(
        "/audit-logs",
      ),
  });

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <AppNav />
      <Link href="/profile" className="text-sm text-primary hover:underline">
        ← Back to profile
      </Link>
      <h1 className="mb-8 mt-4 text-2xl font-bold">Activity log</h1>

      <Card>
        <CardTitle className="mb-4">Recent security events</CardTitle>
        {isLoading ? (
          <div className="h-32 animate-pulse rounded bg-muted" />
        ) : (
          <ul className="space-y-2 text-sm">
            {data?.logs.map((log) => (
              <li
                key={log.id}
                className="flex justify-between rounded-lg bg-muted px-3 py-2"
              >
                <span>{log.action.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
            {!data?.logs.length && (
              <p className="text-muted-foreground">No activity yet</p>
            )}
          </ul>
        )}
      </Card>
    </main>
  );
}
