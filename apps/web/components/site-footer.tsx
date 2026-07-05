import Link from "next/link";
import { BRAND } from "@/lib/brand";

const FOOTER_LINKS = {
  product: [
    { href: "/faq", label: "FAQ" },
    { href: "/changelog", label: "Changelog" },
    { href: "/roadmap", label: "Roadmap" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/security", label: "Security" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
} as const;

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
        {title}
      </p>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-lg font-semibold text-foreground">{BRAND.name}</p>
            <p className="mt-2 text-sm text-muted-foreground">{BRAND.tagline.short}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Available worldwide · 24+ currencies
            </p>
          </div>
          <FooterLinkGroup title="Product" links={FOOTER_LINKS.product} />
          <FooterLinkGroup title="Company" links={FOOTER_LINKS.company} />
          <FooterLinkGroup title="Legal" links={FOOTER_LINKS.legal} />
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>&copy; {year} {BRAND.name}. All rights reserved.</p>
          <p className="text-xs">
            Your data stays encrypted. We never sell your financial information.
          </p>
        </div>
      </div>
    </footer>
  );
}
