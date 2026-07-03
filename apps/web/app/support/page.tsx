"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { track } from "@nexa/analytics/react";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

interface Ticket {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  hasSnapshot: boolean;
  createdAt: string;
  snapshot: {
    status: string;
    expiresAt: string;
    revokedAt: string | null;
    accessLogs: Array<{
      adminEmail: string;
      reason: string;
      createdAt: string;
    }>;
  } | null;
}

const CATEGORIES = [
  { value: "BUG", label: "Bug Report" },
  { value: "FEEDBACK", label: "Feedback" },
  { value: "FEATURE_REQUEST", label: "Feature Request" },
  { value: "OTHER", label: "Other" },
] as const;

function detectBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Other";
}

function detectOs() {
  const ua = navigator.userAgent;
  if (ua.includes("Win")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Other";
}

export default function SupportPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<string>("FEEDBACK");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [includeSnapshot, setIncludeSnapshot] = useState(false);
  const [snapshotConsent, setSnapshotConsent] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [session, isPending, router, pathname]);

  const { data: tickets } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => api<Ticket[]>("/support/tickets"),
    enabled: Boolean(session),
  });

  const createTicket = useMutation({
    mutationFn: () =>
      api("/support/tickets", {
        method: "POST",
        body: JSON.stringify({
          category,
          subject,
          description,
          includeSnapshot: category === "BUG" && includeSnapshot,
          snapshotConsent: category === "BUG" && snapshotConsent,
          route: pathname,
          browser: detectBrowser(),
          os: detectOs(),
          deviceType: /Mobi|Android/i.test(navigator.userAgent)
            ? "mobile"
            : "desktop",
          appVersion: "0.0.1",
        }),
      }),
    onSuccess: () => {
      toast.success("Support request submitted");
      track("support_ticket_created", { category });
      setSubject("");
      setDescription("");
      setIncludeSnapshot(false);
      setSnapshotConsent(false);
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to submit"),
  });

  const revokeSnapshot = useMutation({
    mutationFn: (ticketId: string) =>
      api(`/support/tickets/${ticketId}/revoke-snapshot`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Snapshot access revoked");
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });

  if (isPending || !session) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <AppNav />

      <h1 className="mb-2 text-2xl font-bold">Support &amp; Feedback</h1>
      <p className="mb-8 text-muted-foreground">
        Report bugs, share feedback, or request features. We never access your
        financial data unless you explicitly choose to share it.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createTicket.mutate();
        }}
        className="mb-12 space-y-4"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (e.target.value !== "BUG") {
                setIncludeSnapshot(false);
                setSnapshotConsent(false);
              }
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Subject</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength={200}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={5000}
            rows={5}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Describe the issue or your feedback..."
          />
        </div>

        {category === "BUG" && (
          <Card className="border-primary/20 bg-primary/5 p-4">
            <CardTitle className="mb-2 text-base">
              Optional financial snapshot
            </CardTitle>
            <CardDescription className="mb-4 text-sm text-foreground">
              Nexa cannot access your financial information unless you explicitly
              choose to share it. If enabled, support staff can temporarily view
              your cycle, transactions, goals, and engine calculations to debug
              the issue. Snapshots expire after 72 hours and you can revoke
              access anytime.
            </CardDescription>

            <label className="mb-3 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeSnapshot}
                onChange={(e) => {
                  setIncludeSnapshot(e.target.checked);
                  if (!e.target.checked) setSnapshotConsent(false);
                }}
                className="mt-1"
              />
              Include financial snapshot
            </label>

            {includeSnapshot && (
              <>
                <ul className="mb-3 ml-6 list-disc text-sm text-muted-foreground">
                  <li>Current financial cycle dates</li>
                  <li>Transaction count and details</li>
                  <li>Goals and engine calculations</li>
                  <li>Safe To Spend and Financial Health Score</li>
                </ul>
                <label className="flex items-start gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={snapshotConsent}
                    onChange={(e) => setSnapshotConsent(e.target.checked)}
                    required={includeSnapshot}
                    className="mt-1"
                  />
                  I consent to sharing this snapshot with Nexa support
                </label>
              </>
            )}
          </Card>
        )}

        <Button type="submit" disabled={createTicket.isPending}>
          {createTicket.isPending ? "Submitting..." : "Submit"}
        </Button>
      </form>

      {tickets && tickets.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Your requests</h2>
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.category} &middot;{" "}
                      {new Date(ticket.createdAt).toLocaleDateString()} &middot;{" "}
                      {ticket.status}
                    </p>
                  </div>
                  {ticket.hasSnapshot && ticket.snapshot?.status === "ACTIVE" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeSnapshot.mutate(ticket.id)}
                    >
                      Revoke snapshot
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {ticket.description}
                </p>
                {ticket.snapshot?.accessLogs &&
                  ticket.snapshot.accessLogs.length > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="mb-1 text-xs font-medium">
                        Snapshot access history
                      </p>
                      {ticket.snapshot.accessLogs.map((log, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          {log.adminEmail} viewed on{" "}
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      ))}
                    </div>
                  )}
              </Card>
            ))}
          </div>
        </section>
      )}

      <p className="mt-8 text-sm text-muted-foreground">
        General inquiries? Visit our{" "}
        <Link href="/contact" className="text-primary hover:underline">
          Contact page
        </Link>
        .
      </p>
    </main>
  );
}
