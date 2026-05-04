'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllTestimonialsAdmin,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  uploadTestimonialProfileImage,
  type TestimonialAdmin,
} from '@/api';
import { FiPlus, FiTrash2, FiUpload, FiX } from 'react-icons/fi';
import Image from 'next/image';
import { AdminTableActions } from '@/components/admin/AdminTableActions';
import { ConfirmationModal, useToast, Select, type SelectOption } from '@/components/shared';

const RATING_OPTIONS: SelectOption[] = [1, 2, 3, 4, 5].map((n) => ({
  value: String(n),
  label: `${n} / 5`,
}));

export default function TestimonialsAdminPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [rows, setRows] = useState<TestimonialAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TestimonialAdmin | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    body: '',
    rating: '5',
    sort_order: '0',
    is_active: true,
    profileImageUrl: '',
  });
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!localStorage.getItem('admin_token')) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getAllTestimonialsAdmin();
      if (res.success && res.data?.testimonials) {
        setRows(res.data.testimonials);
      } else {
        setError(res.message || 'Failed to load');
      }
    } catch {
      setError('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ok = localStorage.getItem('admin_authenticated');
    const token = localStorage.getItem('admin_token');
    if (!ok || !token) {
      router.replace('/admin/login');
      return;
    }
    void load();
  }, [router, load]);

  const resetForm = () => {
    setForm({
      name: '',
      body: '',
      rating: '5',
      sort_order: '0',
      is_active: true,
      profileImageUrl: '',
    });
    setRemoveProfileImage(false);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (t: TestimonialAdmin) => {
    setEditing(t);
    setForm({
      name: t.name,
      body: t.body,
      rating: String(t.rating),
      sort_order: String(t.sort_order ?? 0),
      is_active: t.is_active !== false,
      profileImageUrl: t.profile_image_url || '',
    });
    setRemoveProfileImage(false);
    setShowModal(true);
  };

  const handleProfileFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Please choose an image file.');
      return;
    }
    try {
      setUploadingImage(true);
      setRemoveProfileImage(false);
      const res = await uploadTestimonialProfileImage(file);
      if (res.success && res.data?.imageUrl) {
        setForm((f) => ({ ...f, profileImageUrl: res.data!.imageUrl }));
        showSuccess('Profile image uploaded');
      } else {
        showError(res.message || 'Upload failed');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const body = form.body.trim();
    const rating = parseInt(form.rating, 10);
    const sort_order = parseInt(form.sort_order, 10) || 0;
    if (!name || !body) {
      showError('Name and testimonial text are required.');
      return;
    }
    if (rating < 1 || rating > 5) {
      showError('Rating must be 1–5.');
      return;
    }

    try {
      setSaving(true);
      if (editing) {
        const res = await updateTestimonial(editing.id, {
          name,
          body,
          rating,
          sort_order,
          is_active: form.is_active,
          profile_image_url: removeProfileImage
            ? null
            : form.profileImageUrl
              ? form.profileImageUrl
              : null,
        });
        if (res.success) {
          showSuccess('Testimonial updated');
          setShowModal(false);
          resetForm();
          void load();
        } else {
          showError(res.message || 'Update failed');
        }
      } else {
        const res = await createTestimonial({
          name,
          body,
          rating,
          sort_order,
          is_active: form.is_active,
          profile_image_url: form.profileImageUrl || null,
        });
        if (res.success) {
          showSuccess('Testimonial created');
          setShowModal(false);
          resetForm();
          void load();
        } else {
          showError(res.message || 'Create failed');
        }
      }
    } catch {
      showError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      const res = await deleteTestimonial(deletingId);
      if (res.success) {
        showSuccess('Deleted');
        setShowDelete(false);
        setDeletingId(null);
        void load();
      } else {
        showError(res.message || 'Delete failed');
      }
    } catch {
      showError('Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  if (error && !loading && rows.length === 0) {
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Testimonials</h1>
              <p className="text-sm text-slate-600">
                Shown on the home page before FAQ. Order uses sort order (lower first).
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#341050] text-white rounded-lg hover:opacity-90"
            >
              <FiPlus className="h-4 w-4" />
              Add testimonial
            </button>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F6F8FA] border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Order</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Photo</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Text</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Rating</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Active</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                          No testimonials yet. Add one to show on the landing page.
                        </td>
                      </tr>
                    ) : (
                      rows.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/80">
                          <td className="px-3 py-2 text-slate-600">{t.sort_order}</td>
                          <td className="px-3 py-2">
                            {t.profile_image_url ? (
                              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200">
                                <Image
                                  src={t.profile_image_url}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-900">{t.name}</td>
                          <td className="px-3 py-2 text-slate-600 max-w-md truncate">{t.body}</td>
                          <td className="px-3 py-2">{t.rating} / 5</td>
                          <td className="px-3 py-2">
                            <span
                              className={
                                t.is_active !== false
                                  ? 'text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs'
                                  : 'text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-xs'
                              }
                            >
                              {t.is_active !== false ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <AdminTableActions
                              onEdit={() => openEdit(t)}
                              onDelete={() => {
                                setDeletingId(t.id);
                                setShowDelete(true);
                              }}
                            />
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50">
              <h2 className="text-lg font-bold">{editing ? 'Edit testimonial' : 'New testimonial'}</h2>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-slate-500 hover:text-slate-800"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-auto p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    placeholder="Student or parent name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Profile photo (optional)</label>
                  <p className="text-xs text-slate-500 mb-2">Shown next to their name on the home page.</p>
                  {form.profileImageUrl && !removeProfileImage ? (
                    <div className="flex items-center gap-3">
                      <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200">
                        <Image
                          src={form.profileImageUrl}
                          alt="Profile"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="inline-flex items-center gap-1.5 px-2 py-1 text-xs border border-slate-300 rounded cursor-pointer hover:bg-slate-50 w-fit">
                          <FiUpload className="h-3.5 w-3.5" />
                          Replace
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleProfileFile}
                            disabled={uploadingImage}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setRemoveProfileImage(true);
                            setForm((f) => ({ ...f, profileImageUrl: '' }));
                          }}
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 w-fit">
                      <FiUpload className="h-4 w-4" />
                      {uploadingImage ? 'Uploading…' : 'Upload image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileFile}
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">What they say about Unitracko</label>
                  <textarea
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    rows={5}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg resize-none"
                    placeholder="Their testimonial…"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Rating</label>
                    <Select
                      options={RATING_OPTIONS}
                      value={form.rating}
                      onChange={(v) => setForm({ ...form, rating: v || '5' })}
                      placeholder="Rating"
                      isClearable={false}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Sort order</label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Visible on landing page</span>
                </label>
              </div>
              <div className="border-t border-slate-200 px-4 py-3 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-3 py-1.5 text-sm bg-[#341050] text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDelete}
        onClose={() => {
          setShowDelete(false);
          setDeletingId(null);
        }}
        onConfirm={confirmDelete}
        title="Delete testimonial"
        message="Remove this testimonial from the site?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
