"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getPublicBlogs } from "@/api";
import type { Blog } from "@/api/admin/blogs";
import OnboardingLoader from "@/components/shared/OnboardingLoader";
import { LandingCardFrame } from "@/components/containers/LandingCardFrame";

const PAGE_SIZE = 9;

function parsePage(raw: string | null): number {
    if (raw == null || raw === "") return 1;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
}

function BlogsListing() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const page = parsePage(searchParams.get("page"));

    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        (async () => {
            try {
                const res = await getPublicBlogs({ page, pageSize: PAGE_SIZE });
                if (cancelled) return;
                if (res.success && res.data) {
                    setBlogs(res.data.blogs);
                    setTotal(res.data.total);
                    setTotalPages(res.data.totalPages);
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
    }, [page, router]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [page]);

    if (loading) {
        return <OnboardingLoader message="Loading..." />;
    }

    const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);

    const pageLinkClass = (active: boolean) =>
        [
            "inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
            active
                ? "border-black bg-black text-white"
                : "border-black/15 bg-white text-black hover:border-black/30 hover:bg-black/[0.03]",
        ].join(" ");

    const navBtnClass = (enabled: boolean) =>
        [
            "inline-flex items-center gap-1 rounded-full border px-3 py-2 text-sm font-semibold transition-colors",
            enabled
                ? "border-black/15 text-black hover:border-black/30 hover:bg-black/[0.03]"
                : "pointer-events-none border-black/10 text-black/30",
        ].join(" ");

    return (
        <main className="min-h-screen bg-white pb-20">
            <div className="appContainer py-4 md:py-5">
                {error ? (
                    <p className="text-sm text-red-600">{error}</p>
                ) : blogs.length === 0 ? (
                    <p className="text-sm text-black/50">No posts yet. Check back soon.</p>
                ) : (
                    <>
                        <ul className="grid gap-6 overflow-visible sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
                            {blogs.map((blog) => (
                                <li
                                    key={blog.id}
                                    className="min-w-0 overflow-visible pb-4 pl-2 pt-2 sm:pb-5 sm:pl-3 sm:pt-3"
                                >
                                    <article className="group">
                                        <LandingCardFrame>
                                            <Link
                                                href={`/blogs/${encodeURIComponent(blog.slug)}`}
                                                className="relative block aspect-[8/5] w-full overflow-hidden rounded-[30px] border border-black/15 bg-black/5 ring-1 ring-black/5 outline-none transition-[transform,box-shadow] duration-300 hover:ring-black/20 focus-visible:ring-2 focus-visible:ring-black/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
                                        </LandingCardFrame>
                                    </article>
                                </li>
                            ))}
                        </ul>

                        {totalPages > 1 ? (
                            <nav
                                className="mt-12 flex flex-col items-center gap-4 border-t border-black/10 pt-10"
                                aria-label="Blog list pagination"
                            >
                                <p className="text-sm text-black/55">
                                    Showing{" "}
                                    <span className="font-medium text-black/80">
                                        {start}–{end}
                                    </span>{" "}
                                    of <span className="font-medium text-black/80">{total}</span>
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                                    {page > 1 ? (
                                        <Link
                                            href={`/blogs?page=${page - 1}`}
                                            className={navBtnClass(true)}
                                            scroll={false}
                                        >
                                            <FiChevronLeft className="h-4 w-4" aria-hidden />
                                            Previous
                                        </Link>
                                    ) : (
                                        <span className={navBtnClass(false)}>
                                            <FiChevronLeft className="h-4 w-4" aria-hidden />
                                            Previous
                                        </span>
                                    )}

                                    {totalPages <= 9 ? (
                                        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                                <Link
                                                    key={p}
                                                    href={`/blogs?page=${p}`}
                                                    className={pageLinkClass(p === page)}
                                                    scroll={false}
                                                    aria-current={p === page ? "page" : undefined}
                                                >
                                                    {p}
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="px-2 text-sm font-medium text-black/70">
                                            Page {page} of {totalPages}
                                        </span>
                                    )}

                                    {page < totalPages ? (
                                        <Link
                                            href={`/blogs?page=${page + 1}`}
                                            className={navBtnClass(true)}
                                            scroll={false}
                                        >
                                            Next
                                            <FiChevronRight className="h-4 w-4" aria-hidden />
                                        </Link>
                                    ) : (
                                        <span className={navBtnClass(false)}>
                                            Next
                                            <FiChevronRight className="h-4 w-4" aria-hidden />
                                        </span>
                                    )}
                                </div>
                            </nav>
                        ) : null}
                    </>
                )}
            </div>
        </main>
    );
}

export default function BlogsPage() {
    return (
        <Suspense fallback={<OnboardingLoader message="Loading..." />}>
            <BlogsListing />
        </Suspense>
    );
}
