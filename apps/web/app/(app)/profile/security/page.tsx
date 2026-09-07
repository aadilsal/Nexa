"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/ui/form-field";
import { PageShell, SettingsGroup, SettingsRow } from "@/components/layouts/surface";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";

// Single-owner app: no passkeys, no email-based reset — a recovery code (given once at
// setup) is the account-recovery path instead. This page only handles a normal
// know-your-current-password change.

export default function SecurityPage() {
  const { token } = useSession();
  const changePassword = useAction(api.auth.changePassword);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    try {
      await changePassword({ sessionToken: token, currentPassword, newPassword });
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell title="Security" description="Change your account password." backHref="/profile" backLabel="Profile" narrow>
      <SettingsGroup label="Password">
        <SettingsRow>
          <form onSubmit={onSubmit} className="space-y-3" noValidate>
            <FormField label="Current password" htmlFor="current-password">
              <PasswordInput id="current-password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </FormField>
            <FormField label="New password" htmlFor="new-password">
              <PasswordInput id="new-password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={12} required />
            </FormField>
            <Button type="submit" loading={isSubmitting}>
              Update password
            </Button>
          </form>
        </SettingsRow>
      </SettingsGroup>
    </PageShell>
  );
}
