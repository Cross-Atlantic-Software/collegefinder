"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RoughNotation } from "react-rough-notation";
import { FiX } from "react-icons/fi";

type Props = {
  open: boolean;
  message: string;
  durationSeconds: number;
  onClose: () => void;
};

function clampDuration(sec: number): number {
  const n = Math.round(Number(sec));
  if (!Number.isFinite(n)) return 5;
  return Math.min(60, Math.max(1, n));
}

export function SignupWelcomeModal({ open, message, durationSeconds, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [notationVisible, setNotationVisible] = useState(false);
  const durationMs = clampDuration(durationSeconds) * 1000;

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!open) return;
    setNotationVisible(false);
    const t = window.setTimeout(() => setNotationVisible(true), 350);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const id = window.setTimeout(onClose, durationMs);
    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(id);
    };
  }, [open, durationMs, onClose]);

  if (!mounted || !open) return null;

  const lines = (message || "").split(/\r?\n/).filter((l) => l.length > 0);

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-welcome-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md rounded-[1.35rem] border-2 border-amber-100 bg-white px-6 py-8 shadow-[4px_4px_0_rgb(254,243,199),9px_9px_0_rgb(253,230,138)] sm:px-8 sm:py-10"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-black/45 transition hover:bg-black/5 hover:text-black/70"
          aria-label="Dismiss"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="relative z-10 pr-6 pt-2 text-center sm:text-left">
          <p
            id="signup-welcome-title"
            className="text-xs font-bold uppercase tracking-[0.2em] text-[#341050]/80"
          >
            Welcome
          </p>
          <div className="mt-3 space-y-2 text-lg font-semibold leading-snug text-black/90 sm:text-xl">
            {lines.length > 0 ? (
              lines.map((line, i) => <p key={i}>{line}</p>)
            ) : (
              <p>Thank you for signing up with Unitracko</p>
            )}
          </div>
          <div className="mt-5 flex justify-center sm:justify-start">
            <RoughNotation
              type="underline"
              show={notationVisible}
              color="#341050"
              strokeWidth={2}
              animationDuration={720}
            >
              <span className="text-sm font-semibold text-[#341050] px-0.5">
                You&apos;re in — explore UniTracko
              </span>
            </RoughNotation>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
