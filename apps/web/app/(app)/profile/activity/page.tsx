"use client";

import { useQuery } from "convex/react";
import { PageShell, SettingsGroup, SettingsList, SettingsListItem } from "@/components/layouts/surface";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";

export default function ActivityPage() {
  const { token } = useSession();
  const attempts = useQuery(api.auth.recentLoginAttempts, token ? { sessionToken: token } : "skip");

  return (
    <PageShell title="Activity log" description="Recent sign-in activity on your account." backHref="/profile" backLabel="Profile" narrow>
      <SettingsGroup label="Recent sign-ins">
        {attempts === undefined ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
        ) : attempts.length ? (
          <SettingsList>
            {attempts.map((a) => (
              <SettingsListItem key={a.id}>
                <span className="font-medium">{a.success ? "Signed in" : "Failed sign-in attempt"}</span>
                <span className="text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
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
