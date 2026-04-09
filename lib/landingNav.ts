import type { MouseEvent } from "react";

/**
 * Shared marketing nav targets and smooth scroll for same-page #anchors on /.
 */

export const HEADER_SCROLL_OFFSET_PX = 12;
export const ANCHOR_SCROLL_DURATION_MS = 700;

export type LandingNavItem = { label: string; href: string };

/** Desktop + mobile header nav (order matches site IA). */
export const LANDING_PRIMARY_NAV: LandingNavItem[] = [
    { label: "UniTracko", href: "/#home" },
    { label: "The Reality", href: "/#reality" },
    { label: "The Playbook", href: "/#the-playbook" },
    { label: "Our Edge", href: "/#our-edge" },
    { label: "The Feed", href: "/blogs" },
    { label: "Get in Touch", href: "/#contact" },
];

const easeInOutCubic = (value: number) =>
    value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

export function smoothScrollToY(targetY: number) {
    const reducedMotionEnabled = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clampedTargetY = Math.max(0, targetY);

    if (reducedMotionEnabled) {
        window.scrollTo(0, clampedTargetY);
        return;
    }

    const startY = window.scrollY;
    const deltaY = clampedTargetY - startY;

    if (Math.abs(deltaY) < 2) {
        return;
    }

    let animationStartTime: number | null = null;

    const animate = (currentTime: number) => {
        if (animationStartTime === null) {
            animationStartTime = currentTime;
        }

        const elapsed = currentTime - animationStartTime;
        const progress = Math.min(elapsed / ANCHOR_SCROLL_DURATION_MS, 1);
        const easedProgress = easeInOutCubic(progress);
        window.scrollTo(0, startY + deltaY * easedProgress);

        if (progress < 1) {
            window.requestAnimationFrame(animate);
        }
    };

    window.requestAnimationFrame(animate);
}

export function scrollToLandingSection(sectionId: string) {
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) {
        return;
    }

    const siteHeader = document.querySelector("header");
    const fallbackHeaderHeight = window.innerWidth >= 1024 ? 72 : 64;
    const siteHeaderHeight =
        siteHeader instanceof HTMLElement ? siteHeader.offsetHeight : fallbackHeaderHeight;
    const targetY =
        targetSection.getBoundingClientRect().top +
        window.scrollY -
        siteHeaderHeight -
        HEADER_SCROLL_OFFSET_PX;

    smoothScrollToY(targetY);
}

/**
 * Use on Link onClick when pathname is "/" and href is /#id so scroll matches the header.
 */
export function handleLandingHashClick(
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    options?: { onAfterNavigate?: () => void },
) {
    options?.onAfterNavigate?.();

    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) {
        return;
    }

    const targetId = href.slice(hashIndex + 1);
    if (!targetId) {
        return;
    }

    const sectionExists = document.getElementById(targetId);
    if (!sectionExists) {
        return;
    }

    event.preventDefault();
    window.history.replaceState(null, "", `/#${targetId}`);
    scrollToLandingSection(targetId);
}
