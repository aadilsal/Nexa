"use client";

import { useQuery } from "@tanstack/react-query";
import { useAppRouter } from "@/lib/navigation";
import { useEffect } from "react";
import { AdminNav } from "@/components/admin-nav";
import { AdminMfaGate } from "@/components/admin-mfa-gate";
import { DashboardSkeleton } from "@/components/widgets/dashboard-skeleton";
import { api } from "@/lib/api";
import { hasLocalAuthSession, useSession } from "@/lib/auth-client";

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
  const { data: session, isPending: sessionPending, isRefetching } =
    useSession();
  const router = useAppRouter();

  const { data: admin, isLoading, isError } = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => api<AdminMe>("/admin/me"),
    enabled: Boolean(session),
    retry: false,
  });

  useEffect(() => {
    if (sessionPending || isRefetching) return;
    if (!session && !hasLocalAuthSession()) {
      router.replace("/login?redirect=/admin");
    }
  }, [session, sessionPending, isRefetching, router]);

  useEffect(() => {
    if (admin && !ADMIN_ROLES.has(admin.role)) {
      router.replace("/dashboard");
    }
  }, [admin, router]);

  if (
    sessionPending ||
    isRefetching ||
    isLoading ||
    (!session && hasLocalAuthSession())
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !admin || !ADMIN_ROLES.has(admin.role)) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNav />
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">
          <AdminMfaGate>{children}</AdminMfaGate>
        </div>
      </div>
    </div>
  );
}
