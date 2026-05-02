import type { ReactNode } from "react";

type BubbleProps = {
  children: ReactNode;
  className?: string;
};

/** Simple text block for use inside the white onboarding card */
export function Bubble({ children, className = "" }: BubbleProps) {
  return (
    <div
      className={`text-slate-700 text-sm sm:text-base font-medium leading-relaxed ${className}`.trim()}
    >
      {children}
    </div>
  );
}
