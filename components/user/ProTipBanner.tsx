"use client";

import Image from "next/image";
import React from "react";

interface ProTipBannerProps {
    icon?: React.ReactNode; // emoji OR component OR image
    title: string;
    description: string;
    bgColor?: string; // optional override for background
}

export default function ProTipBanner({
    icon = "💡",
    title,
    description,
    bgColor = "bg-pink", // default
}: ProTipBannerProps) {
    return (
        <div className={`mt-6 rounded-md px-5 py-4 text-white sm:px-5 sm:py-5 ${bgColor}`}>
            <div className="flex items-center gap-4 sm:gap-6">
                
                {/* Icon Container */}
                <div className="flex h-10 w-10 items-center justify-center sm:h-12 sm:w-12 text-3xl sm:text-4xl">
                    {typeof icon === "string" ? (
                        <span>{icon}</span>
                    ) : (
                        icon
                    )}
                </div>

                {/* Text */}
                <div className="space-y-1">
                    <h3 className="text-base font-semibold sm:text-xl">
                        {title}
                    </h3>
                    <p className="text-xs leading-relaxed sm:text-sm">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}
