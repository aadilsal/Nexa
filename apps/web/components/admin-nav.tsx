"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Operations", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/errors", label: "Errors" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/health", label: "Health" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-muted/30 p-4">
      <div className="mb-6">
        <Link href="/admin" className="text-lg font-bold">
          Nexa Admin
        </Link>
        <p className="text-xs text-muted-foreground">Operations platform</p>
      </div>
      <nav className="space-y-1">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/dashboard"
        className="mt-8 block text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to app
      </Link>
    </aside>
  );
}
