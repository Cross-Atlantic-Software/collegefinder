"use client";

import { useState } from "react";
import {
  FiUser,
  FiCreditCard,
  FiLock,
  FiBell,
  FiZap,
  FiCheck,
  FiToggleLeft,
  FiToggleRight,
  FiShield,
  FiSmartphone,
} from "react-icons/fi";
import { Button } from "../shared";

type TabKey = "general" | "credits" | "security" | "notifications";

const tabs: { key: TabKey; label: string; icon: React.ElementType; description: string }[] = [
  {
    key: "general",
    label: "General",
    icon: FiUser,
    description: "Account preferences and profile display.",
  },
  {
    key: "credits",
    label: "Credits & Billing",
    icon: FiCreditCard,
    description: "Manage your plan, credits, and history.",
  },
  {
    key: "security",
    label: "Security",
    icon: FiLock,
    description: "Password, 2FA, and login sessions.",
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: FiBell,
    description: "Control emails, alerts, and reminders.",
  },
];

/* ── Reusable row ─────────────────────────────────────────────── */
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ── Toggle ───────────────────────────────────────────────────── */
function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAD53C] ${
        on ? "bg-black dark:bg-[#FAD53C]" : "bg-slate-200 dark:bg-slate-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/* ── Section card wrapper ─────────────────────────────────────── */
function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-sm dark:bg-slate-900">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

/* ── Tab panels ───────────────────────────────────────────────── */
function GeneralPanel() {
  return (
    <div className="space-y-4">
      <SectionCard title="Profile Display" subtitle="Control how your name and avatar appear.">
        <SettingRow label="Display Name" description="Used in counselling sessions and reports.">
          <input
            type="text"
            defaultValue="Shahid Mollick"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-black focus:ring-1 focus:ring-black dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-[#FAD53C] dark:focus:ring-[#FAD53C] sm:w-56"
          />
        </SettingRow>
        <SettingRow label="Language" description="Interface display language.">
          <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-black dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:w-44">
            <option>English</option>
            <option>Hindi</option>
            <option>Bengali</option>
          </select>
        </SettingRow>
        <SettingRow label="Timezone" description="Used to show exam dates and deadlines correctly.">
          <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-black dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:w-44">
            <option>IST (UTC +5:30)</option>
            <option>UTC</option>
          </select>
        </SettingRow>
      </SectionCard>

      <SectionCard title="Appearance" subtitle="Theme and visual preferences.">
        <SettingRow label="Dark Mode" description="Switch between light and dark interface.">
          <Toggle defaultOn />
        </SettingRow>
        <SettingRow label="Compact Mode" description="Reduce padding for denser layouts.">
          <Toggle />
        </SettingRow>
      </SectionCard>

      <div className="flex justify-end pt-2">
        <Button variant="themeButton" className="px-6">Save changes</Button>
      </div>
    </div>
  );
}

function CreditsPanel() {
  const usageItems = [
    { label: "AI Profile Analysis", used: 12, total: 20, color: "bg-[#FAD53C]" },
    { label: "Mock Test Generation", used: 25, total: 100, color: "bg-black dark:bg-white" },
    { label: "Counselling Sessions", used: 13, total: 15, color: "bg-slate-500 dark:bg-slate-400" },
  ];

  const transactions = [
    { date: "Jun 19, 2026", desc: "AI Profile Analysis", amount: "-2 credits", type: "debit" },
    { date: "Jun 15, 2026", desc: "Monthly Plan Renewal", amount: "+500 credits", type: "credit" },
    { date: "Jun 10, 2026", desc: "Mock Test Generation", amount: "-5 credits", type: "debit" },
    { date: "May 30, 2026", desc: "Counselling Session", amount: "-3 credits", type: "debit" },
    { date: "May 15, 2026", desc: "Monthly Plan Renewal", amount: "+500 credits", type: "credit" },
  ];

  return (
    <div className="space-y-4">
      {/* Balance hero */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-6 text-white dark:bg-black">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Available Credits</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight">450</span>
              <span className="text-sm font-medium text-slate-400">/ 500</span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FAD53C]" />
              Active plan · Renews July 15, 2026
            </p>
          </div>
          <div className="flex min-w-[180px] flex-col gap-2.5">
            <Button variant="themeButton" className="flex w-full items-center justify-center gap-2">
              <FiZap className="h-4 w-4" />
              Upgrade Plan
            </Button>
            <Button
              variant="themeButtonOutline"
              className="w-full border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
            >
              Billing History
            </Button>
          </div>
        </div>
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#FAD53C] opacity-10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[#FAD53C] opacity-5 blur-3xl" />
      </div>

      {/* Usage breakdown */}
      <SectionCard title="Current Usage" subtitle="Credits consumed this billing cycle.">
        <div className="space-y-5 py-3">
          {usageItems.map((item) => {
            const pct = Math.round((item.used / item.total) * 100);
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {item.used} / {item.total} credits
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Transactions */}
      <SectionCard title="Recent Activity" subtitle="Latest credit debits and renewals.">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {transactions.map((tx, i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tx.desc}</p>
                <p className="mt-0.5 text-xs text-slate-400">{tx.date}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  tx.type === "credit"
                    ? "bg-[#FAD53C]/20 text-yellow-800 dark:bg-[#FAD53C]/10 dark:text-[#FAD53C]"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function SecurityPanel() {
  return (
    <div className="space-y-4">
      <SectionCard title="Password" subtitle="Change or update your account password.">
        <SettingRow label="Current Password" description="Required to confirm any password changes.">
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-black focus:ring-1 focus:ring-black dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-[#FAD53C] dark:focus:ring-[#FAD53C] sm:w-56"
          />
        </SettingRow>
        <SettingRow label="New Password" description="Use at least 12 characters with mixed case.">
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-black focus:ring-1 focus:ring-black dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-[#FAD53C] dark:focus:ring-[#FAD53C] sm:w-56"
          />
        </SettingRow>
        <div className="flex justify-end py-4">
          <Button variant="themeButton" className="px-6">Update Password</Button>
        </div>
      </SectionCard>

      <SectionCard title="Two-Factor Authentication" subtitle="Protect your account with an extra verification step.">
        <div className="py-4">
          <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-[#FAD53C]">
              <FiSmartphone className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Authenticator App</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Use Google Authenticator or Authy to generate one-time codes.
              </p>
            </div>
            <Button variant="themeButtonOutline" className="shrink-0 text-xs px-3 py-1.5">
              Enable
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Active Sessions" subtitle="Devices currently signed into your account.">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[
            { device: "Chrome on macOS", location: "Mumbai, IN", status: "Current session" },
            { device: "Safari on iPhone 14", location: "Mumbai, IN", status: "3 days ago" },
          ].map((session) => (
            <div key={session.device} className="flex items-center justify-between gap-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <FiShield className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{session.device}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{session.location} · {session.status}</p>
                </div>
              </div>
              {session.status !== "Current session" && (
                <button className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                  Revoke
                </button>
              )}
              {session.status === "Current session" && (
                <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-[#FAD53C]/20 px-2.5 py-1 text-xs font-semibold text-yellow-800 dark:bg-[#FAD53C]/10 dark:text-[#FAD53C]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FAD53C]" />
                  Active
                </span>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function NotificationsPanel() {
  const groups = [
    {
      title: "Exam Alerts",
      subtitle: "Deadlines, results, and new exam announcements.",
      items: [
        { label: "Upcoming exam deadlines", desc: "3 days before each deadline", defaultOn: true },
        { label: "Results published", desc: "Notify when a shortlisted exam publishes results", defaultOn: true },
        { label: "New exam added", desc: "Exams that match your stream and interests", defaultOn: false },
      ],
    },
    {
      title: "Progress & Milestones",
      subtitle: "Journey planner and preparation reminders.",
      items: [
        { label: "Phase change reminders", desc: "When your plan moves into a new phase", defaultOn: true },
        { label: "Mock test nudges", desc: "Weekly reminder to take a practice test", defaultOn: false },
        { label: "Profile completeness", desc: "Incomplete profile warnings", defaultOn: true },
      ],
    },
    {
      title: "System & Marketing",
      subtitle: "Product updates, newsletters, and offers.",
      items: [
        { label: "Product updates", desc: "New features and platform improvements", defaultOn: true },
        { label: "Promotional offers", desc: "Discounts, partnerships, and events", defaultOn: false },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <SectionCard key={group.title} title={group.title} subtitle={group.subtitle}>
          {group.items.map((item) => (
            <SettingRow key={item.label} label={item.label} description={item.desc}>
              <Toggle defaultOn={item.defaultOn} />
            </SettingRow>
          ))}
        </SectionCard>
      ))}
      <div className="flex justify-end pt-2">
        <Button variant="themeButton" className="px-6">Save preferences</Button>
      </div>
    </div>
  );
}

/* ── Main Settings component ──────────────────────────────────── */
export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabKey>("credits");

  const activeTabMeta = tabs.find((t) => t.key === activeTab)!;

  const renderPanel = () => {
    switch (activeTab) {
      case "general":      return <GeneralPanel />;
      case "credits":      return <CreditsPanel />;
      case "security":     return <SecurityPanel />;
      case "notifications": return <NotificationsPanel />;
    }
  };

  return (
    <div className="min-h-full w-full bg-[#f8fbff] dark:bg-slate-950/40">
      {/* ── Page header (matches ProfileTabs header style) ── */}
      <header className="border-b border-slate-200 bg-white px-4 pb-0 pt-4 dark:border-slate-800 dark:bg-slate-900 md:px-6">
        <div className="flex items-end justify-between gap-4 pb-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Account
            </p>
            <h1 className="mt-0.5 text-xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Manage your preferences, billing, security, and notifications.
            </p>
          </div>
        </div>

        {/* ── Tab bar (matches ProfileTabs pill style) ── */}
        <div className="relative mt-4 flex gap-1 overflow-x-auto pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`group relative flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[#f8fbff] text-slate-900 dark:bg-slate-950/40 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? "text-black dark:text-[#FAD53C]" : "text-slate-400"
                  }`}
                />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-black dark:bg-[#FAD53C]" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Content area (matches ProfileTabs main layout) ── */}
      <div className="px-4 py-4 md:px-6 md:py-6">
        <div className="mx-auto grid w-full max-w-7xl gap-5 xl:grid-cols-[2.15fr,1fr] xl:items-start">
          {/* Main panel */}
          <div key={activeTab} style={{ animation: "fade-in 220ms ease-out" }} className="min-w-0">
            {renderPanel()}
          </div>

          {/* Right sidebar */}
          <aside className="w-full shrink-0 xl:sticky xl:top-6">
            <div className="flex flex-col gap-4">
              {/* Context card */}
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 md:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-[#FAD53C]">
                    <activeTabMeta.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {activeTabMeta.label}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {activeTabMeta.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Plan status card */}
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 md:p-5">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Current Plan</h3>
                <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Standard</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">500 credits / month</p>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-[#FAD53C]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-yellow-800 dark:bg-[#FAD53C]/10 dark:text-[#FAD53C]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FAD53C]" />
                    Active
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>450 credits left</span>
                    <span>90%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full w-[90%] rounded-full bg-[#FAD53C]" />
                  </div>
                </div>
                <Button variant="themeButton" className="mt-4 flex w-full items-center justify-center gap-2">
                  <FiZap className="h-4 w-4" />
                  Upgrade Plan
                </Button>
              </div>

              {/* Quick links */}
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 md:p-5">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h3>
                <div className="mt-3 space-y-1">
                  {[
                    { icon: FiUser, label: "Edit Profile" },
                    { icon: FiShield, label: "Security Checkup" },
                    { icon: FiCreditCard, label: "Billing History" },
                    { icon: FiBell, label: "Notification Digest" },
                  ].map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                    >
                      <Icon className="h-4 w-4 text-slate-400" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
