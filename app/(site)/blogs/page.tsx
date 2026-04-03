"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { getPublicBlogs } from "@/api";
import type { Blog } from "@/api/admin/blogs";
import { siteSocialLinks } from "@/lib/siteSocial";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

function formatPublishDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return "";
    }
}

function stripHtml(html: string | null | undefined, maxLen: number): string {
    const raw = (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (raw.length <= maxLen) return raw;
    return `${raw.slice(0, maxLen).trim()}…`;
}

function cardDescription(blog: Blog): string {
    if (blog.teaser?.trim()) return stripHtml(blog.teaser, 180);
    if (blog.summary?.trim()) return stripHtml(blog.summary, 180);
    return stripHtml(blog.first_part, 180);
}

function BlogCardBrandRow() {
    const iconClass =
        "text-[17px] text-black/55 transition-colors hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/30 rounded-sm";
    return (
        <div className="flex items-center justify-between gap-3 border-t border-black/10 bg-amber-50/70 px-5 py-3">
            <Image
                src="/landing-page/black-logo.svg"
                alt="UniTracko"
                width={100}
                height={22}
                className="h-[22px] w-auto opacity-90"
            />
            <div className="flex shrink-0 items-center gap-2.5">
                <a
                    href={siteSocialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="UniTracko on Instagram"
                    className={iconClass}
                >
                    <FaInstagram aria-hidden />
                </a>
                <a
                    href={siteSocialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="UniTracko on LinkedIn"
                    className={iconClass}
                >
                    <FaLinkedinIn aria-hidden />
                </a>
                <a
                    href={siteSocialLinks.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="UniTracko on X"
                    className={iconClass}
                >
                    <FaXTwitter aria-hidden />
                </a>
            </div>
        </div>
    );
}

export default function BlogsPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await getPublicBlogs();
                if (cancelled) return;
                if (res.success && res.data?.blogs) {
                    setBlogs(res.data.blogs);
                } else {
                    setError(res.message || "Could not load blogs.");
                }
            } catch {
                if (!cancelled) setError("Could not load blogs.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return <OnboardingLoader message="Loading..." />;
    }

    return (
        <main className="min-h-screen bg-white pb-20">
            <div className="appContainer py-10 md:py-14">
                <div className="max-w-3xl">
                    <p className="text-sm font-semibold uppercase tracking-wide text-black/55">
                        Resources
                    </p>
                    <h1 className="mt-2 text-[1rem] font-extrabold leading-tight text-black sm:text-2xl md:text-4xl">
                        Blogs
                    </h1>
                    <p className="mt-3 max-w-xl text-base leading-relaxed text-black/70">
                        Guides and updates from UniTracko to help you stay ahead in your admission journey.
                    </p>
                </div>

                {error ? (
                    <p className="mt-12 text-sm text-red-600">{error}</p>
                ) : blogs.length === 0 ? (
                    <p className="mt-12 text-sm text-black/50">No posts yet. Check back soon.</p>
                ) : (
                    <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
                        {blogs.map((blog) => (
                            <li key={blog.id}>
                                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition-shadow hover:shadow-md">
                                    <Link
                                        href={`/blogs/${encodeURIComponent(blog.slug)}`}
                                        className="relative block aspect-[16/10] w-full bg-black/5"
                                    >
                                        {blog.blog_image ? (
                                            <Image
                                                src={blog.blog_image}
                                                alt=""
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                unoptimized
                                            />
                                        ) : null}
                                    </Link>
                                    <div className="flex flex-1 flex-col p-5 pb-0">
                                        {blog.is_featured ? (
                                            <span className="mb-2 inline-flex w-fit rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                                                Featured
                                            </span>
                                        ) : null}
                                        <time
                                            className="text-xs font-medium uppercase tracking-wide text-black/45"
                                            dateTime={blog.created_at}
                                        >
                                            {formatPublishDate(blog.created_at)}
                                        </time>
                                        <h2 className="mt-1.5 text-lg font-bold leading-snug text-black">
                                            <Link
                                                href={`/blogs/${encodeURIComponent(blog.slug)}`}
                                                className="hover:underline"
                                            >
                                                {blog.title}
                                            </Link>
                                        </h2>
                                        <p className="mt-2 flex-1 text-sm leading-relaxed text-black/65">
                                            {cardDescription(blog)}
                                        </p>
                                        <Link
                                            href={`/blogs/${encodeURIComponent(blog.slug)}`}
                                            className="mt-4 inline-flex items-center gap-1 pb-5 text-sm font-semibold text-black hover:underline"
                                        >
                                            Read more
                                            <FiArrowRight className="text-base" aria-hidden />
                                        </Link>
                                    </div>
                                    <BlogCardBrandRow />
                                </article>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}
