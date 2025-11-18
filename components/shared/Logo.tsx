"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  lightSrc?: string;     // logo for light mode
  darkSrc?: string;      // logo for dark mode
  alt?: string;
  href?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
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
}: Props) {
  const content = (
    <>
      {/* Light mode logo */}
      <Image
        src={lightSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={`block dark:hidden ${className}`}
      />

      {/* Dark mode logo */}
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

  return href ? (
    <Link href={href} aria-label={alt} className="inline-flex items-center">
      {content}
    </Link>
  ) : (
    content
  );
}
