"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  PiGraduationCapFill,
  PiTargetBold,
  PiLightningFill,
} from "react-icons/pi";
import { FaChartBar, FaUserCircle } from "react-icons/fa";
import { Button } from "../shared";
import { useAuth } from "@/contexts/AuthContext";
import { getProfileCompletion } from "@/api";

export default function UserDetails() {
  const { user } = useAuth();
  const userName = user?.name || "there";
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletion = async () => {
      try {
        const response = await getProfileCompletion();
        if (response.success && response.data) {
          setCompletionPercentage(response.data.percentage);
        }
      } catch (err) {
        console.error("Error fetching profile completion:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletion();
  }, []);

  const getCompletionMessage = () => {
    if (completionPercentage >= 90) return "Excellent! Your profile is complete";
    if (completionPercentage >= 70) return "Almost there! Complete your profile";
    if (completionPercentage >= 50) return "Halfway there! Keep going";
    return "Get started! Complete your profile";
  };

  return (
    <section className="bg-[#f5f9ff] pt-10 pb-8 border-b border-black/8">
      <div className="appContainer">
        {/* Top row: Avatar + Greeting + Profile Strength */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          {/* Avatar + Greeting */}
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-[#FAD53C] bg-white flex items-center justify-center">
              {user?.profile_photo ? (
                <Image
                  src={user.profile_photo}
                  alt="User avatar"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <FaUserCircle className="h-14 w-14 text-black/20" />
              )}
            </div>

            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-black/40 mb-1">
                Your Profile
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-black leading-none">
                {userName}
              </h1>
              <p className="text-sm text-black/50 mt-1">
                Let&apos;s make your college dream happen
              </p>
            </div>
          </div>

          {/* Profile Strength — no card, just inline */}
          <div className="w-full max-w-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-black">Profile Strength</span>
              <span className="rounded-full bg-[#FAD53C] px-3 py-0.5 text-xs font-bold text-black">
                {loading ? "..." : `${completionPercentage}%`}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#eaf4ff] overflow-hidden">
              <div
                className="h-2 rounded-full bg-[#FAD53C] transition-all duration-700"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-black/50">{getCompletionMessage()}</p>
            <div className="mt-4">
              <Button
                variant="DarkGradient"
                size="md"
                className="w-full justify-center rounded-full border border-black bg-black text-[#FAD53C] hover:bg-[#111] text-sm"
              >
                See Full List →
              </Button>
            </div>
          </div>
        </div>

        {/* Stats row — flat, no boxes */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: <PiGraduationCapFill />, value: "PCM", label: "Stream" },
            { icon: <FaChartBar />, value: "87.5%", label: "Overall" },
            { icon: <PiTargetBold />, value: "3", label: "Colleges" },
            { icon: <PiLightningFill />, value: "2", label: "Events" },
          ].map(({ icon, value, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 py-1"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf4ff] text-lg text-black">
                {icon}
              </div>
              <div>
                <p className="text-lg font-bold leading-none text-black">{value}</p>
                <p className="text-xs text-black/50 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
