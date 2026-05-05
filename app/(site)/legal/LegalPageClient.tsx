"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import legalDocument from "@/data/legal-document.json";

type LegalSection = {
    id: string;
    title: string;
    paragraphs: string[];
};

const doc = legalDocument as { intro: string[]; sections: LegalSection[] };

function isDecorativeLine(s: string): boolean {
    const t = s.trim();
    if (!t) return true;
    return /^[━═─▔_\s·]+$/.test(t);
}

function isNumberedSubheading(s: string): boolean {
    return /^\d+(\.\d+)?\s/.test(s.trim());
}

function isLetterSubheading(s: string): boolean {
    return /^[A-Z]\.\s/.test(s.trim());
}

function isMetaLine(s: string): boolean {
    const t = s.trim();
    return (
        /^Last Updated:/i.test(t) ||
        /^Effective Date:/i.test(t) ||
        /^Version:/i.test(t)
    );
}

function isTldrLine(s: string): boolean {
    return /^TL;DR\b/i.test(s.trim());
}

function isLikelyListItem(s: string): boolean {
    const t = s.trim();
    if (!t) return false;
    if (isDecorativeLine(t) || isMetaLine(t) || isTldrLine(t)) return false;
    if (isNumberedSubheading(t) || isLetterSubheading(t)) return false;
    if (t.endsWith(":")) return false;
    if (/[.!?]$/.test(t)) return false;
    if (t.length > 95) return false;
    return true;
}

function linkify(text: string): ReactNode {
    const re =
        /(https?:\/\/[^\s|]+|www\.[^\s|]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    const parts: React.ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(text)) !== null) {
        if (m.index > last) {
            parts.push(text.slice(last, m.index));
        }
        const raw = m[0];
        let href: string;
        if (/^https?:\/\//i.test(raw)) {
            href = raw;
        } else if (/^www\./i.test(raw)) {
            href = `https://${raw}`;
        } else {
            href = `mailto:${raw}`;
        }
        const isMail = href.startsWith("mailto:");
        parts.push(
            <a
                key={`${m.index}-${raw.slice(0, 12)}`}
                href={href}
                className="font-semibold text-black underline underline-offset-2 decoration-black/40 hover:decoration-black"
                {...(isMail ? {} : { target: "_blank", rel: "noopener noreferrer" })}
            >
                {raw}
            </a>
        );
        last = m.index + raw.length;
    }
    if (last < text.length) {
        parts.push(text.slice(last));
    }
    return parts.length ? <>{parts}</> : text;
}

function IntroBlock({ lines }: { lines: string[] }) {
    return (
        <header id="legal-top" className="scroll-mt-20 md:scroll-mt-24">
            {lines.map((line, i) => {
                if (i === 0) {
                    return (
                        <h1
                            key={i}
                            className="text-[1.75rem] font-extrabold leading-tight text-black sm:text-4xl md:text-[2.35rem]"
                        >
                            {line}
                        </h1>
                    );
                }
                if (isDecorativeLine(line)) {
                    return (
                        <div
                            key={i}
                            className="my-5 text-center text-xs tracking-[0.35em] text-black/35"
                            aria-hidden
                        >
                            · · ·
                        </div>
                    );
                }
                if (line === "Documents Included:") {
                    return (
                        <p key={i} className="mt-8 text-sm font-bold text-black">
                            {line}
                        </p>
                    );
                }
                if (isMetaLine(line)) {
                    return (
                        <p key={i} className="mt-2 text-sm text-black/60">
                            {linkify(line)}
                        </p>
                    );
                }
                return (
                    <p
                        key={i}
                        className={`mt-3 text-base leading-relaxed text-black/80 ${line.startsWith('"') ? "rounded-lg border border-black/10 bg-amber-50/80 px-4 py-3 font-medium text-black/85" : ""}`}
                    >
                        {linkify(line)}
                    </p>
                );
            })}
        </header>
    );
}

