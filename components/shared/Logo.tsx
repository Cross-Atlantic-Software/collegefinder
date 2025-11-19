"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  lightSrc?: string;
  darkSrc?: string;
  alt?: string;
  href?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;

  // NEW PROP
  mode?: "auto" | "light" | "dark";  
};

export default function Logo({
  lightSrc = "/svgs/logo.svg",
  darkSrc = "/svgs/logo-dark.svg",
  alt = "College Finder",
  href,
  width = 200,
  height = 40,
  className = "",
  priority,
  mode = "auto",   // default: auto (light + dark based on tailwind)
}: Props) {
  const renderLogo = () => {
    if (mode === "light") {
      return (
        <Image
          src={lightSrc}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className={className}
        />
      );
    }

    if (mode === "dark") {
      return (
        <Image
          src={darkSrc}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className={className}
        />
      );
    }

    // AUTO (default) — Tailwind manages dark mode
    return (
      <>
        <Image
          src={lightSrc}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className={`block dark:hidden ${className}`}
        />
        <Image
          src={darkSrc}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className={`hidden dark:block ${className}`}
        />
      </>
    );
  };

  const content = renderLogo();

  return href ? (
    <Link href={href} aria-label={alt} className="inline-flex items-center">
      {content}
    </Link>
  ) : (
    content
  );
}
