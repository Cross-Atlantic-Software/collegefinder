"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { makeStrengthPayment } from "@/api";
import { useToast } from "@/components/shared";

/** Set in StrengthForm before redirecting to Razorpay */
export const STRENGTH_PAYMENT_PENDING_KEY = "strength_payment_pending";

const PROCESSING_KEY = "strength_pay_processing";

/**
 * After Razorpay payment, redirect users to:
 *   {your-app-origin}/dashboard?strength_pay=success
 *
 * In Razorpay Dashboard → Payment Links → your link → Settings:
 * set “Redirect URL” (after successful payment) to exactly that URL with your production domain.
 *
 * We cannot detect Razorpay’s hosted success page from our app; only this return URL works.
 */
export default function StrengthPaymentReturnHandler({
  onNavigateToStrengths,
}: {
  onNavigateToStrengths: () => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (searchParams.get("strength_pay") !== "success") return;

    const pending = sessionStorage.getItem(STRENGTH_PAYMENT_PENDING_KEY);
    if (!pending) {
      router.replace("/dashboard");
      return;
    }

    if (sessionStorage.getItem(PROCESSING_KEY) === "1") return;
    sessionStorage.setItem(PROCESSING_KEY, "1");

    (async () => {
      try {
        const res = await makeStrengthPayment();
        if (res.success) {
          sessionStorage.removeItem(STRENGTH_PAYMENT_PENDING_KEY);
          showSuccess("Payment successful! A confirmation email has been sent.");
          onNavigateToStrengths();
        } else {
          showError(
            res.message ||
              "Could not confirm payment. If you were charged, contact support."
          );
        }
      } catch {
        showError("Could not confirm payment. If you were charged, contact support.");
      } finally {
        sessionStorage.removeItem(PROCESSING_KEY);
        router.replace("/dashboard");
      }
    })();
  }, [searchParams, router, showSuccess, showError, onNavigateToStrengths]);

  return null;
}
