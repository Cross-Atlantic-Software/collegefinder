"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "../../shared";
import { sendOTP, verifyOTP, resendOTP } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { FiX } from "react-icons/fi";

const OTP_LENGTH = 6;

type EmailVerificationModalProps = {
  email: string;
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
};

export function EmailVerificationModal({
  email,
  isOpen,
  onClose,
  onVerified,
}: EmailVerificationModalProps) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const { refreshUser } = useAuth();

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOTP = async () => {
    if (!email || sendingOTP) return;
    
    setSendingOTP(true);
    setError(null);
    
    try {
      const response = await sendOTP(email);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
      console.error("Error sending OTP:", err);
    } finally {
      setSendingOTP(false);
    }
  };

  // Send OTP when modal opens
  useEffect(() => {
    if (isOpen && email) {
      handleSendOTP();
      // Reset OTP when modal opens
      setOtp(Array(OTP_LENGTH).fill(""));
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, email]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!text) return;

    const next = text
      .split("")
      .concat(Array(OTP_LENGTH).fill(""))
      .slice(0, OTP_LENGTH);

    setOtp(next);

    const lastIndex = Math.min(text.length, OTP_LENGTH) - 1;
    if (lastIndex >= 0) {
      inputsRef.current[lastIndex]?.focus();
    }

    event.preventDefault();
  };

  const code = otp.join("");
  const isComplete = code.length === OTP_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || !email) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await verifyOTP(email, code);
      
      if (response.success) {
        setSuccess(true);
        // Refresh user data to get updated email_verified status
        await refreshUser();
        setTimeout(() => {
          onVerified();
          onClose();
        }, 1000);
      } else {
        setError(response.message || "Invalid OTP code. Please try again.");
        setOtp(Array(OTP_LENGTH).fill(""));
        inputsRef.current[0]?.focus();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error verifying OTP:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email || resending) return;

    setResending(true);
    setError(null);

    try {
      const response = await resendOTP(email);
      if (response.success) {
        setSuccess(true);
        setOtp(Array(OTP_LENGTH).fill(""));
        inputsRef.current[0]?.focus();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || "Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error resending OTP:", err);
    } finally {
      setResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg bg-white/10 p-6 shadow-xl backdrop-blur-md border border-white/20">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-300 hover:text-white transition"
        >
          <FiX className="h-6 w-6" />
        </button>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
            <p className="text-sm text-slate-300">
              We've sent a verification code to <span className="font-semibold text-pink">{email}</span>
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-emerald-500/20 border border-emerald-500/50 px-4 py-3 text-sm text-emerald-200">
              {submitting ? "Email verified successfully!" : "OTP sent successfully!"}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Enter 6-digit code
              </label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputsRef.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-md border border-white/20 bg-white/5 text-white focus:border-pink focus:bg-white/10 focus:outline-none transition"
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                variant="DarkGradient"
                size="md"
                className="w-full rounded-full"
                disabled={!isComplete || submitting}
              >
                {submitting ? "Verifying..." : "Verify Email"}
              </Button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-slate-300 hover:text-pink transition disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend Code"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

