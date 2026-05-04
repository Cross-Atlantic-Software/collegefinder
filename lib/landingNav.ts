import type { MouseEvent } from "react";

/**
 * Shared marketing nav targets and smooth scroll for same-page #anchors on /.
 */

export const HEADER_SCROLL_OFFSET_PX = 12;
export const ANCHOR_SCROLL_DURATION_MS = 700;

export type LandingNavItem = { label: string; href: string };

/**
 * Query on `/` so ContactSection does not auto-redirect completed users to `/welcome`
 * (avoids a loop when returning from the post-onboarding welcome screen).
 */
export const LANDING_FROM_HOME_PARAM = "from";
export const LANDING_FROM_HOME_VALUE = "home";

/** Same-origin URL for a landing section; includes `from=home` so ContactSection does not send completed users to `/welcome`. */
export function landingPageSectionHref(sectionId: string): string {
    return `/?${LANDING_FROM_HOME_PARAM}=${LANDING_FROM_HOME_VALUE}#${sectionId}`;
}

/** Desktop + mobile header nav (order matches site IA). */
export const LANDING_PRIMARY_NAV: LandingNavItem[] = [
    { label: "UniTracko", href: landingPageSectionHref("home") },
    { label: "The Reality", href: landingPageSectionHref("reality") },
    { label: "The Playbook", href: landingPageSectionHref("the-playbook") },
    { label: "Our Edge", href: landingPageSectionHref("our-edge") },
    { label: "The Feed", href: "/blogs" },
    { label: "Get in Touch", href: landingPageSectionHref("get-in-touch") },
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

    let pathWithSearch = "";
    try {
        const resolved = new URL(href, window.location.href);
        pathWithSearch = resolved.pathname + resolved.search;
    } catch {
        pathWithSearch = window.location.pathname + window.location.search;
    }

    window.history.replaceState(null, "", `${pathWithSearch}#${targetId}`);
    scrollToLandingSection(targetId);
}
