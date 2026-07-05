"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GOAL_PRIORITIES,
  GOAL_PRIORITY_LABELS,
  GoalFormSchema,
  type GoalFormInput,
  type GoalPriority,
} from "@nexa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const CREATE_PRIORITIES = GOAL_PRIORITIES.filter(
  (priority) => priority !== "EMERGENCY_FUND",
);

export type GoalFormValues = GoalFormInput;

function defaultTargetDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function toDateInputValue(value: string): string {
  return value.slice(0, 10);
}

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialValues?: Partial<GoalFormValues>;
  isEmergencyFund?: boolean;
  loading?: boolean;
  deleteLoading?: boolean;
  onSubmit: (values: GoalFormValues) => void | Promise<void>;
  onDelete?: () => void;
}

export function GoalFormDialog({
  open,
  onOpenChange,
  mode,
  initialValues,
  isEmergencyFund = false,
  loading = false,
  deleteLoading = false,
  onSubmit,
  onDelete,
}: GoalFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(GoalFormSchema),
    defaultValues: {
      name: "",
      targetAmount: 0,
      targetDate: defaultTargetDate(),
      priority: "MEDIUM",
    },
  });

  useEffect(() => {
    if (!open) return;

    reset({
      name: initialValues?.name ?? "",
      targetAmount: initialValues?.targetAmount ?? 0,
      targetDate: initialValues?.targetDate
        ? toDateInputValue(initialValues.targetDate)
        : defaultTargetDate(),
      priority:
        initialValues?.priority ?? (isEmergencyFund ? "EMERGENCY_FUND" : "MEDIUM"),
    });
  }, [open, initialValues, isEmergencyFund, reset]);

  const priorityOptions = isEmergencyFund
    ? (["EMERGENCY_FUND"] as const)
    : CREATE_PRIORITIES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add a goal" : "Edit goal"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Set a target amount and date. Nexa tracks progress from your savings automatically."
              : "Update your target. Progress is calculated from your cycle savings — you cannot edit it manually."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values);
          })}
          className="space-y-4"
          noValidate
        >
          <FormField label="Goal name" htmlFor="goal-name" error={errors.name?.message}>
            <Input
              id="goal-name"
              placeholder="e.g. New car, House down payment"
              error={!!errors.name}
              {...register("name")}
            />
          </FormField>

          <FormField
            label="Target amount"
            htmlFor="goal-amount"
            error={errors.targetAmount?.message}
          >
            <Input
              id="goal-amount"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              error={!!errors.targetAmount}
              {...register("targetAmount")}
            />
          </FormField>

          <FormField
            label="Target date"
            htmlFor="goal-date"
            error={errors.targetDate?.message}
          >
            <Input
              id="goal-date"
              type="date"
              error={!!errors.targetDate}
              {...register("targetDate")}
            />
          </FormField>

          <FormField label="Priority" htmlFor="goal-priority" error={errors.priority?.message}>
            <select
              id="goal-priority"
              disabled={isEmergencyFund}
              className={cn(
                "w-full rounded-md border border-input bg-card px-3 py-2 text-sm",
                isEmergencyFund && "cursor-not-allowed opacity-70",
              )}
              {...register("priority")}
            >
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {GOAL_PRIORITY_LABELS[priority as GoalPriority]}
                </option>
              ))}
            </select>
          </FormField>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            {mode === "edit" && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                loading={deleteLoading}
                disabled={loading}
                className="w-full sm:mr-auto sm:w-auto"
              >
                Delete goal
              </Button>
            ) : (
              <span />
            )}
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading || deleteLoading}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={deleteLoading}
                className="flex-1 sm:flex-none"
              >
                {mode === "create" ? "Create goal" : "Save changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
