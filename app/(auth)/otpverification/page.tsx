"use client";

import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpVerificationForm } from "@/components/auth/OtpVerificationForm";
import { Logo } from "@/components/shared";

export default function LoginVerifyPage() {
  const searchParams = useSearchParams();
  const emailHint = searchParams.get("email") || undefined;

  // Redirect to login if no email provided
  if (!emailHint) {
    return (
      <AuthShell variant="minimal" showMinimalHeader={false} contentClassName="items-center justify-center">
        <div className="mx-auto w-full max-w-[460px] rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-sm text-slate-600">Please start from the login page.</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell variant="minimal" showMinimalHeader={false} contentClassName="items-center justify-center">
      <div className="flex w-full flex-col items-center justify-center gap-6">
        <Logo mode="light" width={190} height={42} className="h-auto w-[170px] sm:w-[190px]" />
        <OtpVerificationForm
          emailHint={emailHint}
          onVerified={(code) => {
          }}
        />
      </div>
    </AuthShell>
  );
}
