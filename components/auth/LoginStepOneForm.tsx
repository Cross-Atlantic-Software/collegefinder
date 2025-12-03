"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../shared";
import { sendOTP } from "@/api";

export function LoginStepOneForm() {
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendOTP(email);
      
      if (response.success) {
        // Navigate to OTP verification page with email as query param
        router.push(`/otpverification?email=${encodeURIComponent(email)}`);
      } else {
        setError(response.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error sending OTP:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="text-center mx-auto">
      <h1 className="mb-3 text-4xl font-bold leading-tight sm:text-5xl">
        Start learning to{" "}
        <span className="block text-pink">code today!</span>
      </h1>
      <p className="mb-6 text-sm text-slate-200/80 sm:text-base">
        Login with your email to continue your College Finder journey.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-md border border-white/10 bg-white/5 p-5 backdrop-blur-md text-start"
      >
        <div className="space-y-1 text-sm">
          <label
            htmlFor="email"
            className="font-medium text-slate-100 mb-2 block"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-md border border-white/15 bg-white/10 p-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-pink focus:outline-none transition duration-500"
            placeholder="you@example.com"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-200/80">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-white/20 bg-slate-950/40 text-pink-500 focus:ring-pink-400"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            I agree to College Finder&apos;s{" "}
            <Link
              href="/"
              className="underline underline-offset-2 hover:text-pink transition duration-500"
            >
              Terms of Service
            </Link>
            .
          </span>
        </label>

        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={!email || !agree || isLoading}
          variant="DarkGradient"
          size="lg"
          className="w-full mt-2"
        >
          {isLoading ? "Sending..." : "Continue to verification"}
        </Button>

        <p className="pt-2 text-center text-xs text-slate-300/70">
          New here? Your account will be created automatically after
          verification.
        </p>
      </form>
    </section>
  );
}
