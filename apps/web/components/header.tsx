import Link from "next/link";
import { NexaLogo } from "./nexa-logo";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full overflow-visible border-b border-border bg-card/95 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/90">
      <div className="container mx-auto flex h-[4.25rem] max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8 overflow-visible">
          <NexaLogo variant="nav" height={40} priority />
          <nav className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link href="#quick-answers" className="transition-colors hover:text-foreground">
              Overview
            </Link>
            <Link href="#features" className="transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="#security" className="transition-colors hover:text-foreground">
              Security
            </Link>
            <Link href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:px-6"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
