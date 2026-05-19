"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
  FaXTwitter,
} from "react-icons/fa6";
import { FiShare2 } from "react-icons/fi";
import { getPublicBlogShareUrl } from "@/lib/blogShare";

type Props = {
  slug: string;
  title: string;
};

const iconClass = "h-[1.1rem] w-[1.1rem]";
const btnClass = "transition-colors hover:text-black";

function openShareWindow(url: string) {
  window.open(url, "_blank", "noopener,noreferrer,width=680,height=680");
}

export function BlogShareActions({ slug, title }: Props) {
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const href = window.location.href;
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    setShareUrl(isLocal ? getPublicBlogShareUrl(slug) : href);
  }, [slug]);

  const shareText = `Check out this blog: ${title}`;
  const safeShareUrl = shareUrl || getPublicBlogShareUrl(slug);
  const encodedUrl = encodeURIComponent(safeShareUrl);
  const encodedText = encodeURIComponent(shareText);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(safeShareUrl);
      alert("Blog link copied. You can paste it in your app.");
    } catch {
      alert("Could not copy link automatically. Please copy from the address bar.");
    }
  };

  const handleInstagramShare = async () => {
    await copyLink();
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title,
        text: shareText,
        url: safeShareUrl,
      });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="flex shrink-0 items-center gap-3 text-black/70">
      <button
        type="button"
        onClick={handleNativeShare}
        aria-label="Share"
        className={btnClass}
        title="Share"
      >
        <FiShare2 className={iconClass} />
      </button>
      <button
        type="button"
        onClick={handleInstagramShare}
        aria-label="Instagram"
        className={btnClass}
        title="Instagram (copy link + open Instagram)"
      >
        <FaInstagram className={iconClass} />
      </button>
      <button
        type="button"
        onClick={() =>
          openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`)
        }
        aria-label="LinkedIn"
        className={btnClass}
        title="Share on LinkedIn"
      >
        <FaLinkedinIn className={iconClass} />
      </button>
      <button
        type="button"
        onClick={() =>
          openShareWindow(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`)
        }
        aria-label="X"
        className={btnClass}
        title="Share on X"
      >
        <FaXTwitter className={iconClass} />
      </button>
      <button
        type="button"
        onClick={() =>
          openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)
        }
        aria-label="Facebook"
        className={btnClass}
        title="Share on Facebook"
      >
        <FaFacebookF className={iconClass} />
      </button>
      <button
        type="button"
        onClick={() =>
          openShareWindow(
            `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${safeShareUrl}`)}`
          )
        }
        aria-label="WhatsApp"
        className={btnClass}
        title="Share on WhatsApp"
      >
        <FaWhatsapp className={iconClass} />
      </button>
      <Link
        href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
          `${shareText}\n\n${safeShareUrl}`
        )}`}
        aria-label="Email"
        className={btnClass}
        title="Share via Email"
      >
        <FaEnvelope className={iconClass} />
      </Link>
    </div>
  );
}
