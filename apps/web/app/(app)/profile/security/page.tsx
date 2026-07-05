"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  PageShell,
  SettingsGroup,
  SettingsList,
  SettingsListItem,
  SettingsRow,
} from "@/components/layouts/surface";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export default function SecurityPage() {
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      api<{ passkeys: Array<{ id: string; name: string | null; createdAt: string }> }>(
        "/users/me",
      ),
  });

  const addPasskey = useMutation({
    mutationFn: async () => {
      await authClient.passkey.addPasskey({ name: "This device" });
    },
    onSuccess: () => {
      toast.success("Passkey added");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Failed to add passkey"),
  });

  return (
    <PageShell
      title="Security"
      description="Sign in with Face ID, fingerprint, or device PIN."
      backHref="/profile"
      backLabel="Profile"
      narrow
    >
      <SettingsGroup
        label="Passkeys"
        description="Faster, more secure sign-in on this device."
      >
        <SettingsRow>
          <Button
            onClick={() => addPasskey.mutate()}
            disabled={addPasskey.isPending}
          >
            {addPasskey.isPending ? "Adding…" : "Add passkey"}
          </Button>
        </SettingsRow>
        {profile?.passkeys.length ? (
          <SettingsList>
            {profile.passkeys.map((pk) => (
              <SettingsListItem key={pk.id}>
                <span className="font-medium">{pk.name ?? "Passkey"}</span>
                <span className="text-muted-foreground">
                  {pk.createdAt
                    ? new Date(pk.createdAt).toLocaleDateString()
                    : ""}
                </span>
              </SettingsListItem>
            ))}
          </SettingsList>
        ) : (
          <p className="py-2 text-sm text-muted-foreground">
            No passkeys yet.
          </p>
        )}
      </SettingsGroup>

      <SettingsGroup
        label="Password"
        description="Reset your password via email. Other sessions will be signed out."
      >
        <SettingsRow>
          <Link href="/forgot-password">
            <Button variant="outline">Reset password</Button>
          </Link>
        </SettingsRow>
      </SettingsGroup>
    </PageShell>
  );
}
