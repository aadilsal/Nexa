import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-wider text-primary">
          Pakistan&apos;s Financial Decision Platform
        </p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Can I afford this while staying on track?
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Nexa transforms simple expense logging into personalized financial
          guidance. Not a tracker — a decision platform.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/signup">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
