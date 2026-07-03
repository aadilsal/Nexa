"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import { api } from "@/lib/api";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api("/support/contact", {
        method: "POST",
        body: JSON.stringify({ name, email, message }),
      });
      toast.success("Message sent — we'll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <div className="mx-auto max-w-2xl flex-1 px-4 py-12">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to home
        </Link>

        <h1 className="mb-4 text-3xl font-bold">Contact Us</h1>
        <p className="mb-8 text-muted-foreground">
          Have a question? We typically respond within 1–2 business days.
        </p>

        <Card className="mb-8 p-6">
          <CardTitle className="mb-2">Support email</CardTitle>
          <CardDescription className="text-base text-foreground">
            <a
              href="mailto:support@nexa.app"
              className="text-primary hover:underline"
            >
              support@nexa.app
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={5000}
              rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </div>
      <SiteFooter />
    </main>
  );
}
