"use client";

import { useEffect, useState } from "react";

export default function LogoutLoader() {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-[#050816]">
      <div className="text-center space-y-6">
        {/* Animated Spinner */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 border-4 border-pink-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-pink-500 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-pink-500/10 rounded-full"></div>
          <div className="absolute inset-2 border-4 border-transparent border-t-pink-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="text-slate-900 dark:text-white text-lg font-medium">
            Logging out
            <span className="inline-block w-4">{dots}</span>
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            See you soon!
          </p>
        </div>
      </div>

      {/* Subtle background animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
      </div>
    </div>
  );
}


