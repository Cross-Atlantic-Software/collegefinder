'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllLoanProvidersAdmin,
  getLoanProviderById,
  createLoanProvider,
  updateLoanProvider,
  deleteLoanProvider,
  uploadLoanProviderLogo,
  downloadLoanProvidersBulkTemplate,
  downloadAllDataExcel,
  bulkUploadLoanProviders,
  uploadMissingLogosLoanProviders,
  deleteAllLoanProviders,
  type LoanProvider,
  type LoanDisbursementStep,
  type LoanEligibleCountry,
  type LoanEligibleCourseType,
} from '@/api/admin/loans';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiUpload, FiDownload, FiEye, FiBarChart } from 'react-icons/fi';
import { ConfirmationModal, useToast } from '@/components/shared';
import { AdminTableActions } from '@/components/admin/AdminTableActions';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import Image from 'next/image';

type FormTab = 'basic' | 'disbursement' | 'countries' | 'courseTypes';

export default function LoansPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [providers, setProviders] = useState<LoanProvider[]>([]);
  const [allProviders, setAllProviders] = useState<LoanProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<LoanProvider | null>(null);
  const [viewingData, setViewingData] = useState<{
    loanProvider: LoanProvider;
    disbursementProcess: LoanDisbursementStep[];
    eligibleCountries: LoanEligibleCountry[];
    eligibleCourseTypes: LoanEligibleCourseType[];
  } | null>(null);
  const [loadingView, setLoadingView] = useState(false);
  const [activeTab, setActiveTab] = useState<FormTab>('basic');
  const [formData, setFormData] = useState({
    provider_name: '',
    provider_type: '',
    interest_rate_min: '' as string | number,
    interest_rate_max: '' as string | number,
    processing_fee: '',
    max_loan_amount: '',
    moratorium_period_months: '' as string | number,
    repayment_duration_years: '' as string | number,
    collateral_required: false,
    coapplicant_required: false,
    tax_benefit_available: false,
    official_website_link: '',
    contact_email: '',
    contact_phone: '',
    description: '',
    logo: '',
    disbursementProcess: [] as { step_number: string | number; description: string }[],
    eligibleCountries: [] as { country_name: string }[],
    eligibleCourseTypes: [] as { course_type: string }[],
  });
  const [, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkExcelFile, setBulkExcelFile] = useState<File | null>(null);
  const [bulkLogoFiles, setBulkLogoFiles] = useState<File[]>([]);
  const [bulkLogosZipFile, setBulkLogosZipFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    created: number;
    createdLoanProviders: { id: number; name: string }[];
    errors: number;
    errorDetails: { row: number; message: string }[];
  } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const { canDownloadExcel } = useAdminPermissions();
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showMissingLogosModal, setShowMissingLogosModal] = useState(false);
  const [missingLogosZipFile, setMissingLogosZipFile] = useState<File | null>(null);
  const [missingLogosUploading, setMissingLogosUploading] = useState(false);
  const [missingLogosError, setMissingLogosError] = useState<string | null>(null);
  const [missingLogosResult, setMissingLogosResult] = useState<{ updated: { id: number; provider_name: string }[]; skipped: string[]; summary: { logosAdded: number; filesSkipped: number; uploadErrors: number } } | null>(null);

  // Run once on mount to prevent continuous API calls
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (allProviders.length === 0) {
      setProviders([]);
      return;
    }
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setProviders(allProviders);
        return;
      }
      const q = searchQuery.toLowerCase();
      setProviders(
        allProviders.filter(
          (p) =>
            p.provider_name.toLowerCase().includes(q) ||
            (p.provider_type && p.provider_type.toLowerCase().includes(q)) ||
            (p.contact_email && p.contact_email.toLowerCase().includes(q))
        )
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, allProviders]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await getAllLoanProvidersAdmin();
      if (res.success && res.data) {
        setAllProviders(res.data.loanProviders);
        setProviders(res.data.loanProviders);
      }
    } catch (err) {
      setError('Failed to fetch loan providers');
      console.error(err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setUploading(true);
      const response = await uploadLoanProviderLogo(file);
      if (response.success && response.data?.logoUrl) {
        setFormData((prev) => ({ ...prev, logo: response.data!.logoUrl }));
        setLogoPreview(response.data!.logoUrl);
        showSuccess('Logo uploaded');
      } else {
        showError(response.message || 'Upload failed');
      }
    } catch {
      showError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
      handleLogoUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        provider_name: formData.provider_name.trim(),
        provider_type: formData.provider_type.trim() || null,
        interest_rate_min: formData.interest_rate_min === '' ? null : Number(formData.interest_rate_min),
        interest_rate_max: formData.interest_rate_max === '' ? null : Number(formData.interest_rate_max),
        processing_fee: formData.processing_fee.trim() || null,
        max_loan_amount: formData.max_loan_amount.trim() || null,
        moratorium_period_months: formData.moratorium_period_months === '' ? null : Number(formData.moratorium_period_months),
        repayment_duration_years: formData.repayment_duration_years === '' ? null : Number(formData.repayment_duration_years),
        collateral_required: formData.collateral_required,
        coapplicant_required: formData.coapplicant_required,
        tax_benefit_available: formData.tax_benefit_available,
        official_website_link: formData.official_website_link.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        description: formData.description.trim() || null,
        logo: formData.logo || null,
        disbursementProcess: formData.disbursementProcess.map((s) => ({
          step_number: s.step_number === '' ? undefined : Number(s.step_number),
          description: s.description?.trim() || undefined,
        })).filter((s) => s.step_number != null || s.description),
        eligibleCountries: formData.eligibleCountries.filter((c) => c.country_name?.trim()).map((c) => ({ country_name: c.country_name!.trim() })),
        eligibleCourseTypes: formData.eligibleCourseTypes.filter((c) => c.course_type?.trim()).map((c) => ({ course_type: c.course_type!.trim() })),
      };
      if (editingProvider) {
        const response = await updateLoanProvider(editingProvider.id, payload);
        if (response.success && response.data) {
          showSuccess('Loan provider updated');
          setAllProviders((prev) => prev.map((p) => (p.id === editingProvider.id ? response.data!.loanProvider : p)));
          setProviders((prev) => prev.map((p) => (p.id === editingProvider.id ? response.data!.loanProvider : p)));
          fetchData(true);
          handleModalClose();
        } else {
          setError(response.message || 'Update failed');
          showError(response.message || 'Update failed');
        }
      } else {
        const response = await createLoanProvider(payload);
        if (response.success && response.data) {
          showSuccess('Loan provider created');
          fetchData(true);
          handleModalClose();
        } else {
          setError(response.message || 'Create failed');
          showError(response.message || 'Create failed');
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setError(msg);
      showError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleView = async (provider: LoanProvider) => {
    try {
      setLoadingView(true);
      const response = await getLoanProviderById(provider.id);
      if (response.success && response.data) {
        setViewingData({
          loanProvider: response.data.loanProvider,
          disbursementProcess: response.data.disbursementProcess || [],
          eligibleCountries: response.data.eligibleCountries || [],
          eligibleCourseTypes: response.data.eligibleCourseTypes || [],
        });
      } else {
        showError('Failed to load loan provider');
      }
    } catch {
      showError('Failed to load loan provider');
    } finally {
      setLoadingView(false);
    }
  };

  const handleEdit = async (provider: LoanProvider) => {
    try {
      const response = await getLoanProviderById(provider.id);
      if (response.success && response.data) {
        const d = response.data;
        setFormData({
          provider_name: d.loanProvider.provider_name ?? '',
          provider_type: d.loanProvider.provider_type ?? '',
          interest_rate_min: d.loanProvider.interest_rate_min ?? '',
          interest_rate_max: d.loanProvider.interest_rate_max ?? '',
          processing_fee: d.loanProvider.processing_fee ?? '',
          max_loan_amount: d.loanProvider.max_loan_amount ?? '',
          moratorium_period_months: d.loanProvider.moratorium_period_months ?? '',
          repayment_duration_years: d.loanProvider.repayment_duration_years ?? '',
          collateral_required: d.loanProvider.collateral_required ?? false,
          coapplicant_required: d.loanProvider.coapplicant_required ?? false,
          tax_benefit_available: d.loanProvider.tax_benefit_available ?? false,
          official_website_link: d.loanProvider.official_website_link ?? '',
          contact_email: d.loanProvider.contact_email ?? '',
          contact_phone: d.loanProvider.contact_phone ?? '',
          description: d.loanProvider.description ?? '',
          logo: d.loanProvider.logo ?? '',
          disbursementProcess: (d.disbursementProcess || []).map((s) => ({
            step_number: s.step_number ?? '',
            description: s.description ?? '',
          })),
          eligibleCountries: (d.eligibleCountries || []).map((c) => ({ country_name: c.country_name ?? '' })),
          eligibleCourseTypes: (d.eligibleCourseTypes || []).map((c) => ({ course_type: c.course_type ?? '' })),
        });
        setLogoPreview(d.loanProvider.logo ?? null);
        setEditingProvider(d.loanProvider);
        setActiveTab('basic');
        setShowModal(true);
      }
    } catch {
      showError('Failed to load loan provider');
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      const response = await deleteLoanProvider(deletingId);
      if (response.success) {
        showSuccess('Loan provider deleted');
        fetchData();
      } else {
        showError(response.message || 'Delete failed');
      }
    } catch {
      showError('Delete failed');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const handleCreate = () => {
    setEditingProvider(null);
    setFormData({
      provider_name: '',
      provider_type: '',
      interest_rate_min: '',
      interest_rate_max: '',
      processing_fee: '',
      max_loan_amount: '',
      moratorium_period_months: '',
      repayment_duration_years: '',
      collateral_required: false,
      coapplicant_required: false,
      tax_benefit_available: false,
      official_website_link: '',
      contact_email: '',
      contact_phone: '',
      description: '',
      logo: '',
      disbursementProcess: [],
      eligibleCountries: [],
      eligibleCourseTypes: [],
    });
    setLogoPreview(null);
    setError(null);
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingProvider(null);
  };

  const handleBulkTemplateDownload = async () => {
    try {
      await downloadLoanProvidersBulkTemplate();
      showSuccess('Template downloaded');
    } catch {
      showError('Failed to download template');
    }
  };

  const handleDownloadAllExcel = async () => {
    try {
      setDownloadingExcel(true);
      await downloadAllDataExcel();
      showSuccess('Excel downloaded');
    } catch {
      showError('Failed to download Excel');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDeleteAllConfirm = async () => {
    try {
      setIsDeletingAll(true);
      const response = await deleteAllLoanProviders();
      if (response.success) {
        showSuccess(response.message || 'All loan providers deleted successfully');
        setShowDeleteAllConfirm(false);
        fetchData(true);
      } else {
        showError(response.message || 'Failed to delete all loan providers');
        setShowDeleteAllConfirm(false);
      }
    } catch (err) {
      showError('An error occurred while deleting all loan providers');
      setShowDeleteAllConfirm(false);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleMissingLogosSubmit = async () => {
    if (!missingLogosZipFile) {
      showError('Please select a ZIP file');
      return;
    }
    setMissingLogosUploading(true);
    setMissingLogosError(null);
    setMissingLogosResult(null);
    try {
      const res = await uploadMissingLogosLoanProviders(missingLogosZipFile);
      if (res.success && res.data) {
        setMissingLogosResult(res.data);
        showSuccess(res.message || `Added ${res.data.summary.logosAdded} logo(s)`);
        fetchData(true);
      } else {
        setMissingLogosError(res.message || 'Upload failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setMissingLogosError(msg);
      showError(msg);
    } finally {
      setMissingLogosUploading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkExcelFile) {
      showError('Select an Excel file');
      return;
    }
    setBulkUploading(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const res = await bulkUploadLoanProviders(bulkExcelFile, bulkLogoFiles, bulkLogosZipFile);
      if (res.success && res.data) {
        setBulkResult(res.data);
        showSuccess(res.message || `Created ${res.data.created} loan provider(s)`);
        fetchData(true);
      } else {
        setBulkError(res.message || 'Bulk upload failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bulk upload failed';
      setBulkError(msg);
      showError(msg);
    } finally {
      setBulkUploading(false);
    }
  };

  const addDisbursementStep = () => setFormData((prev) => ({ ...prev, disbursementProcess: [...prev.disbursementProcess, { step_number: '', description: '' }] }));
  const removeDisbursementStep = (i: number) => setFormData((prev) => ({ ...prev, disbursementProcess: prev.disbursementProcess.filter((_, idx) => idx !== i) }));
  const updateDisbursementStep = (i: number, field: 'step_number' | 'description', v: string | number) => {
    setFormData((prev) => {
      const next = [...prev.disbursementProcess];
      if (next[i]) next[i] = { ...next[i], [field]: v };
      return { ...prev, disbursementProcess: next };
    });
  };

  const addCountry = () => setFormData((prev) => ({ ...prev, eligibleCountries: [...prev.eligibleCountries, { country_name: '' }] }));
  const removeCountry = (i: number) => setFormData((prev) => ({ ...prev, eligibleCountries: prev.eligibleCountries.filter((_, idx) => idx !== i) }));
  const updateCountry = (i: number, v: string) => {
    setFormData((prev) => {
      const next = [...prev.eligibleCountries];
      if (next[i]) next[i] = { country_name: v };
      return { ...prev, eligibleCountries: next };
    });
  };

  const addCourseType = () => setFormData((prev) => ({ ...prev, eligibleCourseTypes: [...prev.eligibleCourseTypes, { course_type: '' }] }));
  const removeCourseType = (i: number) => setFormData((prev) => ({ ...prev, eligibleCourseTypes: prev.eligibleCourseTypes.filter((_, idx) => idx !== i) }));
  const updateCourseType = (i: number, v: string) => {
    setFormData((prev) => {
      const next = [...prev.eligibleCourseTypes];
      if (next[i]) next[i] = { course_type: v };
      return { ...prev, eligibleCourseTypes: next };
    });
  };

  const tabs: { id: FormTab; label: string }[] = [
    { id: 'basic', label: 'Basic' },
    { id: 'disbursement', label: 'Disbursement' },
    { id: 'countries', label: 'Countries' },
    { id: 'courseTypes', label: 'Course Types' },
  ];

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => router.replace('/admin/login')} className="text-pink hover:underline">Go to login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Loan Providers Manager</h1>
            <p className="text-sm text-gray-600">Manage loan providers with terms, disbursement process, eligible countries and course types. CRUD and Excel + logos bulk upload.</p>
          </div>

          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <span className="text-xs font-medium text-gray-700">All providers</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{allProviders.length}</span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, type, email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none w-64"
                />
              </div>
            </div>
            <div className="inline-flex items-center gap-2">
              <button type="button" onClick={handleCreate} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90">
                <FiPlus className="h-4 w-4" />
                Add Loan Provider
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(true);
                  setBulkResult(null);
                  setBulkError(null);
                  setBulkExcelFile(null);
                  setBulkLogoFiles([]);
                  setBulkLogosZipFile(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <FiUpload className="h-4 w-4" />
                Bulk upload (Excel)
              </button>
              {allProviders.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMissingLogosModal(true);
                    setMissingLogosZipFile(null);
                    setMissingLogosResult(null);
                    setMissingLogosError(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <FiUpload className="h-4 w-4" />
                  Upload missing logos
                </button>
              )}
              {canDownloadExcel && (
                <button
                  type="button"
                  onClick={handleDownloadAllExcel}
                  disabled={downloadingExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <FiDownload className="h-4 w-4" />
                  {downloadingExcel ? 'Downloading...' : 'Download Excel'}
                </button>
              )}
              {currentAdmin?.type === 'super_admin' && allProviders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowDeleteAllConfirm(true)}
                  disabled={isDeletingAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  <FiTrash2 className="h-4 w-4" />
                  Delete All
                </button>
              )}
            </div>
          </div>

          {error && <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">{error}</div>}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading loan providers...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">LOGO</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">TYPE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">INTEREST RATE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">MAX LOAN</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {providers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                          {providers.length < allProviders.length ? 'No providers match your search' : 'No loan providers yet'}
                        </td>
                      </tr>
                    ) : (
                      providers.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <div className="h-12 w-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                              {p.logo ? (
                                <Image src={p.logo} alt={p.provider_name} width={48} height={48} className="object-contain" unoptimized />
                              ) : (
                                <span className="text-xs text-gray-400">No logo</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{p.provider_name}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-600">{p.provider_type || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-600">
                              {p.interest_rate_min != null && p.interest_rate_max != null
                                ? `${p.interest_rate_min}% - ${p.interest_rate_max}%`
                                : p.interest_rate_min != null
                                  ? `${p.interest_rate_min}%`
                                  : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-600">{p.max_loan_amount || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <AdminTableActions
                              onView={() => handleView(p)}
                              onEdit={() => handleEdit(p)}
                              onDelete={() => handleDeleteClick(p.id)}
                              loadingView={loadingView}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingProvider ? 'Edit Loan Provider' : 'Create Loan Provider'}</h2>
              <button type="button" onClick={handleModalClose} className="text-white hover:text-gray-200">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="shrink-0 flex border-b border-gray-200 bg-gray-100 px-4 gap-1 overflow-x-auto min-h-[44px] items-end">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2.5 px-3 text-sm font-medium border-b-2 whitespace-nowrap -mb-px ${activeTab === tab.id ? 'border-pink text-pink bg-white rounded-t' : 'border-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-200/50'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 space-y-4">
              {activeTab === 'basic' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Provider Name *</label>
                    <input
                      type="text"
                      value={formData.provider_name}
                      onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                      required
                      placeholder="e.g. HDFC Credila"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Provider Type</label>
                    <input
                      type="text"
                      value={formData.provider_type}
                      onChange={(e) => setFormData({ ...formData, provider_type: e.target.value })}
                      placeholder="e.g. NBFC, Bank"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Logo</label>
                    {logoPreview && (
                      <div className="relative h-24 w-24 rounded-md overflow-hidden bg-gray-100 border border-gray-300 mb-2">
                        <Image src={logoPreview} alt="Logo" fill className="object-contain" unoptimized />
                      </div>
                    )}
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <FiUpload className="h-4 w-4" />
                      <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                      <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" disabled={uploading} />
                    </label>
                    {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Interest Rate Min (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.interest_rate_min}
                        onChange={(e) => setFormData({ ...formData, interest_rate_min: e.target.value === '' ? '' : e.target.value })}
                        placeholder="10.5"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Interest Rate Max (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.interest_rate_max}
                        onChange={(e) => setFormData({ ...formData, interest_rate_max: e.target.value === '' ? '' : e.target.value })}
                        placeholder="14"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Processing Fee</label>
                    <input
                      type="text"
                      value={formData.processing_fee}
                      onChange={(e) => setFormData({ ...formData, processing_fee: e.target.value })}
                      placeholder="e.g. 1% of loan amount"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Loan Amount</label>
                    <input
                      type="text"
                      value={formData.max_loan_amount}
                      onChange={(e) => setFormData({ ...formData, max_loan_amount: e.target.value })}
                      placeholder="e.g. 50 Lakh"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Moratorium (months)</label>
                      <input
                        type="number"
                        value={formData.moratorium_period_months}
                        onChange={(e) => setFormData({ ...formData, moratorium_period_months: e.target.value === '' ? '' : e.target.value })}
                        placeholder="12"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Repayment (years)</label>
                      <input
                        type="number"
                        value={formData.repayment_duration_years}
                        onChange={(e) => setFormData({ ...formData, repayment_duration_years: e.target.value === '' ? '' : e.target.value })}
                        placeholder="15"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.collateral_required}
                        onChange={(e) => setFormData({ ...formData, collateral_required: e.target.checked })}
                        className="rounded border-gray-300 text-pink focus:ring-pink"
                      />
                      <span className="text-sm">Collateral required</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.coapplicant_required}
                        onChange={(e) => setFormData({ ...formData, coapplicant_required: e.target.checked })}
                        className="rounded border-gray-300 text-pink focus:ring-pink"
                      />
                      <span className="text-sm">Co-applicant required</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.tax_benefit_available}
                        onChange={(e) => setFormData({ ...formData, tax_benefit_available: e.target.checked })}
                        className="rounded border-gray-300 text-pink focus:ring-pink"
                      />
                      <span className="text-sm">Tax benefit available</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Official Website</label>
                    <input
                      type="url"
                      value={formData.official_website_link}
                      onChange={(e) => setFormData({ ...formData, official_website_link: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        placeholder="support@example.com"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        placeholder="9876543210"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description..."
                      rows={3}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink outline-none resize-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'disbursement' && (
                <>
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-gray-700">Disbursement Process</label>
                    <button type="button" onClick={addDisbursementStep} className="text-sm text-pink hover:underline">+ Add step</button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {formData.disbursementProcess.map((step, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <input
                          type="number"
                          value={step.step_number}
                          onChange={(e) => updateDisbursementStep(i, 'step_number', e.target.value === '' ? '' : e.target.value)}
                          placeholder="Step #"
                          className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          value={step.description}
                          onChange={(e) => updateDisbursementStep(i, 'description', e.target.value)}
                          placeholder="Description"
                          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                        <button type="button" onClick={() => removeDisbursementStep(i)} className="text-red-600 text-sm">Remove</button>
                      </div>
                    ))}
                    {formData.disbursementProcess.length === 0 && <p className="text-sm text-gray-500">No steps. Click &quot;Add step&quot;.</p>}
                  </div>
                </>
              )}

              {activeTab === 'countries' && (
                <>
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-gray-700">Eligible Countries</label>
                    <button type="button" onClick={addCountry} className="text-sm text-pink hover:underline">+ Add</button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {formData.eligibleCountries.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={item.country_name}
                          onChange={(e) => updateCountry(i, e.target.value)}
                          placeholder="e.g. India"
                          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                        <button type="button" onClick={() => removeCountry(i)} className="text-red-600 text-sm">Remove</button>
                      </div>
                    ))}
                    {formData.eligibleCountries.length === 0 && <p className="text-sm text-gray-500">No countries. Click &quot;Add&quot;.</p>}
                  </div>
                </>
              )}

              {activeTab === 'courseTypes' && (
                <>
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-gray-700">Eligible Course Types</label>
                    <button type="button" onClick={addCourseType} className="text-sm text-pink hover:underline">+ Add</button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {formData.eligibleCourseTypes.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={item.course_type}
                          onChange={(e) => updateCourseType(i, e.target.value)}
                          placeholder="e.g. Engineering, MBA"
                          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                        <button type="button" onClick={() => removeCourseType(i)} className="text-red-600 text-sm">Remove</button>
                      </div>
                    ))}
                    {formData.eligibleCourseTypes.length === 0 && <p className="text-sm text-gray-500">No course types. Click &quot;Add&quot;.</p>}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={handleModalClose} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-3 py-1.5 text-sm bg-pink text-white rounded-lg hover:bg-pink/90 disabled:opacity-50">
                  {isSaving ? 'Saving...' : editingProvider ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View modal */}
      {viewingData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-4">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                {viewingData.loanProvider?.logo ? (
                  <img
                    src={viewingData.loanProvider.logo}
                    alt={viewingData.loanProvider?.provider_name ?? 'Logo'}
                    className="h-12 w-12 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gray-200 shrink-0 flex items-center justify-center text-gray-500 text-xl">
                    <FiBarChart />
                  </div>
                )}
                <h2 className="text-lg font-bold text-gray-900 truncate">{viewingData.loanProvider?.provider_name ?? 'Loan Provider'}</h2>
              </div>
              <button type="button" onClick={() => setViewingData(null)} className="text-gray-500 hover:text-gray-700 shrink-0">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Provider type:</strong> {viewingData.loanProvider?.provider_type ?? '-'}</p>
              <p>
                <strong>Interest rate:</strong>{' '}
                {viewingData.loanProvider?.interest_rate_min != null && viewingData.loanProvider?.interest_rate_max != null
                  ? `${viewingData.loanProvider.interest_rate_min}% - ${viewingData.loanProvider.interest_rate_max}%`
                  : '-'}
              </p>
              <p><strong>Processing fee:</strong> {viewingData.loanProvider?.processing_fee ?? '-'}</p>
              <p><strong>Max loan amount:</strong> {viewingData.loanProvider?.max_loan_amount ?? '-'}</p>
              <p><strong>Moratorium period:</strong> {viewingData.loanProvider?.moratorium_period_months != null ? `${viewingData.loanProvider.moratorium_period_months} months` : '-'}</p>
              <p><strong>Repayment duration:</strong> {viewingData.loanProvider?.repayment_duration_years != null ? `${viewingData.loanProvider.repayment_duration_years} years` : '-'}</p>
              <p><strong>Collateral required:</strong> {viewingData.loanProvider?.collateral_required ? 'Yes' : 'No'}</p>
              <p><strong>Co-applicant required:</strong> {viewingData.loanProvider?.coapplicant_required ? 'Yes' : 'No'}</p>
              <p><strong>Tax benefit available:</strong> {viewingData.loanProvider?.tax_benefit_available ? 'Yes' : 'No'}</p>
              <p><strong>Contact email:</strong> {viewingData.loanProvider?.contact_email ?? '-'}</p>
              <p><strong>Contact phone:</strong> {viewingData.loanProvider?.contact_phone ?? '-'}</p>
              <p><strong>Website:</strong>{' '}
                {viewingData.loanProvider?.official_website_link ? (
                  <a href={viewingData.loanProvider.official_website_link} target="_blank" rel="noopener noreferrer" className="text-pink hover:underline">{viewingData.loanProvider.official_website_link}</a>
                ) : '-'}
              </p>
            </div>
            {viewingData.loanProvider?.description && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700">Description</p>
                <p className="text-sm text-gray-600">{viewingData.loanProvider.description}</p>
              </div>
            )}
            {((viewingData.disbursementProcess ?? []).length > 0) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700">Disbursement process</p>
                <ol className="text-sm text-gray-600 list-decimal list-inside">
                  {(viewingData.disbursementProcess ?? []).map((s) => (
                    <li key={s.id}>{s.description || `Step ${s.step_number}`}</li>
                  ))}
                </ol>
              </div>
            )}
            {((viewingData.eligibleCountries ?? []).length > 0) && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Eligible countries</p>
                <p className="text-sm text-gray-600">{(viewingData.eligibleCountries ?? []).map((c) => c.country_name).filter(Boolean).join(', ')}</p>
              </div>
            )}
            {((viewingData.eligibleCourseTypes ?? []).length > 0) && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Eligible course types</p>
                <p className="text-sm text-gray-600">{(viewingData.eligibleCourseTypes ?? []).map((c) => c.course_type).filter(Boolean).join(', ')}</p>
              </div>
            )}
            <button type="button" onClick={() => { setViewingData(null); handleEdit(viewingData.loanProvider); }} className="mt-4 px-3 py-1.5 text-sm bg-pink text-white rounded-lg hover:bg-pink/90">Edit</button>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Bulk Upload Loan Providers</h2>
              <button type="button" onClick={() => setShowBulkModal(false)} className="text-gray-500 hover:text-gray-700">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload an Excel file (use template). Optionally attach a ZIP of logos; filenames must match the <code className="bg-gray-100 px-1 rounded">logo_filename</code> column.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Excel file *</label>
                <input type="file" accept=".xlsx,.xls" onChange={(e) => setBulkExcelFile(e.target.files?.[0] ?? null)} className="w-full text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Logos (ZIP file)</label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file?.name.toLowerCase().endsWith('.zip')) {
                      setBulkLogosZipFile(file);
                      setBulkLogoFiles([]);
                    }
                    e.target.value = '';
                  }}
                  className="w-full text-sm"
                />
              </div>
              {canDownloadExcel && (
                <button type="button" onClick={handleBulkTemplateDownload} className="inline-flex items-center gap-2 text-sm text-pink hover:underline">
                  <FiDownload className="h-4 w-4" />
                  Download Excel template
                </button>
              )}
            </div>
            {bulkError && <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded">{bulkError}</div>}
            {bulkResult && (
              <div className="mt-3 p-2 bg-green-50 text-green-800 text-sm rounded">
                Created: {bulkResult.created}. {bulkResult.errors > 0 && `Errors: ${bulkResult.errors} row(s).`}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowBulkModal(false)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
              <button type="button" onClick={handleBulkSubmit} disabled={!bulkExcelFile || bulkUploading} className="px-3 py-1.5 text-sm bg-pink text-white rounded-lg hover:bg-pink/90 disabled:opacity-50">
                {bulkUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Missing Logos Modal */}
      {showMissingLogosModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col ring-1 ring-black/5">
            <div className="bg-darkGradient text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white/20"><FiUpload className="h-5 w-5" /></div>
                <h2 className="text-lg font-semibold tracking-tight">Upload missing logos</h2>
              </div>
              <button type="button" onClick={() => setShowMissingLogosModal(false)} className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20" aria-label="Close"><FiX className="h-5 w-5" /></button>
            </div>
            <div className="p-5 overflow-auto space-y-5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Upload a ZIP containing logo images. File names must match <code className="px-1.5 py-0.5 rounded bg-slate-200/80 font-mono text-xs">logo_filename</code> for loan providers with no logo yet.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">ZIP file (required)</label>
                <label className="flex flex-col items-center justify-center w-full min-h-[120px] rounded-xl border-2 border-dashed border-slate-300 hover:border-pink/50 hover:bg-pink/5 transition-all cursor-pointer group">
                  <input type="file" accept=".zip,application/zip,application/x-zip-compressed" className="hidden" onChange={(e) => { setMissingLogosZipFile(e.target.files?.[0] ?? null); setMissingLogosResult(null); setMissingLogosError(null); e.target.value = ''; }} />
                  {missingLogosZipFile ? (
                    <div className="flex flex-col items-center gap-2 p-4">
                      <div className="p-2 rounded-full bg-green-100 text-green-600"><FiUpload className="h-5 w-5" /></div>
                      <span className="text-sm font-medium text-slate-800 truncate max-w-[240px]">{missingLogosZipFile.name}</span>
                      <button type="button" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setMissingLogosZipFile(null); setMissingLogosResult(null); setMissingLogosError(null); }} className="text-xs text-slate-500 hover:text-red-600">Remove</button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-slate-500 group-hover:text-slate-600">
                      <FiUpload className="h-8 w-8 opacity-60" />
                      <span className="text-sm font-medium">Drop ZIP here or click to browse</span>
                      <span className="text-xs">.zip only</span>
                    </div>
                  )}
                </label>
              </div>
              {missingLogosError && <div className="bg-red-50 border border-red-200/80 text-red-700 px-4 py-3 text-sm rounded-xl">{missingLogosError}</div>}
              {missingLogosResult && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                  <p className="font-semibold text-slate-900">✓ Logos added: {missingLogosResult.summary.logosAdded}</p>
                  {missingLogosResult.summary.filesSkipped > 0 && <p className="text-sm text-amber-700">Files skipped: {missingLogosResult.summary.filesSkipped}</p>}
                  {missingLogosResult.updated.length > 0 && <ul className="text-xs text-slate-600 list-disc list-inside max-h-24 overflow-y-auto">{missingLogosResult.updated.map((u, i) => <li key={i}>{u.provider_name}</li>)}</ul>}
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-slate-200/80 bg-slate-50/50 flex justify-end gap-3">
              <button type="button" onClick={() => setShowMissingLogosModal(false)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100">Close</button>
              <button type="button" onClick={handleMissingLogosSubmit} disabled={!missingLogosZipFile || missingLogosUploading} className="px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2">
                {missingLogosUploading ? <><span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Uploading…</> : <><FiUpload className="h-4 w-4" />Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeletingId(null); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Loan Provider"
        message="Are you sure you want to delete this loan provider? All related data will be removed."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        confirmButtonStyle="danger"
      />
      <ConfirmationModal
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={handleDeleteAllConfirm}
        title="Delete All Loan Providers"
        message={`Are you sure you want to delete all ${allProviders.length} loan providers? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeletingAll}
      />
    </div>
  );
}
