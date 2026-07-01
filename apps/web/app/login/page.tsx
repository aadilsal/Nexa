"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { authClient, signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? "Login failed");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setError("Enter your email first");
      return;
    }
    setLoading(true);
    await authClient.signIn.magicLink({
      email,
      callbackURL: "/dashboard",
    });
    setMagicSent(true);
    setLoading(false);
  }

  async function handlePasskey() {
    setLoading(true);
    try {
      await authClient.signIn.passkey();
      router.push("/dashboard");
    } catch {
      setError("Passkey sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  if (magicSent) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardTitle>Check your email</CardTitle>
          <CardDescription className="mt-2">
            Sign-in link sent to {email}. In dev, check the server console for
            the URL.
          </CardDescription>
          <Button className="mt-4" variant="outline" onClick={() => setMagicSent(false)}>
            Back
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardTitle className="mb-1">Welcome back</CardTitle>
        <CardDescription className="mb-6">Sign in to your Nexa account</CardDescription>

        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in with password"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            type="button"
            disabled={loading}
            onClick={handlePasskey}
          >
            Sign in with passkey
          </Button>
          <Button
            variant="outline"
            className="w-full"
            type="button"
            disabled={loading}
            onClick={handleMagicLink}
          >
            Email me a sign-in link
          </Button>
        </div>

        <p className="mt-4 text-center text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </p>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </main>
  );
}
