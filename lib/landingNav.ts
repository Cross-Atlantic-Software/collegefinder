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

/** Waitlist screen shown when authenticated users open "My Dashboard" from the marketing site. */
export const DASHBOARD_WELCOME_PATH = "/welcome?from=dashboard";

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
        return false;
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
    return true;
}

/** Retry scroll until the section mounts (landing CMS content loads asynchronously). */
export function scheduleScrollToLandingSection(sectionId: string, maxAttempts = 24) {
    let attempts = 0;

    const tryScroll = () => {
        if (scrollToLandingSection(sectionId)) {
            return;
        }
        attempts += 1;
        if (attempts < maxAttempts) {
            requestAnimationFrame(tryScroll);
        }
    };

    requestAnimationFrame(() => {
        requestAnimationFrame(tryScroll);
    });
}

export function getLandingHashFromLocation(): string | null {
    if (typeof window === "undefined") return null;
    const raw = window.location.hash?.replace(/^#/, "").trim();
    return raw || null;
}

export function replaceLandingUrlHash(sectionId: string, href: string) {
    let pathWithSearch = "";
    try {
        const resolved = new URL(href, window.location.href);
        pathWithSearch = resolved.pathname + resolved.search;
    } catch {
        pathWithSearch = window.location.pathname + window.location.search;
    }
    window.history.replaceState(null, "", `${pathWithSearch}#${sectionId}`);
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

    event.preventDefault();
    replaceLandingUrlHash(targetId, href);
    scheduleScrollToLandingSection(targetId);
}

/** Call on the home page after landing sections have mounted. */
export function bindLandingHashScrollOnHome(ready: boolean) {
    if (!ready || typeof window === "undefined") return () => {};

    const scrollFromHash = () => {
        const id = getLandingHashFromLocation();
        if (id) scheduleScrollToLandingSection(id);
    };

    scrollFromHash();

    const onHashChange = () => scrollFromHash();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
}
