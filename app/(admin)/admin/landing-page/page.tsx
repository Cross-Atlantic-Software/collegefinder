'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import LandingPageContentEditor from '@/components/admin/landing-page/LandingPageContentEditor';
import { getAdminLandingPageContent, updateAdminLandingPageContent } from '@/api/admin/landingPage';
import type { LandingPageContent } from '@/types/landingPage';
import { useToast } from '@/components/shared';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

export default function AdminLandingPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { canEdit } = useAdminPermissions();
  const [content, setContent] = useState<LandingPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    (async () => {
      try {
        const res = await getAdminLandingPageContent();
        if (res.success && res.data?.content) {
          setContent(res.data.content);
        } else {
          showError(res.message || 'Failed to load landing page content');
        }
      } catch {
        showError('Failed to load landing page content');
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    try {
      const res = await updateAdminLandingPageContent(content);
      if (res.success && res.data?.content) {
        setContent(res.data.content);
        showSuccess('Landing page content saved');
      } else {
        showError(res.message || 'Save failed');
      }
    } catch {
      showError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          title="Landing page"
          subtitle="Edit public home page copy by section. Images and video stay in the codebase."
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-6xl mx-auto w-full">
            <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm max-w-2xl">
              Use the sidebar links to jump to each block. Changes apply to the marketing home page for visitors who are not logged in.
            </p>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={!canEdit || saving || !content || loading}
              className="shrink-0 inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>

          {loading ? (
            <div className="max-w-6xl mx-auto rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              Loading…
            </div>
          ) : content ? (
            <LandingPageContentEditor value={content} onChange={setContent} disabled={!canEdit} />
          ) : (
            <div className="max-w-6xl mx-auto rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Could not load content. Refresh the page or check your connection.
            </div>
          )}

          {!loading && content ? (
            <div className="max-w-6xl mx-auto mt-6 pb-8 flex justify-end lg:pr-0">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={!canEdit || saving}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg transition-opacity disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
