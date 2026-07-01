"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { resetPassword } from "@/lib/auth-client";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await resetPassword({ newPassword: password, token });
    if (result.error) {
      setError(result.error.message ?? "Reset failed");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardTitle>Invalid link</CardTitle>
        <CardDescription className="mt-2">
          This reset link is invalid or expired.
        </CardDescription>
        <Link href="/forgot-password" className="mt-4 inline-block text-primary">
          Request a new link
        </Link>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardTitle className="mb-1">Set new password</CardTitle>
      <CardDescription className="mb-6">
        All other sessions will be signed out.
      </CardDescription>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          placeholder="New password (min 8 characters)"
          required
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Updating..." : "Update password"}
        </Button>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={<p>Loading...</p>}>
        <ResetForm />
      </Suspense>
    </main>
  );
}
