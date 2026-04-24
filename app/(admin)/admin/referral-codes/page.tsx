'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiRefreshCw, FiTrash2, FiXCircle } from 'react-icons/fi';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllActiveReferralCodes,
  deactivateReferralCode,
  deleteReferralCode,
  type ActiveReferralCode,
} from '@/api';
import { ConfirmationModal, useToast } from '@/components/shared';

export default function ActiveReferralCodesPage() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [rows, setRows] = useState<ActiveReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<ActiveReferralCode | null>(null);
  const [action, setAction] = useState<'deactivate' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const res = await getAllActiveReferralCodes();
      if (res.success && res.data?.referralCodes) {
        setRows(res.data.referralCodes);
      } else {
        showError(res.message || 'Failed to fetch referral codes');
      }
    } catch (e) {
      showError('Failed to fetch referral codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmAction = async () => {
    if (!target || !action) return;
    try {
      setBusy(true);
      const res =
        action === 'deactivate'
          ? await deactivateReferralCode(target.id)
          : await deleteReferralCode(target.id);
      if (!res.success) {
        showError(res.message || 'Operation failed');
        return;
      }
      showSuccess(action === 'deactivate' ? 'Referral code deactivated' : 'Referral code deleted');
      setTarget(null);
      setAction(null);
      fetchRows();
    } catch {
      showError('Operation failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Active Referral Codes</h1>
              <p className="text-sm text-slate-600">Manage generated user referral codes.</p>
            </div>
            <button
              type="button"
              onClick={fetchRows}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 bg-white rounded-lg hover:bg-[#F6F8FA]"
            >
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-4 text-sm text-slate-500 text-center">Loading referral codes...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F6F8FA] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">USER</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">EMAIL</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">ACTIVE CODE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">STATUS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">UPDATED</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-sm text-slate-500">
                          No referral codes found
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => (
                        <tr key={r.id} className="hover:bg-[#F6F8FA]">
                          <td className="px-4 py-2 text-sm text-slate-900">{r.user_name || `User ${r.user_id}`}</td>
                          <td className="px-4 py-2 text-sm text-slate-600">{r.user_email}</td>
                          <td className="px-4 py-2 text-sm font-mono text-slate-900">{r.active_code}</td>
                          <td className="px-4 py-2 text-xs">
                            {r.is_active ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800">Active</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Inactive</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-600">
                            {new Date(r.updated_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setTarget(r);
                                  setAction('deactivate');
                                }}
                                disabled={!r.is_active}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-amber-200 text-amber-700 bg-amber-50 disabled:opacity-50"
                              >
                                <FiXCircle className="h-3 w-3" />
                                Deactivate
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setTarget(r);
                                  setAction('delete');
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-red-200 text-red-700 bg-red-50"
                              >
                                <FiTrash2 className="h-3 w-3" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      <ConfirmationModal
        isOpen={Boolean(target && action)}
        onClose={() => {
          setTarget(null);
          setAction(null);
        }}
        onConfirm={confirmAction}
        title={action === 'deactivate' ? 'Deactivate Referral Code' : 'Delete Referral Code'}
        message={
          action === 'deactivate'
            ? 'This will deactivate the code and users will no longer be able to use it.'
            : 'This will permanently delete this referral code mapping.'
        }
        confirmText={action === 'deactivate' ? 'Deactivate' : 'Delete'}
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={busy}
      />
    </div>
  );
}
