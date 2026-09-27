"use client";

import { useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { toast } from "sonner";
import { calculateIncomeTax, TAX_TABLES } from "@nexa/finance-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/layouts/surface";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

const num = (s: string) => (s.trim() === "" ? 0 : Number(s) || 0);

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center gap-3 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-6 w-6 accent-[var(--primary)]" />
    </label>
  );
}

export default function TaxPage() {
  const { token } = useSession();
  const { formatAmount } = useCurrency();
  const data = useQuery(api.planning.getTax, token ? { sessionToken: token } : "skip");
  const saveTax = useAction(api.planning.saveTax);

  const [salary, setSalary] = useState("");
  const [business, setBusiness] = useState("");
  const [exportIncome, setExportIncome] = useState("");
  const [pseb, setPseb] = useState(false);
  const [filer, setFiler] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loaded || data === undefined) return;
    const i = data.inputs as { salaryIncome?: number; businessIncome?: number; itExportIncome?: number; psebRegistered?: boolean; filer?: boolean } | null;
    if (i) {
      setSalary(i.salaryIncome ? String(i.salaryIncome) : "");
      setBusiness(i.businessIncome ? String(i.businessIncome) : "");
      setExportIncome(i.itExportIncome ? String(i.itExportIncome) : "");
      setPseb(Boolean(i.psebRegistered));
      setFiler(i.filer ?? true);
    }
    setLoaded(true);
  }, [data, loaded]);

  const inputs = { salaryIncome: num(salary), businessIncome: num(business), itExportIncome: num(exportIncome), psebRegistered: pseb, filer };
  const result = calculateIncomeTax({ ...inputs, taxYear: data?.taxYear });
  const table = TAX_TABLES[result.taxYear]!;
  const slabs = result.regime === "salaried" ? table.salaried : table.nonSalaried;
  const taxable = inputs.salaryIncome + inputs.businessIncome;

  async function save() {
    if (!token) return;
    setBusy(true);
    try {
      await saveTax({ sessionToken: token, inputs });
      toast.success("Saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell title="Income tax" description="Pakistan income tax estimate for individuals." backHref="/plan" backLabel="Plan" narrow>
      {result.ratesOutdated ? (
        <p className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          Tax Year {data?.taxYear} rates haven&apos;t been added yet — this uses Tax Year {result.taxYear} rates ({result.law}) until they are.
        </p>
      ) : null}

      <section className="bg-hero rounded-3xl p-5 text-white shadow-floating" aria-live="polite">
        <p className="text-sm text-white/70">Tax Year {result.taxYear} estimate</p>
        <p className="mt-1 text-[40px] font-bold leading-none tabular-nums">{formatAmount(result.totalTax)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-4 text-sm">
          <div>
            <p className="text-xs text-white/60">Per month</p>
            <p className="font-semibold tabular-nums">{formatAmount(result.monthly)}</p>
          </div>
          <div>
            <p className="text-xs text-white/60">Effective rate</p>
            <p className="font-semibold tabular-nums">{(result.effectiveRate * 100).toFixed(1)}%</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-white/60">{result.law} · 1 Jul {result.taxYear - 1} – 30 Jun {result.taxYear}</p>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Your yearly income</h2>
        <div className="divide-y divide-border rounded-2xl bg-card px-4 shadow-card">
          <label className="block py-3">
            <span className="text-sm font-medium">Salary</span>
            <span className="block text-xs text-muted-foreground">Taxable salary from an employer, for the whole year.</span>
            <Input type="number" inputMode="numeric" min={0} value={salary} onChange={(e) => setSalary(e.target.value)} className="mt-2 h-11" placeholder="0" />
          </label>
          <label className="block py-3">
            <span className="text-sm font-medium">Business & other income</span>
            <span className="block text-xs text-muted-foreground">Local freelance, business profit, rent — not foreign IT income.</span>
            <Input type="number" inputMode="numeric" min={0} value={business} onChange={(e) => setBusiness(e.target.value)} className="mt-2 h-11" placeholder="0" />
          </label>
          <label className="block py-3">
            <span className="text-sm font-medium">IT export / freelance (foreign)</span>
            <span className="block text-xs text-muted-foreground">Foreign clients paid into your Pakistani bank — taxed separately under section 154A.</span>
            <Input type="number" inputMode="numeric" min={0} value={exportIncome} onChange={(e) => setExportIncome(e.target.value)} className="mt-2 h-11" placeholder="0" />
          </label>
          {data && data.projectedAnnualIncome > 0 ? (
            <div className="py-3 text-sm">
              <p className="text-muted-foreground">
                Nexa has {formatAmount(data.incomeSoFar)} income logged this tax year — about {formatAmount(data.projectedAnnualIncome)} for the full year.
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <button type="button" className="font-medium text-primary" onClick={() => setSalary(String(data.projectedAnnualIncome))}>
                  Use as salary
                </button>
                <button type="button" className="font-medium text-primary" onClick={() => setExportIncome(String(data.projectedAnnualIncome))}>
                  Use as IT export
                </button>
              </div>
            </div>
          ) : null}
          <Toggle label="PSEB registered" hint="0.25% final tax on IT exports instead of 1%." checked={pseb} onChange={setPseb} />
          <Toggle label="Active taxpayer (filer)" hint="On FBR's Active Taxpayers List. Non-filers pay double on exports." checked={filer} onChange={setFiler} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Breakdown</h2>
        <div className="divide-y divide-border rounded-2xl bg-card px-4 text-sm shadow-card">
          <div className="flex justify-between py-3">
            <span className="text-muted-foreground">{result.regime === "salaried" ? "Salaried rates" : "Non-salaried rates"} on {formatAmount(taxable)}</span>
            <span className="font-medium tabular-nums">{formatAmount(result.normalTax)}</span>
          </div>
          {result.surcharge > 0 ? (
            <div className="flex justify-between py-3">
              <span className="text-muted-foreground">Surcharge</span>
              <span className="font-medium tabular-nums">{formatAmount(result.surcharge)}</span>
            </div>
          ) : null}
          <div className="flex justify-between py-3">
            <span className="text-muted-foreground">IT export at {(result.exportRate * 100).toFixed(2).replace(/\.?0+$/, "")}%</span>
            <span className="font-medium tabular-nums">{formatAmount(result.exportTax)}</span>
          </div>
          <div className="flex justify-between py-3 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatAmount(result.totalTax)}</span>
          </div>
        </div>
        {inputs.salaryIncome > 0 && inputs.businessIncome > 0 ? (
          <p className="mt-2 px-1 text-xs text-muted-foreground">Salaried rates only apply when salary is more than 75% of your taxable income.</p>
        ) : null}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Tax Year {result.taxYear} {result.regime} slabs
        </h2>
        <ul className="divide-y divide-border rounded-2xl bg-card px-4 text-sm shadow-card">
          {slabs.map((s, i) => {
            const next = slabs[i + 1];
            const current = taxable > s.from && (!next || taxable <= next.from);
            return (
              <li key={s.from} className={cn("flex justify-between gap-3 py-2.5", current && "font-semibold text-primary")}>
                <span>
                  {next ? `${formatAmount(s.from)} – ${formatAmount(next.from)}` : `Above ${formatAmount(s.from)}`}
                </span>
                <span className="tabular-nums">
                  {s.rate === 0 ? "0%" : `${s.fixed ? `${formatAmount(s.fixed)} + ` : ""}${Math.round(s.rate * 100)}%`}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <Button className="mt-6 h-11 w-full rounded-xl" onClick={save} loading={busy}>
        Save
      </Button>

      <p className="mt-4 px-1 text-xs leading-relaxed text-muted-foreground">
        An estimate from the Income Tax Ordinance 2001 as amended by the {table.law.split(" (")[0]}. Tax your employer or bank already withheld counts towards
        this. For filing, use FBR IRIS or a tax advisor.
      </p>
    </PageShell>
  );
}
