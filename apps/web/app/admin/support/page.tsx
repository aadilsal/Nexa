"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

interface Ticket {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  userId: string | null;
  guestEmail: string | null;
  hasSnapshot: boolean;
  createdAt: string;
  snapshot: { id: string; status: string; expiresAt: string } | null;
}

export default function AdminSupportPage() {
  const queryClient = useQueryClient();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [snapshotData, setSnapshotData] = useState<Record<string, unknown> | null>(null);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: () => api<Ticket[]>("/admin/support/tickets"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/admin/support/tickets/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
  });

  async function viewSnapshot(ticketId: string) {
    if (reason.length < 10) {
      toast.error("Please provide a reason (min 10 characters)");
      return;
    }
    try {
      const data = await api<{ payload: unknown }>(
        `/admin/support/tickets/${ticketId}/snapshot`,
        { method: "POST", body: JSON.stringify({ reason }) },
      );
      setSnapshotData(data.payload as Record<string, unknown>);
      setViewingId(ticketId);
      toast.success("Snapshot loaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load snapshot");
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Loading tickets...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Support Inbox</h1>

      <div className="space-y-4">
        {tickets?.map((ticket) => (
          <Card key={ticket.id} className="p-4">
            <div className="mb-2 flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">{ticket.subject}</CardTitle>
                <CardDescription>
                  {ticket.category} &middot; {ticket.status} &middot;{" "}
                  {ticket.userId ?? ticket.guestEmail ?? "Guest"}
                </CardDescription>
              </div>
              <select
                value={ticket.status}
                onChange={(e) =>
                  updateStatus.mutate({ id: ticket.id, status: e.target.value })
                }
                className="rounded-md border border-input bg-background px-2 py-1 text-sm"
              >
                {["OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ),
                )}
              </select>
            </div>
            <p className="text-sm text-muted-foreground">{ticket.description}</p>

            {ticket.hasSnapshot && ticket.snapshot?.status === "ACTIVE" && (
              <div className="mt-4 border-t border-border pt-4">
                <input
                  type="text"
                  placeholder="Reason for viewing snapshot (required)"
                  value={viewingId === ticket.id ? reason : ""}
                  onChange={(e) => {
                    setViewingId(ticket.id);
                    setReason(e.target.value);
                  }}
                  className="mb-2 w-full rounded-md border border-input px-3 py-2 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewSnapshot(ticket.id)}
                >
                  View financial snapshot
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {snapshotData && (
        <Card className="mt-6 p-4">
          <CardTitle className="mb-2">Snapshot data (read-only)</CardTitle>
          <pre className="max-h-96 overflow-auto rounded bg-muted p-4 text-xs">
            {JSON.stringify(snapshotData, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
