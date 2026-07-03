"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminNav } from "@/components/admin-nav";
import { AdminMfaGate } from "@/components/admin-mfa-gate";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

const ADMIN_ROLES = new Set([
  "SUPPORT",
  "OPERATIONS",
  "ADMIN",
  "SUPER_ADMIN",
]);

interface AdminMe {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();

  const { data: admin, isLoading, isError } = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => api<AdminMe>("/admin/me"),
    enabled: Boolean(session),
    retry: false,
  });

  useEffect(() => {
    if (!sessionPending && !session) {
      router.replace("/login?redirect=/admin");
    }
  }, [session, sessionPending, router]);

  useEffect(() => {
    if (admin && !ADMIN_ROLES.has(admin.role)) {
      router.replace("/dashboard");
    }
  }, [admin, router]);

  if (sessionPending || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading admin...</p>
      </div>
    );
  }

  if (isError || !admin || !ADMIN_ROLES.has(admin.role)) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <div className="flex-1 overflow-auto p-8">
        <AdminMfaGate>{children}</AdminMfaGate>
      </div>
    </div>
  );
}
