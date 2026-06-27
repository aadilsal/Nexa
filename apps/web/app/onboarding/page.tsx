"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatPKR } from "@/lib/utils";

interface FixedExpenseRow {
  name: string;
  category: string;
  expectedAmount: number;
}

interface IncomeRow {
  name: string;
  expectedAmount: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [primaryPayday, setPrimaryPayday] = useState(5);
  const [startingBalance, setStartingBalance] = useState(0);
  const [variableEstimate, setVariableEstimate] = useState(30000);

  const [incomes, setIncomes] = useState<IncomeRow[]>([
    { name: "Salary", expectedAmount: 120000 },
  ]);

  const [expenses, setExpenses] = useState<FixedExpenseRow[]>([
    { name: "Rent", category: "HOUSING", expectedAmount: 25000 },
    { name: "Fuel", category: "FUEL", expectedAmount: 10000 },
    { name: "Internet", category: "UTILITIES", expectedAmount: 5000 },
  ]);

  const recurringTotal = expenses.reduce((s, e) => s + e.expectedAmount, 0);
  const predictedMonthly = recurringTotal + variableEstimate;
  const emergencyTarget = predictedMonthly * 3;

  async function handleComplete() {
    setLoading(true);
    setError("");

    try {
      await api("/onboarding/complete", {
        method: "POST",
        body: JSON.stringify({
          primaryPayday,
          startingBalance,
          variableEstimate,
          fixedExpenses: expenses,
          incomeExpectations: incomes,
          emergencyFundTarget: emergencyTarget,
        }),
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onboarding failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Step {step} of 3</p>
        <h1 className="text-2xl font-bold">Set up your finances</h1>
      </div>

      {step === 1 && (
        <Card>
          <CardTitle className="mb-1">Income & payday</CardTitle>
          <CardDescription className="mb-6">
            When do you usually receive your salary?
          </CardDescription>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Primary payday (day of month)
              </label>
              <Input
                type="number"
                min={1}
                max={31}
                value={primaryPayday}
                onChange={(e) => setPrimaryPayday(Number(e.target.value))}
              />
            </div>

            {incomes.map((income, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <Input
                  value={income.name}
                  onChange={(e) => {
                    const next = [...incomes];
                    next[i].name = e.target.value;
                    setIncomes(next);
                  }}
                  placeholder="Income source"
                />
                <Input
                  type="number"
                  value={income.expectedAmount}
                  onChange={(e) => {
                    const next = [...incomes];
                    next[i].expectedAmount = Number(e.target.value);
                    setIncomes(next);
                  }}
                  placeholder="Expected amount"
                />
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setIncomes([...incomes, { name: "", expectedAmount: 0 }])
              }
            >
              + Add income source
            </Button>
          </div>

          <Button className="mt-6 w-full" onClick={() => setStep(2)}>
            Continue
          </Button>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardTitle className="mb-1">Monthly expenses</CardTitle>
          <CardDescription className="mb-6">
            Fixed recurring expenses and variable spending estimate
          </CardDescription>

          <div className="space-y-4">
            {expenses.map((expense, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <Input
                  value={expense.name}
                  onChange={(e) => {
                    const next = [...expenses];
                    next[i].name = e.target.value;
                    setExpenses(next);
                  }}
                  placeholder="Name"
                />
                <Input
                  type="number"
                  value={expense.expectedAmount}
                  onChange={(e) => {
                    const next = [...expenses];
                    next[i].expectedAmount = Number(e.target.value);
                    setExpenses(next);
                  }}
                  placeholder="Amount"
                />
                <Input
                  value={expense.category}
                  onChange={(e) => {
                    const next = [...expenses];
                    next[i].category = e.target.value;
                    setExpenses(next);
                  }}
                  placeholder="Category"
                />
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setExpenses([
                  ...expenses,
                  { name: "", category: "OTHER", expectedAmount: 0 },
                ])
              }
            >
              + Add fixed expense
            </Button>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Average variable spending per month
              </label>
              <Input
                type="number"
                value={variableEstimate}
                onChange={(e) => setVariableEstimate(Number(e.target.value))}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Food, shopping, entertainment, dining, miscellaneous
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => setStep(3)}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardTitle className="mb-1">Review & confirm</CardTitle>
          <CardDescription className="mb-6">
            We&apos;ll create your Emergency Fund goal automatically
          </CardDescription>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payday</span>
              <span>{primaryPayday}th of each month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Predicted monthly expenses</span>
              <span>{formatPKR(predictedMonthly)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Emergency Fund target (3 months)</span>
              <span className="text-primary">{formatPKR(emergencyTarget)}</span>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Starting balance (optional)
              </label>
              <Input
                type="number"
                value={startingBalance}
                onChange={(e) => setStartingBalance(Number(e.target.value))}
              />
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleComplete}
              disabled={loading}
            >
              {loading ? "Setting up..." : "Complete Setup"}
            </Button>
          </div>
        </Card>
      )}
    </main>
  );
}
