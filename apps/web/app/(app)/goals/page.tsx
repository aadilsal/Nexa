"use client";

import { useQuery, useAction, useMutation } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { GoalDetailCard, type TrackedGoal } from "@/components/goals/goal-detail-card";
import { GoalFormDialog, type GoalFormValues } from "@/components/goals/goal-form-dialog";
import { PageShell, StatStrip } from "@/components/layouts/surface";
import { EmptyState } from "@/components/widgets/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/lib/session";
import { useCurrency } from "@/lib/currency";

export default function GoalsPage() {
  const { token } = useSession();
  const { formatAmount } = useCurrency();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingGoal, setEditingGoal] = useState<TrackedGoal | null>(null);
  const [deleteGoal, setDeleteGoal] = useState<TrackedGoal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const data = useQuery(api.dashboard.get, token ? { sessionToken: token } : "skip");
  const createGoal = useAction(api.goals.create);
  const updateGoal = useAction(api.goals.update);
  const removeGoal = useMutation(api.goals.remove);

  const goals = (data?.goals ?? []) as unknown as TrackedGoal[];
  const goalRisks = data?.goalRisks ?? [];
  const isLoading = data === undefined;
  const onTrackCount = goals.filter((goal) => goal.onTrack).length;

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
    if (!token) return;
    setIsSubmitting(true);
    try {
      if (formMode === "create") {
        await createGoal({
          sessionToken: token,
          name: values.name,
          targetAmount: values.targetAmount,
          targetDate: new Date(values.targetDate).getTime(),
          priority: values.priority,
          currency: data?.currency ?? "PKR",
        });
        toast.success("Goal created");
      } else if (editingGoal) {
        await updateGoal({
          sessionToken: token,
          id: editingGoal.id as Id<"goals">,
          name: values.name,
          targetAmount: values.targetAmount,
          targetDate: new Date(values.targetDate).getTime(),
          priority: values.priority,
        });
        toast.success("Goal updated");
      }
      setFormOpen(false);
      setEditingGoal(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save goal");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(goal: TrackedGoal) {
    if (!token) return;
    setIsDeleting(true);
    try {
      await removeGoal({ sessionToken: token, id: goal.id as Id<"goals"> });
      toast.success("Goal deleted");
      setDeleteGoal(null);
      setEditingGoal(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete goal");
    } finally {
      setIsDeleting(false);
    }
  }

  const sortedGoals = [...goals].sort((a, b) => {
    if (a.isEmergencyFund !== b.isEmergencyFund) return a.isEmergencyFund ? -1 : 1;
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
              { label: "Needs attention", value: String(goals.length - onTrackCount) },
            ]}
          />

          <div className="space-y-5">
            {sortedGoals.map((goal) => {
              const risk = goalRisks.find((item) => item.goalId === goal.id);
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
            ? { name: editingGoal.name, targetAmount: editingGoal.targetAmount, targetDate: editingGoal.targetDate, priority: editingGoal.priority }
            : undefined
        }
        loading={isSubmitting}
        deleteLoading={isDeleting}
        onSubmit={handleFormSubmit}
        onDelete={
          formMode === "edit" && editingGoal
            ? () => {
                setFormOpen(false);
                setDeleteGoal(editingGoal);
              }
            : undefined
        }
      />

      <Dialog open={!!deleteGoal} onOpenChange={(open) => !open && setDeleteGoal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete goal?</DialogTitle>
            <DialogDescription>
              {deleteGoal?.isEmergencyFund
                ? `"${deleteGoal.name}" will be removed. Safe To Spend will no longer reserve cash for an emergency fund until you add one again.`
                : deleteGoal
                  ? `"${deleteGoal.name}" will be removed. Your saved progress history stays in past cycles.`
                  : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteGoal(null)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={isDeleting} onClick={() => deleteGoal && void handleDelete(deleteGoal)}>
              Delete goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
