'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getPaymentSettings,
  updatePaymentSettings,
  type GstMode,
  type PaymentSettings,
} from '@/api/admin/credits';
import { canEdit } from '@/lib/adminPermissions';
import type { AdminUserType } from '@/api/types';

function useAdminRole(): AdminUserType | undefined {
  const [type, setType] = useState<AdminUserType | undefined>(undefined);
  useEffect(() => {
    try {
      const s = localStorage.getItem('admin_user');
      if (s) setType(JSON.parse(s)?.type);
    } catch { /* ignore */ }
  }, []);
  return type;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Mirrors backend gstMath.computeGst — for the admin live preview only. */
function previewGst(price: number, mode: GstMode, percent: number) {
  const p = Number(price);
  if (mode === 'exclusive') {
    const base = round2(p);
    const gst = round2(p * (percent / 100));
    return { base, gst, total: round2(base + gst) };
  }
  const base = round2(p / (1 + percent / 100));
  const gst = round2(p - base);
  return { base, gst, total: round2(p) };
}

const PREVIEW_PRICE = 49;
const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminPaymentSettingsPage() {
  const role = useAdminRole();
  const editable = canEdit(role);

  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [mode, setMode] = useState<GstMode>('inclusive');
  const [percent, setPercent] = useState<number>(18);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await getPaymentSettings();
    if (!res.success || !res.data) {
      setError(res.message || 'Failed to load settings');
    } else {
      setSettings(res.data);
      setMode(res.data.gst_mode);
      setPercent(Number(res.data.gst_percent));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const dirty = settings && (mode !== settings.gst_mode || percent !== Number(settings.gst_percent));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSavedAt(null);
    const res = await updatePaymentSettings({ gst_mode: mode, gst_percent: percent });
    if (!res.success || !res.data) {
      setError(res.message || 'Save failed');
    } else {
      setSettings(res.data);
      setMode(res.data.gst_mode);
      setPercent(Number(res.data.gst_percent));
      setSavedAt(new Date().toLocaleTimeString());
    }
    setSaving(false);
  };

  const preview = previewGst(PREVIEW_PRICE, mode, percent);

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-4">
            <h1 className="text-lg font-semibold text-slate-900">Payment Settings</h1>
            <p className="text-sm text-slate-500">Global GST treatment applied to every credit pack price.</p>
          </div>

          {isLoading && <p className="p-6 text-center text-sm text-slate-500">Loading settings…</p>}
          {error && <p className="mb-3 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          {!isLoading && settings && (
            <div className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="mb-3 text-sm font-semibold text-slate-900">GST</p>

                <label className="block text-xs font-medium text-slate-600">Mode</label>
                <div className="mt-1 flex gap-2">
                  {(['inclusive', 'exclusive'] as GstMode[]).map((m) => (
                    <button
                      key={m}
                      disabled={!editable}
                      onClick={() => setMode(m)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                        mode === m
                          ? 'border-slate-900 bg-slate-900 text-[#FAD53C]'
                          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  {mode === 'inclusive'
                    ? 'Pack price already includes GST (backed out for the invoice).'
                    : 'GST is added on top of the pack price.'}
                </p>

                <label className="mt-4 block text-xs font-medium text-slate-600">GST %</label>
                <input
                  type="number" min={0} max={100} step="0.01"
                  disabled={!editable}
                  value={percent}
                  onChange={(e) => setPercent(Number(e.target.value) || 0)}
                  className="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
                />

                {editable && (
                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving || !dirty}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-[#FAD53C] hover:bg-slate-800 disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Save settings'}
                    </button>
                    {savedAt && <span className="text-xs text-emerald-600">Saved at {savedAt}</span>}
                  </div>
                )}
                {!editable && (
                  <p className="mt-5 text-xs text-slate-500">You have read-only access to these settings.</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="mb-1 text-sm font-semibold text-slate-900">Live preview</p>
                <p className="mb-3 text-[11px] text-slate-500">A ₹{PREVIEW_PRICE} pack with the settings on the left:</p>
                <div className="rounded-xl border border-slate-200">
                  <div className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-slate-500">Base</span>
                    <span className="text-slate-800">{fmt(preview.base)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 px-4 py-2 text-sm">
                    <span className="text-slate-500">GST ({percent}% · {mode})</span>
                    <span className="text-slate-800">{fmt(preview.gst)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 px-4 py-2 text-sm font-semibold">
                    <span className="text-slate-900">Total charged</span>
                    <span className="text-slate-900">{fmt(preview.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
