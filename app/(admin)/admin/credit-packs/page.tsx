'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiPackage, FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  listPacks,
  createPack,
  updatePack,
  deletePack,
  type CreditPackAdmin,
  type CreditPackInput,
} from '@/api/admin/credits';
import { canEdit, canDelete } from '@/lib/adminPermissions';
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

const EMPTY_FORM: CreditPackInput = { name: '', credits: 1, price_inr: 0, is_active: true, sort_order: 0 };

function PackModal({
  initial,
  onClose,
  onSave,
}: {
  initial: (CreditPackInput & { id?: number }) | null;
  onClose: () => void;
  onSave: (form: CreditPackInput, id?: number) => Promise<void>;
}) {
  const [form, setForm] = useState<CreditPackInput>(initial ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!form.name.trim()) { setErr('Name is required'); return; }
    if (form.credits < 1) { setErr('Credits must be at least 1'); return; }
    if (form.price_inr < 0) { setErr('Price cannot be negative'); return; }
    setSaving(true);
    setErr(null);
    try {
      await onSave(form, initial?.id);
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-semibold text-slate-900">{initial?.id ? 'Edit pack' : 'New pack'}</p>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Close"><FiX /></button>
        </div>
        <div className="space-y-3 px-5 py-4">
          {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Credits</span>
              <input
                type="number" min={1}
                value={form.credits}
                onChange={(e) => setForm({ ...form, credits: parseInt(e.target.value, 10) || 0 })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Price (₹, all-in)</span>
              <input
                type="number" min={0} step="0.01"
                value={form.price_inr}
                onChange={(e) => setForm({ ...form, price_inr: Number(e.target.value) || 0 })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Sort order</span>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <span className="text-sm text-slate-700">Active</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-[#FAD53C] hover:bg-slate-800 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCreditPacksPage() {
  const role = useAdminRole();
  const editable = canEdit(role);
  const deletable = canDelete(role);

  const [packs, setPacks] = useState<CreditPackAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<(CreditPackInput & { id?: number }) | null | undefined>(undefined);
  // undefined = closed, null = new, object = edit

  const fetchPacks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await listPacks();
    if (!res.success || !res.data) setError(res.message || 'Failed to load packs');
    else setPacks(res.data);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchPacks(); }, [fetchPacks]);

  const handleSave = async (form: CreditPackInput, id?: number) => {
    const res = id ? await updatePack(id, form) : await createPack(form);
    if (!res.success) throw new Error(res.message || 'Save failed');
    await fetchPacks();
  };

  const handleDelete = async (pack: CreditPackAdmin) => {
    if (!confirm(`Delete pack "${pack.name}"? This cannot be undone.`)) return;
    const res = await deletePack(pack.id);
    if (!res.success) { alert(res.message || 'Delete failed'); return; }
    await fetchPacks();
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Credit Packs</h1>
              <p className="text-sm text-slate-500">Packs students can buy. Price is the all-in amount; GST is computed from Payment Settings.</p>
            </div>
            {editable && (
              <button onClick={() => setModal(null)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-[#FAD53C] hover:bg-slate-800">
                <FiPlus /> New pack
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {isLoading && <p className="p-6 text-center text-sm text-slate-500">Loading packs…</p>}
            {error && <p className="p-6 text-center text-sm text-rose-600">{error}</p>}
            {!isLoading && !error && packs.length === 0 && (
              <div className="flex flex-col items-center gap-2 p-10 text-center">
                <FiPackage className="text-2xl text-slate-300" />
                <p className="text-sm text-slate-500">No packs yet.</p>
              </div>
            )}
            {!isLoading && !error && packs.length > 0 && (
              <table className="w-full">
                <thead className="bg-[#F6F8FA] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">NAME</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">CREDITS</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">PRICE (₹)</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">STATUS</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">ORDER</th>
                    {(editable || deletable) && <th className="px-4 py-2 text-right text-xs font-semibold text-slate-700">ACTIONS</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {packs.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{p.name}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-600">{p.credits}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-600">₹{Number(p.price_inr).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-600">{p.sort_order}</td>
                      {(editable || deletable) && (
                        <td className="px-4 py-2.5 text-right">
                          <div className="inline-flex gap-2">
                            {editable && (
                              <button
                                onClick={() => setModal({ id: p.id, name: p.name, credits: p.credits, price_inr: p.price_inr, is_active: p.is_active, sort_order: p.sort_order })}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                <FiEdit2 /> Edit
                              </button>
                            )}
                            {deletable && (
                              <button
                                onClick={() => handleDelete(p)}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                              >
                                <FiTrash2 /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {modal !== undefined && (
        <PackModal initial={modal} onClose={() => setModal(undefined)} onSave={handleSave} />
      )}
    </div>
  );
}
