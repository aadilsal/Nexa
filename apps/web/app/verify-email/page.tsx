"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { sendVerificationEmail, useSession } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const { data: session } = useSession();

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardTitle className="mb-2">Verify your email</CardTitle>
        <CardDescription className="mb-6">
          We sent a verification link to your inbox. On localhost, the link is
          also printed in your Next.js server console.
        </CardDescription>
        <Button
          variant="outline"
          disabled={!session?.user?.email}
          onClick={() => {
            if (session?.user?.email) {
              sendVerificationEmail({
                email: session.user.email,
                callbackURL: "/onboarding",
              });
            }
          }}
        >
          Resend verification email
        </Button>
        <p className="mt-6 text-sm text-muted-foreground">
          Already verified?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
