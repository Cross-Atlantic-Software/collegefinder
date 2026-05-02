"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { WelcomeLayout } from "@/components/auth/onboard/WelcomeLayout";

export function OnboardLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  let progress = 0;
  let title = "";
  let suffix = "";
  
  if (pathname === '/step-1') { progress = 20; title = "Welcome"; suffix = "to UniTracko"; }
  else if (pathname === '/step-2') { progress = 40; title = "What's"; suffix = "your name?"; }
  else if (pathname === '/step-2a') { progress = 60; title = "Your"; suffix = "academic stream"; }
  else if (pathname === '/step-2b') { progress = 80; title = "Your"; suffix = "interests"; }
  else if (pathname === '/step-2c') { progress = 90; title = "Your"; suffix = "city"; }
  else if (pathname === '/step-2d') { progress = 95; title = "Your"; suffix = "location"; }
  else if (pathname === '/step-referral') { progress = 95; title = "Got a"; suffix = "referral code?"; }
  else if (pathname === '/step-3') { progress = 100; }

  return (
    <WelcomeLayout progress={progress} scribbleTitle={title} scribbleSuffix={suffix}>
      {children}
    </WelcomeLayout>
  );
}
