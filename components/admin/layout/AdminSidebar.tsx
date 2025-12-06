'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  FiLayout, 
  FiUsers, 
  FiLogOut,
  FiChevronRight,
  FiChevronDown,
  FiMail,
  FiTarget,
  FiBook,
  FiUser,
  FiShield,
  FiFileText
} from 'react-icons/fi';
import { Logo } from '@/components/shared';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  children: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Users',
    icon: <FiUsers className="h-4 w-4" />,
    children: [
      {
        label: 'Site Users',
        href: '/admin/site-users',
        icon: <FiUser className="h-4 w-4" />,
      },
      {
        label: 'Admin Users',
        href: '/admin/admin-users',
        icon: <FiShield className="h-4 w-4" />,
      },
    ],
  },
];

const navItems: NavItem[] = [
  {
    label: 'Career Goals',
    href: '/admin/career-goals',
    icon: <FiTarget className="h-4 w-4" />,
  },
  {
    label: 'Exams',
    href: '/admin/exams',
    icon: <FiBook className="h-4 w-4" />,
  },
  {
    label: 'Email Templates',
    href: '/admin/email-templates',
    icon: <FiMail className="h-4 w-4" />,
  },
  {
    label: 'Blogs',
    href: '/admin/blogs',
    icon: <FiFileText className="h-4 w-4" />,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Auto-expand groups if any child is active
    const activeGroups = new Set<string>();
    navGroups.forEach((group) => {
      const hasActiveChild = group.children.some((child) => pathname === child.href);
      if (hasActiveChild) {
        activeGroups.add(group.label);
      }
    });
    setExpandedGroups(activeGroups);
  }, [pathname]);

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
        {navGroups.map((group) => {
          const isExpanded = isGroupExpanded(group.label);
          const hasActiveChild = group.children.some((child) => pathname === child.href);

          return (
            <div key={group.label} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.label)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm
                  ${
                    hasActiveChild
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
                    const isActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`
                          flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm
                          ${
                            isActive
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

        {/* Regular Navigation Items */}
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm
                ${
                  isActive
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

