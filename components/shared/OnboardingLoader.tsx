"use client";

import { useEffect, useState } from "react";

interface OnboardingLoaderProps {
  message?: string;
}

export default function OnboardingLoader({ message = "Preparing your journey..." }: OnboardingLoaderProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="h-screen w-full flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(90deg, #140E27 0%, #240F3C 50%, #341050 100%)",
      }}
    >
      <div className="text-center space-y-6">
        {/* Animated Spinner */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-pink-500 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-purple-500/10 rounded-full"></div>
          <div className="absolute inset-2 border-4 border-transparent border-t-pink-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="text-white text-lg font-medium">
            {message}
            <span className="inline-block w-4">{dots}</span>
          </p>
          <p className="text-purple-300/70 text-sm">
            Just a moment
          </p>
        </div>
      </div>

      {/* Animated gradient dots */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-pink-500 opacity-60 animate-pulse"
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.5s',
            }}
          />
        ))}
      </div>

      {/* Subtle background animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
      </div>
    </div>
  );
}

