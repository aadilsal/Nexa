"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
} from "lucide-react";
import {
  PurchaseSimulationFormSchema,
  type PurchaseSimulationFormInput,
  type CurrencyCode,
} from "@nexa/shared";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { CurrencySelect } from "@/components/currency-select";
import { api } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { track } from "@nexa/analytics/react";
import { cn } from "@/lib/utils";

interface SimulationResult {
  recommendation: "WAIT" | "GO_AHEAD";
  triggeredRule: string | null;
  suggestedWaitUntil: string | null;
  explanation: string;
  currency: CurrencyCode;
  impacts: {
    emergencyFundDelayDays: number;
    savingsRateBefore: number;
    savingsRateAfter: number;
    goalDelays: Array<{ goalName: string; delayDays: number }>;
  };
  before: {
    safeToSpend: { today: number };
  };
  after: {
    safeToSpend: { today: number };
  };
}

function resetFormState(
  reset: () => void,
  setResult: (value: SimulationResult | null) => void,
) {
  reset();
  setResult(null);
}

export function CanIBuyThis() {
  const { primaryCurrency, formatAmount } = useCurrency();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PurchaseSimulationFormInput>({
    resolver: zodResolver(PurchaseSimulationFormSchema),
    defaultValues: {
      itemName: "",
      amount: "",
      currency: primaryCurrency,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: PurchaseSimulationFormInput) =>
      api<SimulationResult>("/simulations/purchase", {
        method: "POST",
        body: JSON.stringify({
          itemName: data.itemName,
          amount: Number(data.amount),
          currency: data.currency ?? primaryCurrency,
        }),
      }),
    onSuccess: (data) => {
      setResult(data);
      track("simulation_run", { recommendation: data.recommendation });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Simulation failed"),
  });

  const isGoAhead = result?.recommendation === "GO_AHEAD";
  const safeToSpendImpact = result
    ? result.after.safeToSpend.today - result.before.safeToSpend.today
    : 0;
  const affectedGoals = result?.impacts.goalDelays.filter(
    (goal) => goal.delayDays > 0,
  ) ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setTimeout(() => resetFormState(reset, setResult), 300);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
          <Search className="h-4 w-4" />
          Can I Buy This?
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-card shadow-floating sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Can I buy this?</DialogTitle>
          <DialogDescription>
            Nexa runs this against your real bills, income, and goals.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit((data) => mutation.mutate(data))}
              className="space-y-4 pt-2"
              noValidate
            >
              <FormField
                label="What are you buying?"
                htmlFor="can-i-buy-item"
                error={errors.itemName?.message}
              >
                <Input
                  id="can-i-buy-item"
                  placeholder="Item name"
                  error={!!errors.itemName}
                  autoFocus
                  {...register("itemName")}
                />
              </FormField>

              <FormField
                label="Amount"
                htmlFor="can-i-buy-amount"
                error={errors.amount?.message}
              >
                <div className="flex gap-2">
                  <Controller
                    control={control}
                    name="currency"
                    render={({ field }) => (
                      <CurrencySelect
                        value={(field.value as CurrencyCode) ?? primaryCurrency}
                        onChange={field.onChange}
                        compact
                      />
                    )}
                  />
                  <Input
                    id="can-i-buy-amount"
                    inputMode="numeric"
                    placeholder="Amount"
                    className="font-mono"
                    error={!!errors.amount}
                    {...register("amount")}
                  />
                </div>
              </FormField>

              <Button
                type="submit"
                className="h-11 w-full"
                loading={mutation.isPending}
              >
                {mutation.isPending ? "Analyzing…" : "Analyze purchase"}
              </Button>
            </motion.form>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5 pt-2"
            >
              <div
                className={cn(
                  "rounded-xl border p-4",
                  isGoAhead
                    ? "border-primary/25 bg-primary/10"
                    : "border-warning/25 bg-warning/10",
                )}
              >
                <div className="flex items-start gap-3">
                  {isGoAhead ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                  )}
                  <div>
                    <h4
                      className={cn(
                        "text-lg font-semibold",
                        isGoAhead ? "text-primary" : "text-warning",
                      )}
                    >
                      {isGoAhead ? "Go ahead" : "Wait"}
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                      {result.explanation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between rounded bg-muted/50 p-2">
                  <span className="text-muted-foreground">Safe to spend impact</span>
                  <span
                    className={cn(
                      "font-mono tabular-nums",
                      safeToSpendImpact < 0
                        ? "text-destructive"
                        : "text-foreground",
                    )}
                  >
                    {safeToSpendImpact >= 0 ? "+" : ""}
                    {formatAmount(safeToSpendImpact, result.currency)}
                  </span>
                </div>
                <div className="flex justify-between rounded bg-muted/50 p-2">
                  <span className="text-muted-foreground">Savings rate</span>
                  <span className="font-mono tabular-nums">
                    {(result.impacts.savingsRateBefore * 100).toFixed(1)}% →{" "}
                    <span
                      className={
                        result.impacts.savingsRateAfter <
                        result.impacts.savingsRateBefore
                          ? "text-destructive"
                          : undefined
                      }
                    >
                      {(result.impacts.savingsRateAfter * 100).toFixed(1)}%
                    </span>
                  </span>
                </div>
                {affectedGoals.length > 0 ? (
                  <div className="rounded bg-muted/50 p-2">
                    <p className="mb-2 text-muted-foreground">Goal impact</p>
                    <ul className="space-y-1">
                      {affectedGoals.map((goal) => (
                        <li
                          key={`${goal.goalName}-${goal.delayDays}`}
                          className="flex justify-between gap-3"
                        >
                          <span className="truncate">{goal.goalName}</span>
                          <span className="shrink-0 font-medium text-warning">
                            +{goal.delayDays} day{goal.delayDays === 1 ? "" : "s"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex justify-between rounded bg-muted/50 p-2">
                    <span className="text-muted-foreground">Goal impact</span>
                    <span className="text-muted-foreground">No delay on your goals</span>
                  </div>
                )}
              </div>

              {result.suggestedWaitUntil ? (
                <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    Suggested wait until{" "}
                    <span className="font-medium">
                      {new Date(result.suggestedWaitUntil).toLocaleDateString()}
                    </span>
                  </span>
                </div>
              ) : null}

              <div className="flex flex-col gap-2 pt-1">
                <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground" asChild>
                  <Link href="/can-i-buy">Open full analysis</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
