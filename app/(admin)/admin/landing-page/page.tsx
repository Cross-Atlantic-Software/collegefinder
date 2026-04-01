'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAdminLandingPageContent, updateAdminLandingPageContent } from '@/api/admin/landingPage';
import type { LandingPageContent } from '@/types/landingPage';
import { useToast } from '@/components/shared';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

export default function AdminLandingPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { canEdit } = useAdminPermissions();
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

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
          setJsonText(JSON.stringify(res.data.content, null, 2));
        } else {
          showError(res.message || 'Failed to load landing page content');
        }
      } catch (e) {
        showError('Failed to load landing page content');
      } finally {
        setLoading(false);
      }
    })();
  }, [router, showError]);

  const handleSave = async () => {
    setParseError(null);
    let parsed: LandingPageContent;
    try {
      parsed = JSON.parse(jsonText) as LandingPageContent;
    } catch {
      setParseError('Invalid JSON. Fix syntax and try again.');
      return;
    }

    setSaving(true);
    try {
      const res = await updateAdminLandingPageContent(parsed);
      if (res.success && res.data?.content) {
        setJsonText(JSON.stringify(res.data.content, null, 2));
        showSuccess('Landing page content saved');
      } else {
        showError(res.message || 'Save failed');
      }
    } catch (e) {
      showError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FA]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Landing page (home)" />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <p className="text-sm text-slate-600 mb-4 max-w-3xl">
            Edit all public home page text (hero, sections, FAQ). Images and video files stay in the codebase.
            Save valid JSON matching the structure returned by GET (nested <code className="bg-slate-100 px-1 rounded">hero</code>,{' '}
            <code className="bg-slate-100 px-1 rounded">info</code>, <code className="bg-slate-100 px-1 rounded">features</code>, etc.).
          </p>

          {loading ? (
            <p className="text-slate-500">Loading…</p>
          ) : (
            <>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                spellCheck={false}
                className="w-full min-h-[70vh] font-mono text-xs md:text-sm border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                disabled={!canEdit}
              />
              {parseError && <p className="mt-2 text-sm text-red-600">{parseError}</p>}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={!canEdit || saving}
                  className="px-4 py-2 rounded-lg bg-[#341050] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
