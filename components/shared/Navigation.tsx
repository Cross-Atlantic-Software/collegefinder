"use client";

import Link from "next/link";

const navLinks = [
    { label: "Career & Exams", href: "/career" },
    { label: "Apply", href: "/apply" },
    { label: "Prepare", href: "/prepare" },
    { label: "College", href: "/college" },
    { label: "Finance", href: "/finance" },
    { label: "Knowledge Center", href: "/knowledge-center" },
];

export default function Navigation() {
    return (
        <nav className="hidden items-center gap-4 text-sm text-gray-800 dark:text-gray-200 lg:flex">
            {navLinks.map((item, index) => (
                <div key={item.href} className="flex items-center gap-4">
                    {index !== 0 && (
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                    )}

                    <Link
                        href={item.href}
                        className="text-md font-semibold text-gray-800 dark:text-gray-200 transition duration-500 hover:text-pink dark:hover:text-pink"
                    >
                        {item.label}
                    </Link>
                </div>
            ))}
        </nav>
    );
}
