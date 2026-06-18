'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllAutomationExams,
  getAutomationTaxonomyExamOptions,
  createAutomationExam,
  updateAutomationExam,
  deleteAutomationExam,
  AutomationExam,
  AutomationExamDetails,
  CreateAutomationExamData,
  TaxonomyExamOption,
} from '@/api/admin/automation-exams';
import { getAllExamsAdmin } from '@/api/admin/exams';
import { getApiBaseUrl, getBrowserAdminToken } from '@/api/client';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiEye, FiLink, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { ConfirmationModal, useToast, Dropdown } from '@/components/shared';
import type { DropdownOption } from '@/components/shared';
import { AdminTableActions } from '@/components/admin/AdminTableActions';
import { AutomationCollegesTab } from '@/components/admin/automation/AutomationCollegesTab';
import { AutomationScholarshipsTab } from '@/components/admin/automation/AutomationScholarshipsTab';

type AutomationFormsSectionTab = 'exams' | 'colleges' | 'scholarships';

const AUTOMATION_FORMS_TABS: { id: AutomationFormsSectionTab; label: string }[] = [
  { id: 'exams', label: 'Automation Exams' },
  { id: 'colleges', label: 'Automation Colleges' },
  { id: 'scholarships', label: 'Automation Scholarships' },
];

type ExamDetailsForm = {
  application_start_date: string;
  application_close_date: string;
  admit_card_date: string;
  exam_date: string;
  result_date: string;
  counselling_start_date: string;
  counselling_end_date: string;
  application_fees: string;
  ut_service_fee: string;
};

const emptyExamDetailsForm = (): ExamDetailsForm => ({
  application_start_date: '',
  application_close_date: '',
  admit_card_date: '',
  exam_date: '',
  result_date: '',
  counselling_start_date: '',
  counselling_end_date: '',
  application_fees: '',
  ut_service_fee: '',
});

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function examDetailsFromApi(details?: AutomationExamDetails | null): ExamDetailsForm {
  if (!details) return emptyExamDetailsForm();
  return {
    application_start_date: toDateInputValue(details.application_start_date),
    application_close_date: toDateInputValue(details.application_close_date),
    admit_card_date: toDateInputValue(details.admit_card_date),
    exam_date: toDateInputValue(details.exam_date),
    result_date: toDateInputValue(details.result_date),
    counselling_start_date: toDateInputValue(details.counselling_start_date),
    counselling_end_date: toDateInputValue(details.counselling_end_date),
    application_fees: details.application_fees != null ? String(details.application_fees) : '',
    ut_service_fee: details.ut_service_fee != null ? String(details.ut_service_fee) : '',
  };
}

function examDetailsPayload(form: ExamDetailsForm) {
  return {
    application_start_date: form.application_start_date || null,
    application_close_date: form.application_close_date || null,
    admit_card_date: form.admit_card_date || null,
    exam_date: form.exam_date || null,
    result_date: form.result_date || null,
    counselling_start_date: form.counselling_start_date || null,
    counselling_end_date: form.counselling_end_date || null,
    application_fees: form.application_fees.trim() ? Number(form.application_fees) : null,
    ut_service_fee: form.ut_service_fee.trim() ? Number(form.ut_service_fee) : null,
  };
}

function formatMappingStatus(status?: string) {
  return status === 'mapped' ? 'Mapped' : 'Not Mapped';
}

function formatDisplayDate(value: string | null | undefined) {
  if (!value) return '—';
  return String(value).slice(0, 10);
}

