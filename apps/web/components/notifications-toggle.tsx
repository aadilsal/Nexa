"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";
import { currentSubscription, pushSupport, subscribeDevice, type PushSupport } from "@/lib/push-client";

/** Settings row: turn push notifications on/off for this device. */
export function NotificationsToggle() {
  const { token } = useSession();
  const publicKey = useQuery(api.push.publicKey, {});
  const subscribe = useMutation(api.push.subscribe);
  const unsubscribe = useMutation(api.push.unsubscribe);
  const [support, setSupport] = useState<PushSupport>("unsupported");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupport(pushSupport());
    void currentSubscription().then((sub) => setEnabled(Boolean(sub)));
  }, []);

  async function toggle() {
    if (!token || !publicKey) return;
    setBusy(true);
    try {
      if (enabled) {
        const sub = await currentSubscription();
        if (sub) {
          await unsubscribe({ sessionToken: token, endpoint: sub.endpoint });
          await sub.unsubscribe();
        }
        setEnabled(false);
      } else {
        const keys = await subscribeDevice(publicKey);
        await subscribe({ sessionToken: token, ...keys });
        setEnabled(true);
        toast.success("Notifications on for this device");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't change notifications");
    } finally {
      setBusy(false);
    }
  }

  const hint =
    support === "needs-home-screen"
      ? "On iPhone: tap Share → Add to Home Screen, then open Nexa from there to turn these on."
      : support === "unsupported"
        ? "This browser doesn't support notifications."
        : publicKey === null
          ? "Notifications aren't configured on the server yet."
          : "Imported transactions, budget alerts, bill and Zakat reminders.";

  return (
    <div className="flex min-h-14 items-center gap-3 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Notifications</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
      </div>
      {support === "supported" && publicKey ? (
        <Button size="sm" variant={enabled ? "outline" : "default"} onClick={toggle} loading={busy}>
          {enabled ? "Turn off" : "Turn on"}
        </Button>
      ) : null}
    </div>
  );
}
