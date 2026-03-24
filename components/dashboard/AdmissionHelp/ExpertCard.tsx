"use client";

import Image from "next/image";
import { FaUserCircle, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import type { AdmissionExpert } from "@/api/experts";

interface ExpertCardProps {
  expert: AdmissionExpert;
}

export default function ExpertCard({ expert }: ExpertCardProps) {
  const hasPhone = expert.phone?.trim();
  const hasEmail = expert.email?.trim();
  const hasContact = hasPhone || hasEmail || expert.contact?.trim();

  return (
    <div className="flex-shrink-0 w-40 rounded-md bg-white/5 border border-white/10 p-3 text-center hover:bg-white/10 transition-colors">
      <div className="relative w-14 h-14 mx-auto mb-2 rounded-full overflow-hidden bg-slate-700">
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
      <p className="text-xs font-semibold text-slate-100 truncate">{expert.name}</p>
      <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
        {expert.type.replace(/_/g, " ")}
      </p>
      {expert.description && (
        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 text-left px-0.5">
          {expert.description}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
        {hasPhone && (
          <a
            href={`tel:${expert.phone!.trim()}`}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-pink/20 text-[10px] text-pink font-medium hover:bg-pink/30 transition-colors"
          >
            <FaPhoneAlt className="w-2.5 h-2.5" />
            Phone
          </a>
        )}
        {hasEmail && (
          <a
            href={`mailto:${expert.email!.trim()}`}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-pink/20 text-[10px] text-pink font-medium hover:bg-pink/30 transition-colors"
          >
            <FaEnvelope className="w-2.5 h-2.5" />
            Email
          </a>
        )}
        {!hasPhone && !hasEmail && hasContact && (
          <a
            href={expert.contact!.includes("@") ? `mailto:${expert.contact}` : `tel:${expert.contact}`}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-pink/20 text-[10px] text-pink font-medium hover:bg-pink/30 transition-colors"
          >
            {expert.contact!.includes("@") ? <FaEnvelope className="w-2.5 h-2.5" /> : <FaPhoneAlt className="w-2.5 h-2.5" />}
            Contact
          </a>
        )}
      </div>
    </div>
  );
}
