"use client";

import { useConvex } from "convex/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageShell, SettingsGroup, SettingsRow } from "@/components/layouts/surface";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";
import { track } from "@nexa/analytics/react";

// Account deletion is out of scope for this cutover (single-owner app, no self-serve
// deletion flow ported) — export only.

export default function DataPage() {
  const { token } = useSession();
  const convex = useConvex();

  async function downloadJson() {
    if (!token) return;
    const data = await convex.query(api.export.exportJson, { sessionToken: token });
    track("data_exported", { format: "json" });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexa-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON export downloaded");
  }

  async function downloadCsv() {
    if (!token) return;
    const csv = await convex.query(api.export.exportCsv, { sessionToken: token });
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
    <PageShell title="Data & privacy" description="Export your records." backHref="/profile" backLabel="Profile" narrow>
      <SettingsGroup label="Export" description="Download all your financial records.">
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
    </PageShell>
  );
}
