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

// Zakat is worked out automatically from what Nexa already knows — your live balance, money
// owed to/by you (Lent & borrowed) and today's gold/silver prices. You only add what Nexa can't
// see. Saved inputs: `cash` = cash outside Nexa, `receivables`/`debtsDueNow` = extras on top of
// the live loan figures, price 0 = use the live price.

type Unit = "tola" | "gram";
type Fields = Record<
  | "extraCash"
  | "gold"
  | "silver"
  | "goldPrice"
  | "silverPrice"
  | "extraReceivables"
  | "investments"
  | "businessStock"
  | "otherAssets"
  | "extraDebts"
  | "loanInstallmentsNext12Months"
  | "alreadyDeducted",
  string
>;

const EMPTY: Fields = {
  extraCash: "",
  gold: "",
  silver: "",
  goldPrice: "",
  silverPrice: "",
  extraReceivables: "",
  investments: "",
  businessStock: "",
  otherAssets: "",
  extraDebts: "",
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

function Field({ label, hint, value, onChange, suffix, placeholder = "0" }: { label: string; hint?: string; value: string; onChange: (v: string) => void; suffix?: string; placeholder?: string }) {
  return (
    <label className="block py-3">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {suffix ? <span className="text-xs text-muted-foreground">{suffix}</span> : null}
      </span>
      {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span> : null}
      <Input type="number" inputMode="decimal" min={0} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 h-11" placeholder={placeholder} />
    </label>
  );
}

function LiveRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {note ? <span className="block text-xs text-muted-foreground">{note}</span> : null}
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums">{value}</span>
    </div>
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
  const data = useQuery(api.planning.getZakat, token ? { sessionToken: token } : "skip");
  const dashboard = useQuery(api.dashboard.get, token ? { sessionToken: token } : "skip");
  const saveZakat = useAction(api.planning.saveZakat);
  const refreshPrices = useAction(api.metals.refresh);
  const logTransaction = useAction(api.transactions.create);

  const [f, setF] = useState<Fields>(EMPTY);
  const [unit, setUnit] = useState<Unit>("tola");
  const [basis, setBasis] = useState<NisabBasis>("silver");
  const [zakatDate, setZakatDate] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof Fields) => (v: string) => setF((prev) => ({ ...prev, [key]: v }));

  // Fetch today's prices once if the daily job hasn't run yet.
  const needsPrices = data !== undefined && data.live.goldPerGram === null;
  useEffect(() => {
    if (needsPrices && token) void refreshPrices({ sessionToken: token });
  }, [needsPrices, token, refreshPrices]);

  // Load saved extras once (weights in grams, prices per gram; shown in tola by default).
  useEffect(() => {
    if (loaded || data === undefined) return;
    const i = data.inputs as Record<string, number | string> | null;
    if (i) {
      const n = (k: string) => (Number(i[k]) ? String(i[k]) : "");
      const tola = (k: string) => (Number(i[k]) ? String(+(Number(i[k]) / TOLA_GRAMS).toFixed(3)) : "");
      const tolaPrice = (k: string) => (Number(i[k]) ? String(Math.round(Number(i[k]) * TOLA_GRAMS)) : "");
      setF({
        extraCash: n("cash"),
        gold: tola("goldGrams"),
        silver: tola("silverGrams"),
        goldPrice: tolaPrice("goldPricePerGram"),
        silverPrice: tolaPrice("silverPricePerGram"),
        extraReceivables: n("receivables"),
        investments: n("investments"),
        businessStock: n("businessStock"),
        otherAssets: n("otherAssets"),
        extraDebts: n("debtsDueNow"),
        loanInstallmentsNext12Months: n("loanInstallmentsNext12Months"),
        alreadyDeducted: n("alreadyDeducted"),
      });
      if (i.nisabBasis === "gold" || i.nisabBasis === "silver") setBasis(i.nisabBasis);
    }
    if (data.zakatDate) setZakatDate(toDateInput(data.zakatDate));
    setLoaded(true);
  }, [data, loaded]);

  const toGrams = (w: string) => (unit === "tola" ? num(w) * TOLA_GRAMS : num(w));
  const toPerGram = (p: string) => (unit === "tola" ? num(p) / TOLA_GRAMS : num(p));
  const perUnit = (perGram: number) => (unit === "tola" ? perGram * TOLA_GRAMS : perGram);

  const liveCash = Math.max(0, dashboard?.cash.currentCashAvailable ?? 0);
  const liveGold = data?.live.goldPerGram ?? 0;
  const liveSilver = data?.live.silverPerGram ?? 0;
  const goldPerGram = toPerGram(f.goldPrice) || liveGold;
  const silverPerGram = toPerGram(f.silverPrice) || liveSilver;

  // What gets saved: only the user's own extras (live figures are re-read every time).
  const saved = useMemo(
    () => ({
      cash: num(f.extraCash),
      goldGrams: toGrams(f.gold),
      goldPricePerGram: toPerGram(f.goldPrice),
      silverGrams: toGrams(f.silver),
      silverPricePerGram: toPerGram(f.silverPrice),
      receivables: num(f.extraReceivables),
      investments: num(f.investments),
      businessStock: num(f.businessStock),
      otherAssets: num(f.otherAssets),
      debtsDueNow: num(f.extraDebts),
      loanInstallmentsNext12Months: num(f.loanInstallmentsNext12Months),
      alreadyDeducted: num(f.alreadyDeducted),
      nisabBasis: basis,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f, unit, basis],
  );

  const result = calculateZakat({
    ...saved,
    cash: liveCash + saved.cash,
    receivables: (data?.live.owedToYou ?? 0) + saved.receivables,
    debtsDueNow: (data?.live.youOwe ?? 0) + saved.debtsDueNow,
    goldPricePerGram: goldPerGram,
    silverPricePerGram: silverPerGram,
  });
  const unitLabel = unit === "tola" ? "tola" : "g";

  async function save() {
    if (!token) return;
    setBusy(true);
    try {
      await saveZakat({ sessionToken: token, inputs: saved, zakatDate: zakatDate ? new Date(`${zakatDate}T09:00:00`).getTime() : undefined });
      toast.success("Saved");
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
    <PageShell title="Zakat" description="Worked out automatically from your money in Nexa (Hanafi)." backHref="/plan" backLabel="Plan" narrow>
      <section className="bg-hero rounded-3xl p-5 text-white shadow-floating" aria-live="polite">
        <p className="text-sm text-white/70">Zakat to pay</p>
        <p className="mt-1 text-[40px] font-bold leading-none tabular-nums">{formatAmount(result.remainingToPay)}</p>
        <p className="mt-3 text-sm text-white/80">
          {result.nisabValue === 0
            ? "Getting today's gold and silver prices…"
            : result.meetsNisab
              ? `2.5% of ${formatAmount(result.netZakatable)} — above the nisab of ${formatAmount(result.nisabValue)} (${result.nisabBasisUsed}).`
              : `Your ${formatAmount(result.netZakatable)} is below the nisab of ${formatAmount(result.nisabValue)} (${result.nisabBasisUsed}) — no Zakat due.`}
          {result.zakatDue > result.remainingToPay ? ` ${formatAmount(result.zakatDue - result.remainingToPay)} already deducted.` : ""}
        </p>
      </section>

      <Card title="From Nexa (automatic)">
        <LiveRow label="Money in Nexa" value={formatAmount(liveCash)} note="Your current balance" />
        <LiveRow label="Owed to you" value={formatAmount(data?.live.owedToYou ?? 0)} note="From Lent & borrowed" />
        <LiveRow label="You owe" value={`− ${formatAmount(data?.live.youOwe ?? 0)}`} note="Deducted" />
        <LiveRow
          label={`Gold / silver price per ${unitLabel}`}
          value={liveGold ? `${formatAmount(perUnit(liveGold))} / ${formatAmount(perUnit(liveSilver))}` : "…"}
          note={data?.live.pricesDate ? `International spot, ${data.live.pricesDate}` : "Updated daily"}
        />
      </Card>

      <Card title="Add what Nexa can't see">
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
        <Field label="Gold you own" hint="All gold, including jewellery you wear (Hanafi)." suffix={unitLabel} value={f.gold} onChange={set("gold")} />
        <Field label="Silver you own" suffix={unitLabel} value={f.silver} onChange={set("silver")} />
        <Field label="Cash outside Nexa" hint="Cash at home or accounts you don't track in Nexa." value={f.extraCash} onChange={set("extraCash")} />
        <Field label="Investments" hint="Shares, mutual funds, crypto — at today's value." value={f.investments} onChange={set("investments")} />
        <Field label="Business stock" hint="Goods held for sale, at sale value." value={f.businessStock} onChange={set("businessStock")} />
        <Field label="Long-term loan instalments" hint="Only the next 12 months — not the full balance." value={f.loanInstallmentsNext12Months} onChange={set("loanInstallmentsNext12Months")} />
        <Field label="Zakat already deducted" hint="e.g. by your bank on 1st Ramadan this Zakat year." value={f.alreadyDeducted} onChange={set("alreadyDeducted")} />
      </Card>

      <details className="mt-6 rounded-2xl bg-card px-4 shadow-card">
        <summary className="flex min-h-12 cursor-pointer items-center text-sm font-semibold">More options</summary>
        <div className="divide-y divide-border pb-2">
          <div className="grid grid-cols-2 gap-2 py-3">
            {(["silver", "gold"] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBasis(b)}
                aria-pressed={basis === b}
                className={cn("min-h-11 rounded-xl border px-3 text-sm font-medium", basis === b ? "border-primary bg-primary-muted text-primary" : "border-border text-muted-foreground")}
              >
                {b === "silver" ? "Silver nisab (Hanafi)" : "Gold nisab"}
              </button>
            ))}
          </div>
          <Field label="Local gold price" hint="Your sarafa rate for the karat you own — leave blank to use spot." suffix={`per ${unitLabel}`} value={f.goldPrice} onChange={set("goldPrice")} placeholder={liveGold ? String(Math.round(perUnit(liveGold))) : "0"} />
          <Field label="Local silver price" suffix={`per ${unitLabel}`} value={f.silverPrice} onChange={set("silverPrice")} placeholder={liveSilver ? String(Math.round(perUnit(liveSilver))) : "0"} />
          <Field label="Other money owed to you" hint="Not already in Lent & borrowed, and you expect it back." value={f.extraReceivables} onChange={set("extraReceivables")} />
          <Field label="Other debts due now" hint="Bills or debts due within about a month." value={f.extraDebts} onChange={set("extraDebts")} />
          <Field label="Other zakatable wealth" value={f.otherAssets} onChange={set("otherAssets")} />
        </div>
      </details>

      <Card title="Your Zakat date">
        <label className="block py-3">
          <span className="text-sm font-medium">Date you pay each year</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">The Hijri date you first owned nisab. You&apos;ll get a reminder a week before.</span>
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
          <li>
            Nisab: 52.5 tola ({SILVER_NISAB_GRAMS} g) of silver for cash and mixed assets (Hanafi); 7.5 tola ({GOLD_NISAB_GRAMS} g) of gold if gold is your only wealth.
          </li>
          <li>Counted: cash, bank and wallet balances, all gold and silver (including worn jewellery), money owed to you that you expect back, investments and business stock.</li>
          <li>Not counted: your home, car, furniture, personal items, and money you don&apos;t expect to recover.</li>
          <li>Deducted: debts due now; for long-term loans, only the next 12 months of instalments.</li>
          <li>Spot prices are international rates; Pakistani sarafa rates are usually a little higher — enter yours under More options for a closer figure.</li>
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
