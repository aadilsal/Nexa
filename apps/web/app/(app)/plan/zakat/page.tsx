"use client";

import { useEffect, useMemo, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { toast } from "sonner";
import { calculateZakat, SILVER_NISAB_GRAMS, GOLD_NISAB_GRAMS, TOLA_GRAMS, type NisabBasis } from "@nexa/finance-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/layouts/surface";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

type Unit = "tola" | "gram";
type Fields = Record<
  | "cash"
  | "gold"
  | "goldPrice"
  | "silver"
  | "silverPrice"
  | "receivables"
  | "investments"
  | "businessStock"
  | "otherAssets"
  | "debtsDueNow"
  | "loanInstallmentsNext12Months"
  | "alreadyDeducted",
  string
>;

const EMPTY: Fields = {
  cash: "",
  gold: "",
  goldPrice: "",
  silver: "",
  silverPrice: "",
  receivables: "",
  investments: "",
  businessStock: "",
  otherAssets: "",
  debtsDueNow: "",
  loanInstallmentsNext12Months: "",
  alreadyDeducted: "",
};

const num = (s: string) => (s.trim() === "" ? 0 : Number(s) || 0);
const toDateInput = (ts: number) => new Date(ts).toISOString().slice(0, 10);
function hijri(ts: number) {
  try {
    return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(new Date(ts));
  } catch {
    return "";
  }
}

function Field({ label, hint, value, onChange, suffix }: { label: string; hint?: string; value: string; onChange: (v: string) => void; suffix?: string }) {
  return (
    <label className="block py-3">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {suffix ? <span className="text-xs text-muted-foreground">{suffix}</span> : null}
      </span>
      {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span> : null}
      <Input type="number" inputMode="decimal" min={0} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 h-11" placeholder="0" />
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="divide-y divide-border rounded-2xl bg-card px-4 shadow-card">{children}</div>
    </section>
  );
}

export default function ZakatPage() {
  const { token } = useSession();
  const { formatAmount } = useCurrency();
  const saved = useQuery(api.planning.getZakat, token ? { sessionToken: token } : "skip");
  const dashboard = useQuery(api.dashboard.get, token ? { sessionToken: token } : "skip");
  const saveZakat = useAction(api.planning.saveZakat);
  const logTransaction = useAction(api.transactions.create);

  const [f, setF] = useState<Fields>(EMPTY);
  const [unit, setUnit] = useState<Unit>("tola");
  const [basis, setBasis] = useState<NisabBasis>("silver");
  const [zakatDate, setZakatDate] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof Fields) => (v: string) => setF((prev) => ({ ...prev, [key]: v }));

  // Load saved inputs once (stored in grams / price per gram; shown in tola by default).
  useEffect(() => {
    if (loaded || saved === undefined) return;
    const i = saved.inputs as Record<string, number | string> | null;
    if (i) {
      const g = (k: string) => String(i[k] ?? "");
      setF({
        cash: g("cash"),
        gold: i.goldGrams ? String(+(Number(i.goldGrams) / TOLA_GRAMS).toFixed(3)) : "",
        goldPrice: i.goldPricePerGram ? String(Math.round(Number(i.goldPricePerGram) * TOLA_GRAMS)) : "",
        silver: i.silverGrams ? String(+(Number(i.silverGrams) / TOLA_GRAMS).toFixed(3)) : "",
        silverPrice: i.silverPricePerGram ? String(Math.round(Number(i.silverPricePerGram) * TOLA_GRAMS)) : "",
        receivables: g("receivables"),
        investments: g("investments"),
        businessStock: g("businessStock"),
        otherAssets: g("otherAssets"),
        debtsDueNow: g("debtsDueNow"),
        loanInstallmentsNext12Months: g("loanInstallmentsNext12Months"),
        alreadyDeducted: g("alreadyDeducted"),
      });
      if (i.nisabBasis === "gold" || i.nisabBasis === "silver") setBasis(i.nisabBasis);
    }
    if (saved.zakatDate) setZakatDate(toDateInput(saved.zakatDate));
    setLoaded(true);
  }, [saved, loaded]);

  const perGram = (price: string) => (unit === "tola" ? num(price) / TOLA_GRAMS : num(price));
  const grams = (weight: string) => (unit === "tola" ? num(weight) * TOLA_GRAMS : num(weight));

  const inputs = useMemo(
    () => ({
      cash: num(f.cash),
      goldGrams: grams(f.gold),
      goldPricePerGram: perGram(f.goldPrice),
      silverGrams: grams(f.silver),
      silverPricePerGram: perGram(f.silverPrice),
      receivables: num(f.receivables),
      investments: num(f.investments),
      businessStock: num(f.businessStock),
      otherAssets: num(f.otherAssets),
      debtsDueNow: num(f.debtsDueNow),
      loanInstallmentsNext12Months: num(f.loanInstallmentsNext12Months),
      alreadyDeducted: num(f.alreadyDeducted),
      nisabBasis: basis,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f, unit, basis],
  );
  const result = calculateZakat(inputs);
  const missingPrice = basis === "silver" ? !num(f.silverPrice) : !num(f.goldPrice);
  const unitLabel = unit === "tola" ? "tola" : "g";

  async function save() {
    if (!token) return;
    setBusy(true);
    try {
      await saveZakat({ sessionToken: token, inputs, zakatDate: zakatDate ? new Date(`${zakatDate}T09:00:00`).getTime() : undefined });
      toast.success("Zakat details saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function logPayment() {
    if (!token || result.remainingToPay <= 0) return;
    if (!confirm(`Log a Zakat payment of ${formatAmount(result.remainingToPay)} as an expense?`)) return;
    await logTransaction({ sessionToken: token, description: "Zakat", amount: result.remainingToPay, category: "CHARITY", type: "EXPENSE" });
    toast.success("Zakat payment logged");
  }

  return (
    <PageShell title="Zakat" description="Hanafi calculation on the wealth you own on your Zakat date." backHref="/plan" backLabel="Plan" narrow>
      {/* Result */}
      <section className="bg-hero rounded-3xl p-5 text-white shadow-floating" aria-live="polite">
        <p className="text-sm text-white/70">Zakat to pay</p>
        <p className="mt-1 text-[40px] font-bold leading-none tabular-nums">{formatAmount(result.remainingToPay)}</p>
        <p className="mt-3 text-sm text-white/80">
          {missingPrice
            ? `Enter the ${basis} price to check the nisab.`
            : result.meetsNisab
              ? `2.5% of ${formatAmount(result.netZakatable)} — above the nisab of ${formatAmount(result.nisabValue)} (${result.nisabBasisUsed}).`
              : `Below the nisab of ${formatAmount(result.nisabValue)} (${result.nisabBasisUsed}) — no Zakat due.`}
          {result.zakatDue > result.remainingToPay ? ` ${formatAmount(result.zakatDue - result.remainingToPay)} already deducted.` : ""}
        </p>
      </section>

      <Card title="Nisab & prices">
        <div className="grid grid-cols-2 gap-2 py-3">
          {(["silver", "gold"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBasis(b)}
              aria-pressed={basis === b}
              className={cn("min-h-11 rounded-xl border px-3 text-sm font-medium", basis === b ? "border-primary bg-primary-muted text-primary" : "border-border text-muted-foreground")}
            >
              {b === "silver" ? "Silver (Hanafi)" : "Gold"}
            </button>
          ))}
        </div>
        <p className="py-3 text-xs leading-relaxed text-muted-foreground">
          Silver nisab = 52.5 tola ({SILVER_NISAB_GRAMS} g); gold = 7.5 tola ({GOLD_NISAB_GRAMS} g). Hanafi scholars use silver for cash and mixed assets
          because it is more beneficial to the poor. If your only wealth is gold, the gold nisab is used automatically.
        </p>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-medium">Weigh in</span>
          <div className="flex rounded-lg bg-muted p-0.5">
            {(["tola", "gram"] as const).map((u) => (
              <button key={u} type="button" onClick={() => setUnit(u)} aria-pressed={unit === u} className={cn("h-9 rounded-md px-3 text-sm", unit === u ? "bg-card font-medium shadow-sm" : "text-muted-foreground")}>
                {u === "tola" ? "Tola" : "Grams"}
              </button>
            ))}
          </div>
        </div>
        <Field label="Gold price" hint="Today's price for the karat you own (e.g. 22k)." suffix={`per ${unitLabel}`} value={f.goldPrice} onChange={set("goldPrice")} />
        <Field label="Silver price" suffix={`per ${unitLabel}`} value={f.silverPrice} onChange={set("silverPrice")} />
      </Card>

      <Card title="What you own">
        <div className="py-3">
          <Field label="Cash & bank balances" hint="Cash at home, all bank and wallet balances, savings, foreign currency." value={f.cash} onChange={set("cash")} />
          {dashboard ? (
            <button type="button" className="text-sm font-medium text-primary" onClick={() => set("cash")(String(Math.max(0, Math.round(dashboard.cash.currentCashAvailable))))}>
              Use Nexa balance ({formatAmount(dashboard.cash.currentCashAvailable)})
            </button>
          ) : null}
        </div>
        <Field label="Gold" hint="All gold, including jewellery you wear (Hanafi)." suffix={unitLabel} value={f.gold} onChange={set("gold")} />
        <Field label="Silver" suffix={unitLabel} value={f.silver} onChange={set("silver")} />
        <div className="py-3">
          <Field label="Money owed to you" hint="Loans you expect to get back. Leave out money you don't expect to recover." value={f.receivables} onChange={set("receivables")} />
          {saved && saved.suggestedReceivables > 0 ? (
            <button type="button" className="text-sm font-medium text-primary" onClick={() => set("receivables")(String(Math.round(saved.suggestedReceivables)))}>
              Use Lent & borrowed ({formatAmount(saved.suggestedReceivables)})
            </button>
          ) : null}
        </div>
        <Field label="Investments" hint="Shares, mutual funds, crypto — at today's market value." value={f.investments} onChange={set("investments")} />
        <Field label="Business stock" hint="Goods held for sale, at sale value." value={f.businessStock} onChange={set("businessStock")} />
        <Field label="Other zakatable wealth" value={f.otherAssets} onChange={set("otherAssets")} />
      </Card>

      <Card title="Deductions">
        <Field label="Debts due now" hint="Bills and debts you must pay now or within about a month." value={f.debtsDueNow} onChange={set("debtsDueNow")} />
        <Field label="Long-term loans" hint="Only the next 12 months of instalments — not the full balance." value={f.loanInstallmentsNext12Months} onChange={set("loanInstallmentsNext12Months")} />
        <Field label="Zakat already deducted" hint="e.g. by your bank on 1st Ramadan from a savings account this Zakat year." value={f.alreadyDeducted} onChange={set("alreadyDeducted")} />
      </Card>

      <Card title="Your Zakat date">
        <label className="block py-3">
          <span className="text-sm font-medium">Date you pay each year</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            The Hijri date you first owned nisab. You&apos;ll get a reminder a week before, and it moves forward one lunar year after each date.
          </span>
          <Input type="date" value={zakatDate} onChange={(e) => setZakatDate(e.target.value)} className="mt-2 h-11" />
          {zakatDate ? <span className="mt-1.5 block text-xs text-muted-foreground">{hijri(new Date(`${zakatDate}T09:00:00`).getTime())}</span> : null}
        </label>
      </Card>

      <div className="mt-6 grid gap-3">
        <Button className="h-11 rounded-xl" onClick={save} loading={busy}>
          Save
        </Button>
        {result.remainingToPay > 0 ? (
          <Button variant="outline" className="h-11 rounded-xl" onClick={logPayment}>
            Log Zakat payment
          </Button>
        ) : null}
      </div>

      <details className="mt-6 rounded-2xl bg-card p-4 text-sm leading-relaxed shadow-card">
        <summary className="cursor-pointer font-semibold">How this is calculated</summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
          <li>Zakat is 2.5% of your net zakatable wealth, due once every lunar (Hijri) year if it is at or above the nisab on your Zakat date.</li>
          <li>Counted: cash, bank and wallet balances, savings, all gold and silver (including worn jewellery, per the Hanafi school), money owed to you that you expect back, investments and business stock.</li>
          <li>Not counted: your home, car, furniture, personal items, and money owed to you that you don&apos;t expect to recover (pay on it when it is returned).</li>
          <li>Deducted: debts due now; for long-term loans, only the next 12 months of instalments.</li>
          <li>In Pakistan, banks deduct Zakat on 1st Ramadan from savings accounts above the government nisab unless a CZ-50 declaration is filed — enter that amount so you don&apos;t pay twice.</li>
          <li>For your specific situation, confirm with a qualified mufti.</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Sources:{" "}
          <a className="text-primary underline" href="https://islamqa.org/hanafi/askimam/1346" target="_blank" rel="noreferrer">
            Nisab (Hanafi)
          </a>
          ,{" "}
          <a className="text-primary underline" href="https://islamqa.org/hanafi/fatwaa-dot-com/157675/how-to-deduct-debts-when-calculating-zakat/" target="_blank" rel="noreferrer">
            deducting debts
          </a>
          ,{" "}
          <a className="text-primary underline" href="https://jamiat.org.za/zakah-guidelines-hanafi/" target="_blank" rel="noreferrer">
            Hanafi Zakah guidelines
          </a>
          ,{" "}
          <a className="text-primary underline" href="https://www.zameen.com/blog/zakat-deductions-banks.html" target="_blank" rel="noreferrer">
            bank deduction in Pakistan
          </a>
          .
        </p>
      </details>
    </PageShell>
  );
}
