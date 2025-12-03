"use client";

import React, { useState } from "react";
import {
    FiBell,
    FiMessageCircle,
    FiUser,
    FiMenu,
    FiX,
    FiLogOut,
} from "react-icons/fi";

import { Button, Logo, Navigation, ThemeToggle } from "../shared";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

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
    const { isAuthenticated, logout, user } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
    };

    const handleProfileClick = () => {
        router.push('/dashboard');
    };

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

                            {isAuthenticated ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        aria-label="Profile"
                                        onClick={handleProfileClick}
                                        className="bg-gradient-to-r from-[#FBEDF7] to-[#DAF1FF] text-pink hover:bg-gradient-to-r hover:from-[#DAF1FF] hover:to-[#FBEDF7] transition-colors duration-500 px-6 py-3 text-sm rounded-full font-medium inline-flex items-center justify-center gap-2"
                                    >
                                        <FiUser className="text-[18px]" />
                                        {user?.name && <span>{user.name}</span>}
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Logout"
                                        onClick={handleLogout}
                                        className="bg-gradient-to-r from-[#FBEDF7] to-[#DAF1FF] text-pink hover:bg-gradient-to-r hover:from-[#DAF1FF] hover:to-[#FBEDF7] transition-colors duration-500 px-6 py-3 text-sm rounded-full font-medium inline-flex items-center justify-center gap-2"
                                    >
                                        <FiLogOut className="text-[18px]" />
                                    </button>
                                </div>
                            ) : (
                                <Button variant="LightGradient" size="sm" href="/login">
                                    Sign in
                                </Button>
                            )}
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

                            {isAuthenticated ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        aria-label="Profile"
                                        onClick={handleProfileClick}
                                        className="bg-gradient-to-r from-[#FBEDF7] to-[#DAF1FF] text-pink hover:bg-gradient-to-r hover:from-[#DAF1FF] hover:to-[#FBEDF7] transition-colors duration-500 px-4 py-2 text-sm rounded-full font-medium inline-flex items-center justify-center gap-2"
                                    >
                                        <FiUser className="text-[16px]" />
                                        {user?.name && <span className="hidden sm:inline">{user.name}</span>}
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Logout"
                                        onClick={handleLogout}
                                        className="bg-gradient-to-r from-[#FBEDF7] to-[#DAF1FF] text-pink hover:bg-gradient-to-r hover:from-[#DAF1FF] hover:to-[#FBEDF7] transition-colors duration-500 px-4 py-2 text-sm rounded-full font-medium inline-flex items-center justify-center"
                                    >
                                        <FiLogOut className="text-[16px]" />
                                    </button>
                                </div>
                            ) : null}

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

                            {!isAuthenticated && (
                                <div className="mt-3">
                                    <Button
                                        variant="LightGradient"
                                        size="sm"
                                        className="w-full justify-center"
                                        href="/login"
                                    >
                                        Sign in
                                    </Button>
                                </div>
                            )}
                        </nav>
                    )}
                </div>
            </div>
        </header>
    );
}
