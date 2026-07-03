import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
          
          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight font-display sm:text-7xl">
            Financial Intelligence, <br className="hidden sm:block" />
            <span className="text-muted-foreground">not just tracking.</span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Stop wondering where your money went. Nexa tells you if you can buy it, how to save for it, and what to do next.
          </p>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="rounded-full px-8 shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]" asChild>
              <Link href="/dashboard">Join the Waitlist</Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8 gap-2" asChild>
              <Link href="#how-it-works">
                <Play className="w-4 h-4" />
                See how it works
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-y border-border/40 bg-muted/30 py-8">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-widest">
            Trusted by forward-thinking individuals at
          </p>
          <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale sm:gap-16">
            <span className="font-display font-bold text-xl">Stripe</span>
            <span className="font-display font-bold text-xl">Linear</span>
            <span className="font-display font-bold text-xl">Vercel</span>
            <span className="font-display font-bold text-xl">Apple</span>
            <span className="font-display font-bold text-xl">Notion</span>
          </div>
        </div>
      </section>

      {/* How It Works - Scroll Storytelling */}
      <section id="how-it-works" className="py-24 lg:py-32">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold font-display tracking-tight sm:text-4xl text-center mb-16">
            How Nexa Works
          </h2>
          
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-12">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold font-display">1. Ask Nexa.</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Type what you want to buy. Nexa analyzes your cash flow instantly.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold font-display">2. Get an Answer.</h3>
                <p className="text-muted-foreground leading-relaxed">
                  No more mental math. See exactly how a purchase impacts your goals.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold font-display">3. Stay on Track.</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Log expenses at the speed of thought with keyboard shortcuts.
                </p>
              </div>
            </div>
            
            <div className="relative rounded-2xl border bg-card p-8 shadow-floating">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-xl border">
                  <span className="text-2xl">☕</span>
                  <div>
                    <p className="font-medium">Can I buy a $5 coffee?</p>
                    <p className="text-sm text-success font-medium">Yes, you're good to go.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-xl border">
                  <span className="text-2xl">💻</span>
                  <div>
                    <p className="font-medium">Can I buy a MacBook for $2000?</p>
                    <p className="text-sm text-destructive font-medium">Not recommended right now. It delays your 'Bali Vacation' goal.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 lg:py-32 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold tracking-tight font-display mb-6">
            Ready to take control?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-10">
            Join the waitlist today and be the first to experience true financial intelligence.
          </p>
          <form className="flex flex-col gap-2 sm:flex-row max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 rounded-full px-6 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
              required 
            />
            <Button size="lg" variant="secondary" className="rounded-full px-8 text-foreground font-medium">
              Join Waitlist
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
