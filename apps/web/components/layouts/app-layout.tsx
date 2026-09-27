"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogOut, Plus, ReceiptText, Settings, Target, type LucideIcon } from "lucide-react";
import { NexaLogo } from "@/components/nexa-logo";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { useAppRouter } from "@/lib/navigation";

const TransactionLogger = dynamic(() => import("@/components/transaction-logger").then((m) => m.TransactionLogger));

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  also?: string[]; // other routes that belong to this tab
}

// Top-level destinations only (bottom-nav rule: ≤5 items incl. the Add action).
const NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/reports", label: "Activity", icon: ReceiptText },
  { href: "/plan", label: "Plan", icon: Target, also: ["/goals"] },
  { href: "/profile", label: "Settings", icon: Settings },
];

function isActive(pathname: string, item: NavItem) {
  return [item.href, ...(item.also ?? [])].some((href) => pathname === href || pathname.startsWith(`${href}/`));
}

function BottomTab({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground active:text-foreground",
      )}
    >
      <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
      {item.label}
    </Link>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useAppRouter();
  const { logout } = useSession();
  const [addOpen, setAddOpen] = useState(false);

  async function handleSignOut() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar (≥1024px) — same destinations as the phone tab bar. */}
      <aside className="fixed inset-y-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <div className="mb-8 px-2">
          <NexaLogo variant="nav" height={30} />
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="mb-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-md transition-transform active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add transaction
        </button>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
          {NAV.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Sign out
        </button>
      </aside>

      <main className="pb-nav pt-safe lg:pb-10 lg:pl-64">
        <div className="mx-auto w-full max-w-2xl px-4 pt-5 sm:px-6 lg:max-w-4xl lg:pt-10">{children}</div>
      </main>

      {/* Phone tab bar with the Add action in the middle. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-safe backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto flex h-16 max-w-md items-center px-2">
          <BottomTab item={NAV[0]!} pathname={pathname} />
          <BottomTab item={NAV[1]!} pathname={pathname} />
          <div className="flex flex-1 justify-center">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              aria-label="Add transaction"
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-floating ring-4 ring-background transition-transform active:scale-95"
            >
              <Plus className="h-7 w-7" aria-hidden="true" />
            </button>
          </div>
          <BottomTab item={NAV[2]!} pathname={pathname} />
          <BottomTab item={NAV[3]!} pathname={pathname} />
        </div>
      </nav>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl pb-safe">
          <SheetHeader className="px-5 pt-5">
            <SheetTitle>Add transaction</SheetTitle>
            <SheetDescription>Type what you spent or received, e.g. &quot;Lunch 850&quot; or &quot;Salary 150000&quot;.</SheetDescription>
          </SheetHeader>
          <div className="px-5 pb-6">
            <TransactionLogger />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
