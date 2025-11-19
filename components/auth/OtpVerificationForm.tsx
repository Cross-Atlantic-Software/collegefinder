"use client";

import { useRef, useState } from "react";
import { Button } from "../shared";

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
    if (!isComplete) return;

    try {
      setSubmitting(true);
      // TODO: verify OTP
      onVerified?.(code);
    } finally {
      setSubmitting(false);
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
            className="text-left underline underline-offset-2 hover:text-pink-300"
            onClick={() => console.log("Resend OTP")}
          >
            Didn&apos;t get the code? Resend
          </button>
          <p>Using a different email? Go back and update it.</p>
        </div>
      </form>
    </section>
  );
}
