import type { ReactNode } from "react";

type BubbleProps = {
  children: ReactNode;
  className?: string;
};

export function Bubble({ children, className = "" }: BubbleProps) {
  return (
    <div
      className={`rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-800 text-sm sm:text-base px-5 py-4 max-w-lg min-h-[52px] flex items-center ${className}`.trim()}
    >
      {children}
    </div>
  );
}
