"use client";

import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  PurchaseSimulationFormSchema,
  type PurchaseSimulationFormInput,
  type CurrencyCode,
} from "@nexa/shared";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { CurrencySelect } from "@/components/currency-select";
import {
  ContentSection,
  HighlightSurface,
  PageShell,
  StatStrip,
} from "@/components/layouts/surface";
import { api } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { track } from "@nexa/analytics/react";
import { cn } from "@/lib/utils";

interface SimulationResult {
  recommendation: "WAIT" | "GO_AHEAD";
  triggeredRule: string | null;
  suggestedWaitUntil: string | null;
  explanation: string;
  impacts: {
    emergencyFundDelayDays: number;
    savingsRateBefore: number;
    savingsRateAfter: number;
    goalDelays: Array<{ goalName: string; delayDays: number }>;
  };
}

export default function CanIBuyPage() {
  const { primaryCurrency, formatAmount } = useCurrency();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseSimulationFormInput>({
    resolver: zodResolver(PurchaseSimulationFormSchema),
    mode: "onBlur",
    defaultValues: { itemName: "", amount: "", currency: primaryCurrency },
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
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Simulation failed"),
    onSuccess: (data) => {
      track("simulation_run", {
        recommendation: data.recommendation,
      });
    },
  });

  const result = mutation.data;
  const isGoAhead = result?.recommendation === "GO_AHEAD";

  return (
    <PageShell
      title="Can I Buy This?"
      description="Simulate a purchase and see how it affects your goals and savings rate."
      className="max-w-2xl pb-8"
    >
      <ContentSection
        title="Purchase details"
        description="Enter what you're considering — we'll run the numbers."
        className="border-t-0 pt-0"
      >
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-5"
          noValidate
        >
          <FormField
            label="Item name"
            htmlFor="itemName"
            error={errors.itemName?.message}
          >
            <Input
              id="itemName"
              placeholder="e.g. MacBook Pro"
              error={!!errors.itemName}
              {...register("itemName")}
            />
          </FormField>

          <FormField
            label="Amount"
            htmlFor="amount"
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
                id="amount"
                inputMode="numeric"
                placeholder="50,000"
                className="font-mono text-lg"
                error={!!errors.amount}
                {...register("amount")}
              />
            </div>
          </FormField>

          <Button
            type="submit"
            className="w-full sm:w-auto sm:min-w-48"
            size="lg"
            loading={isSubmitting || mutation.isPending}
          >
            Simulate purchase
          </Button>
        </form>
      </ContentSection>

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-10 space-y-10"
          >
            <HighlightSurface
              variant={isGoAhead ? "primary" : "destructive"}
              className={cn(
                "border",
                isGoAhead ? "border-primary/25" : "border-destructive/25",
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                    isGoAhead
                      ? "bg-primary/15 text-primary"
                      : "bg-destructive/15 text-destructive",
                  )}
                >
                  {isGoAhead ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <AlertTriangle className="h-6 w-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {isGoAhead ? "Go ahead" : "Wait"}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {result.explanation}
                  </p>
                  {result.triggeredRule ? (
                    <p className="text-xs text-muted-foreground">
                      Rule triggered: {result.triggeredRule}
                    </p>
                  ) : null}
                </div>
              </div>

              {result.suggestedWaitUntil ? (
                <div className="mt-6 flex items-center gap-2 rounded-xl bg-muted/40 px-4 py-3 text-sm">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    Suggested wait until{" "}
                    <span className="font-medium text-foreground">
                      {new Date(result.suggestedWaitUntil).toLocaleDateString()}
                    </span>
                  </span>
                </div>
              ) : null}
            </HighlightSurface>

            <StatStrip
              items={[
                {
                  label: "Savings rate before",
                  value: `${(result.impacts.savingsRateBefore * 100).toFixed(1)}%`,
                },
                {
                  label: "Savings rate after",
                  value: `${(result.impacts.savingsRateAfter * 100).toFixed(1)}%`,
                  valueClassName:
                    result.impacts.savingsRateAfter <
                    result.impacts.savingsRateBefore
                      ? "text-destructive"
                      : undefined,
                },
              ]}
            />

            {result.impacts.goalDelays.length > 0 ? (
              <ContentSection title="Goal impacts">
                <ul className="divide-y divide-border/50">
                  {result.impacts.goalDelays.map((goal) => (
                    <li
                      key={`${goal.goalName}-${goal.delayDays}`}
                      className="flex items-center justify-between gap-4 py-3 text-sm first:pt-0"
                    >
                      <span className="text-muted-foreground">
                        {goal.goalName}
                      </span>
                      <span className="font-medium text-warning">
                        +{goal.delayDays} day{goal.delayDays === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
                {result.impacts.emergencyFundDelayDays > 0 ? (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Emergency fund delayed by{" "}
                    {result.impacts.emergencyFundDelayDays} day
                    {result.impacts.emergencyFundDelayDays === 1 ? "" : "s"}.
                  </p>
                ) : null}
              </ContentSection>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </PageShell>
  );
}
