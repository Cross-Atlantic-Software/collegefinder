"use client";

import React from "react";
import Link from "next/link";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "ghost"
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
  // Modern SaaS variants
  primary:
    "bg-brand-ink text-white hover:bg-slate-900 active:bg-black disabled:opacity-50 disabled:cursor-not-allowed",
  
  secondary:
    "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
  
  tertiary:
    "bg-transparent text-action-600 hover:bg-action-50 active:bg-action-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-action-500 dark:hover:bg-slate-900",
  
  ghost:
    "bg-transparent text-slate-600 hover:text-action-600 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-action-500",
  LightGradient:
    "bg-gradient-to-r from-highlight-100 to-action-100 text-brand-ink hover:from-action-100 hover:to-highlight-100 transition-colors duration-500",

  themeButton:
    "bg-brand-ink text-white hover:bg-white hover:text-brand-ink border border-brand-ink transition duration-500",

  themeButtonOutline:
    "border border-brand-ink text-brand-ink bg-transparent hover:bg-brand-ink hover:text-white transition duration-500",

  DarkGradient:
    "bg-gradient-to-r from-brand-ink to-action-700 text-white transition-colors duration-500 hover:from-black hover:to-action-700",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs font-medium rounded-md",
  md: "px-4 py-2 text-sm font-medium rounded-lg",
  lg: "px-6 py-3 text-base font-medium rounded-lg",
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
    transition-all duration-200 ease-out active:scale-[0.98] select-none inline-flex items-center justify-center gap-2 whitespace-nowrap
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
