"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_CURRENCY,
  FixedExpenseInputSchema,
  IncomeExpectationInputSchema,
  type Category,
  type CurrencyCode,
} from "@nexa/shared";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategorySelect } from "@/components/category-select";
import { FormField } from "@/components/ui/form-field";
import {
  ContentSection,
  HighlightSurface,
  PageShell,
} from "@/components/layouts/surface";
import { api } from "@/lib/api";
import { FEATURE_HELP } from "@/lib/feature-help";
import { useCurrency } from "@/lib/currency";

interface FixedExpenseRow {
  id?: string;
  name: string;
  category: Category;
  expectedAmount: number;
  currency: CurrencyCode;
}

interface IncomeRow {
  id?: string;
  name: string;
  expectedAmount: number;
  currency: CurrencyCode;
}

interface PlanProfile {
  settings: { primaryCurrency: CurrencyCode };
  variableEstimate: number | null;
  fixedExpenses: Array<{
    id: string;
    name: string;
    category: Category;
    expectedAmount: number;
    currency: CurrencyCode;
  }>;
  incomeExpectations: Array<{
    id: string;
    name: string;
    expectedAmount: number;
    currency: CurrencyCode;
  }>;
}

export default function FinancialPlanPage() {
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api<PlanProfile>("/users/me"),
  });

  const [variableEstimate, setVariableEstimate] = useState(0);
  const [expenses, setExpenses] = useState<FixedExpenseRow[]>([]);
  const [incomes, setIncomes] = useState<IncomeRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setVariableEstimate(profile.variableEstimate ?? 0);
    setExpenses(
      profile.fixedExpenses.map((e) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        expectedAmount: e.expectedAmount,
        currency: e.currency,
      })),
    );
    setIncomes(
      profile.incomeExpectations.map((i) => ({
        id: i.id,
        name: i.name,
        expectedAmount: i.expectedAmount,
        currency: i.currency,
      })),
    );
  }, [profile]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["profile"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const updateVariable = useMutation({
    mutationFn: (amount: number) =>
      api("/financial-plan/variable-estimate", {
        method: "PATCH",
        body: JSON.stringify({ variableEstimate: amount }),
      }),
    onSuccess: () => {
      toast.success("Variable spending estimate updated");
      invalidate();
    },
    onError: () => toast.error("Could not update variable estimate"),
  });

  async function saveExpense(row: FixedExpenseRow) {
    const parsed = FixedExpenseInputSchema.safeParse(row);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Invalid bill");
      return;
    }

    if (row.id) {
      await api(`/financial-plan/fixed-expenses/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ expectedAmount: row.expectedAmount }),
      });
      toast.success(`Updated ${row.name}`);
    } else {
      const created = await api<{ id: string }>("/financial-plan/fixed-expenses", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      setExpenses((prev) =>
        prev.map((e) =>
          e === row ? { ...row, id: created.id } : e,
        ),
      );
      toast.success(`Added ${row.name}`);
    }
    invalidate();
  }

  async function removeExpense(row: FixedExpenseRow) {
    if (row.id) {
      await api(`/financial-plan/fixed-expenses/${row.id}`, { method: "DELETE" });
    }
    setExpenses((prev) => prev.filter((e) => e !== row));
    toast.success("Bill removed");
    invalidate();
  }

  async function saveIncome(row: IncomeRow) {
    const parsed = IncomeExpectationInputSchema.safeParse(row);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Invalid income");
      return;
    }

    if (row.id) {
      await api(`/financial-plan/income-expectations/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ expectedAmount: row.expectedAmount }),
      });
      toast.success(`Updated ${row.name}`);
    } else {
      const created = await api<{ id: string }>("/financial-plan/income-expectations", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      setIncomes((prev) =>
        prev.map((i) =>
          i === row ? { ...row, id: created.id } : i,
        ),
      );
      toast.success(`Added ${row.name}`);
    }
    invalidate();
  }

  async function removeIncome(row: IncomeRow) {
    if (row.id) {
      await api(`/financial-plan/income-expectations/${row.id}`, {
        method: "DELETE",
      });
    }
    setIncomes((prev) => prev.filter((i) => i !== row));
    toast.success("Income source removed");
    invalidate();
  }

  const currency = profile?.settings.primaryCurrency ?? DEFAULT_CURRENCY;

  if (isLoading || !profile) {
    return (
      <PageShell title="Bills & income" backHref="/profile" backLabel="Profile">
        <p className="text-sm text-muted-foreground">Loading your plan…</p>
      </PageShell>
    );
  }

  const monthlyBills = expenses.reduce((sum, e) => sum + e.expectedAmount, 0);
  const monthlyIncome = incomes.reduce((sum, i) => sum + i.expectedAmount, 0);

  return (
    <PageShell
      title="Bills & income"
      description="These numbers feed directly into Safe To Spend and your financial health score."
      backHref="/profile"
      backLabel="Profile"
    >
      <HighlightSurface className="mb-8">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Nexa uses your <strong className="font-medium text-foreground">monthly bills</strong>,{" "}
          <strong className="font-medium text-foreground">expected income</strong>, and{" "}
          <strong className="font-medium text-foreground">variable spending estimate</strong>{" "}
          to calculate how much cash to reserve each cycle. Change anything here and your
          dashboard updates on the next refresh.
        </p>
      </HighlightSurface>

      <div className="space-y-8">
        <ContentSection
          title="Expected monthly income"
          description={`Total: ${formatAmount(monthlyIncome)}/mo`}
          info={FEATURE_HELP.incomeSource}
        >
          <div className="space-y-3">
            {incomes.map((row, index) => (
              <div
                key={row.id ?? `new-income-${index}`}
                className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-card p-3"
              >
                <FormField label="Source" htmlFor={`income-name-${index}`} className="min-w-[140px] flex-1">
                  <Input
                    id={`income-name-${index}`}
                    value={row.name}
                    disabled={!!row.id}
                    onChange={(e) =>
                      setIncomes((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, name: e.target.value } : r,
                        ),
                      )
                    }
                  />
                </FormField>
                <FormField label="Amount / mo" htmlFor={`income-amt-${index}`} className="w-32">
                  <Input
                    id={`income-amt-${index}`}
                    type="number"
                    min={0}
                    value={row.expectedAmount || ""}
                    onChange={(e) =>
                      setIncomes((prev) =>
                        prev.map((r, i) =>
                          i === index
                            ? { ...r, expectedAmount: Number(e.target.value) || 0 }
                            : r,
                        ),
                      )
                    }
                  />
                </FormField>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void saveIncome(row)}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void removeIncome(row)}
                  aria-label={`Remove ${row.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setIncomes((prev) => [
                  ...prev,
                  { name: "", expectedAmount: 0, currency },
                ])
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Add income source
            </Button>
          </div>
        </ContentSection>

        <ContentSection
          title="Fixed monthly bills"
          description={`Total: ${formatAmount(monthlyBills)}/mo — these are prorated across your pay cycle`}
          info={FEATURE_HELP.fixedExpense}
        >
          <div className="space-y-3">
            {expenses.map((row, index) => (
              <div
                key={row.id ?? `new-expense-${index}`}
                className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-card p-3"
              >
                <FormField label="Bill" htmlFor={`expense-name-${index}`} className="min-w-[120px] flex-1">
                  <Input
                    id={`expense-name-${index}`}
                    value={row.name}
                    disabled={!!row.id}
                    onChange={(e) =>
                      setExpenses((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, name: e.target.value } : r,
                        ),
                      )
                    }
                  />
                </FormField>
                <FormField label="Category" htmlFor={`expense-cat-${index}`} className="w-36">
                  <CategorySelect
                    id={`expense-cat-${index}`}
                    value={row.category}
                    onChange={(category) =>
                      setExpenses((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, category } : r,
                        ),
                      )
                    }
                  />
                </FormField>
                <FormField label="Amount / mo" htmlFor={`expense-amt-${index}`} className="w-32">
                  <Input
                    id={`expense-amt-${index}`}
                    type="number"
                    min={0}
                    value={row.expectedAmount || ""}
                    onChange={(e) =>
                      setExpenses((prev) =>
                        prev.map((r, i) =>
                          i === index
                            ? { ...r, expectedAmount: Number(e.target.value) || 0 }
                            : r,
                        ),
                      )
                    }
                  />
                </FormField>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void saveExpense(row)}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void removeExpense(row)}
                  aria-label={`Remove ${row.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setExpenses((prev) => [
                  ...prev,
                  {
                    name: "",
                    category: "OTHER",
                    expectedAmount: 0,
                    currency,
                  },
                ])
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Add bill
            </Button>
          </div>
        </ContentSection>

        <ContentSection
          title="Variable spending estimate"
          description="Groceries, dining out, shopping — spending that isn't a fixed bill"
          info={FEATURE_HELP.variableSpending}
        >
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSaving(true);
              updateVariable.mutate(variableEstimate, {
                onSettled: () => setSaving(false),
              });
            }}
          >
            <FormField label="Estimated / month" htmlFor="variable-estimate" className="w-40">
              <Input
                id="variable-estimate"
                type="number"
                min={0}
                value={variableEstimate || ""}
                onChange={(e) =>
                  setVariableEstimate(Number(e.target.value) || 0)
                }
              />
            </FormField>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </form>
        </ContentSection>

        <p className="text-sm text-muted-foreground">
          Savings goals are managed separately on the{" "}
          <Link href="/goals" className="font-medium text-primary hover:underline">
            Goals page
          </Link>
          .
        </p>
      </div>
    </PageShell>
  );
}
