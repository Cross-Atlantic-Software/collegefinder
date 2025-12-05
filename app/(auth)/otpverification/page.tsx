"use client";

import { useSearchParams } from "next/navigation";
import { MascotBubble } from "@/components/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpVerificationForm } from "@/components/auth/OtpVerificationForm";

export default function LoginVerifyPage() {
  const searchParams = useSearchParams();
  const emailHint = searchParams.get("email") || undefined;

  // Redirect to login if no email provided
  if (!emailHint) {
    return (
      <AuthShell>
        <div className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-10 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-center">
            <h1 className="mb-3 text-4xl font-bold leading-tight sm:text-5xl">
              Email Required
            </h1>
            <p className="mb-6 text-sm text-slate-200/80 sm:text-base">
              Please start from the login page.
            </p>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-10 pt-6 lg:flex-row lg:items-center lg:justify-between">
        <OtpVerificationForm
          emailHint={emailHint}
          onVerified={(code) => {
          }}
        />

        <MascotBubble
          variant="two"
          message={
            <>
              Punch in the <span className="font-semibold text-pink-300">6-digit code</span>{" "}
              and you&apos;re in. No password drama, just vibes.
            </>
          }
        />
      </div>
    </AuthShell>
  );
}
