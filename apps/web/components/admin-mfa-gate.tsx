"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

interface MfaStatus {
  required: boolean;
  enabled: boolean;
  verified: boolean;
}

export function AdminMfaGate({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [setupSecret, setSetupSecret] = useState<string | null>(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ["admin-mfa-status"],
    queryFn: () => api<MfaStatus>("/admin/mfa/status"),
  });

  const setup = useMutation({
    mutationFn: () => api<{ otpauthUrl: string; secret: string }>("/admin/mfa/setup", { method: "POST" }),
    onSuccess: (data) => {
      setSetupSecret(data.secret);
      toast.success("Scan the secret in your authenticator app");
    },
  });

  const enable = useMutation({
    mutationFn: () =>
      api("/admin/mfa/enable", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    onSuccess: () => {
      toast.success("MFA enabled");
      setCode("");
      setSetupSecret(null);
      queryClient.invalidateQueries({ queryKey: ["admin-mfa-status"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to enable MFA"),
  });

  const verify = useMutation({
    mutationFn: () =>
      api("/admin/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    onSuccess: () => {
      toast.success("Verified");
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["admin-mfa-status"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Invalid code"),
  });

  if (isLoading || !status) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Checking security...</p>
      </div>
    );
  }

  if (!status.required) {
    return <>{children}</>;
  }

  if (status.enabled && status.verified) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <Card className="p-6">
        <CardTitle className="mb-2">
          {!status.enabled ? "Set up two-factor authentication" : "Enter MFA code"}
        </CardTitle>
        <CardDescription className="mb-6">
          Admin access requires authenticator app verification.
        </CardDescription>

        {!status.enabled && (
          <div className="mb-4 space-y-3">
            <Button onClick={() => setup.mutate()} disabled={setup.isPending}>
              Generate setup key
            </Button>
            {setupSecret && (
              <p className="rounded bg-muted p-3 font-mono text-xs break-all">
                {setupSecret}
              </p>
            )}
          </div>
        )}

        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="6-digit code"
          maxLength={6}
          className="mb-4"
        />

        <Button
          onClick={() =>
            status.enabled ? verify.mutate() : enable.mutate()
          }
          disabled={code.length !== 6}
        >
          {status.enabled ? "Verify" : "Enable MFA"}
        </Button>
      </Card>
    </div>
  );
}

export function useAdminAccess() {
  return useQuery({
    queryKey: ["admin-me"],
    queryFn: () => api<{ role: string }>("/admin/me"),
    retry: false,
  });
}
