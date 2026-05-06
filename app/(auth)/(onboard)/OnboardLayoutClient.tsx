"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { WelcomeLayout } from "@/components/auth/onboard/WelcomeLayout";

export function OnboardLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  let progress = 0;
  let title = "";
  let suffix = "";
  
  if (pathname === '/step-1') { progress = 20; title = "Hey, welcome to Unitracko"; suffix = ""; }
  else if (pathname === '/step-2') { progress = 40; title = "What do we call you?"; suffix = ""; }
  else if (pathname === '/step-2a') { progress = 60; title = "What's your stream?"; suffix = ""; }
  else if (pathname === '/step-2b') { progress = 80; title = "What excites you?"; suffix = ""; }
  else if (pathname === '/step-2c') { progress = 90; title = "Where are you based?"; suffix = ""; }
  else if (pathname === '/step-2d') { progress = 95; title = "Where are you based?"; suffix = ""; }
  else if (pathname === '/step-referral') { progress = 95; title = "Have a referral code?"; suffix = ""; }
  else if (pathname === '/step-3') { progress = 100; }

  const mobileCompact = pathname === "/step-1" || pathname === "/step-2";

  return (
    <WelcomeLayout
      progress={progress}
      scribbleTitle={title}
      scribbleSuffix={suffix}
      mobileCompact={mobileCompact}
    >
      {children}
    </WelcomeLayout>
  );
}
