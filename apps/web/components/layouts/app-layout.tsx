"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { LayoutDashboard, ShoppingCart, CalendarRange, MessageSquare, UserCircle, HelpCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/can-i-buy", label: "Can I Buy?", icon: ShoppingCart },
  { href: "/weekly-review", label: "Weekly Review", icon: CalendarRange },
  { href: "/chat", label: "AI Coach", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/support", label: "Help", icon: HelpCircle },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const NavContent = () => (
    <nav className="flex flex-col gap-2 p-4">
      {NAV_LINKS.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
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
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border/40 bg-card/50 backdrop-blur fixed inset-y-0 z-50">
        <div className="flex h-16 items-center gap-2 px-6 border-b border-border/40">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
            <span className="text-primary-foreground font-display font-bold text-lg">N</span>
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Nexa</span>
        </div>
        <div className="flex-1 py-4 overflow-y-auto">
          <NavContent />
        </div>
        <div className="p-4 border-t border-border/40">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-lg">N</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight">Nexa</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-16 items-center px-6 border-b border-border/40">
                  <span className="font-display font-bold text-xl">Menu</span>
                </div>
                <NavContent />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Page Content Wrapper */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
