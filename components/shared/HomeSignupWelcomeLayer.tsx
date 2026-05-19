"use client";

import { useCallback, useEffect, useState } from "react";
import type { LandingPageContent } from "@/types/landingPage";
import {
  DEFAULT_SIGNUP_WELCOME_DURATION_SECONDS,
  DEFAULT_SIGNUP_WELCOME_MESSAGE,
} from "@/lib/signupWelcomeDefaults";
import { SIGNUP_WELCOME_SESSION_KEY } from "@/lib/signupWelcomeFlag";
import { SignupWelcomeModal } from "./SignupWelcomeModal";

type Props = {
  signupWelcome?: LandingPageContent["signupWelcome"];
};

export function HomeSignupWelcomeLayer({ signupWelcome }: Props) {
  const [open, setOpen] = useState(false);

  const message = signupWelcome?.message?.trim() || DEFAULT_SIGNUP_WELCOME_MESSAGE;
  const durationSeconds =
    signupWelcome?.durationSeconds ?? DEFAULT_SIGNUP_WELCOME_DURATION_SECONDS;

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SIGNUP_WELCOME_SESSION_KEY) === "1") {
        sessionStorage.removeItem(SIGNUP_WELCOME_SESSION_KEY);
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const onClose = useCallback(() => setOpen(false), []);

  return (
    <SignupWelcomeModal
      open={open}
      message={message}
      durationSeconds={durationSeconds}
      onClose={onClose}
    />
  );
}
