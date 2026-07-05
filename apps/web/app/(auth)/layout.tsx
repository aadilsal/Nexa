import { AuthLayout } from "@/components/layouts/auth-layout";

export default function AuthShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
