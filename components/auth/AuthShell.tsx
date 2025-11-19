"use client";

import { Logo } from "@/components/shared";
import { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="flex min-h-screen flex-col bg-blueGradient text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-center px-6 pt-6">
        <Logo mode="dark" />
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-10 lg:flex-row lg:items-center lg:justify-between">
        {children}
      </div>
    </main>
  );
}
