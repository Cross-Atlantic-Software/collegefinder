"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getPublicBlogs } from "@/api";
import type { Blog } from "@/api/admin/blogs";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

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
            <div className="appContainer py-4 md:py-5">
                {error ? (
                    <p className="text-sm text-red-600">{error}</p>
                ) : blogs.length === 0 ? (
                    <p className="text-sm text-black/50">No posts yet. Check back soon.</p>
                ) : (
                    <ul className="grid gap-6 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
                        {blogs.map((blog) => (
                            <li key={blog.id}>
                                <article className="group relative overflow-hidden">
                                    <Link
                                        href={`/blogs/${encodeURIComponent(blog.slug)}`}
                                        className="relative block aspect-[8/5] w-full overflow-hidden border border-black/10 bg-black/5 shadow-sm outline-none transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2"
                                        aria-label={blog.title}
                                    >
                                        <div className="absolute inset-0">
                                            {blog.blog_image ? (
                                                <Image
                                                    src={blog.blog_image}
                                                    alt=""
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div
                                                    className="flex h-full w-full items-center justify-center bg-gradient-to-br from-highlight-200 to-highlight-400 text-black/30"
                                                    aria-hidden
                                                >
                                                    <span className="text-sm font-semibold uppercase tracking-widest">
                                                        UniTracko
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {/* Match blog detail hero: gradient scrim + white title on image */}
                                        <div
                                            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 via-40% to-transparent"
                                            aria-hidden
                                        />
                                        <div className="absolute inset-x-0 bottom-0 flex flex-col items-start px-3 pb-3 pt-10 text-left sm:px-4 sm:pb-4 sm:pt-12">
                                            {blog.is_featured ? (
                                                <span className="mb-2 inline-flex rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/35 backdrop-blur-sm sm:mb-3 sm:text-xs">
                                                    Featured
                                                </span>
                                            ) : null}
                                            <h2 className="line-clamp-2 w-full text-left text-balance text-sm font-semibold leading-snug text-white drop-shadow-md sm:text-base">
                                                {blog.title}
                                            </h2>
                                        </div>
                                    </Link>
                                </article>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}
