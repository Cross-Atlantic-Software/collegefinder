"use client";

interface HeadingProps {
  subHead?: string;
  head?: string;
  description?: string;
  className?: string;
  gradient?: boolean; // makes main heading gradient
  align?: "left" | "center" | "right";
}

export default function Heading({
  subHead = "",
  head = "",
  description = "",
  className = "",
  gradient = false,
  align = "left",
}: HeadingProps) {
  const alignClass =
    align === "center"
      ? "text-center items-center"
      : align === "right"
      ? "text-right items-end"
      : "text-left items-start";

  return (
    <div className={`flex flex-col gap-3 ${alignClass} ${className}`}>
      {/* Subheading */}
      {subHead && (
        <p className="text-sm font-medium uppercase tracking-wider text-pink">
          {subHead}
        </p>
      )}

      {/* Main heading */}
      {head && (
        <h2
          className={`text-3xl md:text-4xl font-semibold tracking-tight ${
            gradient
              ? "bg-gradient-to-r from-[#ff0080] to-[#7A00FF] bg-clip-text text-transparent"
              : "text-slate-900 dark:text-white"
          }`}
        >
          {head}
        </h2>
      )}

      {/* Description */}
      {description && (
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
}
