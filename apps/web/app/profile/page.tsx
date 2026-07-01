"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { sendVerificationEmail } from "@/lib/auth-client";

interface Profile {
  user: {
    email: string;
    name: string | null;
    emailVerified: boolean;
    primaryPayday: number | null;
    preferredCycleStart: number | null;
  };
  settings: {
    timezone: string;
    weeklyReviewEmail: boolean;
  };
  passkeys: Array<{ id: string; name: string | null }>;
  pendingDeletion: { scheduledFor: string } | null;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api<Profile>("/users/me"),
  });

  const updateProfile = useMutation({
    mutationFn: (name: string) =>
      api("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const updateSettings = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api("/users/settings", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  if (isLoading || !profile) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <AppNav />
      <h1 className="mb-8 text-2xl font-bold">Profile</h1>

      <div className="space-y-6">
        <Card>
          <CardTitle className="mb-4">Account</CardTitle>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <div className="flex gap-2">
                <Input
                  defaultValue={profile.user.name ?? ""}
                  id="profile-name"
                />
                <Button
                  onClick={() => {
                    const el = document.getElementById(
                      "profile-name",
                    ) as HTMLInputElement;
                    updateProfile.mutate(el.value);
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <p className="text-sm">
                {profile.user.email}{" "}
                {profile.user.emailVerified ? (
                  <span className="text-primary">(verified)</span>
                ) : (
                  <span className="text-destructive">(not verified)</span>
                )}
              </p>
              {!profile.user.emailVerified && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    sendVerificationEmail({
                      email: profile.user.email,
                      callbackURL: "/profile",
                    });
                    toast.success("Verification email sent — check console in dev");
                  }}
                >
                  Resend verification email
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-4">Preferences</CardTitle>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Timezone</label>
              <Input
                defaultValue={profile.settings.timezone}
                id="timezone"
                onBlur={(e) =>
                  updateSettings.mutate({ timezone: e.target.value })
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                defaultChecked={profile.settings.weeklyReviewEmail}
                onChange={(e) =>
                  updateSettings.mutate({ weeklyReviewEmail: e.target.checked })
                }
              />
              Send weekly review emails
            </label>
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-2">Security</CardTitle>
          <CardDescription className="mb-4">
            {profile.passkeys.length} passkey(s) registered
          </CardDescription>
          <Link href="/profile/security">
            <Button variant="outline" size="sm">
              Manage security
            </Button>
          </Link>
        </Card>

        <Card>
          <CardTitle className="mb-2">Data & privacy</CardTitle>
          <CardDescription className="mb-4">
            Export your data or manage account deletion.
          </CardDescription>
          <div className="flex flex-wrap gap-2">
            <Link href="/profile/data">
              <Button variant="outline" size="sm">
                Data & export
              </Button>
            </Link>
            <Link href="/profile/activity">
              <Button variant="outline" size="sm">
                Activity log
              </Button>
            </Link>
          </div>
        </Card>

        {profile.pendingDeletion && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardTitle className="text-destructive">Deletion scheduled</CardTitle>
            <CardDescription className="mt-2">
              Account will be deleted on{" "}
              {new Date(profile.pendingDeletion.scheduledFor).toLocaleDateString()}
            </CardDescription>
            <Link href="/profile/data" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                Cancel deletion
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </main>
  );
}
