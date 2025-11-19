"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "../shared";

export function LoginStepOneForm() {
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) return;
    // TODO: route to Step 2 (OTP) or call API
    console.log("Login step 1:", email);
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

        <Button
          type="submit"
          disabled={!email || !agree}
          variant="DarkGradient"
          size="lg"
          className="w-full mt-2"
        >
          Continue to verification
        </Button>

        <p className="pt-2 text-center text-xs text-slate-300/70">
          New here? Your account will be created automatically after
          verification.
        </p>
      </form>
    </section>
  );
}
