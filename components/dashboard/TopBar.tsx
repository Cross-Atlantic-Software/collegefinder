"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BiBell, BiChevronDown, BiMenu, BiSearch } from "react-icons/bi";
import { FaUserCircle } from "react-icons/fa";
import { FiLogOut, FiSettings, FiUser } from "react-icons/fi";
import { Button } from "../shared";
import { IoFunnel } from "react-icons/io5";
import { useAuth } from "@/contexts/AuthContext";

type TopBarProps = {
  onToggleSidebar: () => void;
  onToggleCollapse: () => void;
  isSidebarCollapsed: boolean;
};

export default function TopBar({ onToggleSidebar, onToggleCollapse, isSidebarCollapsed }: TopBarProps) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="flex items-center gap-4 px-4 py-3 md:px-6">
        {/* Sidebar toggles */}
        <button
          onClick={onToggleSidebar}
          aria-label="Open sidebar"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200 md:hidden"
        >
          <BiMenu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        </button>

        <button
          onClick={onToggleCollapse}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
        >
          <BiMenu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        </button>

        {/* Search */}
        <div className="flex-1 flex items-center gap-3">
          <div className="hidden md:flex flex-1 items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-all duration-200 focus-within:border-action-500 focus-within:ring-1 focus-within:ring-action-500/20">
            <BiSearch className="h-4 w-4 flex-shrink-0" />
            <input
              placeholder="Search exams, tutorials, colleges..."
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-slate-500"
            />
          </div>
          <Button variant="secondary" size="sm" className="hidden md:flex gap-2"> <IoFunnel /> Filters</Button>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2" ref={profileMenuRef}>
          <button
            aria-label="Notifications"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
          >
            <BiBell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-4 min-w-4 rounded-full bg-action-500 px-1 text-[10px] font-semibold leading-4 text-white">4</span>
          </button>

          <button
            onClick={() => setProfileOpen((v) => !v)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200"
          >
            <div className="relative h-7 w-7 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              {user?.profile_photo ? (
                <Image
                  src={user.profile_photo}
                  alt={user?.name || "Profile"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <FaUserCircle className="h-6 w-6 text-slate-400 dark:text-slate-500" />
              )}
            </div>
            <span className="hidden md:inline-block max-w-[140px] truncate text-sm font-medium">
              {user?.name || "User"}
            </span>
            <BiChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-6 top-14 z-30 w-52 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-xl"
            >
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                <FiUser className="h-4 w-4" />
                My Profile
              </button>
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                <FiSettings className="h-4 w-4" />
                Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <FiLogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
