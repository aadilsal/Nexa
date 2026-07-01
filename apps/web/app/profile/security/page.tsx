"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
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
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <AppNav />
      <Link href="/profile" className="text-sm text-primary hover:underline">
        ← Back to profile
      </Link>
      <h1 className="mb-8 mt-4 text-2xl font-bold">Security</h1>

      <div className="space-y-6">
        <Card>
          <CardTitle className="mb-2">Passkeys</CardTitle>
          <CardDescription className="mb-4">
            Sign in with Face ID, fingerprint, or device PIN.
          </CardDescription>
          <Button
            onClick={() => addPasskey.mutate()}
            disabled={addPasskey.isPending}
          >
            {addPasskey.isPending ? "Adding..." : "Add passkey"}
          </Button>
          <ul className="mt-4 space-y-2 text-sm">
            {profile?.passkeys.map((pk) => (
              <li key={pk.id} className="flex justify-between rounded-lg bg-muted px-3 py-2">
                <span>{pk.name ?? "Passkey"}</span>
                <span className="text-muted-foreground">
                  {pk.createdAt
                    ? new Date(pk.createdAt).toLocaleDateString()
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle className="mb-2">Password</CardTitle>
          <CardDescription className="mb-4">
            Reset your password via email. Other sessions will be signed out.
          </CardDescription>
          <Link href="/forgot-password">
            <Button variant="outline">Reset password</Button>
          </Link>
        </Card>
      </div>
    </main>
  );
}
