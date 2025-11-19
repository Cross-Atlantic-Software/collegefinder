import type { ReactNode } from "react";

type BubbleProps = {
  children: ReactNode;
};

export function Bubble({ children }: BubbleProps) {
  return (
    <div className="rounded-md bg-white/15 backdrop-blur-sm text-white text-sm sm:text-base px-5 py-4 max-w-lg shadow-md border border-white/10">
      {children}
    </div>
  );
}
