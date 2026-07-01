"use client";

import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

interface PasskeyPromptProps {
  open: boolean;
  onDismiss: () => void;
}

export function PasskeyPrompt({ open, onDismiss }: PasskeyPromptProps) {
  const [loading, setLoading] = useState(false);

  async function handleAddPasskey() {
    setLoading(true);
    try {
      await authClient.passkey.addPasskey({ name: "This device" });
      toast.success("Passkey added! You can sign in with biometrics next time.");
      onDismiss();
    } catch {
      toast.error("Could not add passkey. Try again from Profile → Security.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <Card className="max-w-md">
              <CardTitle>Add a passkey?</CardTitle>
              <CardDescription className="mt-2">
                Sign in faster with Face ID, fingerprint, or Windows Hello. More
                secure than passwords alone.
              </CardDescription>
              <div className="mt-6 flex gap-3">
                <Button onClick={handleAddPasskey} disabled={loading}>
                  {loading ? "Setting up..." : "Add passkey"}
                </Button>
                <Button variant="outline" onClick={onDismiss}>
                  Not now
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function usePasskeyPrompt() {
  const router = useRouter();
  const [show, setShow] = useState(false);

  const dismissMutation = useMutation({
    mutationFn: (dismissed: boolean) =>
      api("/users/settings", {
        method: "PATCH",
        body: JSON.stringify({ passkeyPromptDismissed: dismissed }),
      }),
  });

  useEffect(() => {
    async function check() {
      try {
        const profile = await api<{
          passkeys: unknown[];
          settings: { passkeyPromptDismissed: boolean };
        }>("/users/me");

        if (
          profile.passkeys.length === 0 &&
          !profile.settings?.passkeyPromptDismissed
        ) {
          setShow(true);
        }
      } catch {
        // not logged in
      }
    }
    check();
  }, [router]);

  function dismiss() {
    setShow(false);
    dismissMutation.mutate(true);
  }

  return { show, dismiss };
}
