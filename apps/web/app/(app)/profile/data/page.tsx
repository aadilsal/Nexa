"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  HighlightSurface,
  PageShell,
  SettingsGroup,
  SettingsRow,
} from "@/components/layouts/surface";
import { api, apiText } from "@/lib/api";
import { track } from "@nexa/analytics/react";

export default function DataPage() {
  const queryClient = useQueryClient();

  const { data: deletionStatus } = useQuery({
    queryKey: ["deletion-status"],
    queryFn: () => api<{ pending: boolean; scheduledFor?: string }>("/account/deletion-status"),
  });

  const requestDeletion = useMutation({
    mutationFn: () => api("/account", { method: "DELETE" }),
    onSuccess: () => {
      track("account_deleted");
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
    track("data_exported", { format: "json" });
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
    track("data_exported", { format: "csv" });
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
    <PageShell
      title="Data & privacy"
      description="Export your records or manage account deletion."
      backHref="/profile"
      backLabel="Profile"
      narrow
    >
      <SettingsGroup
        label="Export"
        description="Download all your financial records. Limited to 3 exports per hour."
      >
        <SettingsRow>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadJson}>
              Export JSON
            </Button>
            <Button variant="outline" onClick={downloadCsv}>
              Export CSV
            </Button>
          </div>
        </SettingsRow>
      </SettingsGroup>

      <div className="border-t border-border/50 pt-8">
        <HighlightSurface variant="destructive">
          <p className="font-medium text-foreground">Delete account</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your data will be permanently deleted after 30 days. You can cancel
            during the grace period.
          </p>
          <div className="mt-4">
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
          </div>
        </HighlightSurface>
      </div>
    </PageShell>
  );
}
