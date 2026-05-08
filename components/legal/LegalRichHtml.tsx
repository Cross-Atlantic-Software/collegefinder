"use client";

import { useState, useEffect } from "react";

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "ul",
    "ol",
    "li",
    "a",
    "h1",
    "h2",
    "h3",
    "h4",
    "blockquote",
    "span",
    "div",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "class"],
};

type Props = {
  html: string;
  className?: string;
};

/** Sanitizes HTML in the browser only (dynamic import) for Next.js Webpack compatibility. */
export function LegalRichHtml({ html, className }: Props) {
  const [safe, setSafe] = useState("");

  useEffect(() => {
    let cancelled = false;
    void import("dompurify").then((mod) => {
      if (cancelled || typeof window === "undefined") return;
      const DOMPurify = mod.default;
      setSafe(DOMPurify.sanitize(html || "", SANITIZE_CONFIG));
    });
    return () => {
      cancelled = true;
    };
  }, [html]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: safe }}
      suppressHydrationWarning
    />
  );
}
