"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FaEnvelope, FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { FiArrowLeft } from "react-icons/fi";
import { getPublicBlogBySlug } from "@/api";
import type { Blog } from "@/api/admin/blogs";
import OnboardingLoader from "@/components/shared/OnboardingLoader";
import { siteSocialLinks } from "@/lib/siteSocial";

/** Extract YYYY-MM-DD from API (plain date or ISO string from DB/JSON). */
function parseCustomPublishDate(raw: string | null | undefined): string | null {
    if (raw == null || typeof raw !== "string") return null;
    const t = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    if (t.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
    return null;
}

/** Prefer custom calendar date when set; otherwise created_at. */
function getBlogDisplayDate(blog: Blog): { label: string; dateTime: string } {
    const custom = parseCustomPublishDate(blog.published_date_custom ?? null);
    if (custom) {
        const [y, m, d] = custom.split("-").map(Number);
        return {
            label: new Date(y, m - 1, d).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            }),
            dateTime: custom,
        };
    }
    return {
        label: new Date(blog.created_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        }),
        dateTime: blog.created_at,
    };
}

function visibleRichText(html: string | null | undefined): boolean {
    if (!html?.trim()) return false;
    const t = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return t.length > 0;
}

export default function BlogPostPage() {
    const params = useParams();
    const slug = typeof params.slug === "string" ? params.slug : "";
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) {
            setLoading(false);
            setError("Invalid link.");
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await getPublicBlogBySlug(slug);
                if (cancelled) return;
                if (res.success && res.data?.blog) {
                    setBlog(res.data.blog);
                } else {
                    setError(res.message || "Post not found.");
                }
            } catch {
                if (!cancelled) setError("Post not found.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [slug]);

    if (loading) {
        return <OnboardingLoader message="Loading..." />;
    }

    if (error || !blog) {
        return (
            <main className="min-h-screen bg-white pb-20">
                <div className="appContainer py-10 md:py-14">
                    <p className="text-sm text-red-600">{error || "Post not found."}</p>
                    <Link
                        href="/blogs"
                        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-black hover:underline"
                    >
                        <FiArrowLeft aria-hidden />
                        Back to blogs
                    </Link>
                </div>
            </main>
        );
    }

    const displayDate = getBlogDisplayDate(blog);

    return (
        <main className="min-h-screen bg-white pb-20">
            <article className="appContainer py-6 md:py-8">
                <Link
                    href="/blogs"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-black/70 transition-colors hover:text-black hover:underline"
                >
                    <FiArrowLeft aria-hidden />
                    Back to blogs
                </Link>

                {blog.blog_image ? (
                    <>
                        <div className="relative mx-auto mt-6 aspect-[16/7] max-w-3xl overflow-hidden border border-black/10 bg-black/5 shadow-sm">
                            <Image
                                src={blog.blog_image}
                                alt=""
                                fill
                                className="object-contain"
                                sizes="(max-width: 1024px) 100vw, 896px"
                                priority
                                unoptimized
                            />
                            <div
                                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 via-40% to-transparent"
                                aria-hidden
                            />
                            <div className="absolute inset-x-0 bottom-0 flex flex-col items-start px-4 pb-6 pt-16 text-center md:px-8 md:pb-8 md:pt-20">
                                {blog.is_featured ? (
                                    <span className="mb-3 inline-flex rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white ring-1 ring-white/35 backdrop-blur-sm">
                                        Featured
                                    </span>
                                ) : null}
                                <h1 className="text-balance text-2xl font-semibold leading-tight text-white drop-shadow-md sm:text-4xl md:text-5xl">
                                    {blog.title}
                                </h1>
                            </div>
                        </div>
                        {visibleRichText(blog.teaser) || visibleRichText(blog.summary) ? (
                            <div className="mx-auto mt-6 max-w-3xl text-center">
                                {visibleRichText(blog.teaser) ? (
                                    <p className="text-lg font-medium leading-relaxed text-black/80">
                                        {blog.teaser}
                                    </p>
                                ) : null}
                                {visibleRichText(blog.summary) ? (
                                    <p className="mt-3 text-base leading-relaxed text-black/65">{blog.summary}</p>
                                ) : null}
                            </div>
                        ) : null}
                    </>
                ) : (
                    <header className="mx-auto mt-2 max-w-3xl text-center">
                        {blog.is_featured ? (
                            <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                                Featured
                            </span>
                        ) : null}
                        <h1 className="mt-3 text-balance text-[1.85rem] font-semibold leading-tight text-black sm:text-4xl md:text-5xl">
                            {blog.title}
                        </h1>
                        {visibleRichText(blog.teaser) ? (
                            <p className="mt-4 text-lg font-medium leading-relaxed text-black/80">{blog.teaser}</p>
                        ) : null}
                        {visibleRichText(blog.summary) ? (
                            <p className="mt-3 text-base leading-relaxed text-black/65">{blog.summary}</p>
                        ) : null}
                    </header>
                )}

                <div
                    className={`mx-auto flex max-w-3xl items-center justify-between gap-4 ${blog.blog_image ? "mt-6" : "mt-8"}`}
                >
                    <time
                        dateTime={displayDate.dateTime}
                        className="text-sm font-medium text-black/60"
                    >
                        {displayDate.label}
                    </time>
                    <div className="flex shrink-0 items-center gap-3 text-black/70">
                        <Link
                            href={siteSocialLinks.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram"
                            className="transition-colors hover:text-black"
                        >
                            <FaInstagram className="h-[1.1rem] w-[1.1rem]" />
                        </Link>
                        <Link
                            href={siteSocialLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="LinkedIn"
                            className="transition-colors hover:text-black"
                        >
                            <FaLinkedinIn className="h-[1.1rem] w-[1.1rem]" />
                        </Link>
                        <Link
                            href={siteSocialLinks.x}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="X"
                            className="transition-colors hover:text-black"
                        >
                            <FaXTwitter className="h-[1.1rem] w-[1.1rem]" />
                        </Link>
                        <Link
                            href={siteSocialLinks.email}
                            aria-label="Email"
                            className="transition-colors hover:text-black"
                        >
                            <FaEnvelope className="h-[1.1rem] w-[1.1rem]" />
                        </Link>
                    </div>
                </div>


                <div className="mx-auto mt-10 max-w-3xl">
                    {blog.content_type === "VIDEO" && blog.video_file ? (
                        <video
                            className="w-full max-h-[70vh] rounded-xl border border-black/10 bg-black"
                            controls
                            playsInline
                            preload="metadata"
                            src={blog.video_file}
                        >
                            <track kind="captions" />
                        </video>
                    ) : null}

                    {blog.content_type === "TEXT" && blog.first_part ? (
                        <div
                            className="blog-content text-base leading-relaxed text-black/80 [&_a]:font-semibold [&_a]:text-black [&_a]:underline [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
                            dangerouslySetInnerHTML={{ __html: blog.first_part }}
                        />
                    ) : null}

                    {blog.content_type === "TEXT" && blog.second_part ? (
                        <div
                            className="blog-content mt-8 text-base leading-relaxed text-black/80 [&_a]:font-semibold [&_a]:text-black [&_a]:underline [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
                            dangerouslySetInnerHTML={{ __html: blog.second_part }}
                        />
                    ) : null}

                    {blog.url ? (
                        <p className="mt-10 text-sm text-black/60">
                            Source:{" "}
                            <a
                                href={blog.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-black underline"
                            >
                                {blog.source_name || blog.url}
                            </a>
                        </p>
                    ) : null}
                </div>
            </article>
        </main>
    );
}
