"use client";

import {
    FaEnvelope,
    FaFacebookF,
    FaInstagram,
    FaXTwitter,
} from "react-icons/fa6";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { handleLandingHashClick, LANDING_PRIMARY_NAV } from "@/lib/landingNav";

const LEGAL_BAR_LINKS: { href: string; label: string }[] = [
    { href: "/legal", label: "Legal" },
    { href: "/legal#privacy-policy", label: "Privacy Policy" },
    { href: "/legal#terms-of-use", label: "Terms of Use" },
    { href: "/legal#cookie-policy", label: "Cookie Policy" },
    { href: "/legal#disclaimer", label: "Disclaimer" },
    { href: "/legal#our-data-promise", label: "Our Data Promise" },
    { href: "/legal#refund-policy", label: "Refund Policy" },
];

export default function Footer() {
    const pathname = usePathname();
    const isHomePage = pathname === "/";
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
                                className="transition-colors hover:text-black"
                                onClick={(event) => {
                                    if (!isHomePage) return;
                                    handleLandingHashClick(event, item.href);
                                }}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-black/70">
                            Stay up to date
                        </p>

                        <form className="mt-3 flex overflow-hidden rounded-full border border-black/25 bg-black">
                            <input
                                type="email"
                                placeholder=""
                                className="w-full bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-white/60 focus:outline-none"
                            />
                            <button
                                type="submit"
                                aria-label="Subscribe"
                                className="inline-flex items-center justify-center px-4 text-white/80 transition-colors hover:text-white"
                            >
                                <FaEnvelope />
                            </button>
                        </form>

                        <p className="mt-3 text-xs text-black/70">
                            I confirm that I have read{" "}
                            <Link
                                href="/legal#privacy-policy"
                                className="font-semibold text-black/85 underline underline-offset-2 hover:text-black"
                            >
                                Privacy Policy
                            </Link>{" "}
                            and agree with it.
                        </p>

                        <div className="mt-4 flex items-center gap-3 text-black/70">
                            <Link href="#" aria-label="Email" className="transition-colors hover:text-black">
                                <FaEnvelope />
                            </Link>
                            <Link href="#" aria-label="X" className="transition-colors hover:text-black">
                                <FaXTwitter />
                            </Link>
                            <Link href="#" aria-label="Facebook" className="transition-colors hover:text-black">
                                <FaFacebookF />
                            </Link>
                            <Link href="#" aria-label="Instagram" className="transition-colors hover:text-black">
                                <FaInstagram />
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
