'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  FiUsers,
  FiLogOut,
  FiChevronRight,
  FiChevronDown,
  FiMail,
  FiTarget,
  FiBook,
  FiUser,
  FiShield,
  FiFileText,
  FiLayers,
  FiMapPin,
  FiImage,
  FiStar,
  FiHelpCircle,
  FiPlay,
  FiSettings,
  FiMessageSquare,
  FiActivity,
  FiUserPlus,
  FiShare2,
} from 'react-icons/fi';
import { Logo } from '@/components/shared';

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
    icon: <FiLayers className="h-4 w-4" />,
    children: [
      {
        label: 'Interests',
        href: '/admin/career-goals',
        icon: <FiTarget className="h-4 w-4" />,
        moduleCode: 'career_goals',
      },
      { label: 'Subjects', href: '/admin/subjects', icon: <FiBook className="h-4 w-4" />, moduleCode: 'subjects' },
      { label: 'Streams', href: '/admin/streams', icon: <FiBook className="h-4 w-4" />, moduleCode: 'streams' },
      { label: 'Careers', href: '/admin/careers', icon: <FiBook className="h-4 w-4" />, moduleCode: 'careers' },
      { label: 'Topics', href: '/admin/topics', icon: <FiBook className="h-4 w-4" />, moduleCode: 'topics' },
      { label: 'Subtopics', href: '/admin/subtopics', icon: <FiBook className="h-4 w-4" />, moduleCode: 'subtopics' },
      { label: 'Purposes', href: '/admin/purposes', icon: <FiBook className="h-4 w-4" />, moduleCode: 'purposes' },
      // { label: 'Levels', href: '/admin/levels', icon: <FiBook className="h-4 w-4" />, moduleCode: 'levels' },
      { label: 'Program Categories', href: '/admin/programs', icon: <FiBook className="h-4 w-4" />, moduleCode: 'programs' },
      { label: 'Categories', href: '/admin/categories', icon: <FiBook className="h-4 w-4" />, moduleCode: 'categories' },
      { label: 'Branches / Courses', href: '/admin/branches', icon: <FiBook className="h-4 w-4" />, moduleCode: 'branches' },
      { label: 'Exam Cities', href: '/admin/exam-cities', icon: <FiMapPin className="h-4 w-4" />, moduleCode: 'exam_cities' },
    ],
  },
  {
    label: 'Institutes',
    icon: <FiBook className="h-4 w-4" />,
    children: [
      { label: 'Institutes', href: '/admin/institutes', icon: <FiBook className="h-4 w-4" />, moduleCode: 'institutes' },
    ],
  },
  {
    label: 'Exams',
    icon: <FiFileText className="h-4 w-4" />,
    children: [
      { label: 'Exams', href: '/admin/exams', icon: <FiFileText className="h-4 w-4" />, moduleCode: 'exams' },
    ],
  },
  {
    label: 'Mock Prompts',
    icon: <FiMessageSquare className="h-4 w-4" />,
    children: [
      {
        label: 'Prompts',
        href: '/admin/mock-prompts',
        icon: <FiMessageSquare className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'Social Media',
    icon: <FiShare2 className="h-4 w-4" />,
    children: [
      {
        label: 'Post Generator',
        href: '/admin/social/post-generator',
        icon: <FiShare2 className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'Colleges',
    icon: <FiBook className="h-4 w-4" />,
    children: [
      { label: 'Colleges', href: '/admin/colleges', icon: <FiBook className="h-4 w-4" />, moduleCode: 'colleges' },
    ],
  },
  // {
  //   label: 'Scholarships',
  //   icon: <FiBook className="h-4 w-4" />,
  //   children: [
  //     { label: 'Scholarships', href: '/admin/scholarships', icon: <FiBook className="h-4 w-4" />, moduleCode: 'scholarships' },
  //   ],
  // },
  // {
  //   label: 'Loans',
  //   icon: <FiBook className="h-4 w-4" />,
  //   children: [
  //     { label: 'Loan Providers', href: '/admin/loans', icon: <FiBook className="h-4 w-4" />, moduleCode: 'loans' },
  //   ],
  // },
];

const navItems: NavItem[] = [
  { label: 'Email Templates', href: '/admin/email-templates', icon: <FiMail className="h-4 w-4" />, moduleCode: 'email_templates' },
  { label: 'Blogs', href: '/admin/blogs', icon: <FiFileText className="h-4 w-4" />, moduleCode: 'blogs' },
  { label: 'Lectures', href: '/admin/lectures', icon: <FiFileText className="h-4 w-4" />, moduleCode: 'lectures' },
  { label: 'Applications', href: '/admin/applications', icon: <FiPlay className="h-4 w-4" />, moduleCode: 'applications' },
  // { label: 'Automation Exams', href: '/admin/automation-exams', icon: <FiSettings className="h-4 w-4" />, moduleCode: 'automation_exams' },
  { label: 'Add Experts', href: '/admin/experts', icon: <FiUserPlus className="h-4 w-4" /> },
];

const counsellorNavItem: NavItem = {
  label: 'Counsellor Panel',
  href: '/admin/counsellor',
  icon: <FiActivity className="h-4 w-4" />,
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [admin, setAdmin] = useState<{ type?: string; module_codes?: string[] } | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('admin_user');
      if (s) setAdmin(JSON.parse(s));
    } catch (_) {}
  }, []);

  useEffect(() => {
    const activeGroups = new Set<string>();
    navGroups.forEach((group) => {
      if (group.superAdminOnly && admin?.type !== 'super_admin') return;
      const hasActiveChild = group.children.some((child) => pathname === child.href || pathname.startsWith(child.href + '/'));
      if (hasActiveChild) activeGroups.add(group.label);
    });
    queueMicrotask(() => setExpandedGroups(activeGroups));
  }, [pathname, admin]);

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

  return (
    <div className="w-64 bg-gradient-to-b from-[#140E27] to-[#341050] min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <Link href="/admin" className="block">
          <Logo
            mode="dark"
            darkSrc="/svgs/logo-white.svg"
            width={160}
            height={36}
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {/* Navigation Groups */}
        {filteredGroups.map((group) => {
          const isExpanded = isGroupExpanded(group.label);
          const hasActiveChild = group.children.some((child) => pathname === child.href || pathname.startsWith(child.href + '/'));

          return (
            <div key={group.label} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.label)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm
                  ${hasActiveChild
                    ? 'bg-pink/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                {group.icon}
                <span className="font-medium text-sm flex-1 text-left">{group.label}</span>
                {isExpanded ? (
                  <FiChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <FiChevronRight className="h-3.5 w-3.5" />
                )}
              </button>

              {isExpanded && (
                <div className="ml-4 space-y-1">
                  {group.children.map((child) => {
                    const isActive = pathname === child.href || pathname.startsWith(child.href + '/');
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`
                          flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm
                          ${isActive
                            ? 'bg-pink text-white shadow-lg'
                            : 'text-white/60 hover:bg-white/10 hover:text-white/80'
                          }
                        `}
                      >
                        {child.icon}
                        <span className="font-medium text-sm">{child.label}</span>
                        {isActive && <FiChevronRight className="h-3.5 w-3.5 ml-auto" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Counsellor Panel - visible to counsellor and super_admin */}
        {showCounsellor && (() => {
          const isActive = pathname === counsellorNavItem.href || pathname.startsWith(counsellorNavItem.href + '/');
          return (
            <Link
              href={counsellorNavItem.href}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm
                ${isActive
                  ? 'bg-pink text-white shadow-lg'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {counsellorNavItem.icon}
              <span className="font-medium text-sm">{counsellorNavItem.label}</span>
              {isActive && <FiChevronRight className="h-3.5 w-3.5 ml-auto" />}
            </Link>
          );
        })()}

        {/* Regular Navigation Items */}
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm
                ${isActive
                  ? 'bg-pink text-white shadow-lg'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && <FiChevronRight className="h-3.5 w-3.5 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm"
        >
          <FiLogOut className="h-4 w-4" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}

