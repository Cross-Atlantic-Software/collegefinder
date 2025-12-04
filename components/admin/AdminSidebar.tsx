'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  FiLayout, 
  FiUsers, 
  FiLogOut,
  FiChevronRight,
  FiChevronDown,
  FiMail
} from 'react-icons/fi';
import { Logo } from '@/components/shared';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  subItems?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    label: 'Site Users',
    href: '/admin/users/basic-info',
    icon: <FiUsers className="h-4 w-4" />,
    subItems: [
      { label: 'Basic Info', href: '/admin/users/basic-info' },
      { label: 'Academics', href: '/admin/users/academics' },
      { label: 'Career Goals', href: '/admin/users/career-goals' },
    ],
  },
  {
    label: 'Admin Users',
    href: '/admin/manage',
    icon: <FiUsers className="h-4 w-4" />,
  },
  {
    label: 'Email Templates',
    href: '/admin/email-templates',
    icon: <FiMail className="h-4 w-4" />,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Auto-expand Site Users if any sub-item is active
    if (pathname?.startsWith('/admin/users')) {
      return ['site-users'];
    }
    return [];
  });

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
  };

  const isSiteUsersActive = pathname?.startsWith('/admin/users');
  const isSiteUsersExpanded = expandedItems.includes('site-users');

  return (
    <div className="w-64 bg-gradient-to-b from-[#140E27] to-[#341050] min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <Link href="/admin/users/basic-info" className="block">
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
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.label === 'Site Users' && isSiteUsersActive);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const itemKey = item.label.toLowerCase().replace(' ', '-');
          const isExpanded = expandedItems.includes(itemKey);

          return (
            <div key={item.href}>
              {hasSubItems ? (
                <>
                  <button
                    onClick={() => toggleExpanded(itemKey)}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm
                      ${
                        isActive
                          ? 'bg-pink text-white shadow-lg'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    {item.icon}
                    <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
                    {isExpanded ? (
                      <FiChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <FiChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems!.map((subItem) => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`
                              flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm
                              ${
                                isSubActive
                                  ? 'bg-pink/80 text-white'
                                  : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                              }
                            `}
                          >
                            <span className="text-xs">•</span>
                            <span className="font-medium text-sm">{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
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
              )}
            </div>
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

