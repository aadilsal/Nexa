"use client";

import Link from "next/link";
import { useAppRouter } from "@/lib/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthSignInSchema, type AuthSignInInput } from "@nexa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authClient, signIn, waitForSession, clearStoredBearerToken } from "@/lib/auth-client";
import { prefetchAppData } from "@/lib/prefetch-app-data";
import { BRAND } from "@/lib/brand";

export default function LoginPage() {
  const router = useAppRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<AuthSignInInput>({
    resolver: zodResolver(AuthSignInSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: AuthSignInInput) {
    setError("");
    try {
      clearStoredBearerToken();
      const result = await signIn.email(data);
      if (result.error) {
        setError(result.error.message ?? "Login failed");
        return;
      }
      const sessionReady = await waitForSession();
      if (!sessionReady) {
        setError("Session could not be established. Please try again.");
        return;
      }
      void prefetchAppData(queryClient);
      router.refresh();
      router.push("/dashboard");
    } catch {
      setError("Login failed. Please try again.");
    }
  }

  async function handleMagicLink() {
    const email = getValues("email");
    const parsed = AuthSignInSchema.pick({ email: true }).safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter your email first");
      return;
    }
    setError("");
    setMagicLinkLoading(true);
    try {
      const result = await authClient.signIn.magicLink({
        email: parsed.data.email,
        callbackURL: "/dashboard",
      });
      if (result.error) {
        setError(result.error.message ?? "Could not send sign-in link");
        return;
      }
      setMagicSent(true);
    } catch {
      setError("Could not send sign-in link. Please try again.");
    } finally {
      setMagicLinkLoading(false);
    }
  }

  async function handlePasskey() {
    setPasskeyLoading(true);
    setError("");
    try {
      clearStoredBearerToken();
      await authClient.signIn.passkey();
      const sessionReady = await waitForSession();
      if (!sessionReady) {
        setError("Session could not be established. Please try again.");
        return;
      }
      void prefetchAppData(queryClient);
      router.refresh();
      router.push("/dashboard");
    } catch {
      setError("Passkey sign-in failed");
    } finally {
      setPasskeyLoading(false);
    }
  }

  if (magicSent) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            Sign-in link sent to {getValues("email")}. Click the link in your
            email to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" variant="outline" onClick={() => setMagicSent(false)}>
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>{BRAND.tagline.short}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={!!errors.email}
              {...register("email")}
            />
          </FormField>

          <FormField
            label="Password"
            htmlFor="password"
            error={errors.password?.message}
          >
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="Password"
              error={!!errors.password}
              {...register("password")}
            />
          </FormField>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            type="button"
            loading={passkeyLoading}
            disabled={isSubmitting || magicLinkLoading}
            onClick={handlePasskey}
          >
            Sign in with passkey
          </Button>
          <Button
            variant="outline"
            className="w-full"
            type="button"
            loading={magicLinkLoading}
            disabled={isSubmitting || passkeyLoading}
            onClick={handleMagicLink}
          >
            Email me a sign-in link
          </Button>
        </div>

        <p className="text-center text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
