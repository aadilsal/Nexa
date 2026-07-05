"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect } from "react";
import { ParseTransactionSchema, type Category, type CurrencyCode, type TransactionType } from "@nexa/shared";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategorySelect } from "@/components/category-select";
import { CurrencySelect } from "@/components/currency-select";
import { TransactionTypeSelect } from "@/components/transaction-type-select";
import { api } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { track } from "@nexa/analytics/react";
import { cn } from "@/lib/utils";
import { showTransactionInsightToast } from "@/components/notifications/transaction-insight-toast";

interface ParsedPreview {
  description: string;
  amount: number;
  category: Category;
  type: TransactionType;
  currency?: string;
  confidence: number;
}

export function TransactionLogger() {
  const queryClient = useQueryClient();
  const { primaryCurrency, formatAmount } = useCurrency();
  const [rawInput, setRawInput] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>(primaryCurrency);
  const [inputError, setInputError] = useState("");
  const [preview, setPreview] = useState<ParsedPreview | null>(null);

  useEffect(() => {
    setCurrency(primaryCurrency);
  }, [primaryCurrency]);

  function validateInput(input: string): string | null {
    const result = ParseTransactionSchema.safeParse({ rawInput: input });
    if (!result.success) {
      return result.error.issues[0]?.message ?? "Invalid entry";
    }
    return null;
  }

  function submitPreview(input: string) {
    const error = validateInput(input);
    if (error) {
      setInputError(error);
      return;
    }
    setInputError("");
    parseMutation.mutate({ rawInput: input, currency });
  }

  const parseMutation = useMutation({
    mutationFn: (input: { rawInput: string; currency: CurrencyCode }) =>
      api<ParsedPreview>("/transactions/parse", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => setPreview(data),
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not parse"),
  });

  const logMutation = useMutation({
    mutationFn: (previewData: ParsedPreview) =>
      api<{
        transaction: ParsedPreview & { eventId: string };
        safeToSpend: { before: number; after: number };
        healthScore: { before: number; after: number };
        insight: string | null;
      }>("/transactions", {
        method: "POST",
        body: JSON.stringify({
          description: previewData.description,
          amount: previewData.amount,
          category: previewData.category,
          type: previewData.type,
          currency: previewData.currency ?? currency,
        }),
      }),
    onSuccess: (data) => {
      setRawInput("");
      setPreview(null);
      track("transaction_logged", {
        type: data.transaction.type === "INCOME" ? "income" : "expense",
      });
      const txCurrency =
        (data.transaction.currency as CurrencyCode | undefined) ?? currency;
      const amountPrefix = data.transaction.type === "INCOME" ? "+" : "−";
      showTransactionInsightToast({
        description: data.transaction.description,
        amountLabel: `${amountPrefix}${formatAmount(data.transaction.amount, txCurrency)}`,
        safeToSpend: data.safeToSpend,
        healthScore: data.healthScore,
        insight: data.insight,
        formatAmount: (value) => formatAmount(value, txCurrency),
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-insight"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to log"),
  });

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (rawInput.trim()) submitPreview(rawInput.trim());
        }}
      >
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl bg-muted/30 px-4 py-2 transition-colors focus-within:bg-muted/40",
            inputError && "ring-2 ring-destructive/40",
          )}
        >
          <CurrencySelect
            value={currency}
            onChange={setCurrency}
            compact
            className="shrink-0 border-0 bg-transparent"
          />
          <Input
            value={rawInput}
            onChange={(e) => {
              setRawInput(e.target.value);
              if (inputError) setInputError("");
              if (preview) setPreview(null);
            }}
            onBlur={() => {
              if (rawInput.trim()) {
                const error = validateInput(rawInput.trim());
                setInputError(error ?? "");
              }
            }}
            placeholder="Description amount"
            className="h-11 flex-1 border-0 bg-transparent px-0 font-mono shadow-none focus-visible:ring-0"
            maxLength={200}
          />
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            className="shrink-0 gap-1 text-primary"
            disabled={parseMutation.isPending || !rawInput.trim()}
          >
            {parseMutation.isPending ? "…" : "Preview"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        {inputError ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {inputError}
          </p>
        ) : null}
      </form>

      <p className="text-xs text-muted-foreground">
        Type a short description and amount — we&apos;ll parse the category for you.
      </p>

      <AnimatePresence>
        {preview ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex flex-col gap-4 rounded-xl bg-muted/30 px-4 py-4"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{preview.description}</span>
              <span className="font-mono tabular-nums text-foreground">
                {preview.type === "INCOME" ? "+" : "−"}
                {formatAmount(
                  preview.amount,
                  (preview.currency as CurrencyCode | undefined) ?? currency,
                )}
              </span>
              {preview.confidence < 0.85 ? (
                <Badge variant="outline" className="text-[10px]">
                  Review category
                </Badge>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs text-muted-foreground">
                Category
                <CategorySelect
                  value={preview.category}
                  onChange={(category) =>
                    setPreview((current) =>
                      current ? { ...current, category } : current,
                    )
                  }
                />
              </label>
              <label className="space-y-1.5 text-xs text-muted-foreground">
                Type
                <TransactionTypeSelect
                  value={preview.type}
                  onChange={(type) =>
                    setPreview((current) =>
                      current ? { ...current, type } : current,
                    )
                  }
                />
              </label>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                onClick={() => preview && logMutation.mutate(preview)}
                loading={logMutation.isPending}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPreview(null)}
                aria-label="Cancel preview"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
