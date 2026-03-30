'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { searchStudent, submitCounsellorResults, updateCounsellorResults, downloadCounsellorBulkTemplate, downloadAllCounsellorExcel, bulkUploadCounsellorResults, uploadCounsellorReportPdfs } from '@/api/admin/counsellor';
import type { StudentSearchResult } from '@/api/admin/counsellor';
import type { StrengthResultData } from '@/api/strength';
import { getAllExpertsAdmin } from '@/api/admin/experts';
import type { AdmissionExpert } from '@/api/experts';
import { FiSearch, FiUpload, FiSave, FiUser, FiDownload, FiX, FiFileText } from 'react-icons/fi';
import { useToast, MultiSelect } from '@/components/shared';
import Image from 'next/image';

export default function CounsellorPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [searchId, setSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [studentData, setStudentData] = useState<StudentSearchResult | null>(null);
  const [strengths, setStrengths] = useState<string[]>(['', '', '', '', '']);
  const [careers, setCareers] = useState<{ career: string; details: string }[]>(
    Array.from({ length: 5 }, () => ({ career: '', details: '' }))
  );
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [experts, setExperts] = useState<AdmissionExpert[]>([]);
  const [assignedExpertIds, setAssignedExpertIds] = useState<string[]>([]);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkExcelFile, setBulkExcelFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    created: number;
    createdResults: { id: number; user_id: number; student_name: string }[];
    errors: number;
    errorDetails: { row: number; message: string }[];
    reportsAdded?: number;
  } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkReportsZip, setBulkReportsZip] = useState<File | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const [showReportPdfsModal, setShowReportPdfsModal] = useState(false);
  const [reportPdfsZipFile, setReportPdfsZipFile] = useState<File | null>(null);
  const [reportPdfsUploading, setReportPdfsUploading] = useState(false);
  const [reportPdfsResult, setReportPdfsResult] = useState<{
    summary: { reportsAdded: number; filesSkipped: number; uploadErrors: number };
    updated: { user_id: number; report_file_name: string }[];
    skipped: string[];
    errors: { file: string; message: string }[];
  } | null>(null);
  const [reportPdfsError, setReportPdfsError] = useState<string | null>(null);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }
    const adminUser = localStorage.getItem('admin_user');
    if (adminUser) {
      try {
        const parsed = JSON.parse(adminUser);
        if (parsed.type !== 'counsellor' && parsed.type !== 'super_admin') {
          router.replace('/admin');
        }
      } catch (_) {}
    }
    loadExperts();
  }, [router]);

  const loadExperts = async () => {
    try {
      const res = await getAllExpertsAdmin();
      if (res.success && res.data) {
        setExperts(res.data.experts.filter((e) => e.is_active !== false));
      }
    } catch (_) {}
  };

  const handleSearch = async () => {
    const userId = parseInt(searchId, 10);
    if (isNaN(userId) || userId <= 0) {
      showError('Please enter a valid Student ID');
      return;
    }

    setSearching(true);
    setStudentData(null);
    try {
      const res = await searchStudent(userId);
      if (res.success && res.data) {
        setStudentData(res.data);
        if (res.data.existing_results) {
          populateFromResults(res.data.existing_results);
          setIsEditing(true);
        } else {
          resetForm();
          setIsEditing(false);
        }
      } else {
        showError(res.message || 'Student not found');
      }
    } catch (err) {
      showError('Failed to search student');
    } finally {
      setSearching(false);
    }
  };

  const populateFromResults = (results: StrengthResultData) => {
    const s = Array.isArray(results.strengths) ? results.strengths : [];
    setStrengths([...s, ...Array(5 - s.length).fill('')].slice(0, 5));

    const c = Array.isArray(results.career_recommendations) ? results.career_recommendations : [];
    const paddedCareers = [...c, ...Array(5 - c.length).fill({ career: '', details: '' })].slice(0, 5);
    setCareers(paddedCareers.map(item => ({ career: item.career || '', details: item.details || '' })));

    const ids = (results as { assigned_expert_ids?: number[]; assigned_expert_id?: number | null }).assigned_expert_ids;
    if (ids && Array.isArray(ids)) {
      setAssignedExpertIds(ids.map(String));
    } else {
      const single = (results as { assigned_expert_id?: number | null }).assigned_expert_id;
      setAssignedExpertIds(single != null ? [String(single)] : []);
    }
  };

  const resetForm = () => {
    setStrengths(['', '', '', '', '']);
    setCareers(Array.from({ length: 5 }, () => ({ career: '', details: '' })));
    setReportFile(null);
    setAssignedExpertIds([]);
  };

  const handleSave = async () => {
    if (!studentData) return;

    const filledStrengths = strengths.filter(s => s.trim());
    const filledCareers = careers.filter(c => c.career.trim());

    if (filledStrengths.length === 0) {
      showError('Please fill at least one strength');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('user_id', String(studentData.student.id));
      formData.append('strengths', JSON.stringify(filledStrengths));
      formData.append('career_recommendations', JSON.stringify(filledCareers));
      formData.append('assigned_expert_ids', JSON.stringify(assignedExpertIds.map(Number).filter(n => !isNaN(n))));
      if (reportFile) {
        formData.append('report', reportFile);
      }

      let res;
      if (isEditing) {
        res = await updateCounsellorResults(studentData.student.id, formData);
      } else {
        res = await submitCounsellorResults(formData);
      }

      if (res.success) {
        showSuccess(isEditing ? 'Results updated successfully' : 'Results saved successfully');
        setIsEditing(true);
      } else {
        showError(res.message || 'Failed to save results');
      }
    } catch (err) {
      showError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadCounsellorBulkTemplate();
      showSuccess('Template downloaded');
    } catch {
      showError('Failed to download template');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      await downloadAllCounsellorExcel();
      showSuccess('Excel downloaded');
    } catch {
      showError('Failed to download Excel');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkExcelFile) return;
    setBulkUploading(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const res = await bulkUploadCounsellorResults(bulkExcelFile, bulkReportsZip || undefined);
      if (res.success && res.data) {
        setBulkResult(res.data);
        showSuccess(res.message || `Created/updated ${res.data.created} result(s)`);
        if (res.data.errors === 0) setShowBulkModal(false);
        else setBulkExcelFile(null);
      } else {
        setBulkError(res.message || 'Bulk upload failed');
      }
    } catch {
      setBulkError('Bulk upload failed');
      showError('Bulk upload failed');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleUploadReportPdfs = async () => {
    if (!reportPdfsZipFile) return;
    setReportPdfsUploading(true);
    setReportPdfsError(null);
    setReportPdfsResult(null);
    try {
      const res = await uploadCounsellorReportPdfs(reportPdfsZipFile);
      if (res.success && res.data) {
        setReportPdfsResult(res.data);
        showSuccess(res.message || 'Report PDFs attached');
      } else {
        setReportPdfsError(res.message || 'Upload failed');
      }
    } catch {
      setReportPdfsError('Upload failed');
      showError('Upload failed');
    } finally {
      setReportPdfsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-slate-900 mb-1">Counsellor Panel</h1>
            <p className="text-sm text-slate-600">Look up students and enter strength analysis results.</p>
          </div>

          {/* Bulk upload controls */}
          <div className="mb-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowBulkModal(true);
                setBulkResult(null);
                setBulkError(null);
                setBulkExcelFile(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-[#F6F8FA] transition-colors"
            >
              <FiUpload className="h-4 w-4" />
              Bulk upload (Excel)
            </button>
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={downloadingExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-[#F6F8FA] transition-colors disabled:opacity-50"
            >
              <FiDownload className="h-4 w-4" />
              {downloadingExcel ? 'Downloading...' : 'Download Excel'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReportPdfsModal(true);
                setReportPdfsZipFile(null);
                setReportPdfsResult(null);
                setReportPdfsError(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-[#F6F8FA] transition-colors"
            >
              <FiFileText className="h-4 w-4" />
              Upload report PDFs
            </button>
          </div>

          <div className="max-w-4xl space-y-6">
            {/* Search card */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-[#F6F8FA]/80">
                  <h2 className="text-xs font-semibold text-slate-800">Find student</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Enter the student’s user ID to load their details and add or edit strength results.</p>
                </div>
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                      <input
                        type="number"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="e.g. 42"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none transition-all"
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      disabled={searching || !searchId.trim()}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#341050] hover:bg-[#2a0c40] rounded-lg shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {searching ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <FiSearch className="w-4 h-4" />
                          Search
                        </>
                      )}
                    </button>
                  </div>
                  {!studentData && !searching && (
                    <p className="text-xs text-slate-400 mt-3">Press Enter or click Search after entering an ID.</p>
                )}
              </div>
            </div>

            {/* Student info & form (only when a student is loaded) */}
            {studentData && (
              <>
                {/* Student details card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#341050]/10 text-[#341050]">
                        <FiUser className="w-4 h-4" />
                      </span>
                      Student details
                    </h2>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        studentData.payment_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {studentData.payment_status === 'paid' ? 'Paid' : 'Not paid'}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row gap-5">
                      <div className="shrink-0">
                        <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center ring-2 ring-slate-200">
                          {studentData.student.profile_photo ? (
                            <Image
                              src={studentData.student.profile_photo}
                              alt={studentData.student.name}
                              width={80}
                              height={80}
                              className="object-cover w-full h-full"
                              unoptimized
                            />
                          ) : (
                            <FiUser className="w-10 h-10 text-slate-400" />
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 min-w-0 flex-1">
                        <InfoRow label="ID" value={String(studentData.student.id)} />
                        <InfoRow label="Name" value={studentData.student.name} />
                        <InfoRow label="Email" value={studentData.student.email} />
                        <InfoRow label="Phone" value={studentData.student.phone} />
                        <InfoRow label="Class" value={studentData.student.class_info} />
                        <InfoRow label="School" value={studentData.student.school} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results form card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 bg-[#F6F8FA]/80">
                    <h2 className="text-sm font-semibold text-slate-800">
                      {isEditing ? 'Edit strength results' : 'Enter strength results'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Fill in strengths, career recommendations, and optionally attach the full report.</p>
                  </div>
                  <div className="p-5 space-y-6">
                    {/* Assign consultants (multiselect) */}
                    <section>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Assign consultant (Strength Masters CRM)
                      </label>
                      <MultiSelect
                        options={experts.map((ex) => ({
                          value: String(ex.id),
                          label: `${ex.name}${ex.type ? ` · ${ex.type.replace(/_/g, ' ')}` : ''}`,
                        }))}
                        value={assignedExpertIds.length ? assignedExpertIds : null}
                        onChange={(values) => setAssignedExpertIds(values || [])}
                        placeholder="None"
                        className="max-w-md"
                      />
                    </section>

                    {/* Top 5 Strengths */}
                    <section>
                      <h3 className="text-sm font-medium text-slate-700 mb-3">Top 5 strengths</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {strengths.map((s, idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={s}
                            onChange={(e) => {
                              const next = [...strengths];
                              next[idx] = e.target.value;
                              setStrengths(next);
                            }}
                            placeholder={`Strength ${idx + 1}`}
                            className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                          />
                        ))}
                      </div>
                    </section>

                    {/* Career recommendations */}
                    <section>
                      <h3 className="text-sm font-medium text-slate-700 mb-3">Career recommendations</h3>
                      <div className="space-y-3">
                        {careers.map((c, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={c.career}
                              onChange={(e) => {
                                const next = [...careers];
                                next[idx] = { ...next[idx], career: e.target.value };
                                setCareers(next);
                              }}
                              placeholder={`Career ${idx + 1}`}
                              className="sm:w-56 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none shrink-0"
                            />
                            <input
                              type="text"
                              value={c.details}
                              onChange={(e) => {
                                const next = [...careers];
                                next[idx] = { ...next[idx], details: e.target.value };
                                setCareers(next);
                              }}
                              placeholder="Details"
                              className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* PDF upload */}
                    <section>
                      <h3 className="text-sm font-medium text-slate-700 mb-2">Full report (PDF)</h3>
                      <label className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#341050]/40 hover:bg-[#341050]/5 cursor-pointer transition-colors">
                        <FiUpload className="w-5 h-5 text-slate-400 shrink-0" />
                        <span className="text-sm text-slate-600">
                          {reportFile ? reportFile.name : 'Choose file or drag PDF here'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                      {studentData.existing_results?.report_url && !reportFile && (
                        <p className="text-xs text-emerald-600 mt-2">A report is already uploaded for this student.</p>
                      )}
                    </section>

                    {/* Save */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#341050] hover:bg-[#2a0c40] rounded-lg shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FiSave className="w-4 h-4" />
                            {isEditing ? 'Update results' : 'Save results'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Bulk upload strength results</h2>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkExcelFile(null);
                  setBulkReportsZip(null);
                  setBulkResult(null);
                  setBulkError(null);
                }}
                className="text-slate-500 hover:text-slate-800 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <p className="text-xs text-slate-600">
                Upload an Excel file with columns: user_id, strengths (1-5), career recommendations (1-5), assigned_consultant_names, report_file_name (e.g. 123.pdf). Optionally attach a ZIP of report PDFs—file names in the ZIP must match report_file_name in the Excel. You can also upload report PDFs later via &quot;Upload report PDFs&quot;.
              </p>
              <div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-[#F6F8FA] disabled:opacity-50"
                >
                  <FiDownload className="h-4 w-4" />
                  {downloadingTemplate ? 'Downloading...' : 'Download template'}
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Excel file</label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#341050]/40 hover:bg-[#341050]/5 cursor-pointer transition-colors">
                  <FiUpload className="w-5 h-5 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600">
                    {bulkExcelFile ? bulkExcelFile.name : 'Choose .xlsx or .xls file'}
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setBulkExcelFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Report PDFs (ZIP) <span className="text-slate-500 font-normal">optional</span></label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#341050]/40 hover:bg-[#341050]/5 cursor-pointer transition-colors">
                  <FiFileText className="w-5 h-5 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600">
                    {bulkReportsZip ? bulkReportsZip.name : 'Choose .zip (PDFs named to match report_file_name)'}
                  </span>
                  <input
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    onChange={(e) => setBulkReportsZip(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
              {bulkError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
                  {bulkError}
                </div>
              )}
              {bulkResult && (
                <div className="bg-[#F6F8FA] border border-slate-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-green-700">Created/updated: {bulkResult.created}</p>
                  {bulkResult.reportsAdded != null && bulkResult.reportsAdded > 0 && (
                    <p className="text-green-700 mt-1">Report PDFs attached: {bulkResult.reportsAdded}</p>
                  )}
                  {bulkResult.errors > 0 && (
                    <p className="text-amber-700 mt-1">Errors: {bulkResult.errors} row(s)</p>
                  )}
                  {bulkResult.errorDetails && bulkResult.errorDetails.length > 0 && (
                    <ul className="mt-2 text-xs text-slate-600 max-h-32 overflow-auto">
                      {bulkResult.errorDetails.map((err, i) => (
                        <li key={i}>
                          Row {err.row}: {err.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="border-t border-slate-200 px-4 py-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkExcelFile(null);
                  setBulkReportsZip(null);
                  setBulkResult(null);
                  setBulkError(null);
                }}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-[#F6F8FA]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleBulkUpload}
                disabled={!bulkExcelFile || bulkUploading}
                className="px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload report PDFs modal */}
      {showReportPdfsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Upload report PDFs</h2>
              <button
                onClick={() => {
                  setShowReportPdfsModal(false);
                  setReportPdfsZipFile(null);
                  setReportPdfsResult(null);
                  setReportPdfsError(null);
                }}
                className="text-slate-500 hover:text-slate-800 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <p className="text-xs text-slate-600">
                Upload a ZIP containing report PDFs. File names inside the ZIP must match the <strong>report_file_name</strong> stored for each strength result (e.g. 123.pdf). Use the bulk Excel template with report_file_name column, then upload the ZIP here or together with the Excel.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">ZIP file</label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#341050]/40 hover:bg-[#341050]/5 cursor-pointer transition-colors">
                  <FiFileText className="w-5 h-5 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600">
                    {reportPdfsZipFile ? reportPdfsZipFile.name : 'Choose .zip file'}
                  </span>
                  <input
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    onChange={(e) => {
                      setReportPdfsZipFile(e.target.files?.[0] || null);
                      setReportPdfsResult(null);
                      setReportPdfsError(null);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              {reportPdfsError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
                  {reportPdfsError}
                </div>
              )}
              {reportPdfsResult && (
                <div className="bg-[#F6F8FA] border border-slate-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-green-700">Reports attached: {reportPdfsResult.summary.reportsAdded}</p>
                  {reportPdfsResult.summary.filesSkipped > 0 && (
                    <p className="text-amber-700 mt-1">Files skipped (no matching report_file_name): {reportPdfsResult.summary.filesSkipped}</p>
                  )}
                  {reportPdfsResult.summary.uploadErrors > 0 && (
                    <p className="text-red-700 mt-1">Errors: {reportPdfsResult.summary.uploadErrors}</p>
                  )}
                </div>
              )}
            </div>
            <div className="border-t border-slate-200 px-4 py-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowReportPdfsModal(false);
                  setReportPdfsZipFile(null);
                  setReportPdfsResult(null);
                  setReportPdfsError(null);
                }}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-[#F6F8FA]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleUploadReportPdfs}
                disabled={!reportPdfsZipFile || reportPdfsUploading}
                className="px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reportPdfsUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className="text-sm font-medium text-slate-900 truncate">{value || '—'}</span>
    </div>
  );
}
