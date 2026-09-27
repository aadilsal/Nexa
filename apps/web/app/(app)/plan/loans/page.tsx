"use client";

import { useQuery } from "convex/react";
import { StatStrip, PageShell } from "@/components/layouts/surface";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

export default function LoansPage() {
  const { token } = useSession();
  const { formatAmount } = useCurrency();
  const data = useQuery(api.planning.overview, token ? { sessionToken: token } : "skip");

  return (
    <PageShell
      title="Lent & borrowed"
      description="Money you lend or borrow changes your cash but isn't counted as spending or income."
      backHref="/plan"
      backLabel="Plan"
      narrow
    >
      {data === undefined ? (
        <div className="h-32 animate-pulse rounded-2xl bg-card" />
      ) : (
        <>
          <StatStrip
            items={[
              { label: "Owed to you", value: formatAmount(data.loans.owedToYou), valueClassName: "text-financial-positive" },
              { label: "You owe", value: formatAmount(data.loans.youOwe), valueClassName: data.loans.youOwe > 0 ? "text-financial-negative" : undefined },
            ]}
          />

          {data.loans.people.length ? (
            <ul className="mt-4 divide-y divide-border rounded-2xl bg-card px-4 shadow-card">
              {data.loans.people.map((p) => (
                <li key={p.person} className="flex items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{p.person}</p>
                    <p className="text-xs text-muted-foreground">
                      Gave {formatAmount(p.lent)} · Got {formatAmount(p.received)}
                    </p>
                  </div>
                  <span className={cn("shrink-0 text-right text-sm font-semibold", p.balance > 0 ? "text-financial-positive" : p.balance < 0 ? "text-financial-negative" : "text-muted-foreground")}>
                    {p.balance > 0 ? `Owes you ${formatAmount(p.balance)}` : p.balance < 0 ? `You owe ${formatAmount(-p.balance)}` : "Settled"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-6 rounded-2xl bg-card p-4 text-sm leading-relaxed shadow-card">
            <p className="mb-2 font-semibold">How to track a loan</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                Tap <b>+</b> and type <i>Lent Ali 5000</i> or <i>Ali paid back 2000</i> (or <i>Borrowed from Sara 3000</i>).
              </li>
              <li>
                For an imported bank transfer, tap its category icon in Activity and choose <b>Lent &amp; borrowed</b>.
              </li>
            </ul>
          </div>
        </>
      )}
    </PageShell>
  );
}