function formatDisplayFee(value: number | null | undefined, suffix = '') {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${value}${suffix}`;
}

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function slugFromTaxonomyCode(code: string) {
  return code
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveTaxonomyIdForExam(
  exam: Pick<AutomationExam, 'name' | 'slug' | 'taxonomy_exam_id'>,
  options: TaxonomyExamOption[]
): number | null {
  if (exam.taxonomy_exam_id) return exam.taxonomy_exam_id;
  const slugNorm = exam.slug.trim().toLowerCase();
  const nameNorm = exam.name.trim().toLowerCase();
  const match = options.find((option) => {
    const codeSlug = option.code ? slugFromTaxonomyCode(option.code) : '';
    return (
      option.name.trim().toLowerCase() === nameNorm ||
      (codeSlug && codeSlug === slugNorm)
    );
  });
  return match?.id ?? null;
}

export default function AutomationFormsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [activeSectionTab, setActiveSectionTab] = useState<AutomationFormsSectionTab>('exams');
  const [exams, setExams] = useState<AutomationExam[]>([]);
  const [allExams, setAllExams] = useState<AutomationExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<AutomationExam | null>(null);
  const [viewingExam, setViewingExam] = useState<AutomationExam | null>(null);
  const [formData, setFormData] = useState<CreateAutomationExamData>({
    name: '',
    slug: '',
    url: '',
    is_active: true,
    field_mappings: {},
    agent_config: {},
    notify_on_complete: true,
    notify_on_failure: true,
    notification_emails: [],
  });
  const [fieldMappingsText, setFieldMappingsText] = useState('{}');
  const [agentConfigText, setAgentConfigText] = useState('{}');
  const [notificationEmailsText, setNotificationEmailsText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taxonomyExams, setTaxonomyExams] = useState<TaxonomyExamOption[]>([]);
  const [selectedTaxonomyId, setSelectedTaxonomyId] = useState<number | null>(null);
  const [taxonomyLoading, setTaxonomyLoading] = useState(false);
  const [examDetailsForm, setExamDetailsForm] = useState<ExamDetailsForm>(emptyExamDetailsForm());

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    fetchExams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (allExams.length === 0) {
      setExams([]);
      return;
    }

    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setExams(allExams);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allExams.filter(exam =>
        exam.name.toLowerCase().includes(searchLower) ||
        exam.slug.toLowerCase().includes(searchLower) ||
        exam.url.toLowerCase().includes(searchLower)
      );
      setExams(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allExams]);

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      const response = await getAllAutomationExams();
      if (response.success && response.data) {
        setAllExams(response.data);
        setExams(response.data);
      } else {
        setError(response.message || 'Failed to fetch exams');
      }
    } catch (err) {
      setError('An error occurred while fetching exams');
      console.error('Error fetching exams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      url: '',
      is_active: true,
      field_mappings: {},
      agent_config: {},
      notify_on_complete: true,
      notify_on_failure: true,
      notification_emails: [],
    });
    setFieldMappingsText('{}');
    setAgentConfigText('{}');
    setNotificationEmailsText('');
    setEditingExam(null);
    setSelectedTaxonomyId(null);
    setExamDetailsForm(emptyExamDetailsForm());
    setError(null);
  };

  const loadTaxonomyExams = async () => {
    setTaxonomyLoading(true);
    try {
      const response = await getAutomationTaxonomyExamOptions();
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        setTaxonomyExams(response.data);
        return;
      }

      const fallback = await getAllExamsAdmin();
      if (fallback.success && fallback.data?.exams?.length) {
        setTaxonomyExams(
          fallback.data.exams.map((exam) => ({
            id: exam.id,
            name: exam.name,
            code: exam.code,
            website: exam.website ?? null,
            registration_link: exam.registration_link ?? null,
            exam_details: exam.examDates
              ? {
                  application_start_date: exam.examDates.application_start_date,
                  application_close_date: exam.examDates.application_close_date,
                  admit_card_date: exam.examDates.admit_card_date,
                  exam_date: exam.examDates.exam_date,
                  result_date: exam.examDates.result_date,
                  counselling_start_date:
                    exam.examDates.counselling_start_date ?? exam.examDates.counselling_date,
                  counselling_end_date: exam.examDates.counselling_end_date,
                  application_fees: exam.examDates.application_fees,
                  ut_service_fee: exam.examDates.ut_service_fee,
                }
              : null,
          }))
        );
        return;
      }

      const token = getBrowserAdminToken();
      if (token) {
        const raw = await fetch(`${getApiBaseUrl()}/admin/automation-exams/taxonomy-options`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (raw.ok) {
          const body = await raw.json();
          if (Array.isArray(body?.data) && body.data.length > 0) {
            setTaxonomyExams(body.data);
            return;
          }
        }
      }

      setTaxonomyExams([]);
      showError(
        response.message ||
          'Could not load exam catalog. Restart the backend server and ensure exams exist in Exams taxonomy.'
      );
    } catch (err) {
      console.error('Error loading taxonomy exams:', err);
      setTaxonomyExams([]);
      showError('Failed to load exam catalog');
    } finally {
      setTaxonomyLoading(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      void loadTaxonomyExams();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const handleCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (exam: AutomationExam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      slug: exam.slug,
      url: exam.url,
      is_active: exam.is_active,
      field_mappings: exam.field_mappings || {},
      agent_config: exam.agent_config || {},
      notify_on_complete: exam.notify_on_complete,
      notify_on_failure: exam.notify_on_failure,
      notification_emails: exam.notification_emails || [],
      taxonomy_exam_id: exam.taxonomy_exam_id ?? null,
    });
    setSelectedTaxonomyId(exam.taxonomy_exam_id ?? null);
    setExamDetailsForm(examDetailsFromApi(exam.exam_details));
    setFieldMappingsText(JSON.stringify(exam.field_mappings || {}, null, 2));
    setAgentConfigText(JSON.stringify(exam.agent_config || {}, null, 2));
    setNotificationEmailsText((exam.notification_emails || []).join(', '));
    setShowModal(true);
  };

  useEffect(() => {
    if (!showModal || !editingExam || taxonomyExams.length === 0) return;
    if (selectedTaxonomyId != null) return;
    const matched = resolveTaxonomyIdForExam(editingExam, taxonomyExams);
    if (matched != null) {
      setSelectedTaxonomyId(matched);
      setFormData((prev) => ({ ...prev, taxonomy_exam_id: matched }));
    }
  }, [showModal, editingExam, taxonomyExams, selectedTaxonomyId]);

  const handleView = (exam: AutomationExam) => {
    setViewingExam(exam);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!editingExam && selectedTaxonomyId == null) {
      setError('Please select an exam from the catalog');
      return;
    }

    if (editingExam && !selectedTaxonomyId && !editingExam.taxonomy_exam_id) {
      setError('Link this automation exam to a catalog exam to sync dates and fees');
      return;
    }

    if (!formData.name.trim()) {
      setError('Exam name is required');
      return;
    }

    if (!formData.slug.trim()) {
      setError('Slug is required');
      return;
    }

    if (!formData.url.trim()) {
      setError('URL is required');
      return;
    }

    // Parse JSON fields
    let fieldMappings = {};
    let agentConfig = {};
    let notificationEmails: string[] = [];

    try {
      if (fieldMappingsText.trim()) {
        fieldMappings = JSON.parse(fieldMappingsText);
      }
    } catch (err) {
      setError('Invalid JSON in Field Mappings');
      return;
    }

    try {
      if (agentConfigText.trim()) {
        agentConfig = JSON.parse(agentConfigText);
      }
    } catch (err) {
      setError('Invalid JSON in Agent Config');
      return;
    }

    if (notificationEmailsText.trim()) {
      notificationEmails = notificationEmailsText
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);
    }

    try {
      setIsSubmitting(true);
      const examData: CreateAutomationExamData = {
        ...formData,
        field_mappings: fieldMappings,
        agent_config: agentConfig,
        notification_emails: notificationEmails,
        taxonomy_exam_id: selectedTaxonomyId ?? editingExam?.taxonomy_exam_id ?? null,
        exam_details: examDetailsPayload(examDetailsForm),
      };

      let response;
      if (editingExam) {
        response = await updateAutomationExam(editingExam.id, examData);
      } else {
        response = await createAutomationExam(examData);
      }

      if (response.success) {
        showSuccess(editingExam ? 'Exam updated successfully' : 'Exam created successfully');
        setShowModal(false);
        resetForm();
        fetchExams();
      } else {
        const errorMsg = response.message || `Failed to ${editingExam ? 'update' : 'create'} exam`;
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = `An error occurred while ${editingExam ? 'updating' : 'creating'} exam`;
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving exam:', err);
    } finally {
      setIsSubmitting(false);
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
      const response = await deleteAutomationExam(deletingId);
      if (response.success) {
        showSuccess('Exam deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchExams();
      } else {
        showError(response.message || 'Failed to delete exam');
      }
    } catch (err: any) {
      showError('An error occurred while deleting exam');
      console.error('Error deleting exam:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const taxonomyDropdownOptions: DropdownOption<number>[] = taxonomyExams.map((exam) => ({
    value: exam.id,
    label: exam.code ? `${exam.name} (${exam.code})` : exam.name,
  }));

  const handleTaxonomySelect = (taxonomyId: number) => {
    const exam = taxonomyExams.find((e) => e.id === taxonomyId);
    if (!exam) return;

    setSelectedTaxonomyId(taxonomyId);
    const slug = exam.code
      ? slugFromTaxonomyCode(exam.code)
      : generateSlug(exam.name);
    setFormData((prev) => ({
      ...prev,
      name: exam.name,
      slug: slug || generateSlug(exam.name),
      url: exam.registration_link?.trim() || exam.website?.trim() || prev.url,
      taxonomy_exam_id: taxonomyId,
    }));
    if (exam.exam_details) {
      setExamDetailsForm((prev) => {
        const loaded = examDetailsFromApi(exam.exam_details);
        const hasExisting = Object.values(prev).some((v) => String(v).trim() !== '');
        return hasExisting && editingExam ? prev : loaded;
      });
    }
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => {
      const next = { ...prev, name };
      if (!editingExam && selectedTaxonomyId == null) {
        next.slug = generateSlug(name);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AdminHeader />
        <main className="flex-1 p-6 overflow-auto min-w-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Automation Forms</h1>
            <p className="text-slate-600">
              Manage automation configurations for exams, colleges, and scholarships
            </p>
          </div>

          <div className="mb-6 border-b border-slate-200">
            <div className="flex gap-1 overflow-x-auto">
              {AUTOMATION_FORMS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSectionTab(tab.id)}
                  className={`py-2.5 px-4 text-sm font-medium border-b-2 whitespace-nowrap -mb-px transition-colors ${
                    activeSectionTab === tab.id
                      ? 'border-[#341050] text-[#341050] bg-white rounded-t'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeSectionTab === 'colleges' && <AutomationCollegesTab />}

          {activeSectionTab === 'scholarships' && <AutomationScholarshipsTab />}

          {activeSectionTab === 'exams' && (
            <>
          {/* Exams tab header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Automation Exams</h2>
              <p className="text-sm text-slate-600">Manage exam configurations for automation workflows</p>
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              New Exam
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Exams Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading exams...
              </div>
            ) : exams.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                No exams found. Create your first exam to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] table-fixed">
                  <thead className="bg-[#F6F8FA] border-b">
                    <tr>
                      <th className="w-[18%] px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                      <th className="w-[26%] px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">URL</th>
                      <th className="w-[12%] px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mapping</th>
                      <th className="w-[11%] px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase whitespace-nowrap">App closes</th>
                      <th className="w-[10%] px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="w-[11%] px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Created</th>
                      <th className="w-[12%] px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {exams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-[#F6F8FA]">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 truncate" title={exam.name}>
                            {exam.name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={exam.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm min-w-0"
                            title={exam.url}
                          >
                            <FiLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{exam.url}</span>
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                              exam.mapping_status === 'mapped'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {formatMappingStatus(exam.mapping_status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                          {exam.exam_details?.application_close_date
                            ? toDateInputValue(exam.exam_details.application_close_date)
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                              exam.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {exam.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                          {new Date(exam.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <AdminTableActions
                            onView={() => handleView(exam)}
                            onEdit={() => handleEdit(exam)}
                            onDelete={() => handleDeleteClick(exam.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
            </>
          )}

        </main>
      </div>

      {activeSectionTab === 'exams' && (
        <>
      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                {editingExam ? 'Edit Exam' : 'Create New Exam'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Exam Name */}
              <div className="relative z-[60]">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Exam Name <span className="text-red-500">*</span>
                </label>
                {editingExam ? (
                  taxonomyLoading ? (
                    <p className="text-sm text-slate-500 py-2">Loading exams...</p>
                  ) : (
                    <>
                      <Dropdown<number>
                        options={taxonomyDropdownOptions}
                        value={selectedTaxonomyId}
                        onChange={handleTaxonomySelect}
                        placeholder="Search and select linked catalog exam..."
                        searchable
                        maxMenuHeight={200}
                        usePortal={false}
                        className="w-full"
                      />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </>
                  )
                ) : taxonomyLoading ? (
                  <p className="text-sm text-slate-500 py-2">Loading exams...</p>
                ) : taxonomyExams.length === 0 ? (
                  <p className="text-sm text-amber-700 py-2 rounded-lg border border-amber-200 bg-amber-50 px-3">
                    No exams in catalog. Add exams under Admin → Exams, restart the backend, then try again.
                  </p>
                ) : (
                  <>
                    <Dropdown<number>
                      options={taxonomyDropdownOptions}
                      value={selectedTaxonomyId}
                      onChange={handleTaxonomySelect}
                      placeholder="Search and select an exam..."
                      searchable
                      maxMenuHeight={200}
                      usePortal={false}
                      className="w-full"
                    />
                    {formData.name ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Selected: <span className="font-medium text-slate-700">{formData.name}</span>
                      </p>
                    ) : null}
                  </>
                )}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  pattern="[a-z0-9-]+"
                  title="Slug must contain only lowercase letters, numbers, and hyphens"
                />
                <p className="mt-1 text-xs text-slate-500">URL-friendly identifier (e.g., jee-main-2024)</p>
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Registration URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Exam catalog dates & fees — synced to exams_taxonomies + exam_dates */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Exam details (synced to exam database)</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Saved to the linked taxonomy exam and <code className="text-[11px]">exam_dates</code> when you create or update.
                    {!selectedTaxonomyId ? (
                      <span className="block mt-1 text-amber-700">
                        Select a catalog exam above — dates cannot be saved without a linked exam.
                      </span>
                    ) : null}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Application start date</label>
                    <input
                      type="date"
                      value={examDetailsForm.application_start_date}
                      onChange={(e) => setExamDetailsForm((p) => ({ ...p, application_start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Application end date</label>
                    <input
                      type="date"
                      value={examDetailsForm.application_close_date}
                      onChange={(e) => setExamDetailsForm((p) => ({ ...p, application_close_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hall ticket / admit card date</label>
                    <input
                      type="date"
                      value={examDetailsForm.admit_card_date}
                      onChange={(e) => setExamDetailsForm((p) => ({ ...p, admit_card_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Exam date</label>
                    <input
                      type="date"
                      value={examDetailsForm.exam_date}
                      onChange={(e) => setExamDetailsForm((p) => ({ ...p, exam_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Result date</label>
                    <input
                      type="date"
                      value={examDetailsForm.result_date}
                      onChange={(e) => setExamDetailsForm((p) => ({ ...p, result_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Counselling start date</label>
                    <input
                      type="date"
                      value={examDetailsForm.counselling_start_date}
                      onChange={(e) => setExamDetailsForm((p) => ({ ...p, counselling_start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Counselling end date</label>
                    <input
                      type="date"
                      value={examDetailsForm.counselling_end_date}
                      onChange={(e) => setExamDetailsForm((p) => ({ ...p, counselling_end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Form fee (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={examDetailsForm.application_fees}
                      onChange={(e) => setExamDetailsForm((p) => ({ ...p, application_fees: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      placeholder="Application fee"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">UT service fee (credits)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={examDetailsForm.ut_service_fee}
                      onChange={(e) => setExamDetailsForm((p) => ({ ...p, ut_service_fee: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      placeholder="Credits charged by UT"
                    />
                  </div>
                </div>

                {editingExam ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mapping status</label>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        editingExam.mapping_status === 'mapped'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {formatMappingStatus(editingExam.mapping_status)}
                    </span>
                    <p className="mt-1 text-xs text-slate-500">
                      Auto-updated when field mappings JSON is saved (Mapped when mappings exist).
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                  Active
                </label>
              </div>

              {/* Field Mappings */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Field Mappings (JSON)
                </label>
                <textarea
                  value={fieldMappingsText}
                  onChange={(e) => setFieldMappingsText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder='{"fullName": {"type": "text", "required": true}, "phone": {"type": "phone"}}'
                />
                <p className="mt-1 text-xs text-slate-500">JSON object mapping user data fields to form configurations</p>
              </div>

              {/* Agent Config */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Agent Config (JSON)
                </label>
                <textarea
                  value={agentConfigText}
                  onChange={(e) => setAgentConfigText(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder='{"max_retries": 3, "screenshot_interval_ms": 1000, "captcha": {"auto_solve_enabled": false}}'
                />
                <p className="mt-1 text-xs text-slate-500">JSON object for LLM agent configuration</p>
              </div>

              {/* Notification Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notify_on_complete"
                    checked={formData.notify_on_complete}
                    onChange={(e) => setFormData({ ...formData, notify_on_complete: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="notify_on_complete" className="text-sm font-medium text-slate-700">
                    Notify on Complete
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notify_on_failure"
                    checked={formData.notify_on_failure}
                    onChange={(e) => setFormData({ ...formData, notify_on_failure: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="notify_on_failure" className="text-sm font-medium text-slate-700">
                    Notify on Failure
                  </label>
                </div>
              </div>

              {/* Notification Emails */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notification Emails (comma-separated)
                </label>
                <input
                  type="text"
                  value={notificationEmailsText}
                  onChange={(e) => setNotificationEmailsText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-[#F6F8FA] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Saving...' : editingExam ? 'Update Exam' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Exam Details</h2>
              <button
                onClick={() => setViewingExam(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Name</label>
                  <p className="text-slate-900">{viewingExam.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Slug</label>
                  <code className="text-sm text-slate-900 bg-slate-100 px-2 py-1 rounded">{viewingExam.slug}</code>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-500 mb-1">URL</label>
                  <a
                    href={viewingExam.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {viewingExam.url}
                  </a>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Status</label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      viewingExam.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {viewingExam.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Created</label>
                  <p className="text-slate-900">
                    {new Date(viewingExam.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Mapping status</label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      viewingExam.mapping_status === 'mapped'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {formatMappingStatus(viewingExam.mapping_status)}
                  </span>
                </div>
                {viewingExam.taxonomy_exam_id && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Linked taxonomy exam</label>
                    <p className="text-slate-900">ID {viewingExam.taxonomy_exam_id}</p>
                  </div>
                )}
              </div>

              {viewingExam.exam_details && (
                <div className="border rounded-lg p-4 bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Portal exam dates & fees</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Application start</span>
                      <p className="text-slate-900">{formatDisplayDate(viewingExam.exam_details.application_start_date)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Application end</span>
                      <p className="text-slate-900">{formatDisplayDate(viewingExam.exam_details.application_close_date)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Hall ticket date</span>
                      <p className="text-slate-900">{formatDisplayDate(viewingExam.exam_details.admit_card_date)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Exam date</span>
                      <p className="text-slate-900">{formatDisplayDate(viewingExam.exam_details.exam_date)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Result date</span>
                      <p className="text-slate-900">{formatDisplayDate(viewingExam.exam_details.result_date)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Counselling start</span>
                      <p className="text-slate-900">{formatDisplayDate(viewingExam.exam_details.counselling_start_date)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Counselling end</span>
                      <p className="text-slate-900">{formatDisplayDate(viewingExam.exam_details.counselling_end_date)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Form fee (₹)</span>
                      <p className="text-slate-900">{formatDisplayFee(viewingExam.exam_details.application_fees)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">UT service fee</span>
                      <p className="text-slate-900">{formatDisplayFee(viewingExam.exam_details.ut_service_fee, ' credits')}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Field Mappings</label>
                <pre className="bg-[#F6F8FA] p-3 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(viewingExam.field_mappings, null, 2)}
                </pre>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Agent Config</label>
                <pre className="bg-[#F6F8FA] p-3 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(viewingExam.agent_config, null, 2)}
                </pre>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Notification Emails</label>
                <p className="text-slate-900">
                  {viewingExam.notification_emails && viewingExam.notification_emails.length > 0
                    ? viewingExam.notification_emails.join(', ')
                    : 'None'}
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setViewingExam(null);
                    handleEdit(viewingExam);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Edit Exam
                </button>
                <button
                  onClick={() => setViewingExam(null)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-[#F6F8FA] transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Exam"
        message="Are you sure you want to delete this exam? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
        </>
      )}
    </div>
  );
}
