"use client";

import React, { useEffect, useState } from "react";
import {
    FiMenu,
    FiX,
} from "react-icons/fi";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";

const navLinks = [
    { label: "Home", href: "/#home" },
    { label: "The Problem", href: "/#problem" },
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "FAQ", href: "/#faq" },
];

const HEADER_SCROLL_OFFSET_PX = 12;
const ANCHOR_SCROLL_DURATION_MS = 700;

const easeInOutCubic = (value: number) => {
    return value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;
};

export default function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isHomePage = pathname === "/";

    useEffect(() => {
        if (!isHomePage) {
            return;
        }

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 16);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [isHomePage]);

    const handleLogout = () => {
        logout();
    };

    const isSolidHeader = !isHomePage || isScrolled || mobileOpen;
    const headerPositionClass = isHomePage ? "fixed inset-x-0 top-0" : "sticky top-0";
    const headerSurfaceClass = isSolidHeader
        ? "border-b border-black/10 bg-white/95 shadow-sm backdrop-blur-md"
        : "border-b border-transparent bg-transparent";
    const brandLogoClass = isSolidHeader ? "" : "invert";
    const navTextClass = isSolidHeader
        ? "text-black/70 hover:text-black"
        : "text-white/80 hover:text-white";
    const secondaryActionClass = isSolidHeader
        ? "text-black/80 hover:text-black"
        : "text-white/85 hover:text-white";
    const menuButtonClass = isSolidHeader
        ? "border-black/20 text-black"
        : "border-white/30 text-white";
    const primaryActionClass = isSolidHeader
        ? "bg-black text-white hover:bg-black/85"
        : "bg-white text-black hover:bg-white/90";

    const smoothScrollToY = (targetY: number) => {
        const reducedMotionEnabled = window
            .matchMedia("(prefers-reduced-motion: reduce)")
            .matches;
        const clampedTargetY = Math.max(0, targetY);

        if (reducedMotionEnabled) {
            window.scrollTo(0, clampedTargetY);
            return;
        }

        const startY = window.scrollY;
        const deltaY = clampedTargetY - startY;

        if (Math.abs(deltaY) < 2) {
            return;
        }

        let animationStartTime: number | null = null;

        const animate = (currentTime: number) => {
            if (animationStartTime === null) {
                animationStartTime = currentTime;
            }

            const elapsed = currentTime - animationStartTime;
            const progress = Math.min(elapsed / ANCHOR_SCROLL_DURATION_MS, 1);
            const easedProgress = easeInOutCubic(progress);
            window.scrollTo(0, startY + deltaY * easedProgress);

            if (progress < 1) {
                window.requestAnimationFrame(animate);
            }
        };

        window.requestAnimationFrame(animate);
    };

    const scrollToSection = (sectionId: string) => {
        const targetSection = document.getElementById(sectionId);
        if (!targetSection) {
            return;
        }

        const siteHeader = document.querySelector("header");
        const fallbackHeaderHeight = window.innerWidth >= 1024 ? 72 : 64;
        const siteHeaderHeight =
            siteHeader instanceof HTMLElement ? siteHeader.offsetHeight : fallbackHeaderHeight;
        const targetY =
            targetSection.getBoundingClientRect().top +
            window.scrollY -
            siteHeaderHeight -
            HEADER_SCROLL_OFFSET_PX;

        smoothScrollToY(targetY);
    };

    const handleNavLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        setMobileOpen(false);

        if (!isHomePage) {
            return;
        }

        const hashIndex = href.indexOf("#");
        if (hashIndex === -1) {
            return;
        }

        const targetId = href.slice(hashIndex + 1);
        if (!targetId) {
            return;
        }

        const sectionExists = document.getElementById(targetId);
        if (!sectionExists) {
            return;
        }

        event.preventDefault();
        window.history.replaceState(null, "", `/#${targetId}`);
        scrollToSection(targetId);
    };

    return (
        <header
            className={`${headerPositionClass} z-50 transition-all duration-300 ease-in-out ${headerSurfaceClass}`}
        >
            <div className="appContainer">
                <div className="mx-auto">
                    {/* DESKTOP HEADER */}
                    <div className="hidden h-[72px] items-center justify-between gap-8 lg:flex">
                        <Link
                            href="/"
                            className="inline-flex items-center"
                            aria-label="UniTracko"
                        >
                            <Image
                                src={isSolidHeader ? "/logo.svg" : "/landing-page/black-logo.svg"}
                                alt="Unitracko logo"
                                width={170}
                                height={38}
                                priority
                                className={`h-auto w-[150px] transition duration-300 md:w-[170px] ${brandLogoClass}`}
                            />
                        </Link>

                        <nav className="flex items-center gap-7 text-sm font-medium">
                            {navLinks.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={(event) => handleNavLinkClick(event, item.href)}
                                    className={`inline-flex items-center gap-1 transition-colors duration-300 ${navTextClass}`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => router.push("/dashboard")}
                                        className={`text-sm font-semibold transition-colors duration-300 ${secondaryActionClass}`}
                                    >
                                        Dashboard
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                                            isSolidHeader
                                                ? "border-black/20 text-black hover:bg-black hover:text-white"
                                                : "border-white/35 text-white hover:bg-white hover:text-black"
                                        }`}
                                    >
                                        Log out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className={`text-sm font-semibold transition-colors duration-300 ${secondaryActionClass}`}
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href="/login"
                                        className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${primaryActionClass}`}
                                    >
                                        Start free trial
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* MOBILE HEADER */}
                    <div className="flex h-[64px] items-center justify-between lg:hidden">
                        <Link
                            href="/"
                            className="inline-flex items-center"
                            aria-label="Unitracko"
                        >
                            <Image
                                src={isSolidHeader ? "/logo.svg" : "/landing-page/black-logo.svg"}
                                alt="Unitracko logo"
                                width={150}
                                height={34}
                                priority
                                className={`h-auto w-[140px] transition duration-300 ${brandLogoClass}`}
                            />
                        </Link>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                aria-label="Toggle navigation"
                                onClick={() => setMobileOpen((prev) => !prev)}
                                className={`inline-flex items-center justify-center rounded-full border p-2 transition-all duration-300 ${menuButtonClass}`}
                            >
                                {mobileOpen ? (
                                    <FiX className="text-[20px]" />
                                ) : (
                                    <FiMenu className="text-[20px]" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* MOBILE NAV MENU */}
                    {mobileOpen && (
                        <div className="border-t border-black/10 py-4 lg:hidden">
                            <nav className="flex flex-col gap-3 text-sm font-medium text-black/80">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="inline-flex items-center justify-between py-1 text-black/80 transition-colors hover:text-black"
                                        onClick={(event) => handleNavLinkClick(event, link.href)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>

                            <div className="mt-4 flex items-center gap-3">
                                {isAuthenticated ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMobileOpen(false);
                                                router.push("/dashboard");
                                            }}
                                            className="rounded-full border border-black/20 px-4 py-2 text-sm font-semibold text-black"
                                        >
                                            Dashboard
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMobileOpen(false);
                                                handleLogout();
                                            }}
                                            className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
                                        >
                                            Log out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            className="rounded-full border border-black/20 px-4 py-2 text-sm font-semibold text-black"
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            Log in
                                        </Link>
                                        <Link
                                            href="/login"
                                            className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            Start free trial
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
