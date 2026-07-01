"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { captureEvent } from "@/lib/posthog";
import { formatPKR } from "@/lib/utils";

interface ParsedPreview {
  description: string;
  amount: number;
  category: string;
  type: string;
  confidence: number;
}

export function TransactionLogger() {
  const queryClient = useQueryClient();
  const [rawInput, setRawInput] = useState("");
  const [preview, setPreview] = useState<ParsedPreview | null>(null);

  const parseMutation = useMutation({
    mutationFn: (input: string) =>
      api<ParsedPreview>("/transactions/parse", {
        method: "POST",
        body: JSON.stringify({ rawInput: input }),
      }),
    onSuccess: (data) => setPreview(data),
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not parse"),
  });

  const logMutation = useMutation({
    mutationFn: (input: string) =>
      api<{
        transaction: ParsedPreview & { eventId: string };
        safeToSpend: { before: number; after: number };
        healthScore: { before: number; after: number };
        insight: string | null;
      }>("/transactions", {
        method: "POST",
        body: JSON.stringify({ rawInput: input }),
      }),
    onSuccess: (data) => {
      setRawInput("");
      setPreview(null);
      captureEvent(
        data.transaction.type === "INCOME" ? "income_logged" : "expense_logged",
        { category: data.transaction.category },
      );
      toast.success(
        data.insight ??
          `Logged! Safe To Spend: ${formatPKR(data.safeToSpend.after)}`,
      );
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to log"),
  });

  return (
    <Card className="mb-8">
      <CardTitle className="mb-1">Log expense or income</CardTitle>
      <CardDescription className="mb-4">
        Try: Petrol 7550 · Salary 120000 · Charity 1000
      </CardDescription>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (rawInput.trim()) parseMutation.mutate(rawInput.trim());
        }}
        className="flex gap-3"
      >
        <Input
          value={rawInput}
          onChange={(e) => {
            setRawInput(e.target.value);
            if (preview) setPreview(null);
          }}
          placeholder="Description amount"
          className="flex-1 font-mono"
          autoFocus
        />
        <Button type="submit" disabled={parseMutation.isPending || !rawInput.trim()}>
          {parseMutation.isPending ? "..." : "Preview"}
        </Button>
      </form>

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-4 rounded-lg border border-border bg-muted/50 p-4"
          >
            <p className="text-sm font-medium">Confirm transaction</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Description</span>
              <span>{preview.description}</span>
              <span className="text-muted-foreground">Amount</span>
              <span className="font-mono">{formatPKR(preview.amount)}</span>
              <span className="text-muted-foreground">Category</span>
              <span>{preview.category}</span>
              <span className="text-muted-foreground">Type</span>
              <span>{preview.type}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                onClick={() => logMutation.mutate(rawInput.trim())}
                disabled={logMutation.isPending}
              >
                {logMutation.isPending ? "Saving..." : "Confirm & Log"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPreview(null)}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
