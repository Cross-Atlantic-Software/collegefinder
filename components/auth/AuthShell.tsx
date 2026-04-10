"use client";

import { Logo } from "@/components/shared";
import Image from "next/image";
import { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  variant?: "default" | "landing" | "minimal";
  contentClassName?: string;
  showMinimalHeader?: boolean;
};

export function AuthShell({
  children,
  variant = "default",
  contentClassName = "",
  showMinimalHeader = true,
}: AuthShellProps) {
  if (variant === "landing") {
    return (
      <main className="relative isolate flex min-h-screen flex-col overflow-hidden text-white">
        <Image
          src="/landing-page/hero-1.png"
          alt="Campus and admission journey background"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-slate-950/70" />

        <header className="appContainer relative z-10 flex w-full items-center justify-center pt-7 sm:pt-8 lg:justify-start">
          <Logo mode="dark" />
        </header>

        <div
          className={`appContainer relative z-10 flex w-full flex-1 pb-10 pt-8 sm:pt-10 ${contentClassName}`}
        >
          {children}
        </div>
      </main>
    );
  }

  if (variant === "minimal") {
    return (
      <main className="relative isolate flex min-h-screen flex-col overflow-hidden text-slate-900">
        <Image
          src="/login-3.png"
          alt="Login page background"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-white/72 backdrop-blur-[1px]" />

        {showMinimalHeader && (
          <header className="appContainer relative z-10 flex w-full items-center justify-center border-b border-slate-200 py-5 lg:justify-start">
            <Logo mode="light" />
          </header>
        )}

        <div className={`appContainer relative z-10 flex w-full flex-1 py-10 sm:py-12 ${contentClassName}`}>
          {children}
        </div>
      </main>
    );
  }

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
