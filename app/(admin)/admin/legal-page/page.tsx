"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import LegalPageEditor from "@/components/admin/legal-page/LegalPageEditor";
import { getAdminLegalDocument, updateAdminLegalDocument } from "@/api/admin/legalDocument";
import type { LegalDocument } from "@/types/legalDocument";
import bundledLegalDefaults from "@/data/legal-document.json";
import { useToast } from "@/components/shared";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";

export default function AdminLegalPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { canEdit } = useAdminPermissions();
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin_authenticated");
    const adminToken = localStorage.getItem("admin_token");
    if (!isAuthenticated || !adminToken) {
      router.replace("/admin/login");
      return;
    }

    (async () => {
      try {
        const res = await getAdminLegalDocument();
        if (res.success && res.data?.document) {
          setDocument(res.data.document);
        } else {
          const msg = res.message || "";
          const moduleDenied =
            msg.includes("Access to this module") || msg.includes("not allowed");
          if (!moduleDenied) {
            setDocument(bundledLegalDefaults as LegalDocument);
          }
          showError(
            moduleDenied
              ? "You need Landing page access to edit legal content. Ask a super admin to grant the Landing page module."
              : msg || "Could not load from server — showing bundled defaults until the API responds.",
          );
        }
      } catch {
        setDocument(bundledLegalDefaults as LegalDocument);
        showError("Could not reach the server — showing bundled defaults. Check that the API is running.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleSave = async () => {
    if (!document) return;
    setSaving(true);
    try {
      const res = await updateAdminLegalDocument(document);
      if (res.success && res.data?.document) {
        setDocument(res.data.document);
        showSuccess("Legal page saved — live site updated.");
      } else {
        showError(res.message || "Save failed");
      }
    } catch {
      showError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FA]">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader
          title="Legal page"
          subtitle="Privacy, terms, cookies, refunds — rich text for /legal. Same permission as Landing page."
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto mb-4 flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-600 shadow-sm">
              Use <strong>Bold</strong>, headings, and bullet or numbered lists from the toolbar.
              Visitors see changes immediately after save (refresh the public page).
            </p>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={!canEdit || saving || !document || loading}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#341050] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#2a0c40] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Publish changes"}
            </button>
          </div>

          {loading ? (
            <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
              Loading editor…
            </div>
          ) : document ? (
            <LegalPageEditor value={document} onChange={setDocument} disabled={!canEdit} />
          ) : (
            <div className="mx-auto max-w-5xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Could not load content. If your role should include this screen, ask a super admin for{" "}
              <strong>Landing page</strong> module access, or run the DB migration for{" "}
              <code className="rounded bg-red-100 px-1">legal_page_content</code> and restart the API.
            </div>
          )}

          {!loading && document ? (
            <div className="mx-auto mt-8 flex max-w-5xl justify-end pb-10">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={!canEdit || saving}
                className="inline-flex items-center justify-center rounded-xl bg-[#341050] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#2a0c40] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Publish changes"}
              </button>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
