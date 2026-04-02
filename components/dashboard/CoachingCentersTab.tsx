// src/components/exams/CoachingCentersTab.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
  MdLocationOn,
  MdPeople,
  MdStar,
  MdStarBorder,
  MdFavoriteBorder,
} from "react-icons/md";
import { Button } from "@/components/shared";

type CoachingCenter = {
  id: string;
  name: string;
  city: string;
  studentsLabel: string; // "80k+ Students"
  rating: number;        // 4.8
  price: string;         // "₹1,50,000"
  duration: string;      // "1 Year"
  offerLabel?: string;   // "Save 20%"
  successRate: string;   // "95%"
  topRanks: string;      // "AIR 1,3,7"
  features: string[];
  isWishlisted?: boolean;
};

const CENTERS: CoachingCenter[] = [
  {
    id: "allen-delhi",
    name: "Allen Career Institute",
    city: "New Delhi",
    studentsLabel: "80k+ Students",
    rating: 4.8,
    price: "₹1,50,000",
    duration: "1 Year",
    offerLabel: "Save 20%",
    successRate: "95%",
    topRanks: "AIR 1,3,7",
    features: ["Live Classes", "Study Material", "Mock Tests", "Doubt Sessions"],
  },
  {
    id: "fiitjee-delhi",
    name: "FIITJEE",
    city: "New Delhi",
    studentsLabel: "60k+ Students",
    rating: 4.6,
    price: "₹1,20,000",
    duration: "1 Year",
    offerLabel: "Save 15%",
    successRate: "92%",
    topRanks: "AIR 2,5,11",
    features: ["Live Classes", "Test Series", "Mentorship"],
  },
];

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const empty = 5 - full;
  return (
    <div className="flex items-center gap-1 text-[12px]">
      {Array.from({ length: full }).map((_, i) => (
        <MdStar key={`f-${i}`} className="text-yellow-400" />
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <MdStarBorder key={`e-${i}`} className="text-yellow-400" />
      ))}
      <span className="ml-1 text-slate-600 dark:text-slate-300">{rating}</span>
    </div>
  );
}

function CoachingCenterCard({
  center,
  onEnroll,
  onDetails,
  onToggleWishlist,
}: {
  center: CoachingCenter;
  onEnroll?: (id: string) => void;
  onDetails?: (id: string) => void;
  onToggleWishlist?: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Logo placeholder */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-900 dark:bg-slate-800 dark:text-slate-200">
            LOGO
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold">{center.name}</h3>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <MdLocationOn /> {center.city}
              </span>
              <span className="inline-flex items-center gap-1">
                <MdPeople /> {center.studentsLabel}
              </span>
            </div>

            <Stars rating={center.rating} />
          </div>
        </div>

        {/* Price */}
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{center.price}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{center.duration}</p>

          {center.offerLabel && (
            <span className="mt-1 inline-flex rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
              {center.offerLabel}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/70">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Success Rate</p>
          <p className="mt-1 text-base font-semibold text-emerald-300">
            {center.successRate}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/70">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Top Ranks Achieved</p>
          <p className="mt-1 text-base font-semibold text-yellow-300">
            {center.topRanks}
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="mt-4 space-y-2">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">Features</p>
        <div className="flex flex-wrap gap-2">
          {center.features.map((f) => (
            <span
              key={f}
              className="rounded-full bg-slate-100 px-3 py-1 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="themeButton"
          size="sm"
          className="flex-1 rounded-full !border-black !bg-black !text-[#FAD53C] transition-all duration-200 hover:!bg-black/90 active:scale-95"
          onClick={() => onEnroll?.(center.id)}
        >
          Enroll Now
        </Button>
        <button
          onClick={() => onDetails?.(center.id)}
          className="flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          aria-label="wishlist"
        >
          View
        </button>
        <button
          onClick={() => onToggleWishlist?.(center.id)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          aria-label="wishlist"
        >
          <MdFavoriteBorder className="text-xl" />
        </button>
      </div>
    </div>
  );
}

export default function CoachingCentersTab() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "price">("rating");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = CENTERS.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );

    if (sortBy === "rating") {
      list = [...list].sort((a, b) => b.rating - a.rating);
    } else {
      // naive price sort for now; replace with numeric parse if needed
      list = [...list];
    }
    return list;
  }, [query, sortBy]);

  return (
    <div className="space-y-4">
      {/* Cards grid (fluid) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filtered.map((center) => (
          <CoachingCenterCard key={center.id} center={center} />
        ))}
      </div>
    </div>
  );
}
