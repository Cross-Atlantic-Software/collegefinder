"use client";

import { useAuth } from "@/contexts/AuthContext";
import LogoutLoader from "./LogoutLoader";

export default function LogoutLoaderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggingOut } = useAuth();

  if (isLoggingOut) {
    return <LogoutLoader />;
  }

  return <>{children}</>;
}




