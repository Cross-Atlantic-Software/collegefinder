// src/components/profile/ProfileTabs.tsx
"use client";

import { useState, ReactNode } from "react";
import { FaUser, FaGraduationCap, FaBullseye } from "react-icons/fa6";
import { FaInfoCircle } from "react-icons/fa";

import BasicInfoForm from "./BasicInfoForm";
import AcademicsProfile from "./AcademicsProfile";
import CareerGoalsTab from "./CareerGoals";
import OtherInfoTab from "./OtherInfoTab";

type TabKey = "basic" | "academics" | "career" | "other";

const tabs: { key: TabKey; label: string; icon: ReactNode }[] = [
  { key: "basic", label: "Personal Details", icon: <FaUser className="text-base" /> },
  { key: "academics", label: "Academics", icon: <FaGraduationCap className="text-base" /> },
  { key: "career", label: "Career Goals", icon: <FaBullseye className="text-base" /> },
  { key: "other", label: "Other Info", icon: <FaInfoCircle className="text-base" /> },
];

export default function ProfileTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  return (
    <div className="">
      {/* Tabs bar */}
      <div className="mb-5 flex w-full overflow-hidden rounded-md bg-white/10 text-sm font-medium text-slate-300">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-center transition ${
                isActive ? "bg-pink text-white" : "hover:bg-white/5"
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
      {activeTab === "other" && <OtherInfoTab />}
    </div>
  );
}
