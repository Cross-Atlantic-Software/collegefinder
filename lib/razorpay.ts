/**
 * Razorpay Checkout loader + minimal types.
 *
 * The checkout.js script is injected once and cached; concurrent callers share
 * the same in-flight promise so we never double-inject. We never trust the
 * client handler to credit the wallet — it only forwards the
 * order/payment/signature to our server's /credits/orders/verify.
 */

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number; // paise
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (resp: unknown) => void) => void;
}

type RazorpayCtor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

let loadPromise: Promise<RazorpayCtor> | null = null;

/** Load the Razorpay checkout SDK once and resolve with the constructor. */
export function loadRazorpay(): Promise<RazorpayCtor> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay can only load in the browser"));
  }
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<RazorpayCtor>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHECKOUT_SRC}"]`
    );
    const onLoad = () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error("Razorpay SDK loaded but unavailable"));
    };
    if (existing) {
      existing.addEventListener("load", onLoad);
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
      if (window.Razorpay) resolve(window.Razorpay);
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = onLoad;
    script.onerror = () => {
      loadPromise = null; // allow a retry on the next attempt
      reject(new Error("Failed to load Razorpay"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
