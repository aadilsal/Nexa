import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full">
      {/* Left Pane - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-lg">N</span>
              </div>
              <span className="font-display font-bold text-xl tracking-tight">
                Nexa
              </span>
            </Link>
            <ThemeToggle />
          </div>
          {children}
        </div>
      </div>

      {/* Right Pane - Visuals */}
      <div className="hidden lg:flex flex-1 relative bg-muted items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute -left-40 top-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute right-20 bottom-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl opacity-50" />
        
        <div className="relative z-10 max-w-lg p-12 text-center space-y-6 backdrop-blur-sm bg-background/30 rounded-3xl border border-border/50 shadow-floating">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-sm font-medium">
            Financial Intelligence
          </div>
          <h2 className="text-4xl font-display font-bold tracking-tight">
            Stop tracking. Start deciding.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Join the platform that turns your raw financial data into clear, actionable intelligence so you can spend with confidence.
          </p>
        </div>
      </div>
    </div>
  );
}
