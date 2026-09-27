import { NexaLogo } from "@/components/nexa-logo";
import { BRAND } from "@/lib/brand";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full">
      {/* Left Pane - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8 flex items-center justify-between">
            <NexaLogo variant="nav" height={36} />

          </div>          {children}
        </div>
      </div>

      {/* Right Pane - Visuals */}
      <div className="hidden lg:flex flex-1 relative bg-muted items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute -left-40 top-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute right-20 bottom-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl opacity-50" />
        
        <div className="relative z-10 max-w-lg p-12 text-center space-y-6 backdrop-blur-sm bg-background/30 rounded-3xl border border-border/50 shadow-floating">
          <NexaLogo variant="full" height={72} href={null} className="mx-auto" />
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-sm font-medium">            Financial Intelligence
          </div>
          <h2 className="text-4xl font-display font-bold tracking-tight">
            {BRAND.tagline.primary}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {BRAND.tagline.short} {BRAND.description}
          </p>
        </div>
      </div>
    </div>
  );
}
