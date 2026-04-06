import type { ReactNode } from "react";

type LandingCardFrameProps = {
    children: ReactNode;
    className?: string;
    /** Hand-drawn strokes above the frame (How it works + blog cards). */
    showSquiggles?: boolean;
    /** `sm` for dense grids so strokes don’t overlap neighbors. */
    squiggleVariant?: "lg" | "sm";
};

function FrameSquiggles({ variant }: { variant: "lg" | "sm" }) {
    const isLg = variant === "lg";
    const strokeW = isLg ? 8 : 5;
    return (
        <svg
            viewBox="0 0 220 120"
            aria-hidden="true"
            className={
                isLg
                    ? "pointer-events-none absolute -left-10 -top-2 z-30 h-20 w-44 text-black"
                    : "pointer-events-none absolute -left-5 -top-1 z-30 h-[3.25rem] w-[7.25rem] text-black sm:-left-6 sm:h-14 sm:w-32"
            }
        >
            <path
                d="M18 88 C44 70, 63 67, 85 66"
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeW}
                strokeLinecap="round"
            />
            <path
                d="M72 45 C88 58, 102 65, 118 74"
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeW}
                strokeLinecap="round"
            />
            <path
                d="M136 10 C126 38, 124 60, 123 84"
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeW}
                strokeLinecap="round"
            />
        </svg>
    );
}

/**
 * Layered sky + amber offset blocks behind content, matching the landing “How it works” video frame.
 */
export function LandingCardFrame({
    children,
    className = "",
    showSquiggles = false,
    squiggleVariant = "lg",
}: LandingCardFrameProps) {
    return (
        <div className={`relative w-full ${className}`.trim()}>
            {showSquiggles ? <FrameSquiggles variant={squiggleVariant} /> : null}

            <div className="absolute -left-3 bottom-0 z-0 h-[82%] w-[82%] rounded-[18px] bg-sky-200 sm:-left-5" />
            <div className="absolute right-0 top-0 z-0 h-[82%] w-[86%] rounded-[18px] bg-amber-200" />

            <div className="relative z-10">{children}</div>
        </div>
    );
}
