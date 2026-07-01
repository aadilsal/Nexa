"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CATEGORIES } from "@nexa/shared";
import { api } from "@/lib/api";
import { captureEvent } from "@/lib/posthog";

interface Props {
  transactionId: string;
  category: string;
}

export function RecategorizeSelect({ transactionId, category }: Props) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newCategory: string) =>
      api(`/transactions/${transactionId}/category`, {
        method: "PATCH",
        body: JSON.stringify({ category: newCategory }),
      }),
    onSuccess: () => {
      captureEvent("transaction_recategorized");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <select
      value={category}
      onChange={(e) => mutation.mutate(e.target.value)}
      disabled={mutation.isPending}
      className="rounded border border-border bg-background px-1 py-0.5 text-xs"
    >
      {CATEGORIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
