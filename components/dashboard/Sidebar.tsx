"use client";

import { useState, useEffect } from "react";
import { BiChevronLeft, BiChevronRight, BiMenu } from "react-icons/bi";
import Image from "next/image";
import {
  FiActivity,
  FiBookOpen,
  FiClipboard,
  FiFileText,
  FiHome,
  FiInfo,
  FiLogOut,
  FiSettings,
  FiShare2,
  FiUser,
} from "react-icons/fi";
import {
  FaBookOpen,
  FaClipboardList,
  FaFileAlt,
  FaFlask,
  FaHome,
  FaShareAlt,
  FaUniversity,
  FaUserCircle,
  FaBrain,
  FaHandsHelping,
} from "react-icons/fa";
import { getProfileCompletion, getAllExams } from "@/api";

type SectionId =
  | "dashboard"
  | "profile"
  | "exam-shortlist"
  | "college-shortlist"
  | "applications"
  | "exam-prep"
  | "test-module"
  | "know-your-strengths"
  | "admission-help"
  | "referral";

type SidebarProps = {
  sidebarOpen: boolean;
  onToggle: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeSection: SectionId;
  onSectionChange: (id: SectionId) => void;
};

const baseNavItems: {
  id: SectionId;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  activeIcon: React.ComponentType<{ className?: string }>;
  getValue?: (completion: number) => string;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    sub: "Your command center",
    icon: FiHome,
    activeIcon: FaHome,
    getValue: () => "Overview",
  },
  {
    id: "profile",
    label: "My Profile",
    sub: "Complete",
    icon: FiUser,
    activeIcon: FaUserCircle,
    getValue: (completion) => `${completion}%`,
  },
  {
    id: "exam-shortlist",
    label: "Exam Shortlist",
    sub: "Exams selected",
    icon: FiClipboard,
    activeIcon: FaClipboardList,
    getValue: () => "8",
  },
  {
    id: "college-shortlist",
    label: "College Shortlist",
    sub: "Colleges matched",
    icon: FiHome,
    activeIcon: FaUniversity,
    getValue: () => "",
  },
  {
    id: "applications",
    label: "Applications",
    sub: "in progress",
    icon: FiFileText,
    activeIcon: FaFileAlt,
    getValue: () => "3",
  },
  {
    id: "exam-prep",
    label: "Exam Prep",
    sub: "Study time",
    icon: FiBookOpen,
    activeIcon: FaBookOpen,
    getValue: () => "156h",
  },
  {
    id: "test-module",
    label: "Mock Test",
    sub: "Practice tests",
    icon: FiActivity,
    activeIcon: FaFlask,
    getValue: () => "0",
  },
  {
    id: "know-your-strengths",
    label: "Know Your Strengths",
    sub: "Discover yourself",
    icon: FaBrain,
    activeIcon: FaBrain,
    getValue: () => "",
  },
  {
    id: "admission-help",
    label: "Admission Help",
    sub: "Expert guidance",
    icon: FaHandsHelping,
    activeIcon: FaHandsHelping,
    getValue: () => "",
  },
  {
    id: "referral",
    label: "Refer & Earn",
    sub: "Invite friends",
    icon: FiShare2,
    activeIcon: FaShareAlt,
    getValue: () => "",
  },
];

