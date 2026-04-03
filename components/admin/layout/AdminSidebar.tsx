'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useLayoutEffect, Suspense } from 'react';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import {
  FiUsers,
  FiLogOut,
  FiChevronRight,
  FiChevronDown,
  FiMail,
  FiTarget,
  FiUser,
  FiShield,
  FiLayers,
  FiMapPin,
  FiPlay,
  FiActivity,
  FiUserPlus,
  FiGitBranch,
  FiBookOpen,
  FiRepeat,
  FiBriefcase,
  FiFolder,
  FiList,
  FiHelpCircle,
  FiPackage,
  FiTag,
  FiGrid,
  FiHome,
  FiAward,
  FiClipboard,
  FiCpu,
  FiFlag,
  FiMap,
  FiEdit3,
  FiVideo,
  FiFile,
  FiLayout,
} from 'react-icons/fi';
const SIDEBAR_COLLAPSED_KEY = 'admin_sidebar_collapsed';

/** Match nav hrefs that may include ?query= (same pathname, different search). */
function childNavMatches(
  pathname: string,
  search: { get: (key: string) => string | null },
  href: string
): boolean {
  const q = href.indexOf('?');
  const path = q === -1 ? href : href.slice(0, q);
  const qs = q === -1 ? '' : href.slice(q + 1);
  const required = qs ? new URLSearchParams(qs) : null;

  if (required) {
    if (pathname !== path) return false;
    for (const [k, v] of required.entries()) {
      if (search.get(k) !== v) return false;
    }
    return true;
  }

  if (pathname === path) return true;
  return pathname.startsWith(`${path}/`);
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  moduleCode?: string; // for filtering by admin module access
}

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  children: NavItem[];
  superAdminOnly?: boolean; // Users group: only for super_admin
}

