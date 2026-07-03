"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShieldAlert, Users, Activity, Settings, Database, ServerCrash, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const ADMIN_LINKS = [
  { href: "/admin", label: "Overview", icon: Activity },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: Database },
  { href: "/admin/system", label: "System Health", icon: ServerCrash },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const NavContent = () => (
    <nav className="flex flex-col gap-1 p-2">
      <div className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Administration
      </div>
      {ADMIN_LINKS.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Dense Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card fixed inset-y-0 z-50">
        <div className="flex h-14 items-center gap-2 px-4 border-b border-border bg-muted/30">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          <span className="font-display font-semibold text-sm tracking-tight text-destructive">
            Nexa Admin
          </span>
        </div>
        <div className="flex-1 py-2 overflow-y-auto">
          <NavContent />
        </div>
        <div className="p-3 border-t border-border flex justify-between items-center bg-muted/10">
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
            ← Exit to App
          </Link>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <span className="font-display font-semibold text-sm tracking-tight">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-60 p-0">
                <div className="flex h-14 items-center px-4 border-b border-border bg-muted/30">
                  <span className="font-display font-semibold text-sm text-destructive">Nexa Admin</span>
                </div>
                <NavContent />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Dense Page Content Wrapper */}
        <div className="flex-1 p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
