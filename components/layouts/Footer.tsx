"use client";

import {
    FaEnvelope,
    FaFacebookF,
    FaInstagram,
    FaXTwitter,
} from "react-icons/fa6";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-amber-300 py-14 md:py-16">
            <div className="appContainer">
                <div className="grid gap-10 lg:grid-cols-[1fr_0.65fr_1fr]">
                    <div>
                        <p className="text-4xl font-extrabold tracking-tight text-black">UNITRACKO</p>
                        <p className="mt-3 max-w-xs text-sm leading-relaxed text-black/75">
                            Track admissions, payments and updates in real time. No missed steps.
                            No last-minute scrambling.
                        </p>
                    </div>

                    <nav className="flex flex-col gap-3 text-sm font-semibold text-black/85">
                        <Link href="/" className="transition-colors hover:text-black">
                            Home
                        </Link>
                        <Link href="#" className="transition-colors hover:text-black">
                            Unitracko
                        </Link>
                        <Link href="#" className="transition-colors hover:text-black">
                            Our Process
                        </Link>
                        <Link href="#" className="transition-colors hover:text-black">
                            Our Edge
                        </Link>
                        <Link href="#" className="transition-colors hover:text-black">
                            Resources
                        </Link>
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
                            I confirm that I have read Privacy Policy and agree with it.
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
