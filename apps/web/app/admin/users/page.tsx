"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

interface UserEntry {
  id: string;
  email: string;
  name: string | null;
  signupDate: string;
  lastLoginAt: string | null;
  onboardingComplete: boolean;
  role: string;
  activity: {
    transactionsLogged: number;
    goalsCreated: number;
    aiMessagesSent: number;
    simulationsRun: number;
  } | null;
}

interface UsersResponse {
  users: UserEntry[];
  total: number;
  page: number;
}

export default function AdminUsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api<UsersResponse>("/admin/users"),
  });

  if (isLoading || !data) {
    return <p className="text-muted-foreground">Loading users...</p>;
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">User Directory</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Operational data only — no financial values.
      </p>

      <p className="mb-4 text-sm">{data.total} users total</p>

      <div className="space-y-3">
        {data.users.map((user) => (
          <Link key={user.id} href={`/admin/users/${user.id}`}>
            <Card className="p-4 transition-colors hover:bg-muted/50">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">
                    {user.name ?? user.email}
                  </CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
                <span className="text-xs text-muted-foreground">
                  {user.onboardingComplete ? "Onboarded" : "Pending"}
                </span>
              </div>
              {user.activity && (
                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                  <span>{user.activity.transactionsLogged} txns logged</span>
                  <span>{user.activity.goalsCreated} goals</span>
                  <span>{user.activity.aiMessagesSent} AI msgs</span>
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
