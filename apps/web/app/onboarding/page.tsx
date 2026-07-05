"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DEFAULT_CURRENCY,
  FixedExpenseInputSchema,
  IncomeExpectationInputSchema,
  OnboardingSchema,
  formatMoney,
  type CurrencyCode,
} from "@nexa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencySelect } from "@/components/currency-select";
import { ContentSection } from "@/components/layouts/surface";
import { FormField } from "@/components/ui/form-field";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { useAppRouter } from "@/lib/navigation";
import { markOnboardingComplete } from "@/lib/onboarding";
import { prefetchAppData } from "@/lib/prefetch-app-data";
import { track } from "@nexa/analytics/react";
import { cn } from "@/lib/utils";

interface FixedExpenseRow {
  name: string;
  category: string;
  expectedAmount: number;
  currency: CurrencyCode;
}

interface IncomeRow {
  name: string;
  expectedAmount: number;
  currency: CurrencyCode;
}

const STEPS = [
  { id: 1, title: "Income & payday" },
  { id: 2, title: "Monthly expenses" },
  { id: 3, title: "Review & confirm" },
] as const;

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              s.id <= step ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Step {step} of {STEPS.length} · {STEPS[step - 1]?.title}
      </p>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useAppRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stepError, setStepError] = useState("");

  const [primaryPayday, setPrimaryPayday] = useState(5);
  const [preferredCycleStart, setPreferredCycleStart] = useState(1);
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [startingBalance, setStartingBalance] = useState(0);
  const [variableEstimate, setVariableEstimate] = useState(30000);
  const [primaryCurrency, setPrimaryCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);

  const [incomes, setIncomes] = useState<IncomeRow[]>([
    { name: "Salary", expectedAmount: 120000, currency: "PKR" },
  ]);

  const [expenses, setExpenses] = useState<FixedExpenseRow[]>([
    { name: "Rent", category: "HOUSING", expectedAmount: 25000, currency: "PKR" },
    { name: "Fuel", category: "FUEL", expectedAmount: 10000, currency: "PKR" },
    { name: "Internet", category: "UTILITIES", expectedAmount: 5000, currency: "PKR" },
  ]);

  const [predictedMonthly, setPredictedMonthly] = useState(0);
  const [emergencyTarget, setEmergencyTarget] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      try {
        const data = await api<{
          predictedMonthly: number;
          emergencyFundTarget: number;
        }>("/onboarding/preview", {
          method: "POST",
          body: JSON.stringify({
            variableEstimate,
            fixedExpenses: expenses,
            primaryCurrency,
          }),
        });
        if (!cancelled) {
          setPredictedMonthly(data.predictedMonthly);
          setEmergencyTarget(data.emergencyFundTarget);
        }
      } catch {
        if (!cancelled) {
          setPredictedMonthly(0);
          setEmergencyTarget(0);
        }
      }
    }

    const debounce = window.setTimeout(() => {
      void loadPreview();
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(debounce);
    };
  }, [expenses, variableEstimate, primaryCurrency]);

  function validateStep1(): string | null {
    if (!isFreelancer) {
      if (primaryPayday < 1 || primaryPayday > 31) {
        return "Payday must be between 1 and 31";
      }
    } else if (preferredCycleStart < 1 || preferredCycleStart > 31) {
      return "Cycle start must be between 1 and 31";
    }

    if (incomes.length === 0) {
      return "Add at least one income source";
    }

    for (const income of incomes) {
      const result = IncomeExpectationInputSchema.safeParse(income);
      if (!result.success) {
        return result.error.issues[0]?.message ?? "Invalid income entry";
      }
    }

    return null;
  }

  function validateStep2(): string | null {
    if (expenses.length === 0) {
      return "Add at least one fixed expense";
    }

    for (const expense of expenses) {
      const result = FixedExpenseInputSchema.safeParse(expense);
      if (!result.success) {
        return result.error.issues[0]?.message ?? "Invalid expense entry";
      }
    }

    if (!Number.isInteger(variableEstimate) || variableEstimate < 0) {
      return "Variable spending must be a whole number of 0 or more";
    }

    return null;
  }

  function goToStep(next: number) {
    setStepError("");
    if (next === 2) {
      const err = validateStep1();
      if (err) {
        setStepError(err);
        return;
      }
    }
    if (next === 3) {
      const err = validateStep2();
      if (err) {
        setStepError(err);
        return;
      }
    }
    setStep(next);
  }

  async function handleComplete() {
    setLoading(true);
    setError("");
    setStepError("");

    const payload = {
      primaryPayday: isFreelancer ? undefined : primaryPayday,
      preferredCycleStart: isFreelancer ? preferredCycleStart : undefined,
      startingBalance,
      variableEstimate,
      fixedExpenses: expenses,
      incomeExpectations: incomes,
      emergencyFundTarget: emergencyTarget,
      primaryCurrency,
    };

    const parsed = OnboardingSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your entries");
      setLoading(false);
      return;
    }

    try {
      await api("/onboarding/complete", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      track("goal_created", { source: "onboarding", isEmergencyFund: true });
      track("onboarding_completed");
      markOnboardingComplete();
      queryClient.setQueryData(["onboarding-status"], { complete: true });
      void prefetchAppData(queryClient);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onboarding failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/[0.06] via-background to-background">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10 space-y-4">
          <StepIndicator step={step} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Set up your finances
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              A few details so Nexa can calculate Safe to Spend and your goals.
            </p>
          </div>
        </header>

        {step === 1 && (
          <ContentSection
            title="Income & payday"
            description={
              isFreelancer
                ? "Choose when your financial cycle starts each month."
                : "When do you usually receive your salary?"
            }
            className="border-t-0 pt-0"
          >
            <div className="space-y-8">
              <div className="inline-flex rounded-xl bg-muted/50 p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={!isFreelancer ? "default" : "ghost"}
                  className="rounded-lg"
                  onClick={() => setIsFreelancer(false)}
                >
                  Salaried
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={isFreelancer ? "default" : "ghost"}
                  className="rounded-lg"
                  onClick={() => setIsFreelancer(true)}
                >
                  Freelancer
                </Button>
              </div>

              {!isFreelancer ? (
                <FormField
                  label="Primary payday"
                  htmlFor="primaryPayday"
                  hint="Day of the month you get paid"
                >
                  <Input
                    id="primaryPayday"
                    type="number"
                    min={1}
                    max={31}
                    value={primaryPayday}
                    onChange={(e) => setPrimaryPayday(Number(e.target.value))}
                  />
                </FormField>
              ) : (
                <FormField
                  label="Cycle start day"
                  htmlFor="preferredCycleStart"
                  hint="Day of the month your cycle begins"
                >
                  <Input
                    id="preferredCycleStart"
                    type="number"
                    min={1}
                    max={31}
                    value={preferredCycleStart}
                    onChange={(e) =>
                      setPreferredCycleStart(Number(e.target.value))
                    }
                  />
                </FormField>
              )}

              <FormField label="Primary currency" htmlFor="primaryCurrency">
                <CurrencySelect
                  id="primaryCurrency"
                  value={primaryCurrency}
                  onChange={setPrimaryCurrency}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Totals and Safe To Spend use live exchange rates — pick the
                  currency you think in.
                </p>
              </FormField>

              <Separator />

              <div className="space-y-4">
                <p className="text-sm font-medium">Income sources</p>
                <div className="space-y-3">
                  {incomes.map((income, i) => (
                    <div
                      key={i}
                      className="grid gap-4 rounded-xl bg-muted/30 p-4 sm:grid-cols-2"
                    >
                      <FormField label="Source" htmlFor={`income-name-${i}`}>
                        <Input
                          id={`income-name-${i}`}
                          value={income.name}
                          onChange={(e) => {
                            const next = [...incomes];
                            next[i].name = e.target.value;
                            setIncomes(next);
                          }}
                          placeholder="e.g. Salary"
                        />
                      </FormField>
                      <FormField
                        label="Expected amount"
                        htmlFor={`income-amount-${i}`}
                      >
                        <div className="flex gap-2">
                          <CurrencySelect
                            value={income.currency}
                            onChange={(value) => {
                              const next = [...incomes];
                              next[i].currency = value;
                              setIncomes(next);
                            }}
                            compact
                          />
                          <Input
                            id={`income-amount-${i}`}
                            type="number"
                            className="font-mono"
                            value={income.expectedAmount}
                            onChange={(e) => {
                              const next = [...incomes];
                              next[i].expectedAmount = Number(e.target.value);
                              setIncomes(next);
                            }}
                            placeholder="120000"
                          />
                        </div>
                      </FormField>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    setIncomes([...incomes, { name: "", expectedAmount: 0, currency: primaryCurrency }])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add income source
                </Button>
              </div>

              {stepError ? (
                <p className="text-sm text-destructive" role="alert">
                  {stepError}
                </p>
              ) : null}
            </div>
            <div className="mt-8">
              <Button className="w-full sm:w-auto sm:min-w-40" onClick={() => goToStep(2)}>
                Continue
              </Button>
            </div>
          </ContentSection>
        )}

        {step === 2 && (
          <ContentSection
            title="Monthly expenses"
            description="Fixed recurring bills and your average variable spending."
            className="border-t-0 pt-0"
          >
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-sm font-medium">Fixed expenses</p>
                <div className="space-y-3">
                  {expenses.map((expense, i) => (
                    <div
                      key={i}
                      className="space-y-4 rounded-xl bg-muted/30 p-4"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Name" htmlFor={`expense-name-${i}`}>
                          <Input
                            id={`expense-name-${i}`}
                            value={expense.name}
                            onChange={(e) => {
                              const next = [...expenses];
                              next[i].name = e.target.value;
                              setExpenses(next);
                            }}
                            placeholder="Rent"
                          />
                        </FormField>
                        <FormField
                          label="Amount"
                          htmlFor={`expense-amount-${i}`}
                        >
                          <div className="flex gap-2">
                            <CurrencySelect
                              value={expense.currency}
                              onChange={(value) => {
                                const next = [...expenses];
                                next[i].currency = value;
                                setExpenses(next);
                              }}
                              compact
                            />
                            <Input
                              id={`expense-amount-${i}`}
                              type="number"
                              className="font-mono"
                              value={expense.expectedAmount}
                              onChange={(e) => {
                                const next = [...expenses];
                                next[i].expectedAmount = Number(e.target.value);
                                setExpenses(next);
                              }}
                              placeholder="25000"
                            />
                          </div>
                        </FormField>
                      </div>
                      <FormField label="Category" htmlFor={`expense-cat-${i}`}>
                        <Input
                          id={`expense-cat-${i}`}
                          value={expense.category}
                          onChange={(e) => {
                            const next = [...expenses];
                            next[i].category = e.target.value;
                            setExpenses(next);
                          }}
                          placeholder="HOUSING"
                        />
                      </FormField>
                      {expenses.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setExpenses(expenses.filter((_, idx) => idx !== i))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    setExpenses([
                      ...expenses,
                      { name: "", category: "OTHER", expectedAmount: 0, currency: primaryCurrency },
                    ])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add fixed expense
                </Button>
              </div>

              <Separator />

              <FormField
                label="Average variable spending per month"
                htmlFor="variableEstimate"
                hint="Food, shopping, entertainment, dining, miscellaneous"
              >
                <Input
                  id="variableEstimate"
                  type="number"
                  className="font-mono"
                  value={variableEstimate}
                  onChange={(e) => setVariableEstimate(Number(e.target.value))}
                />
              </FormField>

              {stepError ? (
                <p className="text-sm text-destructive" role="alert">
                  {stepError}
                </p>
              ) : null}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setStepError("");
                  setStep(1);
                }}
              >
                Back
              </Button>
              <Button className="w-full flex-1 sm:w-auto" onClick={() => goToStep(3)}>
                Continue
              </Button>
            </div>
          </ContentSection>
        )}

        {step === 3 && (
          <ContentSection
            title="Review & confirm"
            description="We'll create your Emergency Fund goal automatically."
            className="border-t-0 pt-0"
          >
            <div className="space-y-8">
              <div className="space-y-4 rounded-xl bg-muted/30 p-5">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Cycle anchor</span>
                  <span className="font-medium">
                    {isFreelancer
                      ? `${preferredCycleStart}th (freelancer)`
                      : `${primaryPayday}th payday`}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Predicted monthly expenses
                  </span>
                  <span className="font-mono font-medium">
                    {formatMoney(predictedMonthly, primaryCurrency)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium">
                    Emergency Fund target
                  </span>
                  <span className="font-mono text-lg font-semibold text-primary">
                    {formatMoney(emergencyTarget, primaryCurrency)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  3 months of expenses — you can adjust this later.
                </p>
              </div>

              <FormField
                label="Starting balance (optional)"
                htmlFor="startingBalance"
                hint="Cash you have available right now"
              >
                <Input
                  id="startingBalance"
                  type="number"
                  min={0}
                  step={1}
                  className="font-mono"
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(Number(e.target.value))}
                />
              </FormField>

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setStepError("");
                  setStep(2);
                }}
              >
                Back
              </Button>
              <Button
                className="w-full flex-1 sm:w-auto"
                onClick={handleComplete}
                loading={loading}
              >
                Complete setup
              </Button>
            </div>
          </ContentSection>
        )}
      </div>
    </main>
  );
}