const navGroups: NavGroup[] = [
  {
    label: 'Users',
    icon: <FiUsers className="h-4 w-4" />,
    superAdminOnly: true,
    children: [
      { label: 'Site Users', href: '/admin/site-users', icon: <FiUser className="h-4 w-4" /> },
      { label: 'Admin Users', href: '/admin/admin-users', icon: <FiShield className="h-4 w-4" /> },
      { label: 'Modules', href: '/admin/modules', icon: <FiLayers className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Taxonomies',
    icon: <FiGitBranch className="h-4 w-4" />,
    children: [
      {
        label: 'Interests',
        href: '/admin/career-goals',
        icon: <FiTarget className="h-4 w-4" />,
        moduleCode: 'career_goals',
      },
      { label: 'Subjects', href: '/admin/subjects', icon: <FiBookOpen className="h-4 w-4" />, moduleCode: 'subjects' },
      { label: 'Streams', href: '/admin/streams', icon: <FiRepeat className="h-4 w-4" />, moduleCode: 'streams' },
      { label: 'Careers', href: '/admin/careers', icon: <FiBriefcase className="h-4 w-4" />, moduleCode: 'careers' },
      { label: 'Topics', href: '/admin/topics', icon: <FiFolder className="h-4 w-4" />, moduleCode: 'topics' },
      { label: 'Subtopics', href: '/admin/subtopics', icon: <FiList className="h-4 w-4" />, moduleCode: 'subtopics' },
      { label: 'Purposes', href: '/admin/purposes', icon: <FiHelpCircle className="h-4 w-4" />, moduleCode: 'purposes' },
      // { label: 'Levels', href: '/admin/levels', icon: <FiList className="h-4 w-4" />, moduleCode: 'levels' },
      { label: 'Program Categories', href: '/admin/programs', icon: <FiPackage className="h-4 w-4" />, moduleCode: 'programs' },
      { label: 'Categories', href: '/admin/categories', icon: <FiTag className="h-4 w-4" />, moduleCode: 'categories' },
      { label: 'Branches / Courses', href: '/admin/branches', icon: <FiGrid className="h-4 w-4" />, moduleCode: 'branches' },
      { label: 'Exam Cities', href: '/admin/exam-cities', icon: <FiMapPin className="h-4 w-4" />, moduleCode: 'exam_cities' },
    ],
  },
  {
    label: 'Coaching Institutes',
    icon: <FiAward className="h-4 w-4" />,
    children: [
      { label: 'Coaching Institutes', href: '/admin/institutes', icon: <FiHome className="h-4 w-4" />, moduleCode: 'institutes' },
    ],
  },
  {
    label: 'Exams',
    icon: <FiClipboard className="h-4 w-4" />,
    children: [
      { label: 'Exams', href: '/admin/exams', icon: <FiFile className="h-4 w-4" />, moduleCode: 'exams' },
      {
        label: 'Mock prompts',
        href: '/admin/mock-prompts',
        icon: <FiCpu className="h-4 w-4" />,
        moduleCode: 'exams',
      },
    ],
  },
  {
    label: 'Colleges',
    icon: <FiFlag className="h-4 w-4" />,
    children: [
      { label: 'Colleges', href: '/admin/colleges', icon: <FiMap className="h-4 w-4" />, moduleCode: 'colleges' },
    ],
  },
  {
    label: 'Scholarships',
    icon: <FiAward className="h-4 w-4" />,
    children: [
      { label: 'Scholarships', href: '/admin/scholarships', icon: <FiTag className="h-4 w-4" />, moduleCode: 'scholarships' },
    ],
  },
  // {
  //   label: 'Loans',
  //   icon: <FiBriefcase className="h-4 w-4" />,
  //   children: [
  //     { label: 'Loan Providers', href: '/admin/loans', icon: <FiHome className="h-4 w-4" />, moduleCode: 'loans' },
  //   ],
  // },
];

const navItems: NavItem[] = [
  { label: 'Email Templates', href: '/admin/email-templates', icon: <FiMail className="h-4 w-4" />, moduleCode: 'email_templates' },
  { label: 'Blogs', href: '/admin/blogs', icon: <FiEdit3 className="h-4 w-4" />, moduleCode: 'blogs' },
  { label: 'Landing page', href: '/admin/landing-page', icon: <FiLayout className="h-4 w-4" />, moduleCode: 'landing_page' },
  { label: 'Self study material', href: '/admin/lectures', icon: <FiVideo className="h-4 w-4" />, moduleCode: 'lectures' },
  { label: 'Applications', href: '/admin/applications', icon: <FiPlay className="h-4 w-4" />, moduleCode: 'applications' },
  // { label: 'Automation Exams', href: '/admin/automation-exams', icon: <FiSettings className="h-4 w-4" />, moduleCode: 'automation_exams' },
  { label: 'Add Experts', href: '/admin/experts', icon: <FiUserPlus className="h-4 w-4" /> },
];

const counsellorNavItem: NavItem = {
  label: 'Counsellor Panel',
  href: '/admin/counsellor',
  icon: <FiActivity className="h-4 w-4" />,
};

function AdminSidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [admin, setAdmin] = useState<{ type?: string; module_codes?: string[] } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  /** Collapsed icon rail only on md+; mobile always shows labels (matches dashboard behavior). */
  const [isMdUp, setIsMdUp] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('admin_user');
      if (s) setAdmin(JSON.parse(s));
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === '1') setIsCollapsed(true);
    } catch (_) {}
  }, []);

  useLayoutEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsMdUp(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch (_) {}
      return next;
    });
  };

  const railMode = isCollapsed && isMdUp;

  useEffect(() => {
    const activeGroups = new Set<string>();
    navGroups.forEach((group) => {
      if (group.superAdminOnly && admin?.type !== 'super_admin') return;
      const hasActiveChild = group.children.some((child) =>
        childNavMatches(pathname, searchParams, child.href)
      );
      if (hasActiveChild) activeGroups.add(group.label);
    });
    queueMicrotask(() => setExpandedGroups(activeGroups));
  }, [pathname, admin, searchParams]);

  const canSeeGroup = (group: NavGroup) => {
    if (group.superAdminOnly) return admin?.type === 'super_admin';
    if (admin?.type === 'super_admin') return true;
    const codes = admin?.module_codes ?? [];
    return group.children.some((c) => !c.moduleCode || codes.includes(c.moduleCode));
  };
  const canSeeItem = (item: NavItem) => {
    if (admin?.type === 'super_admin') return true;
    return !item.moduleCode || (admin?.module_codes ?? []).includes(item.moduleCode);
  };

  const filteredGroups = navGroups.filter(canSeeGroup).map((group) => ({
    ...group,
    children: group.children.filter(canSeeItem),
  })).filter((g) => g.children.length > 0);
  const filteredNavItems = navItems.filter(canSeeItem);
  const showCounsellor = admin?.type === 'counsellor' || admin?.type === 'super_admin';

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
  };

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupLabel)) {
        next.delete(groupLabel);
      } else {
        next.add(groupLabel);
      }
      return next;
    });
  };

  const isGroupExpanded = (groupLabel: string) => expandedGroups.has(groupLabel);

  const tooltipClass =
    'pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 opacity-0 shadow-md transition-all duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 md:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200';

  return (
    <aside
      className={`
        sticky top-0 z-30 flex h-screen max-h-[100dvh] min-h-0 shrink-0 flex-col self-start border-r border-slate-200/80 bg-white
        dark:border-slate-800/60 dark:bg-slate-950
        ${railMode ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header — aligned with dashboard Sidebar (light surface + logo) */}
      <div className="relative z-0 flex items-center gap-2 border-b border-slate-200/80 px-3 py-4 dark:border-slate-800/70">
        <div className={`flex min-w-0 items-center ${railMode ? 'w-full justify-center' : 'flex-1'}`}>
          <Link href="/admin" className="block min-w-0">
            {railMode ? (
              <Image
                src="/logo.svg"
                alt="Unitracko"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl dark:invert"
                priority
              />
            ) : (
              <Image
                src="/logo.svg"
                alt="Unitracko logo"
                width={168}
                height={38}
                className="h-auto w-[160px] max-w-full dark:invert"
                priority
              />
            )}
          </Link>
        </div>
        {!railMode && (
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label="Collapse sidebar"
            className="hidden shrink-0 rounded-lg border-2 border-slate-300 bg-slate-100 p-1.5 text-slate-800 shadow-sm transition-all hover:border-[#341050]/45 hover:bg-white hover:text-[#341050] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#341050]/35 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700 md:inline-flex"
          >
            <BiChevronLeft className="h-4 w-4 stroke-[2.5]" />
          </button>
        )}
        {railMode && (
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label="Expand sidebar"
            className="absolute right-[-14px] top-4 z-50 hidden rounded-full border-2 border-slate-300 bg-slate-100 p-1.5 text-slate-800 shadow-[0_2px_8px_rgba(15,23,42,0.12)] ring-2 ring-white transition-all hover:border-[#341050]/45 hover:bg-white hover:text-[#341050] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#341050]/35 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-950 dark:hover:bg-slate-700 md:inline-flex"
          >
            <BiChevronRight className="h-4 w-4 stroke-[2.5]" />
          </button>
        )}
      </div>

      <div className="mx-2.5 h-px shrink-0 bg-slate-200/80 dark:bg-slate-800/70" />

      {/* Navigation */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2.5 py-4 text-[13px] scrollbar-hide">
        {filteredGroups.map((group) => {
          const isExpanded = isGroupExpanded(group.label);
          const hasActiveChild = group.children.some((child) =>
            childNavMatches(pathname, searchParams, child.href)
          );

          return (
            <div key={group.label} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                title={railMode ? group.label : undefined}
                className={`
                  group relative flex w-full items-center rounded-xl text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight-300
                  ${railMode ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2.5'}
                  ${
                    hasActiveChild
                      ? 'bg-highlight-100 text-brand-ink dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                  }
                `}
              >
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]">
                  {group.icon}
                </span>
                {railMode ? (
                  <span className={tooltipClass}>{group.label}</span>
                ) : (
                  <>
                    <span className="flex-1 text-left text-sm font-medium">{group.label}</span>
                    {isExpanded ? (
                      <FiChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                    ) : (
                      <FiChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                    )}
                  </>
                )}
              </button>

              {isExpanded && (
                <div
                  className={
                    railMode
                      ? 'space-y-0.5'
                      : 'ml-2 space-y-0.5 border-l border-slate-200 pl-2 dark:border-slate-700'
                  }
                >
                  {group.children.map((child) => {
                    const isActive = childNavMatches(pathname, searchParams, child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        title={railMode ? child.label : undefined}
                        className={`
                          group relative flex items-center rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight-300
                          ${railMode ? 'justify-center px-2 py-2' : 'gap-2.5 px-3 py-2'}
                          ${
                            isActive
                              ? 'bg-highlight-100 font-medium text-brand-ink shadow-sm dark:bg-slate-800 dark:text-slate-100'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200'
                          }
                        `}
                      >
                        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
                          {child.icon}
                        </span>
                        {railMode ? (
                          <span className={tooltipClass}>{child.label}</span>
                        ) : (
                          <>
                            <span className="text-sm font-medium">{child.label}</span>
                            {isActive && (
                              <FiChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {showCounsellor &&
          (() => {
            const isActive =
              pathname === counsellorNavItem.href ||
              pathname.startsWith(counsellorNavItem.href + '/');
            return (
              <Link
                href={counsellorNavItem.href}
                title={railMode ? counsellorNavItem.label : undefined}
                className={`
                  group relative flex items-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight-300
                  ${railMode ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2.5'}
                  ${
                    isActive
                      ? 'bg-highlight-100 font-medium text-brand-ink shadow-sm dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                  }
                `}
              >
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]">
                  {counsellorNavItem.icon}
                </span>
                {railMode ? (
                  <span className={tooltipClass}>{counsellorNavItem.label}</span>
                ) : (
                  <>
                    <span className="text-sm font-medium">{counsellorNavItem.label}</span>
                    {isActive && (
                      <FiChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                    )}
                  </>
                )}
              </Link>
            );
          })()}

        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={railMode ? item.label : undefined}
              className={`
                group relative flex items-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight-300
                ${railMode ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2.5'}
                ${
                  isActive
                    ? 'bg-highlight-100 font-medium text-brand-ink shadow-sm dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                }
              `}
            >
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]">
                {item.icon}
              </span>
              {railMode ? (
                <span className={tooltipClass}>{item.label}</span>
              ) : (
                <>
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && (
                    <FiChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mx-2.5 h-px shrink-0 bg-slate-200/80 dark:bg-slate-800/70" />

      <div className="p-2.5">
        <button
          type="button"
          onClick={handleLogout}
          title={railMode ? 'Logout' : undefined}
          className={`
            group relative flex w-full items-center rounded-xl text-sm text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight-300 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200
            ${railMode ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2.5'}
          `}
        >
          <FiLogOut className="h-4 w-4 shrink-0" />
          {railMode ? (
            <span className={tooltipClass}>Logout</span>
          ) : (
            <span className="text-sm font-medium">Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
}

export default function AdminSidebar() {
  return (
    <Suspense
      fallback={
        <aside className="sticky top-0 z-30 flex h-screen max-h-[100dvh] min-h-0 w-64 shrink-0 flex-col self-start border-r border-slate-200/80 bg-white dark:border-slate-800/60 dark:bg-slate-950" />
      }
    >
      <AdminSidebarInner />
    </Suspense>
  );
}
