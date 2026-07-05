"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CATEGORIES, type Category } from "@nexa/shared";
import { CategorySelect } from "@/components/category-select";
import { api } from "@/lib/api";
import { track } from "@nexa/analytics/react";

interface Props {
  transactionId: string;
  category: string;
}

function asCategory(value: string): Category {
  return (CATEGORIES.includes(value as Category) ? value : "OTHER") as Category;
}

export function RecategorizeSelect({ transactionId, category }: Props) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newCategory: Category) =>
      api(`/transactions/${transactionId}/category`, {
        method: "PATCH",
        body: JSON.stringify({ category: newCategory }),
      }),
    onSuccess: () => {
      track("transaction_recategorized");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <CategorySelect
      value={asCategory(category)}
      onChange={(value) => mutation.mutate(value)}
      disabled={mutation.isPending}
      compact
      className="w-auto min-w-[7.5rem] border-border bg-background text-xs"
    />
  );
}
