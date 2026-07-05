import { Header } from "@/components/header";
import { LandingPage } from "@/components/marketing/landing-page";
import { SiteFooter } from "@/components/site-footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <LandingPage />
      <SiteFooter />
    </div>
  );
}
