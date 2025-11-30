'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiLayout, 
  FiUsers, 
  FiLogOut,
  FiChevronRight,
  FiMail
} from 'react-icons/fi';
import { Logo } from '@/components/shared';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: <FiLayout className="h-4 w-4" />,
  },
  {
    label: 'Site Users',
    href: '/admin/dashboard/users',
    icon: <FiUsers className="h-4 w-4" />,
  },
  {
    label: 'Admin Users',
    href: '/admin/dashboard/admins',
    icon: <FiUsers className="h-4 w-4" />,
  },
  {
    label: 'Email Templates',
    href: '/admin/dashboard/email-templates',
    icon: <FiMail className="h-4 w-4" />,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
  };

  return (
    <div className="w-64 bg-gradient-to-b from-[#140E27] to-[#341050] min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <Link href="/admin/dashboard" className="block">
          <Logo 
            mode="dark" 
            darkSrc="/svgs/logo-white.svg"
            width={160}
            height={36}
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5">
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

