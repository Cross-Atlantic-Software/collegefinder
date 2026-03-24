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
  { key: "career", label: "Interests", icon: <FaBullseye className="text-base" /> },
  { key: "other", label: "Other Info", icon: <FaInfoCircle className="text-base" /> },
];

export default function ProfileTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  return (
    <div className="">
      {/* Tabs bar */}
      <div className="mb-6 flex w-full overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-250 border-b-2 relative whitespace-nowrap
                ${
                  isActive 
                    ? "text-action-700 dark:text-action-500 border-b-action-600 dark:border-b-action-500" 
                    : "text-slate-500 dark:text-slate-400 border-b-transparent hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === "basic" && <BasicInfoForm />}
        {activeTab === "academics" && <AcademicsProfile />}
        {activeTab === "career" && <CareerGoalsTab />}
        {activeTab === "other" && <OtherInfoTab />}
      </div>
    </div>
  );
}
