"use client";

import React from "react";
import { FiUploadCloud, FiFileText, FiSettings } from "react-icons/fi";

type Shortcut = {
    label: string;
    icon: React.ReactNode;
};

const shortcuts: Shortcut[] = [
    {
        label: "Upload Marks",
        icon: <FiUploadCloud className="text-xl text-pink" />,
    },
    {
        label: "Upload Documents",
        icon: <FiFileText className="text-xl text-pink" />,
    },
    {
        label: "Upload Preferences",
        icon: <FiSettings className="text-xl text-pink" />,
    },
];

export default function QuickShortcuts() {
    return (
        <section className="w-full max-w-sm rounded-md bg-pink/5 px-5 pb-6 pt-6 dark:bg-slate-900">
            <h3 className="mb-4 text-xl font-semibold dark:text-white">Quick Shortcuts</h3>

            <div className="space-y-3">
                {shortcuts.map((item) => (
                    <button
                        key={item.label}
                        type="button"
                        className="flex w-full items-center gap-4 rounded-md bg-white p-3 text-left text-sm font-medium text-slate-900 shadow-sm dark:bg-slate-950 dark:hover:bg-pink dark:text-white transition duration-500 hover:bg-pink hover:text-white group"
                    >
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pink/10 hover:bg-white transition duration-500 group-hover:bg-white">
                            {item.icon}
                        </span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}
