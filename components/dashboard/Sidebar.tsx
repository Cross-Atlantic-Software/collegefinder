"use client";

import Image from "next/image";
import { BiMenu } from "react-icons/bi";
import {
  FaHome,
  FaUserCircle,
  FaClipboardList,
  FaFileAlt,
  FaBookOpen,
} from "react-icons/fa";
import { FiLogOut, FiSettings } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from 'next/navigation';

type SectionId =
  | "dashboard"
  | "profile"
  | "exam-shortlist"
  | "applications"
  | "exam-prep";

type SidebarProps = {
  sidebarOpen: boolean;
  onToggle: () => void;
  activeSection: SectionId;
  onSectionChange: (id: SectionId) => void;
};

const navItems: {
  id: SectionId;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  value?: string;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    sub: "Your command center",
    icon: FaHome,
    value: "Overview",
  },
  {
    id: "profile",
    label: "My Profile",
    sub: "Complete",
    icon: FaUserCircle,
    value: "85%",
  },
  {
    id: "exam-shortlist",
    label: "Exam Shortlist",
    sub: "Exams selected",
    icon: FaClipboardList,
    value: "8",
  },
  {
    id: "applications",
    label: "Applications",
    sub: "in progress",
    icon: FaFileAlt,
    value: "3",
  },
  {
    id: "exam-prep",
    label: "Exam Prep",
    sub: "Study time",
    icon: FaBookOpen,
    value: "156h",
  },
];

export default function Sidebar({
  sidebarOpen,
  onToggle,
  activeSection,
  onSectionChange,
}: SidebarProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 flex flex-col border-r border-white/5 bg-blueGradient
        transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        w-full max-w-xs
        md:static md:translate-x-0 md:h-screen md:w-64 md:max-w-none
      `}
    >
      {/* Logo + toggle */}
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center text-xs font-semibold">
            <Image
              src="/favicon.svg"
              width={32}
              height={32}
              alt="Logo"
              className="object-contain"
            />
          </div>

          <div
            className={`${sidebarOpen ? "flex" : "hidden md:flex"} flex-col`}
          >
            <span className="text-sm font-semibold">College Finder</span>
            <span className="text-[11px] text-slate-300">
              Student Dashboard
            </span>
          </div>
        </div>

        <button onClick={onToggle} className="inline-flex md:hidden">
          <BiMenu className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* User card */}
      <div className="mx-3 mb-4 rounded-md bg-lightGradient p-3 text-xs text-slate-700 shadow-lg">
        <div className="flex items-center gap-3">
          <Image
            src="/avatar-placeholder.jpg"
            width={40}
            height={40}
            alt="Avatar"
            className="rounded-full object-contain"
          />

          <div
            className={`${sidebarOpen ? "flex" : "hidden md:flex"} flex-1 flex-col`}
          >
            <p className="text-[11px] text-slate-700">Welcome</p>
            <p className="text-sm font-semibold text-slate-900">Dinesh</p>
            <p className="mt-1 h-1.5 w-full rounded-full bg-slate-200">
              <span className="block h-1.5 w-2/3 rounded-full bg-pink" />
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span>LVL 12</span>
              <span>8450 / 10000 XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-2 px-3 text-[13px] overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                    // If clicking the Profile item, navigate to the dedicated /profile route
                    if (item.id === 'profile') {
                      onToggle(); // close drawer on mobile
                      router.push('/profile');
                      return;
                    }

                    onSectionChange(item.id);
                    onToggle(); // closes drawer on mobile
                  }}
              className={`
                flex w-full items-center gap-3 rounded-md p-3 text-left transition duration-500 group
                ${
                  isActive
                    ? "bg-darkGradient text-white shadow-md"
                    : "bg-white/10 text-slate-800 hover:bg-lightGradient"
                }
              `}
            >
              <Icon
                className={`
                  h-5 w-5 shrink-0 transition duration-500
                  ${isActive ? "text-white" : "text-white group-hover:text-pink"}
                `}
              />

              <div
                className={`${sidebarOpen ? "flex" : "hidden md:flex"} flex-1 items-center justify-between`}
              >
                <div className="flex flex-col">
                  <span
                    className={`
                      font-medium transition duration-500
                      ${isActive ? "text-white" : "text-slate-50 group-hover:text-slate-800"}
                    `}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`
                      text-[11px] transition duration-500
                      ${isActive ? "text-slate-300" : "text-slate-300 group-hover:text-slate-600"}
                    `}
                  >
                    {item.sub}
                  </span>
                </div>

                {item.value && (
                  <span
                    className={`
                      text-[13px] font-semibold transition duration-500
                      ${isActive ? "text-white" : "text-white group-hover:text-pink"}
                    `}
                  >
                    {item.value}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-auto space-y-2 px-3 pb-4 text-[13px]">
        <button className="flex w-full items-center gap-3 rounded-md bg-white/10 px-3 py-2.5 text-white transition duration-500 hover:bg-darkGradient">
          <FiSettings className="h-5 w-5 text-white" />
          <span className={`${sidebarOpen ? "inline" : "hidden md:inline"}`}>
            Settings
          </span>
        </button>

        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md bg-red-600 px-3 py-2.5 text-sm font-medium text-white transition duration-500 hover:bg-red-700"
        >
          <FiLogOut className="h-5 w-5 text-white" />
          <span className={`${sidebarOpen ? "inline" : "hidden md:inline"}`}>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
