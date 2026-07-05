"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { GoalDetailCard, type TrackedGoal } from "@/components/goals/goal-detail-card";
import {
  GoalFormDialog,
  type GoalFormValues,
} from "@/components/goals/goal-form-dialog";
import { PageShell, StatStrip } from "@/components/layouts/surface";
import { EmptyState } from "@/components/widgets/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { APP_QUERY_STALE } from "@/lib/prefetch-app-data";
import { useCurrency } from "@/lib/currency";
import { FEATURE_HELP } from "@/lib/feature-help";
import { track } from "@nexa/analytics/react";

interface DashboardGoalsData {
  goals: TrackedGoal[];
  goalRisks: Array<{
    goalId: string;
    goalName: string;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    riskScore: number;
    factors: string[];
  }>;
}

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingGoal, setEditingGoal] = useState<TrackedGoal | null>(null);
  const [deleteGoal, setDeleteGoal] = useState<TrackedGoal | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardGoalsData>("/dashboard"),
    staleTime: APP_QUERY_STALE.dashboard,
  });

  const goals = data?.goals ?? [];
  const onTrackCount = goals.filter((goal) => goal.onTrack).length;

  const invalidateGoals = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["goals"] });
  };

  const createGoal = useMutation({
    mutationFn: (values: GoalFormValues) =>
      api("/goals", {
        method: "POST",
        body: JSON.stringify({
          name: values.name,
          targetAmount: values.targetAmount,
          targetDate: values.targetDate,
          priority: values.priority,
        }),
      }),
    onSuccess: () => {
      toast.success("Goal created");
      track("goal_created");
      setFormOpen(false);
      invalidateGoals();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not create goal"),
  });

  const updateGoal = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: GoalFormValues;
    }) =>
      api(`/goals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: values.name,
          targetAmount: values.targetAmount,
          targetDate: values.targetDate,
          priority: values.priority,
        }),
      }),
    onSuccess: () => {
      toast.success("Goal updated");
      setFormOpen(false);
      setEditingGoal(null);
      invalidateGoals();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not update goal"),
  });

  const removeGoal = useMutation({
    mutationFn: (id: string) =>
      api(`/goals/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Goal removed");
      setDeleteGoal(null);
      invalidateGoals();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not delete goal"),
  });

  function openCreateDialog() {
    setFormMode("create");
    setEditingGoal(null);
    setFormOpen(true);
  }

  function openEditDialog(goal: TrackedGoal) {
    setFormMode("edit");
    setEditingGoal(goal);
    setFormOpen(true);
  }

  async function handleFormSubmit(values: GoalFormValues) {
    if (formMode === "create") {
      await createGoal.mutateAsync(values);
      return;
    }

    if (!editingGoal) return;
    await updateGoal.mutateAsync({ id: editingGoal.id, values });
  }

  const sortedGoals = [...goals].sort((a, b) => {
    if (a.isEmergencyFund !== b.isEmergencyFund) {
      return a.isEmergencyFund ? -1 : 1;
    }
    return a.priority.localeCompare(b.priority);
  });

  return (
    <PageShell
      title="Goals"
      description="Set targets, track progress, and see when you'll reach each goal. Progress updates automatically from your cycle savings."
      actions={
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Add goal
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-20 animate-pulse rounded-xl bg-muted/40" />
          <div className="h-48 animate-pulse rounded-xl bg-muted/40" />
        </div>
      ) : goals.length > 0 ? (
        <div className="space-y-8">
          <StatStrip
            items={[
              { label: "Active goals", value: String(goals.length) },
              { label: "On track", value: String(onTrackCount) },
              {
                label: "Needs attention",
                value: String(goals.length - onTrackCount),
              },
            ]}
          />

          <div className="space-y-5">
            {sortedGoals.map((goal) => {
              const risk = data?.goalRisks.find((item) => item.goalId === goal.id);

              return (
                <GoalDetailCard
                  key={goal.id}
                  goal={goal}
                  riskLevel={risk?.riskLevel}
                  riskFactors={risk?.factors}
                  formatAmount={formatAmount}
                  onEdit={() => openEditDialog(goal)}
                  onDelete={() => setDeleteGoal(goal)}
                />
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground">
            Wondering how a purchase affects your goals?{" "}
            <Link href="/can-i-buy" className="text-primary hover:underline">
              Try Can I Buy This?
            </Link>
          </p>
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Add your first goal — a car, house deposit, or anything that matters. Nexa tracks progress from your savings each cycle."
          actionLabel="Add your first goal"
          onAction={openCreateDialog}
        />
      )}

      <GoalFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        isEmergencyFund={editingGoal?.isEmergencyFund}
        initialValues={
          editingGoal
            ? {
                name: editingGoal.name,
                targetAmount: editingGoal.targetAmount,
                targetDate: editingGoal.targetDate,
                priority: editingGoal.priority,
              }
            : undefined
        }
        loading={createGoal.isPending || updateGoal.isPending}
        onSubmit={handleFormSubmit}
      />

      <Dialog open={!!deleteGoal} onOpenChange={(open) => !open && setDeleteGoal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove goal?</DialogTitle>
            <DialogDescription>
              {deleteGoal
                ? `"${deleteGoal.name}" will be archived. Your saved progress history stays in past cycles.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteGoal(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={removeGoal.isPending}
              onClick={() => deleteGoal && removeGoal.mutate(deleteGoal.id)}
            >
              Remove goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
