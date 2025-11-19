"use client";

import Image from "next/image";
import { ReactNode } from "react";

export type MascotVariant =
  | "one"
  | "two"
  | "three"
  | "four"
  | "five"
  | "six";

const MASCOT_SVGS: Record<MascotVariant, string> = {
  one: "/mascots/one.svg",
  two: "/mascots/two.svg",
  three: "/mascots/three.svg",
  four: "/mascots/four.svg",
  five: "/mascots/five.svg",
  six: "/mascots/six.svg",
};

type MascotBubbleProps = {
  variant?: MascotVariant;
  message: ReactNode;
};

export function MascotBubble({
  variant = "one",
  message,
}: MascotBubbleProps) {
  return (
    <div
      className="
        pointer-events-none
        fixed inset-x-0 bottom-4 z-40
        flex justify-center px-3
        sm:inset-x-auto sm:right-8 sm:bottom-8 sm:justify-end sm:px-0
      "
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Speech bubble */}
        <div
          className="
            pointer-events-auto relative
            max-w-[90vw] rounded-3xl
            bg-slate-950/85 px-4 py-3
            text-lg text-slate-100
            shadow-xl shadow-black/40
            ring-1 ring-white/10
            backdrop-blur-md
            sm:max-w-xs sm:px-5 sm:py-4 sm:text-md
          "
        >
          {message}

          {/* Tail – desktop only */}
          <div
            className="
              pointer-events-none
              absolute -right-2 bottom-5 hidden
              h-4 w-4 rotate-45
              bg-slate-950/85
              ring-1 ring-white/10
              sm:block -z-1
            "
          />
        </div>

        {/* Mascot */}
        <div className="relative h-56 w-30">
          <Image
            src={MASCOT_SVGS[variant]}
            alt="Mascot"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}