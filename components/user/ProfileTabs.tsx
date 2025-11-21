"use client";
import type { JSX } from "react";
import { useState } from "react";
import { LuUser, LuBookOpen, LuTarget } from "react-icons/lu";
import BasicInfoForm from "../dashboard/BasicInfoForm";
import AcademicsProfile from "./AcademicsProfile";
import CareerGoalsTab from "./CareerGoals";

type TabId = "basic" | "academics" | "goals";

const TABS: { id: TabId; label: string; icon: JSX.Element }[] = [
    { id: "basic", label: "Basic Info", icon: <LuUser /> },
    { id: "academics", label: "Academics", icon: <LuBookOpen /> },
    { id: "goals", label: "Career Goals", icon: <LuTarget /> },
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
                                "flex min-w-max items-center px-5 py-3 text-sm font-medium transition-colors duration-200 sm:text-sm gap-2 transition duration-500  dark:text-slate-300",
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
