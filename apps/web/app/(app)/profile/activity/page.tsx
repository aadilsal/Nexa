"use client";

import { useQuery } from "@tanstack/react-query";
import {
  PageShell,
  SettingsGroup,
  SettingsList,
  SettingsListItem,
} from "@/components/layouts/surface";
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
    <PageShell
      title="Activity log"
      description="Recent security events on your account."
      backHref="/profile"
      backLabel="Profile"
      narrow
    >
      <SettingsGroup label="Recent events">
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
        ) : data?.logs.length ? (
          <SettingsList>
            {data.logs.map((log) => (
              <SettingsListItem key={log.id}>
                <span className="font-medium">
                  {log.action.replace(/_/g, " ")}
                </span>
                <span className="text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </SettingsListItem>
            ))}
          </SettingsList>
        ) : (
          <p className="py-2 text-sm text-muted-foreground">No activity yet.</p>
        )}
      </SettingsGroup>
    </PageShell>
  );
}
