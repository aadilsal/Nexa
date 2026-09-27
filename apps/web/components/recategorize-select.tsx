"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { CATEGORIES, type Category } from "@nexa/shared";
import { CategorySelect } from "@/components/category-select";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/lib/session";

interface Props {
  transactionId: string;
  category: string;
}

function asCategory(value: string): Category {
  return (CATEGORIES.includes(value as Category) ? value : "OTHER") as Category;
}

export function RecategorizeSelect({ transactionId, category }: Props) {
  const { token } = useSession();
  const updateCategory = useAction(api.transactions.updateCategory);
  const [isPending, setIsPending] = useState(false);

  async function onChange(newCategory: Category) {
    if (!token) return;
    setIsPending(true);
    try {
      await updateCategory({ sessionToken: token, eventId: transactionId as Id<"transactionEvents">, category: newCategory });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <CategorySelect
      value={asCategory(category)}
      onChange={onChange}
      disabled={isPending}
      compact
      className="w-auto min-w-[7.5rem] border-border bg-background text-xs"
    />
  );
}
