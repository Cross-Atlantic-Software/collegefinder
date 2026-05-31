"use client";

import {
    FaEnvelope,
    FaInstagram,
    FaLinkedinIn,
    FaYoutube,
    FaXTwitter,
} from "react-icons/fa6";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/shared";
import {
    handleLandingHashClick,
    LANDING_PRIMARY_NAV,
    landingPageSectionHref,
} from "@/lib/landingNav";
import { siteSocialLinks } from "@/lib/siteSocial";

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const LEGAL_BAR_LINKS: { href: string; label: string }[] = [
    { href: "/legal#privacy-policy", label: "Privacy Policy" },
    { href: "/legal#terms-of-use", label: "Terms of Use" },
    { href: "/legal#cookie-policy", label: "Cookies" },
    { href: "/legal#refund-policy", label: "Refund Policy" },
];

export default function Footer() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const { showError } = useToast();
    const [leadEmail, setLeadEmail] = useState("");
    const isHomePage = pathname === "/";
    const isLoggedIn = Boolean(user);

    function handleLeadSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const trimmed = leadEmail.trim();
        if (!trimmed) {
            showError("Please enter your email address.");
            return;
        }
        if (!isValidEmail(trimmed)) {
            showError("Please enter a valid email address.");
            return;
        }
        if (isLoggedIn) {
            const queryTarget = landingPageSectionHref("get-in-touch");
            const [baseWithQuery, hashPart] = queryTarget.split("#");
            const joiner = baseWithQuery.includes("?") ? "&" : "?";
            const finalUrl = `${baseWithQuery}${joiner}queryEmail=${encodeURIComponent(trimmed)}&queryIntent=1${hashPart ? `#${hashPart}` : ""}`;
            router.push(finalUrl);
            return;
        }
        router.push(`/signup?email=${encodeURIComponent(trimmed)}`);
    }

    return (
        <footer className="bg-amber-300 py-14 md:py-16">
            <div className="appContainer">
                <div className="grid gap-10 lg:grid-cols-[1fr_0.65fr_1fr]">
                    <div>
                        <Image
                            src="/landing-page/black-logo.svg"
                            alt="Unitracko logo"
                            width={220}
                            height={48}
                            className="h-auto w-[180px]"
                        />
                        <p className="mt-3 max-w-xs text-sm leading-relaxed text-black/75">
                            Track admissions, payments and updates in real time. No missed steps.
                            No last-minute scrambling.
                        </p>
                    </div>

                    <nav className="flex flex-col gap-3 text-sm font-semibold text-black/85">
                        {LANDING_PRIMARY_NAV.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="inline-flex w-fit self-start transition-colors hover:text-black"
                                onClick={(event) => {
                                    if (!isHomePage) return;
                                    handleLandingHashClick(event, item.href);
                                }}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="max-w-sm -ml-1 sm:-ml-2 lg:-ml-6 lg:max-w-md">
                        <p className="text-sm font-semibold tracking-wide text-black/70">
                            {isLoggedIn ? "Need help or have query ?" : "Join UniTracko"}
                        </p>

                        <form
                            onSubmit={handleLeadSubmit}
                            className="mt-3 flex overflow-hidden rounded-full border border-black/25 bg-black"
                        >
                            <input
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={leadEmail}
                                onChange={(e) => setLeadEmail(e.target.value)}
                                placeholder={
                                    isLoggedIn ? "Enter mail for Query" : "Enter your email"
                                }
                                className="w-full bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-white/60 focus:outline-none"
                            />
                            <button
                                type="submit"
                                aria-label={
                                    isLoggedIn
                                        ? "Continue to query form"
                                        : "Continue to sign up"
                                }
                                className="inline-flex items-center justify-center px-4 text-white/80 transition-colors hover:text-white"
                            >
                                <FaEnvelope />
                            </button>
                        </form>

                        {!isLoggedIn && (
                            <p className="mt-3 text-xs text-black/70">
                                I agree to UniTracko&apos;s{" "}
                                <Link
                                    href="/legal#terms-of-use"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-black/85 underline underline-offset-2 hover:text-black"
                                >
                                    Terms of Use
                                </Link>
                                {" "}and{" "}
                                <Link
                                    href="/legal#privacy-policy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-black/85 underline underline-offset-2 hover:text-black"
                                >
                                    Privacy Policy
                                </Link>
                                .
                            </p>
                        )}

                        <div
                            className={
                                !isLoggedIn
                                    ? "mt-4 flex items-center gap-3 text-black/70"
                                    : "mt-4 flex items-center gap-3 text-black/70"
                            }
                        >
                            <Link href={siteSocialLinks.email} aria-label="Email" className="transition-colors hover:text-black">
                                <FaEnvelope />
                            </Link>
                            <Link
                                href={siteSocialLinks.x}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="X"
                                className="transition-colors hover:text-black"
                            >
                                <FaXTwitter />
                            </Link>
                            <Link
                                href={siteSocialLinks.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="LinkedIn"
                                className="transition-colors hover:text-black"
                            >
                                <FaLinkedinIn />
                            </Link>
                            <Link
                                href={siteSocialLinks.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="UniTracko on Instagram"
                                className="transition-colors hover:text-black"
                            >
                                <FaInstagram />
                            </Link>
                            <Link
                                href={siteSocialLinks.youtube}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="YouTube"
                                className="transition-colors hover:text-black"
                            >
                                <FaYoutube />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-black/25 pt-4">
                    <nav
                        aria-label="Legal and policies"
                        className="flex flex-wrap items-center gap-x-0.5 gap-y-1 text-xs font-medium text-black/65"
                    >
                        {LEGAL_BAR_LINKS.map((link, index) => (
                            <span key={link.href} className="inline-flex items-center">
                                {index > 0 ? (
                                    <span
                                        className="mx-2 select-none text-black/35 sm:mx-2.5"
                                        aria-hidden
                                    >
                                        ·
                                    </span>
                                ) : null}
                                <Link
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="whitespace-nowrap underline-offset-2 transition-colors hover:text-black hover:underline"
                                >
                                    {link.label}
                                </Link>
                            </span>
                        ))}
                    </nav>
                    <p className="shrink-0 text-xs font-medium text-black/65 sm:text-right">
                        © 2026 UNITRACKO. All rights reserved
                    </p>
                </div>
            </div>
        </footer>
    );
}
