import { AppLayout } from "@/components/layouts/app-layout";
import { CurrencyProvider } from "@/lib/currency";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CurrencyProvider>
      <AppLayout>{children}</AppLayout>
    </CurrencyProvider>
  );
}
