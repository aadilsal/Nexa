"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api, apiText } from "@/lib/api";
import { captureEvent } from "@/lib/posthog";

export default function DataPage() {
  const queryClient = useQueryClient();

  const { data: deletionStatus } = useQuery({
    queryKey: ["deletion-status"],
    queryFn: () => api<{ pending: boolean; scheduledFor?: string }>("/account/deletion-status"),
  });

  const requestDeletion = useMutation({
    mutationFn: () => api("/account", { method: "DELETE" }),
    onSuccess: () => {
      captureEvent("account_deleted");
      toast.success("Account deletion scheduled (30-day grace period)");
      queryClient.invalidateQueries({ queryKey: ["deletion-status"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const cancelDeletion = useMutation({
    mutationFn: () => api("/account/cancel-deletion", { method: "POST", body: "{}" }),
    onSuccess: () => {
      toast.success("Deletion cancelled");
      queryClient.invalidateQueries({ queryKey: ["deletion-status"] });
    },
  });

  async function downloadJson() {
    const data = await api<unknown>("/export/json");
    captureEvent("data_exported", { format: "json" });
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexa-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON export downloaded");
  }

  async function downloadCsv() {
    const csv = await apiText("/export/csv");
    captureEvent("data_exported", { format: "csv" });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexa-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV export downloaded");
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <AppNav />
      <Link href="/profile" className="text-sm text-primary hover:underline">
        ← Back to profile
      </Link>
      <h1 className="mb-8 mt-4 text-2xl font-bold">Data & privacy</h1>

      <div className="space-y-6">
        <Card>
          <CardTitle className="mb-2">Export your data</CardTitle>
          <CardDescription className="mb-4">
            Download all your financial records. Limited to 3 exports per hour.
          </CardDescription>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadJson}>
              Export JSON
            </Button>
            <Button variant="outline" onClick={downloadCsv}>
              Export CSV
            </Button>
          </div>
        </Card>

        <Card className="border-destructive/30">
          <CardTitle className="mb-2">Delete account</CardTitle>
          <CardDescription className="mb-4">
            Your data will be permanently deleted after 30 days. You can cancel
            during the grace period.
          </CardDescription>
          {deletionStatus?.pending ? (
            <Button
              variant="outline"
              onClick={() => cancelDeletion.mutate()}
              disabled={cancelDeletion.isPending}
            >
              Cancel deletion
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => {
                if (
                  confirm(
                    "Delete your account? You have 30 days to cancel this request.",
                  )
                ) {
                  requestDeletion.mutate();
                }
              }}
              disabled={requestDeletion.isPending}
            >
              Request account deletion
            </Button>
          )}
        </Card>
      </div>
    </main>
  );
}
