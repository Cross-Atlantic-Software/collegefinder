import type { ReactNode } from "react";

type WelcomeLayoutProps = {
  children: ReactNode;
  progress: number; // 0–100
};

export function WelcomeLayout({ children, progress }: WelcomeLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-950 via-purple-950 to-fuchsia-900 text-white px-6 sm:px-16 py-10">
      <div className="flex-1 flex items-center">{children}</div>

      <div className="w-full mt-10">
        <div className="h-2 rounded-full bg-white/10 w-full relative overflow-hidden">
          <div
            className="h-full bg-pink-500 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
