'use client';

import React, { useState, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

export default function AdminHeader() {
  // Get current admin info
  const [adminInfo, setAdminInfo] = useState<{ email: string; type: string } | null>(null);

  useEffect(() => {
    const adminUserStr = localStorage.getItem('admin_user');
    if (adminUserStr) {
      try {
        const admin = JSON.parse(adminUserStr);
        setAdminInfo(admin);
      } catch (e) {
        console.error('Error parsing admin user:', e);
      }
    }
  }, []);

  const getAdminInitials = () => {
    if (adminInfo?.email) {
      return adminInfo.email.charAt(0).toUpperCase();
    }
    return 'A';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center">
      <div className="flex items-center justify-end w-full">
        {/* User Info */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs font-medium text-gray-900">
              {adminInfo?.type === 'super_admin' ? 'Super Admin' : 'Admin'}
            </p>
            <p className="text-xs text-gray-500">{adminInfo?.email || 'Admin'}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-darkGradient flex items-center justify-center text-white text-sm font-semibold">
            {getAdminInitials()}
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <FiChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

