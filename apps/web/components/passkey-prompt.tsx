"use client";

import { motion, AnimatePresence } from "motion/react";
import { Fingerprint, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

interface PasskeyPromptProps {
  open: boolean;
  onDismiss: () => void;
}

export function PasskeyPrompt({ open, onDismiss }: PasskeyPromptProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="passkey-prompt-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-card shadow-floating"
          >
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/12 to-transparent" />

            <button
              type="button"
              onClick={onDismiss}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative px-8 pb-8 pt-10 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <Fingerprint className="h-8 w-8 text-primary" strokeWidth={1.75} />
              </div>

              <h2
                id="passkey-prompt-title"
                className="text-xl font-semibold tracking-tight"
              >
                Add a passkey?
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Sign in faster with Face ID, fingerprint, or Windows Hello — more
                secure than passwords alone.
              </p>

              <div className="mt-6 flex items-start gap-3 rounded-xl bg-muted/40 p-4 text-left text-sm">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-muted-foreground">
                  Passkeys stay on your device. Nexa never sees your biometric
                  data.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
                <Button
                  className="flex-1"
                  onClick={handleAddPasskey}
                  loading={loading}
                >
                  Add passkey
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onDismiss}
                  disabled={loading}
                >
                  Not now
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function usePasskeyPrompt(enabled = true) {
  const [show, setShow] = useState(false);

  const dismissMutation = useMutation({
    mutationFn: (dismissed: boolean) =>
      api("/users/settings", {
        method: "PATCH",
        body: JSON.stringify({ passkeyPromptDismissed: dismissed }),
      }),
  });

  useEffect(() => {
    if (!enabled) {
      setShow(false);
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const profile = await api<{
          passkeys: unknown[];
          settings: { passkeyPromptDismissed: boolean };
        }>("/users/me");

        if (cancelled) return;

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

    const timer = window.setTimeout(() => {
      void check();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled]);

  function dismiss() {
    setShow(false);
    dismissMutation.mutate(true);
  }

  return { show, dismiss };
}
