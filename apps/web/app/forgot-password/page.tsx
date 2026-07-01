"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requestPasswordReset } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardTitle className="mb-2">Check your email</CardTitle>
          <CardDescription>
            If an account exists for {email}, you will receive a reset link.
            Check the server console in dev — the link is logged there too.
          </CardDescription>
          <Link href="/login" className="mt-6 inline-block text-primary hover:underline">
            Back to sign in
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardTitle className="mb-1">Forgot password</CardTitle>
        <CardDescription className="mb-6">
          Enter your email and we&apos;ll send a reset link.
        </CardDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        <Link href="/login" className="mt-4 block text-center text-sm text-primary hover:underline">
          Back to sign in
        </Link>
      </Card>
    </main>
  );
}
