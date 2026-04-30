'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllRecommendedMappings,
  downloadRecommendedMappingTemplate,
  bulkUploadRecommendedMappings,
  type StreamInterestRecommendedMapping,
} from '@/api/admin/recommended-mappings';
import { FiDownload, FiUpload } from 'react-icons/fi';
import { useToast } from '@/components/shared';

export default function RecommendedExamsMappingPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [mappings, setMappings] = useState<StreamInterestRecommendedMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    upserted: number;
    errors: number;
    errorDetails: { row: number; message: string }[];
  } | null>(null);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    try {
      setIsLoading(true);
      const res = await getAllRecommendedMappings();
      if (res.success && res.data) {
        setMappings(res.data.mappings);
      } else {
        showError(res.message || 'Failed to load mappings');
      }
    } catch (e) {
      showError('Failed to load mappings');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadRecommendedMappingTemplate();
      showSuccess('Template download started');
    } catch (e) {
      showError('Could not download template');
      console.error(e);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showError('Choose an Excel file first');
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const res = await bulkUploadRecommendedMappings(file);
      if (res.success && res.data) {
        setResult({
          upserted: res.data.upserted,
          errors: res.data.errors,
          errorDetails: res.data.errorDetails,
        });
        showSuccess(res.message || 'Upload finished');
        setFile(null);
        await load();
      } else {
        showError(res.message || 'Upload failed');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader title="Recommended exams (stream + interest)" />
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Upload an Excel file with one row per <strong>stream + interest</strong> pair. Programs and
              exams are matched by <strong>name</strong> to your taxonomies. Multi-value columns use commas,
              semicolons, or new lines. Re-uploading the same pair <strong>replaces</strong> the previous
              program and exam lists.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleTemplate}
                disabled={downloadingTemplate}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <FiDownload className="h-4 w-4" />
                {downloadingTemplate ? 'Preparing…' : 'Download Excel template'}
              </button>
            </div>

            <form
              onSubmit={handleUpload}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Upload mapping</h2>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="block flex-1 text-sm">
                  <span className="mb-1 block text-slate-600 dark:text-slate-400">Excel file</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
                    className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-800 dark:file:bg-slate-800 dark:file:text-slate-200"
                  />
                </label>
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  <FiUpload className="h-4 w-4" />
                  {uploading ? 'Importing…' : 'Import'}
                </button>
              </div>
            </form>

            {result && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/50">
                <p>
                  Saved <strong>{result.upserted}</strong> row(s).{' '}
                  {result.errors > 0 && (
                    <>
                      <span className="text-amber-700 dark:text-amber-400">
                        {result.errors} row(s) had errors.
                      </span>
                    </>
                  )}
                </p>
                {result.errorDetails.length > 0 && (
                  <ul className="mt-2 max-h-40 list-inside list-disc space-y-1 overflow-y-auto text-slate-700 dark:text-slate-300">
                    {result.errorDetails.map((e) => (
                      <li key={`${e.row}-${e.message}`}>
                        Row {e.row}: {e.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Current mappings</h2>
              </div>
              {isLoading ? (
                <p className="p-4 text-sm text-slate-500">Loading…</p>
              ) : mappings.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No mappings yet. Import an Excel file to add rows.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                      <tr>
                        <th className="px-3 py-2">Stream</th>
                        <th className="px-3 py-2">Interest</th>
                        <th className="px-3 py-2">Programs</th>
                        <th className="px-3 py-2">Exams</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappings.map((m) => (
                        <tr
                          key={m.id}
                          className="border-t border-slate-100 dark:border-slate-800/80"
                        >
                          <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{m.stream_name}</td>
                          <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{m.interest_label}</td>
                          <td className="max-w-xs px-3 py-2 text-slate-600 dark:text-slate-400">
                            {m.program_names || '—'}
                          </td>
                          <td className="max-w-xs px-3 py-2 text-slate-600 dark:text-slate-400">
                            {m.exam_names || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
