"use client";

import { useQuery, useAction, useMutation } from "convex/react";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_CURRENCY, FixedExpenseInputSchema, IncomeExpectationInputSchema, type Category, type CurrencyCode } from "@nexa/shared";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategorySelect } from "@/components/category-select";
import { FormField } from "@/components/ui/form-field";
import { ContentSection, HighlightSurface, PageShell } from "@/components/layouts/surface";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/lib/session";
import { FEATURE_HELP } from "@/lib/feature-help";
import { useCurrency } from "@/lib/currency";

interface FixedExpenseRow {
  id?: Id<"fixedExpenses">;
  name: string;
  category: Category;
  expectedAmount: number;
  currency: CurrencyCode;
}

interface IncomeRow {
  id?: Id<"incomeExpectations">;
  name: string;
  expectedAmount: number;
  currency: CurrencyCode;
}

export default function FinancialPlanPage() {
  const { token } = useSession();
  const { formatAmount, primaryCurrency } = useCurrency();

  const plan = useQuery(api.financialPlan.list, token ? { sessionToken: token } : "skip");
  const settings = useQuery(api.settings.get, token ? { sessionToken: token } : "skip");
  const updateVariable = useAction(api.settings.updateVariableEstimate);
  const createFixedExpense = useAction(api.financialPlan.createFixedExpense);
  const updateFixedExpense = useAction(api.financialPlan.updateFixedExpense);
  const deleteFixedExpense = useMutation(api.financialPlan.deleteFixedExpense);
  const createIncome = useAction(api.financialPlan.createIncomeExpectation);
  const updateIncome = useAction(api.financialPlan.updateIncomeExpectation);
  const deleteIncome = useMutation(api.financialPlan.deleteIncomeExpectation);

  const [variableEstimate, setVariableEstimate] = useState(0);
  const [expenses, setExpenses] = useState<FixedExpenseRow[]>([]);
  const [incomes, setIncomes] = useState<IncomeRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!plan || !settings) return;
    setVariableEstimate(settings.variableEstimate ?? 0);
    setExpenses(
      plan.fixedExpenses.map((e) => ({
        id: e.id as Id<"fixedExpenses">,
        name: e.name,
        category: e.category as Category,
        expectedAmount: e.expectedAmount,
        currency: e.currency as CurrencyCode,
      })),
    );
    setIncomes(
      plan.incomeExpectations.map((i) => ({
        id: i.id as Id<"incomeExpectations">,
        name: i.name,
        expectedAmount: i.expectedAmount,
        currency: i.currency as CurrencyCode,
      })),
    );
  }, [plan, settings]);

  async function saveExpense(row: FixedExpenseRow) {
    if (!token) return;
    const parsed = FixedExpenseInputSchema.safeParse(row);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Invalid bill");
      return;
    }
    if (row.id) {
      await updateFixedExpense({ sessionToken: token, id: row.id, expectedAmount: row.expectedAmount });
      toast.success(`Updated ${row.name}`);
    } else {
      const created = await createFixedExpense({
        sessionToken: token,
        name: parsed.data.name,
        category: parsed.data.category,
        currency: parsed.data.currency ?? currency,
        expectedAmount: parsed.data.expectedAmount,
      });
      setExpenses((prev) => prev.map((e) => (e === row ? { ...row, id: created.id } : e)));
      toast.success(`Added ${row.name}`);
    }
  }

  async function removeExpense(row: FixedExpenseRow) {
    if (token && row.id) await deleteFixedExpense({ sessionToken: token, id: row.id });
    setExpenses((prev) => prev.filter((e) => e !== row));
    toast.success("Bill removed");
  }

  async function saveIncome(row: IncomeRow) {
    if (!token) return;
    const parsed = IncomeExpectationInputSchema.safeParse(row);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Invalid income");
      return;
    }
    if (row.id) {
      await updateIncome({ sessionToken: token, id: row.id, expectedAmount: row.expectedAmount });
      toast.success(`Updated ${row.name}`);
    } else {
      const created = await createIncome({ sessionToken: token, name: parsed.data.name, currency: parsed.data.currency ?? currency, expectedAmount: parsed.data.expectedAmount });
      setIncomes((prev) => prev.map((i) => (i === row ? { ...row, id: created.id } : i)));
      toast.success(`Added ${row.name}`);
    }
  }

  async function removeIncome(row: IncomeRow) {
    if (token && row.id) await deleteIncome({ sessionToken: token, id: row.id });
    setIncomes((prev) => prev.filter((i) => i !== row));
    toast.success("Income source removed");
  }

  const currency = (settings?.primaryCurrency as CurrencyCode) ?? primaryCurrency ?? DEFAULT_CURRENCY;

  if (plan === undefined || settings === undefined) {
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
          <strong className="font-medium text-foreground">variable spending estimate</strong> to calculate how much cash to reserve each cycle. Change anything here and your
          dashboard updates on the next refresh.
        </p>
      </HighlightSurface>

      <div className="space-y-8">
        <ContentSection title="Expected monthly income" description={`Total: ${formatAmount(monthlyIncome)}/mo`} info={FEATURE_HELP.incomeSource}>
          <div className="space-y-3">
            {incomes.map((row, index) => (
              <div key={row.id ?? `new-income-${index}`} className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-card p-3">
                <FormField label="Source" htmlFor={`income-name-${index}`} className="min-w-[140px] flex-1">
                  <Input
                    id={`income-name-${index}`}
                    value={row.name}
                    disabled={!!row.id}
                    onChange={(e) => setIncomes((prev) => prev.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)))}
                  />
                </FormField>
                <FormField label="Amount / mo" htmlFor={`income-amt-${index}`} className="w-32">
                  <Input
                    id={`income-amt-${index}`}
                    type="number"
                    min={0}
                    value={row.expectedAmount || ""}
                    onChange={(e) => setIncomes((prev) => prev.map((r, i) => (i === index ? { ...r, expectedAmount: Number(e.target.value) || 0 } : r)))}
                  />
                </FormField>
                <Button type="button" size="sm" onClick={() => void saveIncome(row)}>
                  Save
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => void removeIncome(row)} aria-label={`Remove ${row.name}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setIncomes((prev) => [...prev, { name: "", expectedAmount: 0, currency }])}>
              <Plus className="mr-1 h-4 w-4" />
              Add income source
            </Button>
          </div>
        </ContentSection>

        <ContentSection title="Fixed monthly bills" description={`Total: ${formatAmount(monthlyBills)}/mo — these are prorated across your pay cycle`} info={FEATURE_HELP.fixedExpense}>
          <div className="space-y-3">
            {expenses.map((row, index) => (
              <div key={row.id ?? `new-expense-${index}`} className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-card p-3">
                <FormField label="Bill" htmlFor={`expense-name-${index}`} className="min-w-[120px] flex-1">
                  <Input
                    id={`expense-name-${index}`}
                    value={row.name}
                    disabled={!!row.id}
                    onChange={(e) => setExpenses((prev) => prev.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)))}
                  />
                </FormField>
                <FormField label="Category" htmlFor={`expense-cat-${index}`} className="w-36">
                  <CategorySelect id={`expense-cat-${index}`} value={row.category} onChange={(category) => setExpenses((prev) => prev.map((r, i) => (i === index ? { ...r, category } : r)))} />
                </FormField>
                <FormField label="Amount / mo" htmlFor={`expense-amt-${index}`} className="w-32">
                  <Input
                    id={`expense-amt-${index}`}
                    type="number"
                    min={0}
                    value={row.expectedAmount || ""}
                    onChange={(e) => setExpenses((prev) => prev.map((r, i) => (i === index ? { ...r, expectedAmount: Number(e.target.value) || 0 } : r)))}
                  />
                </FormField>
                <Button type="button" size="sm" onClick={() => void saveExpense(row)}>
                  Save
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => void removeExpense(row)} aria-label={`Remove ${row.name}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setExpenses((prev) => [...prev, { name: "", category: "OTHER", expectedAmount: 0, currency }])}>
              <Plus className="mr-1 h-4 w-4" />
              Add bill
            </Button>
          </div>
        </ContentSection>

        <ContentSection title="Variable spending estimate" description="Groceries, dining out, shopping — spending that isn't a fixed bill" info={FEATURE_HELP.variableSpending}>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!token) return;
              setSaving(true);
              updateVariable({ sessionToken: token, amount: variableEstimate })
                .then(() => toast.success("Variable spending estimate updated"))
                .catch(() => toast.error("Could not update variable estimate"))
                .finally(() => setSaving(false));
            }}
          >
            <FormField label="Estimated / month" htmlFor="variable-estimate" className="w-40">
              <Input id="variable-estimate" type="number" min={0} value={variableEstimate || ""} onChange={(e) => setVariableEstimate(Number(e.target.value) || 0)} />
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
