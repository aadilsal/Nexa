"use client";

import { useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageShell, SettingsGroup, SettingsList, SettingsListItem, SettingsRow } from "@/components/layouts/surface";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";
import { buildGmailAppsScript } from "@/lib/gmail-apps-script";

const ENDPOINT = `${(process.env.NEXT_PUBLIC_CONVEX_URL ?? "").trim().replace(/\/+$/, "").replace(/\.convex\.cloud$/, ".convex.site")}/ingest`;

const STATUS_LABEL = { LOGGED: "Logged", IGNORED: "Skipped", DUPLICATE: "Duplicate" } as const;

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
  } catch {
    toast.error("Could not copy — select and copy it manually");
  }
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm leading-relaxed">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{n}</span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

export default function AutoImportPage() {
  const { token } = useSession();
  const config = useQuery(api.ingest.getConfig, token ? { sessionToken: token } : "skip");
  const rotateToken = useAction(api.ingest.rotateToken);
  const setOwnerAliases = useMutation(api.ingest.setOwnerAliases);

  const [importToken, setImportToken] = useState<string | null>(null);
  const [aliases, setAliases] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (config) setAliases(config.ownerAliases.join("\n"));
  }, [config]);

  async function generate() {
    if (!token) return;
    if (config?.configured && !confirm("Replace the current token? Your Shortcut and Gmail script will stop working until you paste the new one.")) return;
    setBusy(true);
    try {
      const result = await rotateToken({ sessionToken: token });
      setImportToken(result.token);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create token");
    } finally {
      setBusy(false);
    }
  }

  async function saveAliases() {
    if (!token) return;
    try {
      await setOwnerAliases({ sessionToken: token, ownerAliases: aliases.split("\n") });
      toast.success("Saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    }
  }

  return (
    <PageShell
      title="Auto-import"
      description="Log spending automatically from bank SMS and emails."
      backHref="/profile"
      backLabel="Profile"
      narrow
    >
      <SettingsGroup label="1. Import token" description="Your iPhone and Gmail use this to send alerts to Nexa.">
        <SettingsRow>
          <div className="w-full space-y-3">
            {importToken ? (
              <>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Copy it now — it won&apos;t be shown again.</p>
                <code className="block break-all rounded-lg bg-muted p-3 text-xs">{importToken}</code>
                <Button className="w-full sm:w-auto" onClick={() => copy(importToken, "Token")}>Copy token</Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {config?.configured
                  ? `Token is set${config.lastUsedAt ? ` · last used ${new Date(config.lastUsedAt).toLocaleString()}` : ""}.`
                  : "No token yet."}
              </p>
            )}
            <Button variant={config?.configured ? "outline" : "default"} className="w-full sm:w-auto" onClick={generate} loading={busy}>
              {config?.configured ? "Replace token" : "Generate token"}
            </Button>
          </div>
        </SettingsRow>
      </SettingsGroup>

      {config?.configured ? (
        <SettingsGroup label="2. Your own account names" description="One per line, as banks show them (e.g. A.SALMAN). Transfers between your own accounts are skipped.">
          <SettingsRow>
            <div className="w-full space-y-3">
              <Textarea rows={3} value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder={"A.SALMAN\nADIL SALMAN BUTT"} />
              <Button variant="outline" className="w-full sm:w-auto" onClick={saveAliases}>Save names</Button>
            </div>
          </SettingsRow>
        </SettingsGroup>
      ) : null}

      <SettingsGroup label="3. iPhone text messages" description="Uses the built-in Shortcuts app. Takes about 2 minutes.">
        <SettingsRow>
          <ol className="w-full space-y-3">
            <Step n={1}>Open <b>Shortcuts</b> → <b>Automation</b> → <b>+</b> → <b>Message</b>.</Step>
            <Step n={2}>Tap <b>Sender</b> and pick your bank&apos;s SMS contact (repeat this whole setup for each bank). Choose <b>Run Immediately</b>.</Step>
            <Step n={3}>Add the action <b>Get Contents of URL</b> and paste this URL:
              <button type="button" onClick={() => copy(ENDPOINT, "URL")} className="mt-1 block w-full break-all rounded-lg bg-muted p-2 text-left font-mono text-xs">{ENDPOINT}</button>
            </Step>
            <Step n={4}>Set <b>Method</b> to POST. Add header <b>Authorization</b> = <code>Bearer</code> + space + your token.</Step>
            <Step n={5}>Set <b>Request Body</b> to JSON with two fields: <b>text</b> = <i>Shortcut Input → Content</i>, and <b>source</b> = <code>sms</code>. Done.</Step>
          </ol>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup label="4. Gmail bank emails" description="Checks for new Meezan, ABL and NayaPay alerts every 5 minutes.">
        <SettingsRow>
          <ol className="w-full space-y-3">
            <Step n={1}>
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => copy(buildGmailAppsScript(ENDPOINT, importToken), "Script")}>
                Copy Gmail script
              </Button>
              {!importToken ? <span className="mt-1 block text-xs text-muted-foreground">Generate a token first to have it filled in, or paste it into the script yourself.</span> : null}
            </Step>
            <Step n={2}>Open <a className="text-primary underline" href="https://script.google.com/home/projects/create" target="_blank" rel="noreferrer">script.google.com</a>, replace everything with the script, and save.</Step>
            <Step n={3}>Choose <b>setup</b> in the toolbar, press <b>Run</b>, and allow Gmail access.</Step>
          </ol>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup label="Recent alerts">
        {config === undefined ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
        ) : config.recent.length ? (
          <SettingsList>
            {config.recent.map((m) => (
              <SettingsListItem key={m.id}>
                <span className="font-medium">
                  {STATUS_LABEL[m.status]} <span className="font-normal text-muted-foreground">· {m.source === "sms" ? "SMS" : "Email"}</span>
                </span>
                <span className="text-muted-foreground">
                  {m.reason ? `${m.reason} · ` : ""}
                  {new Date(m.createdAt).toLocaleString()}
                </span>
              </SettingsListItem>
            ))}
          </SettingsList>
        ) : (
          <p className="py-2 text-sm text-muted-foreground">Nothing received yet.</p>
        )}
      </SettingsGroup>
    </PageShell>
  );
}
