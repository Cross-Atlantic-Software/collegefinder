"use client";

import Image from "next/image";
import { FaUserCircle, FaPhoneAlt, FaEnvelope, FaLinkedin, FaGlobe } from "react-icons/fa";
import type { AdmissionExpert } from "@/api/experts";

interface ExpertCardProps {
  expert: AdmissionExpert;
}

export default function ExpertCard({ expert }: ExpertCardProps) {
  const hasPhone = expert.phone?.trim();
  const hasEmail = expert.email?.trim();
  const hasContact = hasPhone || hasEmail || expert.contact?.trim();
  const linkedin = expert.linkedin_url?.trim();
  const website = expert.website?.trim();
  const linkedinHref =
    linkedin && (linkedin.startsWith("http://") || linkedin.startsWith("https://"))
      ? linkedin
      : linkedin
        ? `https://${linkedin.replace(/^\/+/, "")}`
        : null;
  const websiteHref =
    website && (website.startsWith("http://") || website.startsWith("https://"))
      ? website
      : website
        ? `https://${website.replace(/^\/+/, "")}`
        : null;

  return (
    <div className="w-44 flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
      <div className="relative mx-auto mb-2 h-14 w-14 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        {expert.photo_url ? (
          <Image
            src={expert.photo_url}
            alt={expert.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <FaUserCircle className="w-full h-full text-slate-500 p-2" />
        )}
      </div>
      <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{expert.name}</p>
      <p className="mt-0.5 text-[10px] capitalize text-slate-500 dark:text-slate-400">
        {expert.type.replace(/_/g, " ")}
      </p>
      {expert.description && (
        <p className="mt-1 line-clamp-2 px-0.5 text-left text-[10px] text-slate-500 dark:text-slate-400">
          {expert.description}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
        {hasPhone && (
          <a
            href={`tel:${expert.phone!.trim()}`}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            <FaPhoneAlt className="w-2.5 h-2.5" />
            Phone
          </a>
        )}
        {hasEmail && (
          <a
            href={`mailto:${expert.email!.trim()}`}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            <FaEnvelope className="w-2.5 h-2.5" />
            Email
          </a>
        )}
        {!hasPhone && !hasEmail && hasContact && (
          <a
            href={expert.contact!.includes("@") ? `mailto:${expert.contact}` : `tel:${expert.contact}`}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            {expert.contact!.includes("@") ? <FaEnvelope className="w-2.5 h-2.5" /> : <FaPhoneAlt className="w-2.5 h-2.5" />}
            Contact
          </a>
        )}
        {linkedinHref && (
          <a
            href={linkedinHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-[#0a66c2]/15 px-2 py-1 text-[10px] font-medium text-[#0a66c2] transition-colors hover:bg-[#0a66c2]/25 dark:text-[#70b5f9]"
          >
            <FaLinkedin className="w-2.5 h-2.5" />
            LinkedIn
          </a>
        )}
        {websiteHref && (
          <a
            href={websiteHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            <FaGlobe className="w-2.5 h-2.5" />
            Website
          </a>
        )}
      </div>
    </div>
  );
}
