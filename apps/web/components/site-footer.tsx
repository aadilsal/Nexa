import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border py-8">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Nexa. All rights reserved.</p>
        <nav className="flex flex-wrap justify-center gap-4">
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <Link href="/contact" className="hover:text-foreground">
            Contact
          </Link>
          <Link href="/support" className="hover:text-foreground">
            Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}
