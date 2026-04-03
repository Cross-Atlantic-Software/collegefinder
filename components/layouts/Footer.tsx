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
                        <div className="mt-1 border-t border-black/20 pt-3">
                            <Link
                                href="/legal"
                                className="block transition-colors hover:text-black"
                            >
                                Legal
                            </Link>
                            <div className="mt-2 flex flex-col gap-1.5 font-medium text-black/70">
                                <Link
                                    href="/legal#privacy-policy"
                                    className="text-xs transition-colors hover:text-black"
                                >
                                    Privacy Policy
                                </Link>
                                <Link
                                    href="/legal#terms-of-use"
                                    className="text-xs transition-colors hover:text-black"
                                >
                                    Terms of Use
                                </Link>
                                <Link
                                    href="/legal#cookie-policy"
                                    className="text-xs transition-colors hover:text-black"
                                >
                                    Cookie Policy
                                </Link>
                                <Link
                                    href="/legal#disclaimer"
                                    className="text-xs transition-colors hover:text-black"
                                >
                                    Disclaimer
                                </Link>
                                <Link
                                    href="/legal#our-data-promise"
                                    className="text-xs transition-colors hover:text-black"
                                >
                                    Our Data Promise
                                </Link>
                                <Link
                                    href="/legal#refund-policy"
                                    className="text-xs transition-colors hover:text-black"
                                >
                                    Refund Policy
                                </Link>
                            </div>
                        </div>
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

                <div className="mt-10 border-t border-black/25 pt-4 text-center text-xs font-medium text-black/65">
                    © 2026 UNITRACKO. All rights reserved
                </div>
            </div>
        </footer>
    );
}
