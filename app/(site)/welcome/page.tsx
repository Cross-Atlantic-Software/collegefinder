"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingLoader from "@/components/shared/OnboardingLoader";
import {
    LANDING_FROM_HOME_PARAM,
    LANDING_FROM_HOME_VALUE,
} from "@/lib/landingNav";

export default function WelcomeJourneyPage() {
    const router = useRouter();
    const { isLoading, isAuthenticated, user } = useAuth();

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) {
            router.replace("/");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return <OnboardingLoader message="Loading..." />;
    }

    if (!isAuthenticated) {
        return <OnboardingLoader message="Redirecting..." />;
    }

    if (!user?.onboarding_completed) {
        return (
            <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-white px-4 py-16 text-center">
                <p className="max-w-sm text-sm text-black/60">
                    Complete your profile in Get in Touch to see your welcome message.
                </p>
                <Link
                    href="/#get-in-touch"
                    className="text-sm font-semibold text-black underline underline-offset-4"
                >
                    Go to form
                </Link>
            </main>
        );
    }

    return (
        <main className="min-h-[calc(100vh-12rem)] bg-gradient-to-b from-amber-50/80 via-white to-white py-16 md:py-24">
            <div className="appContainer flex justify-center">
                <div className="landing-card-lift w-full max-w-lg rounded-2xl border border-black/10 bg-gradient-to-b from-amber-50/90 to-white p-8 shadow-sm md:p-10">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/55">
                        Unitracko
                    </p>
                    <h1 className="mt-4 text-3xl font-extrabold leading-tight text-black md:text-4xl">
                        We&apos;re building something great for you
                    </h1>
                    <div className="mt-6 space-y-4 text-base leading-relaxed text-black/65 md:text-[1.05rem]">
                        <p>
                            Give us just a little more time - we want to make sure we get this absolutely
                            right for you.
                        </p>
                        <p>You&apos;re on the waitlist. Your patience will pay off - we promise.</p>
                        <p>
                            As a thank you, we&apos;re giving you 2 months free when you&apos;re in - instead
                            of the usual 1 months.
                        </p>
                        <p>We&apos;ll email you the moment you&apos;re ready to go.</p>
                    </div>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                        <Link
                            href={`/?${LANDING_FROM_HOME_PARAM}=${LANDING_FROM_HOME_VALUE}`}
                            className="landing-cta inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full bg-black px-8 py-3 text-center text-sm font-semibold text-white hover:bg-black/85 sm:flex-none"
                        >
                            Go to Home
                        </Link>
                        <Link
                            href={`/?${LANDING_FROM_HOME_PARAM}=${LANDING_FROM_HOME_VALUE}`}
                            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-black/20 bg-white px-8 py-3 text-center text-sm font-semibold text-black/85 transition-colors hover:border-black/35 hover:bg-amber-50/50 sm:flex-none"
                        >
                            Sounds good
                        </Link>
                    </div>
                    <p className="mt-8 text-center text-xs text-black/45">
                        Need help?{" "}
                        <a
                            href="mailto:admin@unitracko.com"
                            className="font-medium text-black/70 underline-offset-4 hover:text-black hover:underline"
                        >
                            admin@unitracko.com
                        </a>
                    </p>
                </div>
            </div>
        </main>
    );
}
