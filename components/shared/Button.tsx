"use client";

import React from "react";
import Link from "next/link";

type ButtonVariant =
  | "LightGradient"
  | "themeButton"
  | "themeButtonOutline"
  | "DarkGradient";

type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
  href?: string; // <-- add this
}

const variantStyles: Record<ButtonVariant, string> = {
  LightGradient:
    "bg-gradient-to-r from-[#FBEDF7] to-[#DAF1FF] text-pink hover:bg-gradient-to-r hover:from-[#DAF1FF] hover:to-[#FBEDF7] transition-colors duration-500",

  themeButton:
    "bg-pink text-white hover:bg-white hover:text-pink border border-pink transition duration-500",

  themeButtonOutline:
    "border border-pink text-pink bg-transparent hover:bg-pink hover:text-white transition duration-500",

  DarkGradient:
    "bg-gradient-to-r from-[#9705F9] to-[#DB0078] text-white transition-colors duration-500 hover:from-[#DB0078] hover:to-[#9705F9]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-6 py-3 text-sm rounded-full",
  md: "px-8 py-3 text-base rounded-full",
  lg: "px-10 py-3 text-lg rounded-full",
};

export default function Button({
  variant = "themeButton",
  size = "md",
  children,
  className = "",
  href,       // <-- detect href
  ...props
}: ButtonProps) {
  const combined = `
    transition-all duration-200 active:scale-[0.97] font-medium select-none inline-flex items-center justify-center
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${className}
  `;

  // If href exists → render Link
  if (href) {
    return (
      <Link href={href} className={combined.trim()}>
        {children}
      </Link>
    );
  }

  // Else → render button
  return (
    <button className={combined.trim()} {...props}>
      {children}
    </button>
  );
}
