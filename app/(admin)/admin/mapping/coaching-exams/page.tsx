'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllCoachingExamsMappings,
  downloadCoachingExamsMappingTemplate,
  downloadCoachingExamsMappingsExcel,
  bulkUploadCoachingExamsMappings,
  deleteCoachingExamsMapping,
  deleteAllCoachingExamsMappings,
  type CoachingExamsMappingRow,
} from '@/api/admin/coaching-exams-mappings';
import MappingExcelDownloadButton from '@/components/admin/mapping/MappingExcelDownloadButton';
import { AdminListPagination } from '@/components/admin/AdminListPagination';
import { FiDownload, FiTrash2, FiUpload } from 'react-icons/fi';
import { useToast } from '@/components/shared';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

const MAPPING_LIST_PAGE_SIZE = 10;

export default function CoachingExamsMappingPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { canDownloadExcel } = useAdminPermissions();
  const [mappings, setMappings] = useState<CoachingExamsMappingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [downloadingMappingExcel, setDownloadingMappingExcel] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    upserted: number;
    errors: number;
    errorDetails: { row: number; message: string }[];
  } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [listPage, setListPage] = useState(1);

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
      const res = await getAllCoachingExamsMappings();
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
      await downloadCoachingExamsMappingTemplate();
      showSuccess('Template download started');
    } catch (e) {
      showError('Could not download template');
      console.error(e);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleDownloadMappingExcel = async () => {
    setDownloadingMappingExcel(true);
    try {
      await downloadCoachingExamsMappingsExcel();
      showSuccess('Mapping Excel download started');
    } catch (e) {
      showError('Could not download mapping Excel');
      console.error(e);
    } finally {
      setDownloadingMappingExcel(false);
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
      const res = await bulkUploadCoachingExamsMappings(file);
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

  const handleDeleteRow = async (m: CoachingExamsMappingRow) => {
    if (
      !window.confirm(
        `Clear exam links for this institute?\n\n${m.institute_cityname}\n\nThis removes coaching exams and specialization exams for that institute. This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingId(m.id);
    try {
      const res = await deleteCoachingExamsMapping(m.id);
      if (res.success) {
        showSuccess(res.message || 'Mapping cleared');
        await load();
      } else {
        showError(res.message || 'Delete failed');
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (
      !window.confirm(
        'Delete ALL coaching exam links?\n\nEvery row in institute_exams and institute_exam_specialization will be removed. This cannot be undone.',
      )
    ) {
      return;
    }
    setDeletingAll(true);
    try {
      const res = await deleteAllCoachingExamsMappings();
      if (res.success) {
        showSuccess(res.message || 'All links deleted');
        await load();
      } else {
        showError(res.message || 'Delete failed');
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeletingAll(false);
    }
  };

  const mappingTotalPages = Math.max(1, Math.ceil(mappings.length / MAPPING_LIST_PAGE_SIZE));
  useEffect(() => {
    if (listPage > mappingTotalPages) setListPage(mappingTotalPages);
  }, [mappings.length, mappingTotalPages, listPage]);

  const paginatedMappings = useMemo(() => {
    const start = (listPage - 1) * MAPPING_LIST_PAGE_SIZE;
    return mappings.slice(start, start + MAPPING_LIST_PAGE_SIZE);
  }, [mappings, listPage]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader title="Coaching exams (institute)" />
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Upload an Excel file with one row per <strong>institute_cityname</strong> (must match an
              institute in your database). Columns: <strong>exams</strong> and{' '}
              <strong>specialization_exams</strong> are matched to the exams taxonomy by name. Multi-value
              columns use commas, semicolons, or new lines. Duplicate city names in one file:{' '}
              <strong>last row wins</strong>. Re-uploading replaces that institute&apos;s exam lists.
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
              {canDownloadExcel && (
                <MappingExcelDownloadButton
                  onClick={handleDownloadMappingExcel}
                  loading={downloadingMappingExcel}
                  disabled={downloadingTemplate}
                />
              )}
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
                    <span className="text-amber-700 dark:text-amber-400">
                      {result.errors} row(s) had errors.
                    </span>
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
              <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Current mappings</h2>
                {mappings.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    disabled={isLoading || deletingAll}
                    className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                    {deletingAll ? 'Deleting…' : 'Delete all'}
                  </button>
                )}
              </div>
              {isLoading ? (
                <p className="p-4 text-sm text-slate-500">Loading…</p>
              ) : mappings.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No institutes with city names found.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                        <tr>
                          <th className="px-3 py-2">Institute (city name)</th>
                          <th className="px-3 py-2">Exams</th>
                          <th className="px-3 py-2">Specialization exams</th>
                          <th className="px-3 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedMappings.map((m) => (
                          <tr
                            key={m.id}
                            className="border-t border-slate-100 dark:border-slate-800/80"
                          >
                            <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{m.institute_cityname}</td>
                            <td className="max-w-xs px-3 py-2 text-slate-600 dark:text-slate-400">
                              {m.exam_names || '—'}
                            </td>
                            <td className="max-w-xs px-3 py-2 text-slate-600 dark:text-slate-400">
                              {m.specialization_exam_names || '—'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(m)}
                                disabled={deletingId === m.id || deletingAll}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-slate-600 dark:text-red-400 dark:hover:bg-red-950/30"
                                title="Clear exams for this institute"
                              >
                                <FiTrash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <AdminListPagination
                    total={mappings.length}
                    page={listPage}
                    pageSize={MAPPING_LIST_PAGE_SIZE}
                    onPageChange={setListPage}
                    className="rounded-b-xl"
                  />
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
