"use client";

import React, { useState } from "react";
import {
    FiBell,
    FiMessageCircle,
    FiUser,
    FiMenu,
    FiX,
} from "react-icons/fi";

import { Button, Logo, Navigation, ThemeToggle } from "../shared";
import Link from "next/link";

const mobileNavLinks = [
    { label: "Career & Exams", href: "/career" },
    { label: "Apply", href: "/apply" },
    { label: "Prepare", href: "/prepare" },
    { label: "College", href: "/college" },
    { label: "Finance", href: "/finance" },
    { label: "Knowledge Center", href: "/knowledge-center" },
];

export default function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <header className="bg-white py-3 dark:bg-[#050816]">
            <div className="appContainer">
                <div className="mx-auto">
                    {/* DESKTOP HEADER */}
                    <div className="hidden h-16 items-center justify-between lg:flex lg:h-20">
                        {/* Left: logo + nav */}
                        <div className="flex flex-col items-start gap-6">
                            <Logo href="/" />
                            <Navigation />
                        </div>

                        {/* Right: icons + CTA */}
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                aria-label="Notifications"
                                className="relative inline-flex items-center justify-center rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <FiBell className="text-[18px] text-black dark:text-gray-100" />
                                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ff0080]" />
                            </button>

                            <button
                                type="button"
                                aria-label="Messages"
                                className="inline-flex items-center justify-center rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <FiMessageCircle className="text-[18px] text-black dark:text-gray-100" />
                            </button>

                            <ThemeToggle />

                            <button
                                type="button"
                                aria-label="Profile"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/80 transition hover:bg-gray-50 dark:border-gray-200 dark:hover:bg-gray-800"
                            >
                                <FiUser className="text-[18px] text-black dark:text-gray-100" />
                            </button>

                            <Button variant="LightGradient" size="sm">
                                Get Started
                            </Button>
                        </div>
                    </div>

                    {/* MOBILE HEADER */}
                    <div className="flex h-14 items-center justify-between lg:hidden">
                        <Logo href="/" />

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                aria-label="Notifications"
                                className="relative inline-flex items-center justify-center rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <FiBell className="text-[18px] text-black dark:text-gray-100" />
                                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ff0080]" />
                            </button>

                            <ThemeToggle />

                            <button
                                type="button"
                                aria-label="Profile"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/80 transition hover:bg-gray-50 dark:border-gray-200 dark:hover:bg-gray-800"
                            >
                                <FiUser className="text-[18px] text-black dark:text-gray-100" />
                            </button>

                            {/* Hamburger */}
                            <button
                                type="button"
                                aria-label="Toggle navigation"
                                onClick={() => setMobileOpen((prev) => !prev)}
                                className="ms-2"
                            >
                                {mobileOpen ? (
                                    <FiX className="text-[20px] text-black dark:text-gray-100" />
                                ) : (
                                    <FiMenu className="text-[20px] text-black dark:text-gray-100" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* MOBILE NAV MENU */}
                    {mobileOpen && (
                        <nav className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3 text-sm text-gray-800 dark:border-gray-800 dark:text-gray-200 lg:hidden">
                            {mobileNavLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="py-1.5 text-sm transition hover:text-black dark:hover:text-white"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}

                            <div className="mt-3">
                                <Button
                                    variant="LightGradient"
                                    size="sm"
                                    className="w-full justify-center"
                                >
                                    Get Started
                                </Button>
                            </div>
                        </nav>
                    )}
                </div>
            </div>
        </header>
    );
}
