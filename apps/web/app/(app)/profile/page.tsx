"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProfileNameFormSchema,
  ProfileTimezoneFormSchema,
  ProfileCurrencyFormSchema,
  type ProfileNameFormInput,
  type ProfileTimezoneFormInput,
  type ProfileCurrencyFormInput,
  type CurrencyCode,
} from "@nexa/shared";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { CurrencySelect } from "@/components/currency-select";
import {
  HighlightSurface,
  PageShell,
  SettingsGroup,
  SettingsLinkRow,
  SettingsRow,
} from "@/components/layouts/surface";
import { api } from "@/lib/api";
import { sendVerificationEmail } from "@/lib/auth-client";

interface Profile {
  user: {
    email: string;
    name: string | null;
    emailVerified: boolean;
    primaryPayday: number | null;
    preferredCycleStart: number | null;
  };
  settings: {
    timezone: string;
    weeklyReviewEmail: boolean;
    primaryCurrency: CurrencyCode;
  };
  passkeys: Array<{ id: string; name: string | null }>;
  pendingDeletion: { scheduledFor: string } | null;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api<Profile>("/users/me"),
  });

  const {
    register: registerName,
    handleSubmit: handleNameSubmit,
    reset: resetName,
    formState: { errors: nameErrors, isSubmitting: isSavingName },
  } = useForm<ProfileNameFormInput>({
    resolver: zodResolver(ProfileNameFormSchema),
    mode: "onBlur",
    defaultValues: { name: "" },
  });

  const {
    register: registerTimezone,
    handleSubmit: handleTimezoneSubmit,
    reset: resetTimezone,
    formState: { errors: timezoneErrors },
  } = useForm<ProfileTimezoneFormInput>({
    resolver: zodResolver(ProfileTimezoneFormSchema),
    mode: "onBlur",
    defaultValues: { timezone: "" },
  });

  const {
    register: registerCurrency,
    handleSubmit: handleCurrencySubmit,
    reset: resetCurrency,
    watch: watchCurrency,
    setValue: setCurrencyValue,
  } = useForm<ProfileCurrencyFormInput>({
    resolver: zodResolver(ProfileCurrencyFormSchema),
    mode: "onBlur",
    defaultValues: {
      primaryCurrency: "PKR",
    },
  });

  const watchedPrimaryCurrency = watchCurrency("primaryCurrency");

  useEffect(() => {
    if (profile) {
      resetName({ name: profile.user.name ?? "" });
      resetTimezone({ timezone: profile.settings.timezone });
      resetCurrency({
        primaryCurrency: profile.settings.primaryCurrency ?? "PKR",
      });
    }
  }, [profile, resetName, resetTimezone, resetCurrency]);

  const updateProfile = useMutation({
    mutationFn: (data: ProfileNameFormInput) =>
      api("/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile-currency"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Update failed"),
  });

  const updateSettings = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api("/users/settings", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile-currency"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Save failed"),
  });

  if (isLoading || !profile) {
    return (
      <PageShell title="Profile" narrow>
        <div className="h-48 animate-pulse rounded-xl bg-muted/40" />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Profile"
      description="Account, security, and preferences."
      narrow
    >
      <div className="space-y-2">
        <SettingsGroup label="Account">
          <SettingsRow>
            <form
              onSubmit={handleNameSubmit((data) => updateProfile.mutate(data))}
              noValidate
            >
              <FormField
                label="Name"
                htmlFor="profile-name"
                error={nameErrors.name?.message}
              >
                <div className="flex gap-2">
                  <Input
                    id="profile-name"
                    error={!!nameErrors.name}
                    {...registerName("name")}
                  />
                  <Button type="submit" loading={isSavingName}>
                    Save
                  </Button>
                </div>
              </FormField>
            </form>
          </SettingsRow>
          <SettingsRow label="Email">
            <p className="text-sm text-foreground">
              {profile.user.email}{" "}
              {profile.user.emailVerified ? (
                <span className="text-primary">(verified)</span>
              ) : (
                <span className="text-destructive">(not verified)</span>
              )}
            </p>
            {!profile.user.emailVerified ? (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-auto px-0 text-primary"
                onClick={() => {
                  sendVerificationEmail({
                    email: profile.user.email,
                    callbackURL: "/profile",
                  });
                  toast.success(
                    "Verification email sent — check console in dev",
                  );
                }}
              >
                Resend verification email
              </Button>
            ) : null}
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup label="Preferences">
          <SettingsRow label="Timezone">
            <Input
              id="timezone"
              error={!!timezoneErrors.timezone}
              {...registerTimezone("timezone", {
                onBlur: () => {
                  void handleTimezoneSubmit((data) =>
                    updateSettings.mutate(data),
                  )();
                },
              })}
            />
          </SettingsRow>
          <SettingsRow>
            <form
              onSubmit={handleCurrencySubmit((data) =>
                updateSettings.mutate({ primaryCurrency: data.primaryCurrency }),
              )}
              noValidate
              className="space-y-3"
            >
              <FormField label="Primary currency" htmlFor="profile-currency">
                <input type="hidden" {...registerCurrency("primaryCurrency")} />
                <div className="flex gap-2">
                  <CurrencySelect
                    id="profile-currency"
                    value={watchedPrimaryCurrency}
                    onChange={(value) =>
                      setCurrencyValue("primaryCurrency", value)
                    }
                  />
                  <Button type="submit">Save</Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Exchange rates are updated automatically. Mixed-currency
                  income and expenses convert to this currency.
                </p>
              </FormField>
            </form>
          </SettingsRow>
          <SettingsRow>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                defaultChecked={profile.settings.weeklyReviewEmail}
                onChange={(e) =>
                  updateSettings.mutate({ weeklyReviewEmail: e.target.checked })
                }
              />
              Send weekly review emails
            </label>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup label="Security & data">
          <SettingsLinkRow
            href="/profile/security"
            title="Security"
            description="Passkeys, password, and sign-in methods"
            meta={`${profile.passkeys.length} passkey(s) registered`}
          />
          <SettingsLinkRow
            href="/support"
            title="Help & support"
            description="Report bugs, share feedback, or request features"
          />
          <SettingsLinkRow
            href="/profile/data"
            title="Data & privacy"
            description="Export your data or manage account deletion"
          />
          <SettingsLinkRow
            href="/profile/activity"
            title="Activity log"
            description="Recent security events on your account"
          />
        </SettingsGroup>

        {profile.pendingDeletion ? (
          <div className="border-t border-border/50 pt-8">
            <HighlightSurface variant="destructive">
              <p className="font-medium text-destructive">Deletion scheduled</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Account will be deleted on{" "}
                {new Date(profile.pendingDeletion.scheduledFor).toLocaleDateString()}
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <a href="/profile/data">Cancel deletion</a>
              </Button>
            </HighlightSurface>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
