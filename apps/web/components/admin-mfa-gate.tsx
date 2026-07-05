"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
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

interface MfaSetup {
  otpauthUrl: string;
  secret: string;
}

export function AdminMfaGate({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [setupData, setSetupData] = useState<MfaSetup | null>(null);
  const [showManualKey, setShowManualKey] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["admin-mfa-status"],
    queryFn: () => api<MfaStatus>("/admin/mfa/status"),
  });

  const setup = useMutation({
    mutationFn: () =>
      api<MfaSetup>("/admin/mfa/setup", { method: "POST" }),
    onSuccess: (data) => {
      setSetupData(data);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not generate QR code"),
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
      setSetupData(null);
      queryClient.invalidateQueries({ queryKey: ["admin-mfa-status"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Invalid verification code"),
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

  const needsSetup = status?.required && !status.enabled;

  useEffect(() => {
    if (!needsSetup || setupData || setup.isPending) return;
    setup.mutate();
    // Only auto-generate once when the setup screen first loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsSetup, setupData]);

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
          {status.enabled
            ? "Enter the 6-digit code from your authenticator app."
            : "Scan the QR code with Google Authenticator or any TOTP app, then enter the code it shows."}
        </CardDescription>

        {!status.enabled && (
          <div className="mb-6 space-y-4">
            {setup.isPending && !setupData ? (
              <p className="text-sm text-muted-foreground">Generating QR code…</p>
            ) : null}

            {setupData ? (
              <>
                <div className="mx-auto w-fit rounded-lg bg-white p-4">
                  <QRCode
                    value={setupData.otpauthUrl}
                    size={200}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>Open Google Authenticator (or similar app)</li>
                  <li>Tap <strong className="font-medium text-foreground">+</strong> → <strong className="font-medium text-foreground">Scan a QR code</strong></li>
                  <li>Point your camera at the code above</li>
                  <li>Enter the 6-digit code the app shows below</li>
                </ol>
                <button
                  type="button"
                  onClick={() => setShowManualKey((open) => !open)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {showManualKey ? "Hide manual setup key" : "Can't scan? Enter key manually"}
                </button>
                {showManualKey ? (
                  <p className="rounded bg-muted p-3 font-mono text-xs break-all">
                    {setupData.secret}
                  </p>
                ) : null}
              </>
            ) : setup.isError ? (
              <Button onClick={() => setup.mutate()} disabled={setup.isPending}>
                Generate QR code
              </Button>
            ) : null}
          </div>
        )}

        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="6-digit code"
          maxLength={6}
          inputMode="numeric"
          autoComplete="one-time-code"
          className="mb-4 text-center text-lg tracking-widest"
        />

        <Button
          onClick={() =>
            status.enabled ? verify.mutate() : enable.mutate()
          }
          disabled={code.length !== 6 || enable.isPending || verify.isPending}
          loading={enable.isPending || verify.isPending}
          className="w-full"
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
