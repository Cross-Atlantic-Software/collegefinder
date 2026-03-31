import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

type WelcomeLayoutProps = {
  children: ReactNode;
  progress: number; // 0–100
};

export function WelcomeLayout({ children, progress }: WelcomeLayoutProps) {
  const stepLabel =
    progress <= 20 ? "Step 1 of 6" :
    progress <= 40 ? "Step 2 of 6" :
    progress <= 60 ? "Step 3 of 6" :
    progress <= 80 ? "Step 4 of 6" :
    progress <= 95 ? "Step 5 of 6" :
    "Almost done!";

  return (
    <div className="flex flex-col w-full flex-1 bg-[#F6F8FA]">
      {/* ── Top header ── */}
      <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 shrink-0">
        <Link href="/" className="block">
          <Image
            src="/svgs/logo-unitracko.svg"
            alt="UniTracko"
            width={148}
            height={33}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-slate-500 font-medium">
            {stepLabel}
          </span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-28 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #341050 0%, #9705F9 60%, #DB0078 100%)",
                }}
              />
            </div>
            <span className="text-xs font-semibold text-[#341050] w-8 text-right">
              {progress}%
            </span>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
