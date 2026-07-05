"use client";

import Link from "next/link";
import { useAppRouter } from "@/lib/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthSignUpFormSchema, type AuthSignUpFormInput } from "@nexa/shared";
import { track } from "@nexa/analytics/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/ui/password-strength";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authClient, signUp } from "@/lib/auth-client";
import { BRAND } from "@/lib/brand";

export default function SignupPage() {
  const router = useAppRouter();
  const [error, setError] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<AuthSignUpFormInput>({
    resolver: zodResolver(AuthSignUpFormSchema),
    mode: "onBlur",
    defaultValues: { name: "", email: "", password: "", acceptTerms: false },
  });

  const password = watch("password");

  async function onSubmit(data: AuthSignUpFormInput) {
    setError("");
    const { name, email, password } = data;
    try {
      const result = await signUp.email({ name, email, password });
      if (result.error) {
        setError(result.error.message ?? "Signup failed");
        return;
      }
      track("signup_completed");
      router.push("/verify-email");
    } catch {
      setError("Signup failed. Please try again.");
    }
  }

  async function handleMagicSignup() {
    const values = getValues();
    const parsed = AuthSignUpFormSchema.pick({
      email: true,
      acceptTerms: true,
    }).safeParse({
      email: values.email,
      acceptTerms: values.acceptTerms,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email");
      return;
    }
    setError("");
    setMagicLinkLoading(true);
    try {
      const name = getValues("name");
      const result = await authClient.signIn.magicLink({
        email: parsed.data.email,
        name: name || undefined,
        callbackURL: "/onboarding",
        newUserCallbackURL: "/onboarding",
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

  if (magicSent) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a link to {getValues("email")}. Click it to create your
            account and start onboarding.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>{BRAND.tagline.primary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Name" htmlFor="name" error={errors.name?.message}>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Your name"
              error={!!errors.name}
              {...register("name")}
            />
          </FormField>

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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              error={!!errors.password}
              {...register("password")}
            />
            <PasswordStrength password={password} />
          </FormField>

          <div className="space-y-2">
            <label className="flex items-start gap-2.5 text-sm leading-relaxed">
              <input
                id="acceptTerms"
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
                {...register("acceptTerms")}
              />
              <span className="text-muted-foreground">
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:underline" target="_blank">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.acceptTerms?.message ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.acceptTerms.message}
              </p>
            ) : null}
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Create account
          </Button>
        </form>

        <Button
          variant="outline"
          className="w-full"
          type="button"
          loading={magicLinkLoading}
          disabled={isSubmitting}
          onClick={handleMagicSignup}
        >
          Sign up with magic link
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
