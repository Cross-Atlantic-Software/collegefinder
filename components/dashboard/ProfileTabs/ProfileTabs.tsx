// src/components/profile/ProfileTabs.tsx
"use client";

import { useState, ReactNode } from "react";
import { FaUser, FaGraduationCap, FaBullseye } from "react-icons/fa6";

import BasicInfoForm from "./BasicInfoForm";
import AcademicsProfile from "./AcademicsProfile";
import CareerGoalsTab from "./CareerGoals";

type TabKey = "basic" | "academics" | "career";

const tabs: { key: TabKey; label: string; icon: ReactNode }[] = [
  { key: "basic", label: "Basic Info", icon: <FaUser className="text-base" /> },
  { key: "academics", label: "Academics", icon: <FaGraduationCap className="text-base" /> },
  { key: "career", label: "Career Goals", icon: <FaBullseye className="text-base" /> },
];

export default function ProfileTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  return (
    <div className="">
      {/* Tabs bar */}
      <div className="mb-5 flex w-full overflow-hidden rounded-md bg-white/10 text-xs font-semibold text-slate-300 sm:text-sm">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-2 py-3 transition ${
                isActive ? "bg-pink text-white shadow-sm" : "hover:bg-white/5"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "basic" && <BasicInfoForm />}
      {activeTab === "academics" && <AcademicsProfile />}
      {activeTab === "career" && <CareerGoalsTab />}
    </div>
  );
}
