"use client";

import { useQuery, useMutation } from "convex/react";
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
  DEFAULT_TIMEZONE,
  isSupportedTimezone,
  DEFAULT_CURRENCY,
} from "@nexa/shared";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { CurrencySelect } from "@/components/currency-select";
import { TimezoneSelect } from "@/components/timezone-select";
import { PageShell, SettingsGroup, SettingsLinkRow, SettingsRow } from "@/components/layouts/surface";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";
import { useAppRouter } from "@/lib/navigation";
import { NotificationsToggle } from "@/components/notifications-toggle";
import { FEATURE_HELP } from "@/lib/feature-help";

export default function ProfilePage() {
  const { token, logout } = useSession();
  const router = useAppRouter();
  const profile = useQuery(api.settings.get, token ? { sessionToken: token } : "skip");
  const updateProfile = useMutation(api.settings.updateProfile);
  const updateSettings = useMutation(api.settings.updateSettings);

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
    watch: watchTimezone,
    setValue: setTimezoneValue,
    formState: { errors: timezoneErrors, isSubmitting: isSavingTimezone },
  } = useForm<ProfileTimezoneFormInput>({
    resolver: zodResolver(ProfileTimezoneFormSchema),
    mode: "onBlur",
    defaultValues: { timezone: DEFAULT_TIMEZONE },
  });

  const watchedTimezone = watchTimezone("timezone");

  const {
    register: registerCurrency,
    handleSubmit: handleCurrencySubmit,
    reset: resetCurrency,
    watch: watchCurrency,
    setValue: setCurrencyValue,
  } = useForm<ProfileCurrencyFormInput>({
    resolver: zodResolver(ProfileCurrencyFormSchema),
    mode: "onBlur",
    defaultValues: { primaryCurrency: DEFAULT_CURRENCY },
  });

  const watchedPrimaryCurrency = watchCurrency("primaryCurrency");

  useEffect(() => {
    if (profile) {
      resetName({ name: profile.name ?? "" });
      resetTimezone({ timezone: isSupportedTimezone(profile.timezone) ? profile.timezone : DEFAULT_TIMEZONE });
      resetCurrency({ primaryCurrency: (profile.primaryCurrency as typeof DEFAULT_CURRENCY) ?? DEFAULT_CURRENCY });
    }
  }, [profile, resetName, resetTimezone, resetCurrency]);

  if (profile === undefined) {
    return (
      <PageShell title="Profile" narrow>
        <div className="h-48 animate-pulse rounded-xl bg-muted/40" />
      </PageShell>
    );
  }

  async function saveName(data: ProfileNameFormInput) {
    if (!token) return;
    try {
      await updateProfile({ sessionToken: token, name: data.name });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function saveSettings(body: { timezone?: string; primaryCurrency?: string }) {
    if (!token) return;
    try {
      await updateSettings({ sessionToken: token, ...body });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <PageShell title="Settings" narrow>
      <div className="space-y-2">
        <SettingsGroup label="Account">
          <SettingsRow>
            <form onSubmit={handleNameSubmit(saveName)} noValidate>
              <FormField label="Name" htmlFor="profile-name" error={nameErrors.name?.message}>
                <div className="flex gap-2">
                  <Input id="profile-name" error={!!nameErrors.name} {...registerName("name")} />
                  <Button type="submit" loading={isSavingName}>
                    Save
                  </Button>
                </div>
              </FormField>
            </form>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup label="Financial plan">
          <SettingsLinkRow href="/profile/plan" title="Bills & income" description="Update fixed bills, expected income, and variable spending" />
          <SettingsLinkRow href="/goals" title="Goals" description="Savings targets and emergency fund" />
        </SettingsGroup>

        <SettingsGroup label="Preferences">
          <SettingsRow>
            <form onSubmit={handleTimezoneSubmit((data) => saveSettings({ timezone: data.timezone }))} noValidate className="space-y-3">
              <FormField label="Timezone" htmlFor="timezone" error={timezoneErrors.timezone?.message} info={FEATURE_HELP.timezone}>
                <input type="hidden" {...registerTimezone("timezone")} />
                <div className="flex gap-2">
                  <TimezoneSelect id="timezone" value={watchedTimezone} error={!!timezoneErrors.timezone} onChange={(value) => setTimezoneValue("timezone", value)} />
                  <Button type="submit" loading={isSavingTimezone}>
                    Save
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Used for daily Safe To Spend resets.</p>
              </FormField>
            </form>
          </SettingsRow>
          <SettingsRow>
            <form onSubmit={handleCurrencySubmit((data) => saveSettings({ primaryCurrency: data.primaryCurrency }))} noValidate className="space-y-3">
              <FormField label="Primary currency" htmlFor="profile-currency" info={FEATURE_HELP.primaryCurrency}>
                <input type="hidden" {...registerCurrency("primaryCurrency")} />
                <div className="flex gap-2">
                  <CurrencySelect id="profile-currency" value={watchedPrimaryCurrency} onChange={(value) => setCurrencyValue("primaryCurrency", value)} />
                  <Button type="submit">Save</Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Exchange rates are updated automatically. Mixed-currency income and expenses convert to this currency.</p>
              </FormField>
            </form>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup label="Automation & data">
          <NotificationsToggle />
          <SettingsLinkRow href="/profile/auto-import" title="Auto-import" description="Log spending from bank SMS and emails" />
          <SettingsLinkRow href="/profile/data" title="Export data" description="Download your records" />
        </SettingsGroup>

        <SettingsGroup label="Account">
          <SettingsLinkRow
            title="Sign out"
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
          />
        </SettingsGroup>
      </div>
    </PageShell>
  );
}
