"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronDown, FiLogOut, FiMenu, FiX } from "react-icons/fi";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { handleLandingHashClick, LANDING_PRIMARY_NAV } from "@/lib/landingNav";
import { usePathname, useRouter } from "next/navigation";

export default function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement | null>(null);
    const { isAuthenticated, logout, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isHomePage = pathname === "/";
    const userDisplayName = useMemo(() => {
        const name = user?.name?.trim();
        if (name) return name;
        return user?.email?.split("@")[0] || "User";
    }, [user]);
    const userInitial = useMemo(() => {
        const first = userDisplayName.trim().charAt(0);
        return first ? first.toUpperCase() : "U";
    }, [userDisplayName]);

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

    useEffect(() => {
        if (!userMenuOpen) return;
        const onDocClick = (event: MouseEvent) => {
            if (!userMenuRef.current) return;
            if (!userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [userMenuOpen]);

    const handleLogout = () => {
        logout();
    };

    const isSolidHeader = !isHomePage || isScrolled || mobileOpen;
    const headerPositionClass = isHomePage ? "fixed inset-x-0 top-0" : "sticky top-0";
    const headerSurfaceClass = isSolidHeader
        ? "border-b border-black/10 bg-white/95 shadow-sm backdrop-blur-md"
        : "border-b border-transparent bg-transparent";
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

    const handleNavLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        const hashIndex = href.indexOf("#");
        const hasHash = hashIndex !== -1 && href.slice(hashIndex + 1).length > 0;

        if (isHomePage && hasHash) {
            handleLandingHashClick(event, href, { onAfterNavigate: () => setMobileOpen(false) });
            return;
        }

        if (!isHomePage && hasHash) {
            event.preventDefault();
            setMobileOpen(false);
            router.push(href);
            return;
        }

        setMobileOpen(false);
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
                                src={isSolidHeader ? "/UniTracko logo 2/logo-2.svg" : "/landing-page/Logo-white.svg"}
                                alt="Unitracko logo"
                                width={170}
                                height={38}
                                priority
                                className="h-auto w-[150px] transition duration-300 md:w-[170px]"
                            />
                        </Link>

                        <nav className="flex items-center gap-7 text-sm font-medium">
                            {LANDING_PRIMARY_NAV.map((item) => (
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
                                        My Dashboard
                                    </button>
                                    <div className="relative" ref={userMenuRef}>
                                        <button
                                            type="button"
                                            onClick={() => setUserMenuOpen((v) => !v)}
                                            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-sm font-semibold transition-all duration-300 ${
                                                isSolidHeader
                                                    ? "border-black/20 bg-white text-black hover:bg-black/5"
                                                    : "border-white/35 bg-black/15 text-white hover:bg-black/30"
                                            }`}
                                        >
                                            {user?.profile_photo ? (
                                                <Image
                                                    src={user.profile_photo}
                                                    alt={userDisplayName}
                                                    width={28}
                                                    height={28}
                                                    className="h-7 w-7 rounded-full object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                                                    isSolidHeader ? "bg-black text-white" : "bg-white text-black"
                                                }`}>
                                                    {userInitial}
                                                </span>
                                            )}
                                            <span className="max-w-[110px] truncate">{userDisplayName}</span>
                                            <FiChevronDown className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                                        </button>
                                        {userMenuOpen && (
                                            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-black/10 bg-white p-1.5 shadow-lg">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setUserMenuOpen(false);
                                                        handleLogout();
                                                    }}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                                >
                                                    <FiLogOut className="h-4 w-4" />
                                                    Logout
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/signup"
                                        className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${primaryActionClass}`}
                                    >
                                        Start My Journey
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
                                src={isSolidHeader ? "/UniTracko logo 2/logo-2.svg" : "/landing-page/Logo-white.svg"}
                                alt="Unitracko logo"
                                width={150}
                                height={34}
                                priority
                                className="h-auto w-[140px] transition duration-300"
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
                                {LANDING_PRIMARY_NAV.map((link) => (
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
                                            My Dashboard
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMobileOpen(false);
                                                handleLogout();
                                            }}
                                            className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
                                        >
                                            <FiLogOut className="h-4 w-4" />
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/signup"
                                            className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            Start My Journey
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
