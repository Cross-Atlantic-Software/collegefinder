"use client";

import { MascotBubble } from "@/components/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpVerificationForm } from "@/components/auth/OtpVerificationForm";

export default function LoginVerifyPage() {
  const emailHint = "you@example.com"; // TODO: pull from state / search params

  return (
    <AuthShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-10 pt-6 lg:flex-row lg:items-center lg:justify-between">
        <OtpVerificationForm
          emailHint={emailHint}
          onVerified={(code) => {
            console.log("OTP verified:", code);
            // TODO: router.push("/dashboard") or next step
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
