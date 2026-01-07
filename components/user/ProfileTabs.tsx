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
    { id: "goals", label: "Career Goals", icon: <LuTarget /> },
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
        <section className="">
            {/* Tabs header */}
            <div className="flex gap-0 overflow-x-auto bg-pink/5 border-b border-pink/10">
                {TABS.map((tab) => {
                    const isActive = tab.id === activeTab;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={[
                                "flex min-w-max items-center px-5 py-3 text-sm font-medium transition-colors :text-sm gap-2 duration-500  dark:text-slate-300",
                                isActive
                                    ? "bg-pink text-white"
                                    : "text-slate-900 hover:bg-pink/5",
                            ].join(" ")}
                        >
                            <span className="text-base">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Body */}
            {renderContent()}
        </section>
    );
}
