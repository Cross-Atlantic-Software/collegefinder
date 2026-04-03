"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { getPublicBlogBySlug } from "@/api";
import type { Blog } from "@/api/admin/blogs";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

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

    return (
        <main className="min-h-screen bg-white pb-20">
            <article className="appContainer py-10 md:py-14">
                <Link
                    href="/blogs"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-black/70 transition-colors hover:text-black hover:underline"
                >
                    <FiArrowLeft aria-hidden />
                    Back to blogs
                </Link>

                <header className="mx-auto mt-8 max-w-3xl">
                    {blog.is_featured ? (
                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                            Featured
                        </span>
                    ) : null}
                    <h1 className="mt-3 text-[1.85rem] font-extrabold leading-tight text-black sm:text-4xl md:text-5xl">
                        {blog.title}
                    </h1>
                    {blog.teaser ? (
                        <p className="mt-4 text-lg font-medium leading-relaxed text-black/80">{blog.teaser}</p>
                    ) : null}
                    {blog.summary ? (
                        <p className="mt-3 text-base leading-relaxed text-black/65">{blog.summary}</p>
                    ) : null}
                </header>

                {blog.blog_image ? (
                    <div className="relative mx-auto mt-10 aspect-[16/9] max-w-4xl overflow-hidden rounded-2xl border border-black/10 bg-black/5">
                        <Image
                            src={blog.blog_image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 896px"
                            priority
                            unoptimized
                        />
                    </div>
                ) : null}

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
