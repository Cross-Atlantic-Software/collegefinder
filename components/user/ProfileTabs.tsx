"use client";
import type { JSX } from "react";
import { useState } from "react";
import { LuUser, LuBookOpen, LuTarget, LuInfo } from "react-icons/lu";
import BasicInfoForm from "../dashboard/ProfileTabs/BasicInfoForm";
import AcademicsProfile from "../dashboard/ProfileTabs/AcademicsProfile";
import CareerGoalsTab from "../dashboard/ProfileTabs/CareerGoals";
import OtherInfoTab from "../dashboard/ProfileTabs/OtherInfoTab";

type TabId = "basic" | "academics" | "goals" | "other";

const TABS: { id: TabId; label: string; icon: JSX.Element }[] = [
    { id: "basic", label: "Personal Details", icon: <LuUser /> },
    { id: "academics", label: "Academics", icon: <LuBookOpen /> },
    { id: "goals", label: "Interests", icon: <LuTarget /> },
    { id: "other", label: "Other Info", icon: <LuInfo /> },
];

export default function ProfileTabs() {
    const [activeTab, setActiveTab] = useState<TabId>("basic");

    const renderContent = () => {
        switch (activeTab) {
            case "basic":
                return <BasicInfoForm />;
            case "academics":
                return <AcademicsProfile />
            case "goals":
                return <CareerGoalsTab />;
            case "other":
                return <OtherInfoTab />;
            default:
                return null;
        }
    };

    return (
        <div>
            {/* Tab Bar — pill style, no surrounding card */}
            <div className="mb-6 flex gap-1.5 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => {
                    const isActive = tab.id === activeTab;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={[
                                "flex min-w-max items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-black text-[#FAD53C] shadow-sm"
                                    : "bg-[#eaf4ff] text-black/60 hover:bg-[#dceeff] hover:text-black",
                            ].join(" ")}
                        >
                            <span className="text-base">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content — no wrapping card */}
            <div>
                {renderContent()}
            </div>
        </div>
    );
}