export default function Sidebar({
  sidebarOpen,
  onToggle,
  isCollapsed,
  onToggleCollapse,
  activeSection,
  onSectionChange,
}: SidebarProps) {
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [examsCount, setExamsCount] = useState(0);

  useEffect(() => {
    const fetchCompletion = async () => {
      try {
        const response = await getProfileCompletion();
        if (response.success && response.data) {
          setCompletionPercentage(response.data.percentage);
        }
      } catch (err) {
        console.error("Error fetching profile completion:", err);
      }
    };

    fetchCompletion();
  }, []);

  useEffect(() => {
    const fetchExamsCount = async () => {
      try {
        const response = await getAllExams();
        if (response.success && response.data?.exams) {
          setExamsCount(response.data.exams.length);
        }
      } catch (err) {
        console.error("Error fetching exams count:", err);
      }
    };

    fetchExamsCount();
  }, []);

  // Create navItems with dynamic values (Mock Test shows exams/practice tests count)
  const navItems = baseNavItems.map(item => ({
    ...item,
    value:
      item.id === "test-module"
        ? String(examsCount)
        : item.getValue
          ? item.getValue(completionPercentage)
          : undefined,
  }));

  const handleSectionClick = (id: SectionId) => {
    onSectionChange(id);

    // Auto-close only on mobile drawer layouts.
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      onToggle();
    }
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-slate-950
        transform transition-all duration-300 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        w-full max-w-xs
        md:static md:translate-x-0 md:h-screen md:max-w-none
        ${isCollapsed ? "md:w-16" : "md:w-60"}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-4">
        <div className={`flex min-w-0 items-center ${isCollapsed ? "w-full justify-center" : "flex-1 gap-2"}`}>
          {isCollapsed && (
            <Image
              src="/svgs/logo-fav-unitracko.svg"
              alt="UniTracko icon"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl"
              priority
            />
          )}
          {!isCollapsed && (
            <div className="min-w-0">
              <Image
                src="/svgs/logo-unitracko.svg"
                alt="UniTracko logo"
                width={168}
                height={38}
                className="h-auto w-[184px] -pb-8 dark:invert"
                priority
              />
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            className="hidden md:inline-flex rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 p-1.5 text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            <BiChevronLeft className="h-4 w-4" />
          </button>
        )}

        {isCollapsed && (
          <button
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="hidden md:inline-flex absolute top-4 right-[-12px] rounded-full border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-1 text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            <BiChevronRight className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="inline-flex md:hidden rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 p-2 text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        >
          <BiMenu className="h-5 w-5" />
        </button>
      </div>

      {/* Pale header separator */}
      <div className="mx-2.5 h-px bg-slate-200/80 dark:bg-slate-800/70" />

      {/* Nav items */}
      <nav
        aria-label="Primary navigation"
        className="flex-1 space-y-1 px-2.5 py-4 text-[13px] overflow-y-auto scrollbar-hide"
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const MenuIcon = isActive ? item.activeIcon : item.icon;

          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => handleSectionClick(item.id)}
                aria-current={isActive ? "page" : undefined}
                title={isCollapsed ? item.label : undefined}
                className={`
                  flex w-full min-h-[50px] items-center rounded-xl text-left transition-all duration-200 group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight-300
                  ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-2.5 py-2.5"}
                  ${
                    isActive
                      ? "bg-highlight-100 text-brand-ink dark:text-slate-100"
                      : "text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  }
                `}
              >
                <MenuIcon
                  className={`
                    h-[18px] w-[18px] shrink-0 transition duration-200
                    ${isActive ? "text-brand-ink dark:text-highlight-300" : "text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"}
                  `}
                />

                {isCollapsed && (
                  <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-40 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 opacity-0 shadow-md transition-all duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 md:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {item.label}
                  </span>
                )}

                {!isCollapsed && (
                  <div
                    className={`${sidebarOpen ? "flex" : "hidden md:flex"} flex-1 items-center justify-between min-w-0`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`
                          font-semibold text-sm transition-colors duration-200 truncate
                          ${isActive ? "text-brand-ink dark:text-slate-100" : "text-slate-800 dark:text-slate-200"}
                        `}
                      >
                        {item.label}
                      </span>
                    </div>

                    {item.value && (
                      <span
                        className={`
                          text-[11px] font-semibold transition-all duration-200 rounded-lg px-2 py-1 flex-shrink-0 ml-2
                          ${isActive ? "text-brand-ink dark:text-slate-200 bg-highlight-200 dark:bg-highlight-300/20" : "text-slate-600 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800/70"}
                        `}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {item.value}
                      </span>
                    )}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Pale footer separator */}
      <div className="mx-2.5 h-px bg-slate-200/80 dark:bg-slate-800/70" />

      {/* Footer */}
      <div className="px-2.5 py-3 space-y-1">

        <button
          type="button"
          title="Settings"
          className={`group relative flex w-full items-center rounded-xl text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors ${isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-2.5 py-2.5"}`}
        >
          <FiSettings className="h-[18px] w-[18px]" />
          {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
          {isCollapsed && (
            <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-40 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 opacity-0 shadow-md transition-all duration-150 group-hover:opacity-100 md:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              Settings
            </span>
          )}
        </button>

        <button
          type="button"
          title="Info"
          className={`group relative flex w-full items-center rounded-xl text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors ${isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-2.5 py-2.5"}`}
        >
          <FiInfo className="h-[18px] w-[18px]" />
          {!isCollapsed && <span className="text-sm font-medium">Info</span>}
          {isCollapsed && (
            <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-40 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 opacity-0 shadow-md transition-all duration-150 group-hover:opacity-100 md:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              Info
            </span>
          )}
        </button>

        <button
          type="button"
          title="Logout"
          className={`group relative flex w-full items-center rounded-xl text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors ${isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-2.5 py-2.5"}`}
        >
          <FiLogOut className="h-[18px] w-[18px]" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          {isCollapsed && (
            <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-40 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 opacity-0 shadow-md transition-all duration-150 group-hover:opacity-100 md:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
