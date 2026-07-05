"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppRouter } from "@/lib/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateSupportTicketFormSchema,
  type CreateSupportTicketFormInput,
} from "@nexa/shared";
import { toast } from "sonner";
import { track } from "@nexa/analytics/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { SupportTicketCategorySelect } from "@/components/support-ticket-category-select";
import {
  ContentSection,
  HighlightSurface,
  PageShell,
} from "@/components/layouts/surface";
import { api } from "@/lib/api";
import { hasLocalAuthSession, useSession } from "@/lib/auth-client";

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
  const { data: session, isPending, isRefetching } = useSession();
  const router = useAppRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [includeSnapshot, setIncludeSnapshot] = useState(false);
  const [snapshotConsent, setSnapshotConsent] = useState(false);
  const [snapshotError, setSnapshotError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateSupportTicketFormInput>({
    resolver: zodResolver(CreateSupportTicketFormSchema),
    mode: "onBlur",
    defaultValues: {
      category: "FEEDBACK",
      subject: "",
      description: "",
    },
  });

  const category = watch("category");

  useEffect(() => {
    if (category !== "BUG") {
      setIncludeSnapshot(false);
      setSnapshotConsent(false);
      setSnapshotError("");
    }
  }, [category]);

  useEffect(() => {
    if (isPending || isRefetching) return;
    if (!session && !hasLocalAuthSession()) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [session, isPending, isRefetching, router, pathname]);

  const { data: tickets } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => api<Ticket[]>("/support/tickets"),
    enabled: Boolean(session),
  });

  const createTicket = useMutation({
    mutationFn: (data: CreateSupportTicketFormInput) =>
      api("/support/tickets", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          includeSnapshot: data.category === "BUG" && includeSnapshot,
          snapshotConsent: data.category === "BUG" && snapshotConsent,
          route: pathname,
          browser: detectBrowser(),
          os: detectOs(),
          deviceType: /Mobi|Android/i.test(navigator.userAgent)
            ? "mobile"
            : "desktop",
          appVersion: "0.0.1",
        }),
      }),
    onSuccess: (_data, variables) => {
      toast.success("Support request submitted");
      track("support_ticket_created", { category: variables.category });
      reset();
      setIncludeSnapshot(false);
      setSnapshotConsent(false);
      setSnapshotError("");
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to submit"),
  });

  function onSubmit(data: CreateSupportTicketFormInput) {
    if (data.category === "BUG" && includeSnapshot && !snapshotConsent) {
      setSnapshotError("You must consent to sharing the snapshot");
      return;
    }
    setSnapshotError("");
    createTicket.mutate(data);
  }

  const revokeSnapshot = useMutation({
    mutationFn: (ticketId: string) =>
      api(`/support/tickets/${ticketId}/revoke-snapshot`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Snapshot access revoked");
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });

  if (isPending || isRefetching || (!session && !hasLocalAuthSession())) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <PageShell
      title="Support & Feedback"
      description="Report bugs, share feedback, or request features. We never access your financial data unless you explicitly choose to share it."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Category" htmlFor="category">
          <SupportTicketCategorySelect
            id="category"
            value={category}
            onChange={(value) =>
              setValue("category", value, { shouldValidate: true })
            }
          />
        </FormField>

        <FormField
          label="Subject"
          htmlFor="subject"
          error={errors.subject?.message}
        >
          <Input
            id="subject"
            maxLength={200}
            error={!!errors.subject}
            {...register("subject")}
          />
        </FormField>

        <FormField
          label="Description"
          htmlFor="description"
          error={errors.description?.message}
        >
          <Textarea
            id="description"
            rows={5}
            maxLength={5000}
            placeholder="Describe the issue or your feedback..."
            error={!!errors.description}
            {...register("description")}
          />
        </FormField>

        {category === "BUG" && (
          <HighlightSurface variant="primary">
            <p className="text-base font-semibold">Optional financial snapshot</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Nexa cannot access your financial information unless you explicitly
              choose to share it. If enabled, support staff can temporarily view
              your cycle, transactions, goals, and engine calculations to debug
              the issue. Snapshots expire after 72 hours and you can revoke
              access anytime.
            </p>

            <label className="mt-4 flex items-start gap-2 text-sm">
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
                <ul className="mt-3 ml-6 list-disc text-sm text-muted-foreground">
                  <li>Current financial cycle dates</li>
                  <li>Transaction count and details</li>
                  <li>Goals and engine calculations</li>
                  <li>Safe To Spend and Financial Health Score</li>
                </ul>
                <label className="mt-3 flex items-start gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={snapshotConsent}
                    onChange={(e) => {
                      setSnapshotConsent(e.target.checked);
                      if (e.target.checked) setSnapshotError("");
                    }}
                    className="mt-1"
                  />
                  I consent to sharing this snapshot with Nexa support
                </label>
                {snapshotError ? (
                  <p className="mt-2 text-sm text-destructive" role="alert">
                    {snapshotError}
                  </p>
                ) : null}
              </>
            )}
          </HighlightSurface>
        )}

        <Button type="submit" loading={createTicket.isPending}>
          Submit
        </Button>
      </form>

      {tickets && tickets.length > 0 ? (
        <ContentSection title="Your requests" className="mt-12">
          <ul className="divide-y divide-border/50">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="py-5 first:pt-0 last:pb-0">
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
                    <div className="mt-3 border-t border-border/50 pt-3">
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
              </li>
            ))}
          </ul>
        </ContentSection>
      ) : null}

      <p className="mt-8 text-sm text-muted-foreground">
        General inquiries? Visit our{" "}
        <Link href="/contact" className="text-primary hover:underline">
          Contact page
        </Link>
        .
      </p>
    </PageShell>
  );
}
