"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PublicContactSchema, type PublicContactInput } from "@nexa/shared";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { SUPPORT_EMAIL } from "@/lib/marketing-content";
import { api } from "@/lib/api";

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PublicContactInput>({
    resolver: zodResolver(PublicContactSchema),
    mode: "onBlur",
    defaultValues: { name: "", email: "", message: "" },
  });

  async function onSubmit(data: PublicContactInput) {
    try {
      await api("/support/contact", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast.success("Message sent — we'll get back to you soon.");
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    }
  }

  return (
    <MarketingPageShell
      title="Contact Us"
      description="Have a question? We typically respond within 1–2 business days."
    >
      <Card className="mb-8 p-6">
        <CardTitle className="mb-2">Support email</CardTitle>
        <CardDescription className="text-base text-foreground">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-primary hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </CardDescription>
        <p className="mt-4 text-sm text-muted-foreground">
          Logged in? Use{" "}
          <Link href="/support" className="text-primary hover:underline">
            Support &amp; Feedback
          </Link>{" "}
          for faster help with account-specific issues.
        </p>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Name" htmlFor="name" error={errors.name?.message}>
          <Input
            id="name"
            maxLength={100}
            error={!!errors.name}
            {...register("name")}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            maxLength={255}
            error={!!errors.email}
            {...register("email")}
          />
        </FormField>

        <FormField
          label="Message"
          htmlFor="message"
          error={errors.message?.message}
        >
          <Textarea
            id="message"
            rows={5}
            maxLength={5000}
            error={!!errors.message}
            {...register("message")}
          />
        </FormField>

        <Button type="submit" loading={isSubmitting}>
          Send Message
        </Button>
      </form>
    </MarketingPageShell>
  );
}
