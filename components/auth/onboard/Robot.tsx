"use client";

import Image from "next/image";

export type MascotVariant = "one" | "two" | "three" | "four" | "five" | "six";

type RobotProps = {
  variant?: MascotVariant;
};

const MASCOT_SOURCES: Record<MascotVariant, string> = {
  one: "/mascots/one.svg",
  two: "/mascots/two.svg",
  three: "/mascots/three.svg",
  four: "/mascots/four.svg",
  five: "/mascots/five.svg",
  six: "/mascots/six.svg",
};

export function Robot({ variant = "one" }: RobotProps) {
  return (
    <div className="relative w-32 h-40 sm:w-40 sm:h-52">
      <Image
        src={MASCOT_SOURCES[variant]}
        alt="Mascot"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}
