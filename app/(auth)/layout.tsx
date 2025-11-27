// app/(auth)/layout.tsx
import { ReactNode } from "react";
import { AuthRedirect } from "@/components/auth/AuthRedirect";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <AuthRedirect>
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-fuchsia-900 text-white">
        {children}
      </main>
    </AuthRedirect>
  );
}
