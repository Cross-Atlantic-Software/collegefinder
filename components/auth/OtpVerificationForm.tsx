"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../shared";
import { verifyOTP, resendOTP } from "@/api";
import { useAuth } from "@/contexts/AuthContext";

const OTP_LENGTH = 6;

type OtpVerificationFormProps = {
  emailHint?: string;
  onVerified?: (code: string) => void;
};

export function OtpVerificationForm({
  emailHint,
  onVerified,
}: OtpVerificationFormProps) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  // Correct ref type
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!text) return;

    const next = text
      .split("")
      .concat(Array(OTP_LENGTH).fill(""))
      .slice(0, OTP_LENGTH);

    setOtp(next);

    const lastIndex = Math.min(text.length, OTP_LENGTH) - 1;
    if (lastIndex >= 0) {
      inputsRef.current[lastIndex]?.focus();
    }

    event.preventDefault();
  };

  const code = otp.join("");
  const isComplete = code.length === OTP_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || !emailHint) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await verifyOTP(emailHint, code);
      
      if (response.success && response.data) {
        setSuccess(true);
        // Store token and user data
        // Convert null to undefined for name property to match User type
        const user = {
          ...response.data.user,
          name: response.data.user.name ?? undefined
        };
        login(response.data.token, user);
        onVerified?.(code);
        
        // Redirect based on whether user has completed onboarding
        // If onboarding_completed is true → go to dashboard
        // If onboarding_completed is false/null → go to onboarding step-1
        const onboardingCompletedValue = response.data.user?.onboarding_completed;
        
        // More robust check - handle boolean, string, number, or truthy values
        let onboardingCompleted = false;
        if (onboardingCompletedValue !== null && onboardingCompletedValue !== undefined) {
          if (onboardingCompletedValue === true) {
            onboardingCompleted = true;
          } else if (onboardingCompletedValue === false) {
            onboardingCompleted = false;
          } else {
            // TypeScript doesn't know the exact type, so we check at runtime
            const valueType = typeof onboardingCompletedValue;
            if (valueType === 'string') {
              const strValue = onboardingCompletedValue as unknown as string;
              onboardingCompleted = strValue.toLowerCase() === 'true' || strValue === 't';
            } else if (valueType === 'number') {
              const numValue = onboardingCompletedValue as unknown as number;
              onboardingCompleted = numValue === 1;
            } else {
              // Fallback: treat as truthy
              onboardingCompleted = !!onboardingCompletedValue;
            }
          }
        }
        
        // Debug logging
        console.log('🔍 OTP Verification - Full response:', JSON.stringify(response, null, 2));
        console.log('🔍 OTP Verification - User data:', response.data.user);
        console.log('🔍 OTP Verification - onboarding_completed (raw):', onboardingCompletedValue, 'Type:', typeof onboardingCompletedValue);
        console.log('🔍 OTP Verification - onboarding_completed (converted):', onboardingCompleted);
        console.log('🔍 OTP Verification - Will redirect to:', onboardingCompleted ? '/dashboard' : '/step-1');
        
        // Prefetch target route for faster loading
        if (onboardingCompleted) {
          router.prefetch("/dashboard");
        } else {
          router.prefetch("/step-1");
        }
        // Small delay for smooth transition, then redirect
        setTimeout(() => {
          if (onboardingCompleted) {
            router.replace("/dashboard");
          } else {
            router.replace("/step-1");
          }
        }, 300);
      } else {
        setError(response.message || "Invalid OTP code. Please try again.");
        // Clear OTP on error
        setOtp(Array(OTP_LENGTH).fill(""));
        inputsRef.current[0]?.focus();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error verifying OTP:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!emailHint || resending) return;

    setResending(true);
    setError(null);

    try {
      const response = await resendOTP(emailHint);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || "Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error resending OTP:", err);
    } finally {
      setResending(false);
    }
  };

  return (
    <section className="max-w-xl text-center mx-auto">
      <h1 className="mb-3 text-4xl font-bold leading-tight sm:text-5xl">
        Enter your{" "}
        <span className="block text-pink">verification code</span>
      </h1>

      <p className="mb-6 text-sm text-slate-200/80 sm:text-base">
        We&apos;ve sent a 6-digit code to{" "}
        <span className="font-semibold text-white">
          {emailHint ?? "your email"}
        </span>
        . Enter it below to continue.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
      >
        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400">
            {resending ? "OTP resent successfully!" : "Verification successful! Redirecting..."}
          </div>
        )}
        <div className="flex justify-between gap-2 sm:gap-3">
          {otp.map((value, index) => (
            <input
              key={index}
              ref={(el) => {
                // 👇 no return, just assign
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={value}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="
                block w-full rounded-md border border-white/15 bg-white/10 px-3 py-5 text-2xl text-white outline-none placeholder:text-slate-400 focus:border-pink focus:outline-none transition duration-500 text-center
              "
            />
          ))}
        </div>

        <Button
            type="submit"
            disabled={!isComplete || submitting}
            variant="DarkGradient"
            size="lg"
            className="w-full mt-2"
        >
          {submitting ? "Verifying…" : "Verify and continue"}
        </Button>

        <div className="flex flex-col gap-2 text-xs text-slate-300/80 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="text-left underline underline-offset-2 hover:text-pink-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleResend}
            disabled={resending || !emailHint}
          >
            {resending ? "Resending..." : "Didn't get the code? Resend"}
          </button>
          <p>Using a different email? Go back and update it.</p>
        </div>
      </form>
    </section>
  );
}
