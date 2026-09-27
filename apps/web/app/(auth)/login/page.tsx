"use client";

import { useState } from "react";
import { useAppRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "@/lib/session";
import { BRAND } from "@/lib/brand";

// Single-owner, authenticator-code-only login. There's no signup here — the one owner
// identity is created once via `node scripts/run-auth-setup.mjs`, not through this UI.

export default function LoginPage() {
  const router = useAppRouter();
  const { login, loginWithRecoveryCode } = useSession();
  const [mode, setMode] = useState<"totp" | "recovery">("totp");
  const [totpCode, setTotpCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (mode === "totp") {
        await login(totpCode);
      } else {
        await loginWithRecoveryCode(recoveryCode);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>{BRAND.tagline.short}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {mode === "totp" ? (
            <FormField label="Authenticator code" htmlFor="totpCode">
              <Input
                id="totpCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                maxLength={6}
                autoFocus
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                required
              />
            </FormField>
          ) : (
            <FormField label="Recovery code" htmlFor="recoveryCode">
              <Input
                id="recoveryCode"
                autoComplete="off"
                placeholder="XXXXX-XXXXX"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                required
              />
            </FormField>
          )}

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm">
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => {
              setMode(mode === "totp" ? "recovery" : "totp");
              setError("");
            }}
          >
            {mode === "totp" ? "Lost your authenticator? Use a recovery code" : "Back to authenticator sign-in"}
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
