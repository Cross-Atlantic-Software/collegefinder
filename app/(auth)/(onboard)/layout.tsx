import { ReactNode } from "react";
import { OnboardLayoutClient } from "./OnboardLayoutClient";

export default function Layout({ children }: { children: ReactNode }) {
  return <OnboardLayoutClient>{children}</OnboardLayoutClient>;
}
