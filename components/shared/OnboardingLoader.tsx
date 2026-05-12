"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface OnboardingLoaderProps {
  message?: string;
}


export default function OnboardingLoader({ message = "Preparing your journey..." }: OnboardingLoaderProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev === "..." ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F6F8FA]">
      {/* Logo */}
      <div className="mb-10">
        <Image
          src="/logo.svg"
          alt="UniTracko"
          width={148}
          height={33}
          className="w-auto h-8"
          priority
          unoptimized
        />
      </div>

      {/* Spinner */}
      <div className="relative w-14 h-14 mb-6">
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-200" />
        <div
          className="absolute inset-0 rounded-full border-[3px] border-transparent animate-spin"
          style={{ borderTopColor: "#0f172a" }}
        />
        <div className="absolute inset-[5px] rounded-full border-[2px] border-slate-100" />
        <div
          className="absolute inset-[5px] rounded-full border-[2px] border-transparent animate-spin"
          style={{ borderTopColor: "#FAD53C", animationDirection: "reverse", animationDuration: "1.4s" }}
        />
      </div>

      {/* Message */}
      <p className="text-sm font-medium text-slate-700">
        {message}
        <span className="inline-block w-5 text-left">{dots}</span>
      </p>
      <p className="mt-1 text-xs text-slate-400">Just a moment</p>

      {/* Bottom dots */}
      <div className="absolute bottom-10 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{
              backgroundColor: "#0f172a",
              opacity: 0.4,
              animationDelay: `${i * 0.22}s`,
              animationDuration: "1.4s",
            }}
          />
        ))}
      </div>
    </div>
  );
}
