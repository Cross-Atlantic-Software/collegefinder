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
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <p className="text-lg font-semibold text-slate-900">Student Profile</p>
                        <p className="mt-0.5 text-xs text-slate-500">Manage your details, academics, interests, and preferences.</p>
                    </div>

                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {TABS.map((tab) => {
                            const isActive = tab.id === activeTab;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={[
                                        "flex min-w-max items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "border-slate-900 bg-slate-900 text-[#FAD53C]"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                                    ].join(" ")}
                                >
                                    <span className="text-base">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            <div className="bg-[#f8fbff] p-4 md:p-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                    {renderContent()}
                </div>
            </div>
        </section>
    );
}
