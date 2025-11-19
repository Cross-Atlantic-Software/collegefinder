// app/(auth)/layout.tsx
import { ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-fuchsia-900 text-white">
      {children}
    </main>
  );
}