function SectionBody({ paragraphs }: { paragraphs: string[] }) {
    const body =
        paragraphs.length > 0 && /^\d+\.\s/.test(paragraphs[0].trim())
            ? paragraphs.slice(1)
            : paragraphs;

    const lines = body.map((x) => x.trim()).filter(Boolean);
    const nodes: ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (isDecorativeLine(line)) {
            nodes.push(
                <div
                    key={`sep-${i}`}
                    className="my-6 text-center text-xs tracking-[0.35em] text-black/35"
                    aria-hidden
                >
                    · · ·
                </div>
            );
            i += 1;
            continue;
        }

        if (isNumberedSubheading(line) || isLetterSubheading(line)) {
            nodes.push(
                <h3
                    key={`h-${i}`}
                    className="mt-9 scroll-mt-24 text-lg font-extrabold leading-snug text-black first:mt-0 md:text-xl md:scroll-mt-28"
                >
                    {linkify(line)}
                </h3>
            );
            i += 1;
            continue;
        }

        if (isTldrLine(line)) {
            nodes.push(
                <p key={`tldr-${i}`} className="mt-6 text-base font-semibold text-black">
                    {linkify(line)}
                </p>
            );
            i += 1;
            continue;
        }

        if (isMetaLine(line)) {
            nodes.push(
                <p key={`meta-${i}`} className="text-sm text-black/60">
                    {linkify(line)}
                </p>
            );
            i += 1;
            continue;
        }

        if (line.endsWith(":")) {
            nodes.push(
                <p key={`label-${i}`} className="mt-5 text-base font-bold text-black md:text-[1.04rem]">
                    {linkify(line)}
                </p>
            );

            const items: string[] = [];
            let j = i + 1;
            while (j < lines.length) {
                const next = lines[j];
                if (
                    next.endsWith(":") ||
                    isDecorativeLine(next) ||
                    isMetaLine(next) ||
                    isTldrLine(next) ||
                    isNumberedSubheading(next) ||
                    isLetterSubheading(next)
                ) {
                    break;
                }
                if (!isLikelyListItem(next)) break;
                items.push(next);
                j += 1;
            }

            if (items.length > 0) {
                nodes.push(
                    <ul
                        key={`ul-after-label-${i}`}
                        className="mt-2 list-disc space-y-1.5 rounded-xl border border-black/10 bg-slate-50/70 px-5 py-4 pl-9 text-black/85 marker:text-black/60"
                    >
                        {items.map((item, idx) => (
                            <li key={`li-after-label-${i}-${idx}`}>{linkify(item)}</li>
                        ))}
                    </ul>
                );
                i = j;
            } else {
                i += 1;
            }
            continue;
        }

        if (isLikelyListItem(line)) {
            const items: string[] = [line];
            let j = i + 1;
            while (j < lines.length && isLikelyListItem(lines[j])) {
                items.push(lines[j]);
                j += 1;
            }
            nodes.push(
                <ul
                    key={`ul-${i}`}
                    className="list-disc space-y-1.5 rounded-xl border border-black/10 bg-slate-50/70 px-5 py-4 pl-9 text-black/85 marker:text-black/60"
                >
                    {items.map((item, idx) => (
                        <li key={`li-${i}-${idx}`}>{linkify(item)}</li>
                    ))}
                </ul>
            );
            i = j;
            continue;
        }

        nodes.push(
            <p key={`p-${i}`} className="text-base leading-relaxed text-black/80">
                {linkify(line)}
            </p>
        );
        i += 1;
    }

    return (
        <div className="mt-6 space-y-3">{nodes}</div>
    );
}

function scrollToHash() {
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (!hash) {
        window.scrollTo({ top: 0, behavior: "auto" });
        return;
    }
    requestAnimationFrame(() => {
        const el = document.getElementById(hash);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });
}

export default function LegalPageClient() {
    useEffect(() => {
        scrollToHash();
        const onHash = () => scrollToHash();
        window.addEventListener("hashchange", onHash);
        return () => window.removeEventListener("hashchange", onHash);
    }, []);

    return (
        <main className="min-h-screen bg-white pb-24">
            <div className="appContainer py-10 md:py-14">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-black/70 transition-colors hover:text-black hover:underline"
                >
                    <FiArrowLeft aria-hidden />
                    Back to UniTracko
                </Link>

                <article className="mx-auto mt-10 max-w-3xl">
                    <IntroBlock lines={doc.intro} />

                    <nav
                        className="mt-10 rounded-2xl border border-black/10 bg-amber-50/60 px-5 py-5 md:px-6"
                        aria-label="On this page"
                    >
                        <p className="text-xs font-bold uppercase tracking-wide text-black/55">
                            On this page
                        </p>
                        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                            {doc.sections.map((s) => (
                                <li key={s.id}>
                                    <a
                                        href={`#${s.id}`}
                                        className="text-sm font-semibold text-black/80 underline-offset-2 hover:text-black hover:underline"
                                    >
                                        {s.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {doc.sections.map((section, idx) => (
                        <section
                            key={section.id}
                            id={section.id}
                            className="scroll-mt-20 border-t border-black/10 pt-12 first:border-t-0 md:scroll-mt-24"
                            aria-labelledby={`${section.id}-heading`}
                        >
                            <h2
                                id={`${section.id}-heading`}
                                className="text-2xl font-extrabold leading-tight text-black md:text-3xl"
                            >
                                {section.title}
                            </h2>
                            <SectionBody paragraphs={section.paragraphs} />
                            {idx < doc.sections.length - 1 ? null : null}
                        </section>
                    ))}
                </article>
            </div>
        </main>
    );
}
