"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => api<Record<string, unknown>>(`/admin/users/${userId}`),
  });

  if (isLoading || !user) {
    return <p className="text-muted-foreground">Loading user...</p>;
  }

  const activity = user.activity as Record<string, number> | null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">User Profile</h1>

      <Card className="mb-4 p-6">
        <CardTitle>{String(user.name ?? user.email)}</CardTitle>
        <CardDescription className="mt-1">{String(user.email)}</CardDescription>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Signup</dt>
            <dd>{new Date(String(user.signupDate)).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd>{String(user.role)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Onboarding</dt>
            <dd>{user.onboardingComplete ? "Complete" : "Incomplete"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Active sessions</dt>
            <dd>{String(user.activeSessionCount)}</dd>
          </div>
        </dl>
      </Card>

      {activity && (
        <Card className="p-6">
          <CardTitle className="mb-4">Activity counts</CardTitle>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Transactions logged</dt>
              <dd>{activity.transactionsLogged}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Goals created</dt>
              <dd>{activity.goalsCreated}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">AI messages</dt>
              <dd>{activity.aiMessagesSent}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Simulations run</dt>
              <dd>{activity.simulationsRun}</dd>
            </div>
          </dl>
        </Card>
      )}
    </div>
  );
}
