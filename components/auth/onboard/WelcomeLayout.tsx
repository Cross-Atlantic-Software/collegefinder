import type { ReactNode } from "react";

type WelcomeLayoutProps = {
  children: ReactNode;
  progress: number; // 0–100
};

export function WelcomeLayout({ children, progress }: WelcomeLayoutProps) {
  return (
    <div className="flex flex-col w-full flex-1 text-white">
      {/* This area will now fill available height and can center children */}
      <div className="flex-1 flex items-center justify-center">
        {children}
      </div>

      {/* Bottom progress bar */}
      <div className="w-full px-28 pb-8">
        <div className="h-2 rounded-full bg-white/10 w-full overflow-hidden">
          <div
            className="h-full bg-[#DB0078] transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
