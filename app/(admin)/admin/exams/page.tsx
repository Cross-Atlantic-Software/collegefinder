'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { 
  getAllExamsAdmin, 
  createExam, 
  updateExam, 
  deleteExam, 
  deleteAllExams,
  getExamById,
  uploadExamLogo,
  downloadBulkTemplate,
  downloadAllDataExcel,
  bulkUploadExams,
  uploadMissingLogos,
  getExamPrompt,
  updateExamPrompt,
  type Exam,
  type ExamDates,
  type ExamEligibilityCriteria,
  type ExamPattern,
  type ExamCutoff
} from '@/api/admin/exams';
import { getAllStreams, type Stream } from '@/api/admin/streams';
import { getAllSubjects, type Subject } from '@/api/admin/subjects';
import { getAllPrograms, type Program } from '@/api/admin/programs';
import { getAllCareerGoalsAdmin, type CareerGoalAdmin } from '@/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiUpload, FiCalendar, FiUser, FiFileText, FiBarChart, FiTarget, FiEye, FiDownload, FiFile, FiImage, FiGlobe, FiCheckSquare, FiLayout } from 'react-icons/fi';
import { ConfirmationModal, useToast, MultiSelect, Dropdown } from '@/components/shared';
import { AdminTableActions } from '@/components/admin/AdminTableActions';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import Image from 'next/image';

export default function ExamsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [careerGoals, setCareerGoals] = useState<CareerGoalAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [viewingExamData, setViewingExamData] = useState<{
    exam: Exam;
    examDates: ExamDates | null;
    eligibilityCriteria: ExamEligibilityCriteria | null;
    examPattern: ExamPattern | null;
    examCutoff: ExamCutoff | null;
    careerGoalIds: number[];
    programIds: number[];
  } | null>(null);
  const [loadingView, setLoadingView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'examDetails' | 'criteria' | 'pattern' | 'cutoff' | 'contactDetails' | 'careerGoals'>('basic');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    exam_logo: '',
    exam_type: '' as 'National' | 'State' | 'Institute' | '',
    conducting_authority: '',
    format: '',
    number_of_papers: '1',
    website: '',
    examDates: {
      application_start_date: '',
      application_close_date: '',
      exam_date: '',
    },
    eligibilityCriteria: {
      stream_ids: [] as number[],
      subject_ids: [] as number[],
      age_limit_min: '',
      age_limit_max: '',
      attempt_limit: '',
      domicile: '',
    },
    examPattern: {
      mode: '' as 'Offline' | 'Online' | 'Hybrid' | '',
      number_of_questions: '',
      marking_scheme: '',
      duration_minutes: '',
    },
    examCutoff: {
      previous_year_cutoff: '',
      ranks_percentiles: '',
      category_wise_cutoff: '',
      target_rank_range: '',
    },
    careerGoalIds: [] as number[],
    programIds: [] as number[],
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
  const [bulkResult, setBulkResult] = useState<{ created: number; createdExams: { id: number; name: string; code: string }[]; errors: number; errorDetails: { row: number; message: string }[] } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const { canDownloadExcel, isSuperAdmin } = useAdminPermissions();
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [showMissingLogosModal, setShowMissingLogosModal] = useState(false);
  const [missingLogosZipFile, setMissingLogosZipFile] = useState<File | null>(null);
  const [missingLogosUploading, setMissingLogosUploading] = useState(false);
  const [missingLogosResult, setMissingLogosResult] = useState<{
    updated: { id: number; name: string; code: string; logo_file_name?: string }[];
    skipped: string[];
    errors: { file: string; message: string }[];
    summary: { logosAdded: number; filesSkipped: number; uploadErrors: number };
  } | null>(null);
  const [missingLogosError, setMissingLogosError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'exams' | 'prompts'>('exams');
  const [promptsByExamId, setPromptsByExamId] = useState<Record<number, { prompt: string; hasCustomPrompt: boolean }>>({});
  const [savingPromptExamId, setSavingPromptExamId] = useState<number | null>(null);
  const [promptsSectionLoading, setPromptsSectionLoading] = useState(false);
  const [promptExam, setPromptExam] = useState<Exam | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptValue, setPromptValue] = useState('');
  const [hasCustomPrompt, setHasCustomPrompt] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptSaving, setPromptSaving] = useState(false);

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
        exam.code.toLowerCase().includes(searchLower) ||
        (exam.description && exam.description.toLowerCase().includes(searchLower)) ||
        (exam.conducting_authority && exam.conducting_authority.toLowerCase().includes(searchLower))
      );
      setExams(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allExams]);

  useEffect(() => {
    if (activeSection !== 'prompts' || allExams.length === 0) return;
    let cancelled = false;
    const load = async () => {
      setPromptsSectionLoading(true);
      const next: Record<number, { prompt: string; hasCustomPrompt: boolean }> = {};
      for (const exam of allExams) {
        if (cancelled) return;
        try {
          const res = await getExamPrompt(exam.id);
          if (res.success && res.data) {
            next[exam.id] = { prompt: res.data.prompt || '', hasCustomPrompt: !!res.data.hasCustomPrompt };
          } else {
            next[exam.id] = { prompt: '', hasCustomPrompt: false };
          }
        } catch {
          next[exam.id] = { prompt: '', hasCustomPrompt: false };
        }
      }
      if (!cancelled) {
        setPromptsByExamId(next);
      }
      setPromptsSectionLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [activeSection, allExams]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      // Fetch exams (required for this module). Dropdowns (streams, subjects, career goals) are optional
      // and may 403 if user doesn't have those modules — use allSettled so one 403 doesn't break the page.
      const [examsRes, streamsRes, subjectsRes, programsRes, careerGoalsRes] = await Promise.allSettled([
        getAllExamsAdmin(),
        getAllStreams(),
        getAllSubjects(),
        getAllPrograms(),
        getAllCareerGoalsAdmin(),
      ]);

      const examsData = examsRes.status === 'fulfilled' ? examsRes.value : null;
      const streamsData = streamsRes.status === 'fulfilled' ? streamsRes.value : null;
      const subjectsData = subjectsRes.status === 'fulfilled' ? subjectsRes.value : null;
      const programsData = programsRes.status === 'fulfilled' ? programsRes.value : null;
      const careerGoalsData = careerGoalsRes.status === 'fulfilled' ? careerGoalsRes.value : null;

      if (examsData?.success && examsData?.data) {
        setAllExams(examsData.data.exams);
        setExams(examsData.data.exams);
      } else if (examsData && !examsData.success) {
        setError(examsData.message || 'Failed to load exams');
      }
      if (streamsData?.success && streamsData?.data) {
        setStreams(streamsData.data.streams.filter((s: Stream) => s.status));
      }
      if (subjectsData?.success && subjectsData?.data) {
        setSubjects(subjectsData.data.subjects.filter((s: Subject) => s.status));
      }
      if (programsData?.success && programsData?.data?.programs) {
        setPrograms(programsData.data.programs.filter((p: Program) => p.status));
      }
      if (careerGoalsData?.success && careerGoalsData?.data) {
        setCareerGoals(careerGoalsData.data.careerGoals.filter((cg: CareerGoalAdmin) => cg.status !== false));
      }
    } catch (err) {
      setError('An error occurred while fetching data');
      console.error('Error fetching data:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setUploading(true);
      const response = await uploadExamLogo(file);
      if (response.success && response.data?.logoUrl) {
        const logoUrl = response.data.logoUrl;
        setFormData((prev) => ({ ...prev, exam_logo: logoUrl }));
        setLogoPreview(logoUrl);
        setError(null);
        showSuccess('Logo uploaded successfully');
      } else {
        const errorMsg = response.message || 'Failed to upload logo';
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'An error occurred while uploading logo';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error uploading logo:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      handleLogoUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const submitData = {
        name: formData.name,
        code: formData.code,
        description: formData.description || undefined,
        exam_logo: formData.exam_logo || null,
        exam_type: formData.exam_type || null,
        conducting_authority: formData.conducting_authority || null,
        format: (() => {
          const v = formData.format?.trim();
          if (!v) return undefined;
          try {
            return JSON.parse(v) as unknown;
          } catch {
            return undefined;
          }
        })(),
        number_of_papers: formData.number_of_papers ? parseInt(formData.number_of_papers, 10) : 1,
        website: formData.website || null,
        examDates: {
          application_start_date: formData.examDates.application_start_date || null,
          application_close_date: formData.examDates.application_close_date || null,
          exam_date: formData.examDates.exam_date || null,
        },
        eligibilityCriteria: {
          stream_ids: formData.eligibilityCriteria.stream_ids,
          subject_ids: formData.eligibilityCriteria.subject_ids,
          age_limit_min: formData.eligibilityCriteria.age_limit_min ? parseInt(formData.eligibilityCriteria.age_limit_min) : null,
          age_limit_max: formData.eligibilityCriteria.age_limit_max ? parseInt(formData.eligibilityCriteria.age_limit_max) : null,
          attempt_limit: formData.eligibilityCriteria.attempt_limit ? parseInt(formData.eligibilityCriteria.attempt_limit) : null,
          domicile: formData.eligibilityCriteria.domicile || null,
        },
        examPattern: {
          mode: formData.examPattern.mode || null,
          number_of_questions: formData.examPattern.number_of_questions ? parseInt(formData.examPattern.number_of_questions) : null,
          marking_scheme: formData.examPattern.marking_scheme || null,
          duration_minutes: formData.examPattern.duration_minutes ? parseInt(formData.examPattern.duration_minutes) : null,
        },
        examCutoff: {
          previous_year_cutoff: formData.examCutoff.previous_year_cutoff || null,
          ranks_percentiles: formData.examCutoff.ranks_percentiles || null,
          category_wise_cutoff: (() => {
            const v = formData.examCutoff.category_wise_cutoff;
            if (v == null) return null;
            const s = typeof v === 'string' ? v : String(v);
            return s.trim() === '' ? null : s.trim();
          })(),
          target_rank_range: formData.examCutoff.target_rank_range || null,
        },
        careerGoalIds: formData.careerGoalIds || [],
        programIds: formData.programIds || [],
      };

      if (editingExam) {
        const response = await updateExam(editingExam.id, submitData);
        if (response.success && response.data) {
          showSuccess('Exam updated successfully');
          // Update list immediately with server response so UI reflects changes
          const updatedExam = response.data.exam;
          setAllExams((prev) => prev.map((e) => (e.id === editingExam.id ? updatedExam : e)));
          setExams((prev) => prev.map((e) => (e.id === editingExam.id ? updatedExam : e)));
          await fetchData(true);
          handleModalClose();
        } else {
          setError(response.message || 'Failed to update exam');
          showError(response.message || 'Failed to update exam');
        }
      } else {
        const response = await createExam(submitData);
        if (response.success && response.data) {
          showSuccess('Exam created successfully');
          await fetchData(true);
          handleModalClose();
        } else {
          setError(response.message || 'Failed to create exam');
          showError(response.message || 'Failed to create exam');
        }
      }
    } catch (err) {
      const errorMsg = 'An error occurred while saving exam';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving exam:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleView = async (exam: Exam) => {
    try {
      setLoadingView(true);
      const response = await getExamById(exam.id);
      if (response.success && response.data) {
        setViewingExamData(response.data);
      } else {
        showError('Failed to load exam details');
      }
    } catch (err) {
      showError('Failed to load exam details');
      console.error('Error loading exam:', err);
    } finally {
      setLoadingView(false);
    }
  };

  const toDateInputValue = (val: string | Date | null | undefined): string => {
    if (val == null || val === '') return '';
    if (typeof val === 'string') {
      const match = val.slice(0, 10).match(/^\d{4}-\d{2}-\d{2}$/);
      return match ? val.slice(0, 10) : val;
    }
    const d = val as Date;
    return d.toISOString ? d.toISOString().slice(0, 10) : '';
  };

  const toNumArray = (val: unknown): number[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((n) => (typeof n === 'number' ? n : parseInt(String(n), 10))).filter((n) => !isNaN(n));
    return [];
  };

  const handleEdit = async (exam: Exam) => {
    try {
      setIsLoading(true);
      const response = await getExamById(exam.id);
      if (response.success && response.data) {
        const data = response.data;
        const e = data.exam;
        const nextForm: typeof formData = {
          name: e?.name ?? '',
          code: e?.code ?? '',
          description: e?.description ?? '',
          exam_logo: e?.exam_logo ?? '',
          exam_type: (e?.exam_type as 'National' | 'State' | 'Institute') ?? '',
          conducting_authority: e?.conducting_authority ?? '',
          format: e?.format != null ? (typeof e.format === 'object' ? JSON.stringify(e.format, null, 2) : String(e.format)) : '',
          number_of_papers: e?.number_of_papers != null ? String(e.number_of_papers) : '1',
          website: e?.website ?? '',
          examDates: {
            application_start_date: toDateInputValue(data.examDates?.application_start_date),
            application_close_date: toDateInputValue(data.examDates?.application_close_date),
            exam_date: toDateInputValue(data.examDates?.exam_date),
          },
          eligibilityCriteria: {
            stream_ids: toNumArray(data.eligibilityCriteria?.stream_ids),
            subject_ids: toNumArray(data.eligibilityCriteria?.subject_ids),
            age_limit_min: data.eligibilityCriteria?.age_limit_min != null ? String(data.eligibilityCriteria.age_limit_min) : '',
            age_limit_max: data.eligibilityCriteria?.age_limit_max != null ? String(data.eligibilityCriteria.age_limit_max) : '',
            attempt_limit: data.eligibilityCriteria?.attempt_limit != null ? String(data.eligibilityCriteria.attempt_limit) : '',
            domicile: data.eligibilityCriteria?.domicile ?? '',
          },
          examPattern: {
            mode: (data.examPattern?.mode as 'Offline' | 'Online' | 'Hybrid') ?? '',
            number_of_questions: data.examPattern?.number_of_questions != null ? String(data.examPattern.number_of_questions) : '',
            marking_scheme: data.examPattern?.marking_scheme ?? '',
            duration_minutes: data.examPattern?.duration_minutes != null ? String(data.examPattern.duration_minutes) : '',
          },
          examCutoff: {
            previous_year_cutoff: data.examCutoff?.previous_year_cutoff ?? '',
            ranks_percentiles: data.examCutoff?.ranks_percentiles ?? '',
            category_wise_cutoff: data.examCutoff?.category_wise_cutoff ?? '',
            target_rank_range: data.examCutoff?.target_rank_range ?? '',
          },
          careerGoalIds: toNumArray(data.careerGoalIds),
          programIds: toNumArray(data.programIds),
        };
        setEditingExam(e ?? exam);
        setFormData(nextForm);
        setLogoPreview(e?.exam_logo ?? null);
        setLogoFile(null);
        setActiveTab('basic');
        requestAnimationFrame(() => setShowModal(true));
      }
    } catch (err) {
      showError('Failed to load exam details');
      console.error('Error loading exam:', err);
    } finally {
      setIsLoading(false);
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
      const response = await deleteExam(deletingId);
      if (response.success) {
        showSuccess('Exam deleted successfully');
        fetchData();
      } else {
        showError(response.message || 'Failed to delete exam');
      }
    } catch (err) {
      showError('An error occurred while deleting exam');
      console.error('Error deleting exam:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const handleCreate = () => {
    setEditingExam(null);
    resetForm();
    setActiveTab('basic');
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      exam_logo: '',
      exam_type: '',
      conducting_authority: '',
      format: '',
      number_of_papers: '1',
      website: '',
      examDates: {
        application_start_date: '',
        application_close_date: '',
        exam_date: '',
      },
      eligibilityCriteria: {
        stream_ids: [],
        subject_ids: [],
        age_limit_min: '',
        age_limit_max: '',
        attempt_limit: '',
        domicile: '',
      },
      examPattern: {
        mode: '',
        number_of_questions: '',
        marking_scheme: '',
        duration_minutes: '',
      },
      examCutoff: {
        previous_year_cutoff: '',
        ranks_percentiles: '',
        category_wise_cutoff: '',
        target_rank_range: '',
      },
      careerGoalIds: [],
      programIds: [],
    });
    setLogoFile(null);
    setLogoPreview(null);
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingExam(null);
    resetForm();
    setActiveTab('basic');
  };

  const handleBulkTemplateDownload = async () => {
    try {
      await downloadBulkTemplate();
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
      const response = await deleteAllExams();
      if (response.success) {
        showSuccess(response.message || 'All exams deleted successfully');
        setShowDeleteAllConfirm(false);
        fetchData(true);
      } else {
        showError(response.message || 'Failed to delete all exams');
        setShowDeleteAllConfirm(false);
      }
    } catch (err) {
      showError('An error occurred while deleting all exams');
      setShowDeleteAllConfirm(false);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkExcelFile) {
      showError('Please select an Excel file');
      return;
    }
    setBulkUploading(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const res = await bulkUploadExams(bulkExcelFile, bulkLogoFiles, bulkLogosZipFile);
      if (res.success && res.data) {
        setBulkResult(res.data);
        showSuccess(res.message || `Created ${res.data.created} exam(s)`);
        fetchData(true);
      } else {
        setBulkError(res.message || 'Bulk upload failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bulk upload failed';
      setBulkError(msg);
      showError(msg);
      const errData = err && typeof err === 'object' && 'data' in err ? (err as { data?: { errorDetails?: { row: number; message: string }[] } }).data : undefined;
      if (errData?.errorDetails?.length) {
        setBulkResult({ created: 0, createdExams: [], errors: errData.errorDetails.length, errorDetails: errData.errorDetails });
      }
    } finally {
      setBulkUploading(false);
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
      const res = await uploadMissingLogos(missingLogosZipFile);
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

  type ExamFormTabId = 'basic' | 'examDetails' | 'criteria' | 'pattern' | 'cutoff' | 'contactDetails' | 'careerGoals';
  const tabs: { id: ExamFormTabId; label: string; icon: typeof FiFileText }[] = [
    { id: 'basic', label: 'Basic Info', icon: FiFileText },
    { id: 'examDetails', label: 'Exam Details', icon: FiCalendar },
    { id: 'criteria', label: 'Criteria', icon: FiCheckSquare },
    { id: 'pattern', label: 'Pattern', icon: FiLayout },
    { id: 'cutoff', label: 'Rank & Cutoff', icon: FiBarChart },
    { id: 'contactDetails', label: 'Contact Details', icon: FiGlobe },
    { id: 'careerGoals', label: 'Interests', icon: FiTarget },
  ];

  const handleOpenPrompt = async (exam: Exam) => {
    setPromptExam(exam);
    setShowPromptModal(true);
    setPromptValue('');
    setHasCustomPrompt(false);
    setPromptLoading(true);
    try {
      const res = await getExamPrompt(exam.id);
      if (res.success && res.data) {
        setPromptValue(res.data.prompt || '');
        setHasCustomPrompt(!!res.data.hasCustomPrompt);
      }
    } catch {
      showError('Failed to load prompt');
    } finally {
      setPromptLoading(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!promptExam) return;
    setPromptSaving(true);
    try {
      const res = await updateExamPrompt(promptExam.id, promptValue);
      if (res.success) {
        showSuccess('Prompt updated. It will be used for mock question generation for this exam.');
        setHasCustomPrompt(!!(promptValue && promptValue.trim()));
      } else {
        showError(res.message || 'Failed to save prompt');
      }
    } catch {
      showError('Failed to save prompt');
    } finally {
      setPromptSaving(false);
    }
  };

  const handleClosePromptModal = () => {
    setShowPromptModal(false);
    setPromptExam(null);
    setPromptValue('');
  };

  const setPromptForExam = (examId: number, prompt: string) => {
    setPromptsByExamId((prev) => ({
      ...prev,
      [examId]: {
        ...prev[examId],
        prompt,
        hasCustomPrompt: prev[examId]?.hasCustomPrompt ?? false,
      },
    }));
  };

  const handleSavePromptInSection = async (exam: Exam) => {
    const current = promptsByExamId[exam.id];
    if (current === undefined) return;
    setSavingPromptExamId(exam.id);
    try {
      const res = await updateExamPrompt(exam.id, current.prompt);
      if (res.success) {
        showSuccess(`Prompt saved for ${exam.name}`);
        setPromptsByExamId((prev) => ({
          ...prev,
          [exam.id]: { ...prev[exam.id], prompt: current.prompt, hasCustomPrompt: !!(current.prompt && current.prompt.trim()) },
        }));
      } else {
        showError(res.message || 'Failed to save prompt');
      }
    } catch {
      showError('Failed to save prompt');
    } finally {
      setSavingPromptExamId(null);
    }
  };

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.replace('/admin/login')}
            className="text-pink hover:underline"
          >
            Go to login
          </button>
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Exams Manager</h1>
            <p className="text-sm text-gray-600">Manage exam options with all related information.</p>
          </div>

          {/* Section tabs: Exams | Generation prompts */}
          <div className="mb-4 flex gap-1 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveSection('exams')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeSection === 'exams'
                  ? 'bg-white border border-gray-200 border-b-0 -mb-px text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Exams
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('prompts')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeSection === 'prompts'
                  ? 'bg-white border border-gray-200 border-b-0 -mb-px text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Generation prompts
            </button>
          </div>

          {/* Controls (only for Exams section) */}
          {activeSection === 'exams' && (
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All exams</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allExams.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, code, description, or authority"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none w-64 transition-all duration-200"
                />
              </div>
            </div>
            <div className="inline-flex items-center gap-2">
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <FiPlus className="h-4 w-4" />
                Add Exam
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiUpload className="h-4 w-4" />
                Bulk upload (Excel)
              </button>
              {allExams.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMissingLogosModal(true);
                    setMissingLogosZipFile(null);
                    setMissingLogosResult(null);
                    setMissingLogosError(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiUpload className="h-4 w-4" />
                  Upload missing logos
                </button>
              )}
              {isSuperAdmin && allExams.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadAllExcel}
                  disabled={downloadingExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <FiDownload className="h-4 w-4" />
                  {downloadingExcel ? 'Downloading...' : 'Download Excel'}
                </button>
              )}
              {isSuperAdmin && allExams.length > 0 && (
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
          )}

          {/* Error Message (Exams section) */}
          {activeSection === 'exams' && error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Exams Table */}
          {activeSection === 'exams' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading exams...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">LOGO</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">CODE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">TYPE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">AUTHORITY</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {exams.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                          {exams.length < allExams.length ? 'No exams found matching your search' : 'No exams found'}
                        </td>
                      </tr>
                    ) : (
                      exams.map((exam) => (
                        <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            <div className="h-12 w-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                              {exam.exam_logo ? (
                                <Image
                                  src={exam.exam_logo}
                                  alt={exam.name}
                                  width={48}
                                  height={48}
                                  className="object-contain"
                                  unoptimized
                                />
                              ) : (
                                <span className="text-xs text-gray-400">No logo</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{exam.name}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-600 font-mono">{exam.code}</span>
                          </td>
                          <td className="px-4 py-2">
                            {exam.exam_type && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {exam.exam_type}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-xs text-gray-600">{exam.conducting_authority || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <AdminTableActions
                              onView={() => handleView(exam)}
                              onEdit={() => handleEdit(exam)}
                              onDelete={() => handleDeleteClick(exam.id)}
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
          )}

          {/* Generation prompts section: all exams from DB with prompt edit */}
          {activeSection === 'prompts' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Set an exam-specific prompt for mock question generation. When set, it is used instead of the generic prompt. Placeholders: {'{{exam_name}}'}, {'{{subject}}'}, {'{{difficulty}}'}, {'{{topic}}'}, {'{{section_name}}'}, {'{{section_type}}'}, {'{{question_type}}'}
              </p>
              {promptsSectionLoading ? (
                <div className="py-8 text-center text-gray-500">Loading prompts for all exams...</div>
              ) : (
                <div className="space-y-4">
                  {allExams.map((exam) => {
                    const data = promptsByExamId[exam.id];
                    const promptText = data?.prompt ?? '';
                    const isSaving = savingPromptExamId === exam.id;
                    return (
                      <div
                        key={exam.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                      >
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">{exam.name}</span>
                            <span className="ml-2 text-sm text-gray-500 font-mono">{exam.code}</span>
                            {data?.hasCustomPrompt && (
                              <span className="ml-2 text-xs text-green-600 font-medium">Custom prompt set</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSavePromptInSection(exam)}
                            disabled={isSaving || data === undefined}
                            className="px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? 'Saving...' : 'Save prompt'}
                          </button>
                        </div>
                        <div className="p-4">
                          <textarea
                            value={data === undefined ? '' : promptText}
                            onChange={(e) => setPromptForExam(exam.id, e.target.value)}
                            placeholder="Leave empty to use the generic prompt, or enter exam-specific instructions..."
                            rows={8}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none resize-y font-mono"
                          />
                        </div>
                      </div>
                    );
                  })}
                  {allExams.length === 0 && (
                    <p className="text-sm text-gray-500 py-4">No exams in the database. Add exams in the Exams tab first.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingExam ? 'Edit Exam' : 'Create Exam'}
              </h2>
              <button
                onClick={handleModalClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 px-4 flex gap-2 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-pink text-pink'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Exam Name <span className="text-pink">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="e.g., JEE Main, NEET"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Code <span className="text-pink">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                        required
                        placeholder="e.g., JEE_MAIN, NEET"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter exam description..."
                        rows={3}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Exam Logo
                      </label>
                      <div className="space-y-2">
                        {logoPreview && (
                          <div className="relative h-32 w-32 rounded-md overflow-hidden bg-gray-100 border border-gray-300">
                            <Image
                              src={logoPreview}
                              alt="Exam logo preview"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                          <FiUpload className="h-4 w-4" />
                          <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                        {uploading && <p className="text-xs text-gray-500">Uploading...</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Exam Type
                      </label>
                      <Dropdown
                        value={formData.exam_type || null}
                        onChange={(v) => setFormData({ ...formData, exam_type: v })}
                        options={[
                          { value: 'National', label: 'National' },
                          { value: 'State', label: 'State' },
                          { value: 'Institute', label: 'Institute' },
                        ]}
                        placeholder="Select type"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Conducting Authority
                      </label>
                      <input
                        type="text"
                        value={formData.conducting_authority}
                        onChange={(e) => setFormData({ ...formData, conducting_authority: e.target.value })}
                        placeholder="e.g., NTA, CBSE"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Number of papers (mock tests)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={formData.number_of_papers}
                        onChange={(e) => setFormData({ ...formData, number_of_papers: e.target.value })}
                        placeholder="1"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Use 2 for exams like JEE Advanced that have 2 papers per mock.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Format (JSON)
                      </label>
                      <textarea
                        value={formData.format}
                        onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                        placeholder='e.g. {"Physics": {"marks": 100}, "Chemistry": {"marks": 100}}'
                        rows={4}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none resize-none font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">Optional. JSON object describing exam format/structure. Same as in bulk template.</p>
                    </div>
                  </>
                )}

                {/* Exam Details Tab */}
                {activeTab === 'examDetails' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Application Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.examDates.application_start_date}
                        onChange={(e) => setFormData({
                          ...formData,
                          examDates: { ...formData.examDates, application_start_date: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Application Close Date
                      </label>
                      <input
                        type="date"
                        value={formData.examDates.application_close_date}
                        onChange={(e) => setFormData({
                          ...formData,
                          examDates: { ...formData.examDates, application_close_date: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Exam Date(s)
                      </label>
                      <input
                        type="date"
                        value={formData.examDates.exam_date}
                        onChange={(e) => setFormData({
                          ...formData,
                          examDates: { ...formData.examDates, exam_date: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Mode (Online / Offline)
                      </label>
                      <Dropdown
                        value={formData.examPattern.mode || null}
                        onChange={(v) => setFormData({
                          ...formData,
                          examPattern: { ...formData.examPattern, mode: v }
                        })}
                        options={[
                          { value: 'Offline', label: 'Offline' },
                          { value: 'Online', label: 'Online' },
                          { value: 'Hybrid', label: 'Hybrid' },
                        ]}
                        placeholder="Select mode"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Domicile
                      </label>
                      <input
                        type="text"
                        value={formData.eligibilityCriteria.domicile}
                        onChange={(e) => setFormData({
                          ...formData,
                          eligibilityCriteria: { ...formData.eligibilityCriteria, domicile: e.target.value }
                        })}
                        placeholder="e.g., All India, Maharashtra, Delhi"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Criteria Tab */}
                {activeTab === 'criteria' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Required Streams
                      </label>
                      <MultiSelect
                        options={streams.map(s => ({ value: s.id.toString(), label: s.name }))}
                        value={formData.eligibilityCriteria.stream_ids.map(id => id.toString())}
                        onChange={(selected) => setFormData({
                          ...formData,
                          eligibilityCriteria: {
                            ...formData.eligibilityCriteria,
                            stream_ids: selected.map(s => parseInt(s))
                          }
                        })}
                        placeholder="Select streams"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Required Subjects
                      </label>
                      <MultiSelect
                        options={subjects.map(s => ({ value: s.id.toString(), label: s.name }))}
                        value={formData.eligibilityCriteria.subject_ids.map(id => id.toString())}
                        onChange={(selected) => setFormData({
                          ...formData,
                          eligibilityCriteria: {
                            ...formData.eligibilityCriteria,
                            subject_ids: selected.map(s => parseInt(s))
                          }
                        })}
                        placeholder="Select subjects"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Minimum Age
                        </label>
                        <input
                          type="number"
                          value={formData.eligibilityCriteria.age_limit_min}
                          onChange={(e) => setFormData({
                            ...formData,
                            eligibilityCriteria: { ...formData.eligibilityCriteria, age_limit_min: e.target.value }
                          })}
                          placeholder="e.g., 17"
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Maximum Age
                        </label>
                        <input
                          type="number"
                          value={formData.eligibilityCriteria.age_limit_max}
                          onChange={(e) => setFormData({
                            ...formData,
                            eligibilityCriteria: { ...formData.eligibilityCriteria, age_limit_max: e.target.value }
                          })}
                          placeholder="e.g., 25"
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Attempt Limit
                      </label>
                      <input
                        type="number"
                        value={formData.eligibilityCriteria.attempt_limit}
                        onChange={(e) => setFormData({
                          ...formData,
                          eligibilityCriteria: { ...formData.eligibilityCriteria, attempt_limit: e.target.value }
                        })}
                        placeholder="e.g., 3"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Programs
                      </label>
                      <MultiSelect
                        options={programs.map((p) => ({ value: p.id.toString(), label: p.name }))}
                        value={formData.programIds.map((id) => id.toString())}
                        onChange={(selected) => setFormData({ ...formData, programIds: selected.map((s) => parseInt(s, 10)) })}
                        placeholder="Select programs (e.g. B.Tech, MBBS)"
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {/* Pattern Tab */}
                {activeTab === 'pattern' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Number of Questions
                      </label>
                      <input
                        type="number"
                        value={formData.examPattern.number_of_questions}
                        onChange={(e) => setFormData({
                          ...formData,
                          examPattern: { ...formData.examPattern, number_of_questions: e.target.value }
                        })}
                        placeholder="e.g., 90"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Marking Scheme
                      </label>
                      <textarea
                        value={formData.examPattern.marking_scheme}
                        onChange={(e) => setFormData({
                          ...formData,
                          examPattern: { ...formData.examPattern, marking_scheme: e.target.value }
                        })}
                        placeholder="e.g., +4 for correct, -1 for incorrect"
                        rows={3}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={formData.examPattern.duration_minutes}
                        onChange={(e) => setFormData({
                          ...formData,
                          examPattern: { ...formData.examPattern, duration_minutes: e.target.value }
                        })}
                        placeholder="e.g., 180"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Cutoff Tab */}
                {activeTab === 'cutoff' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Previous Year Cutoff
                      </label>
                      <textarea
                        value={formData.examCutoff.previous_year_cutoff}
                        onChange={(e) => setFormData({
                          ...formData,
                          examCutoff: { ...formData.examCutoff, previous_year_cutoff: e.target.value }
                        })}
                        placeholder="Enter previous year cutoff details (JSON or text)"
                        rows={3}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none resize-none font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Ranks/Percentiles
                      </label>
                      <textarea
                        value={formData.examCutoff.ranks_percentiles}
                        onChange={(e) => setFormData({
                          ...formData,
                          examCutoff: { ...formData.examCutoff, ranks_percentiles: e.target.value }
                        })}
                        placeholder="Enter ranks and percentiles information (JSON or text)"
                        rows={3}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none resize-none font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Category-wise Cutoff
                      </label>
                      <textarea
                        value={formData.examCutoff.category_wise_cutoff ?? ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          examCutoff: { ...formData.examCutoff, category_wise_cutoff: e.target.value }
                        })}
                        placeholder='e.g. {"General": 95, "OBC": 90, "SC": 85, "ST": 80} (use double quotes in JSON)'
                        rows={3}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none resize-none font-mono text-xs"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter as JSON object or plain text. Stored as text.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Target Rank Range for Top Colleges
                      </label>
                      <textarea
                        value={formData.examCutoff.target_rank_range}
                        onChange={(e) => setFormData({
                          ...formData,
                          examCutoff: { ...formData.examCutoff, target_rank_range: e.target.value }
                        })}
                        placeholder="Enter target rank range for top colleges (JSON or text)"
                        rows={3}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none resize-none font-mono text-xs"
                      />
                    </div>
                  </>
                )}

                {/* Contact Details Tab */}
                {activeTab === 'contactDetails' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="e.g., https://jeemain.nta.nic.in"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Interests Tab */}
                {activeTab === 'careerGoals' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Related Interests
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Select interests that are related to this exam
                      </p>
                      <MultiSelect
                        options={careerGoals.map(cg => ({ value: cg.id.toString(), label: cg.label }))}
                        value={formData.careerGoalIds.map(id => id.toString())}
                        onChange={(selected) => setFormData({
                          ...formData,
                          careerGoalIds: selected.map(s => parseInt(s))
                        })}
                        placeholder="Select interests"
                      />
                    </div>
                  </>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                    {error}
                  </div>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-3 flex justify-end">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSaving || uploading || !formData.name || !formData.code}
                className="px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : editingExam ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Exam Modal */}
      {viewingExamData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Exam Details</h2>
              <button
                type="button"
                onClick={() => setViewingExamData(null)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto space-y-4">
              {viewingExamData.exam.exam_logo && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Logo</label>
                  <div className="relative h-24 w-24 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                    <Image
                      src={viewingExamData.exam.exam_logo}
                      alt={viewingExamData.exam.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <p className="text-sm text-gray-900 font-medium">{viewingExamData.exam.name}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
                <p className="text-sm text-gray-900 font-mono">{viewingExamData.exam.code}</p>
              </div>
              {viewingExamData.exam.description && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingExamData.exam.description}</p>
                </div>
              )}
              {viewingExamData.exam.exam_type && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Exam Type</label>
                  <p className="text-sm text-gray-900">{viewingExamData.exam.exam_type}</p>
                </div>
              )}
              {viewingExamData.exam.conducting_authority && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Conducting Authority</label>
                  <p className="text-sm text-gray-900">{viewingExamData.exam.conducting_authority}</p>
                </div>
              )}
              {viewingExamData.exam.number_of_papers != null && viewingExamData.exam.number_of_papers !== 1 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Number of papers (mock tests)</label>
                  <p className="text-sm text-gray-900">{viewingExamData.exam.number_of_papers}</p>
                </div>
              )}
              {viewingExamData.examDates && (viewingExamData.examDates.application_start_date || viewingExamData.examDates.application_close_date || viewingExamData.examDates.exam_date) && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Exam Details</label>
                  <div className="text-sm text-gray-900 space-y-1">
                    {viewingExamData.examDates.application_start_date && <p>Application start: {viewingExamData.examDates.application_start_date}</p>}
                    {viewingExamData.examDates.application_close_date && <p>Application close: {viewingExamData.examDates.application_close_date}</p>}
                    {viewingExamData.examDates.exam_date && <p>Exam date: {viewingExamData.examDates.exam_date}</p>}
                    {viewingExamData.examPattern?.mode && <p>Mode: {viewingExamData.examPattern.mode}</p>}
                    {viewingExamData.eligibilityCriteria?.domicile && <p>Domicile: {viewingExamData.eligibilityCriteria.domicile}</p>}
                  </div>
                </div>
              )}
              {viewingExamData.eligibilityCriteria && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Criteria</label>
                  <div className="text-sm text-gray-900 space-y-1">
                    {viewingExamData.eligibilityCriteria.stream_ids?.length > 0 && <p>Required Streams: {viewingExamData.eligibilityCriteria.stream_ids.map((id) => streams.find((s) => s.id === id)?.name ?? id).join(', ')}</p>}
                    {viewingExamData.eligibilityCriteria.subject_ids?.length > 0 && <p>Subject Requirements: {viewingExamData.eligibilityCriteria.subject_ids.map((id) => subjects.find((s) => s.id === id)?.name ?? id).join(', ')}</p>}
                    {(viewingExamData.eligibilityCriteria.age_limit_min != null || viewingExamData.eligibilityCriteria.age_limit_max != null) && (
                      <p>Age Limits: {viewingExamData.eligibilityCriteria.age_limit_min ?? '–'} – {viewingExamData.eligibilityCriteria.age_limit_max ?? '–'}</p>
                    )}
                    {viewingExamData.eligibilityCriteria.attempt_limit != null && <p>Attempt Limits: {viewingExamData.eligibilityCriteria.attempt_limit}</p>}
                  </div>
                </div>
              )}
              {viewingExamData.examPattern && (viewingExamData.examPattern.number_of_questions || viewingExamData.examPattern.duration_minutes || viewingExamData.examPattern.marking_scheme) && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Pattern</label>
                  <div className="text-sm text-gray-900 space-y-1">
                    {viewingExamData.examPattern.number_of_questions != null && <p>Number of Questions: {viewingExamData.examPattern.number_of_questions}</p>}
                    {viewingExamData.examPattern.marking_scheme && <p className="whitespace-pre-wrap">Marking Scheme: {viewingExamData.examPattern.marking_scheme}</p>}
                    {viewingExamData.examPattern.duration_minutes != null && <p>Duration: {viewingExamData.examPattern.duration_minutes} min</p>}
                  </div>
                </div>
              )}
              {viewingExamData.examCutoff && (viewingExamData.examCutoff.previous_year_cutoff || viewingExamData.examCutoff.ranks_percentiles || viewingExamData.examCutoff.category_wise_cutoff) && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rank & Cutoff</label>
                  <div className="text-sm text-gray-900 space-y-1">
                    {viewingExamData.examCutoff.previous_year_cutoff && <p className="whitespace-pre-wrap">Previous year: {viewingExamData.examCutoff.previous_year_cutoff}</p>}
                    {viewingExamData.examCutoff.ranks_percentiles && <p className="whitespace-pre-wrap">Ranks: {viewingExamData.examCutoff.ranks_percentiles}</p>}
                    {viewingExamData.examCutoff.category_wise_cutoff && <p className="whitespace-pre-wrap">Category: {viewingExamData.examCutoff.category_wise_cutoff}</p>}
                    {viewingExamData.examCutoff.target_rank_range && <p className="whitespace-pre-wrap">Target rank: {viewingExamData.examCutoff.target_rank_range}</p>}
                  </div>
                </div>
              )}
              {viewingExamData.exam.website && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Details</label>
                  <div className="text-sm text-gray-900 space-y-1">
                    <p>Website: <a href={viewingExamData.exam.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{viewingExamData.exam.website}</a></p>
                  </div>
                </div>
              )}
              {viewingExamData.careerGoalIds?.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Interests</label>
                  <p className="text-sm text-gray-900">
                    {viewingExamData.careerGoalIds.map((id) => careerGoals.find((cg) => cg.id === id)?.label ?? id).join(', ') || viewingExamData.careerGoalIds.join(', ')}
                  </p>
                </div>
              )}
              {viewingExamData.programIds?.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Programs</label>
                  <p className="text-sm text-gray-900">
                    {viewingExamData.programIds.map((id) => programs.find((p) => p.id === id)?.name ?? id).join(', ')}
                  </p>
                </div>
              )}
              {viewingExamData.exam.format != null && typeof viewingExamData.exam.format === 'object' && Object.keys(viewingExamData.exam.format as object).length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Format</label>
                  <pre className="text-xs text-gray-900 bg-gray-50 p-2 rounded overflow-auto max-h-40">{JSON.stringify(viewingExamData.exam.format, null, 2)}</pre>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-sm text-gray-900">{new Date(viewingExamData.exam.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Updated</label>
                  <p className="text-sm text-gray-900">{new Date(viewingExamData.exam.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-darkGradient text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <FiUpload className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Bulk upload exams</h2>
                  <p className="text-xs text-white/80">Excel + optional logos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 overflow-auto space-y-5">
              {/* Step 1: Template */}
              {canDownloadExcel && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="h-10 w-10 rounded-lg bg-darkGradient flex items-center justify-center text-white shrink-0">
                    <FiDownload className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">Get the template</p>
                    <p className="text-xs text-gray-500 mt-0.5">Download the Excel file with all columns</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleBulkTemplateDownload}
                    className="shrink-0 px-3 py-1.5 text-sm font-medium text-white bg-darkGradient rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Download
                  </button>
                </div>
              )}

              {/* Excel file */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  Excel file <span className="text-red-500">*</span>
                </p>
                <label className="block w-full">
                  <div className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer w-full min-h-[120px] ${bulkExcelFile ? 'border-pink/50 bg-pink/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'}`}>
                    <FiFile className={`h-10 w-10 ${bulkExcelFile ? 'text-pink' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-700">
                      {bulkExcelFile ? bulkExcelFile.name : 'Choose Excel file (.xlsx, .xls)'}
                    </span>
                    {bulkExcelFile ? (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBulkExcelFile(null); }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setBulkExcelFile(e.target.files?.[0] ?? null)}
                    className="sr-only"
                  />
                </label>
              </div>

              {/* Logos ZIP */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  Logos ZIP <span className="text-xs font-normal text-gray-500">(optional)</span>
                </p>
                <label className="block w-full">
                  <div className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer w-full min-h-[120px] ${bulkLogosZipFile ? 'border-pink/50 bg-pink/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'}`}>
                    <FiImage className={`h-10 w-10 ${bulkLogosZipFile ? 'text-pink' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-700">
                      {bulkLogosZipFile ? bulkLogosZipFile.name : 'Choose ZIP file'}
                    </span>
                    {bulkLogosZipFile && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBulkLogosZipFile(null); setBulkLogoFiles([]); }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setBulkLogosZipFile(file ?? null);
                      if (file) setBulkLogoFiles([]);
                      e.target.value = '';
                    }}
                    className="sr-only"
                  />
                </label>
              </div>

              {bulkError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <FiX className="h-4 w-4 shrink-0 mt-0.5" />
                  {bulkError}
                </div>
              )}
              {bulkResult && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm space-y-1">
                  <p className="font-medium text-gray-900">Created: {bulkResult.created}</p>
                  {bulkResult.errors > 0 && (
                    <p className="text-amber-700">Errors: {bulkResult.errors}</p>
                  )}
                  {bulkResult.errorDetails?.length > 0 && (
                    <ul className="mt-2 text-xs text-gray-600 list-disc list-inside max-h-32 overflow-y-auto">
                      {bulkResult.errorDetails.map((e, i) => (
                        <li key={i}>Row {e.row}: {e.message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 pt-1">
                Note: Put all logo images in one ZIP. File names inside the ZIP must match <strong>logo_filename</strong> in Excel.
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={!bulkExcelFile || bulkUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-darkGradient rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {bulkUploading ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <FiUpload className="h-4 w-4" />
                    Upload
                  </>
                )}
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
                <div className="p-1.5 rounded-lg bg-white/20">
                  <FiUpload className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight">Upload missing logos</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowMissingLogosModal(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 overflow-auto space-y-5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Upload a ZIP containing logo images. File names must match the <code className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-800 font-mono text-xs">logo_file_name</code> stored for exams that have no logo yet.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">ZIP file (required)</label>
                <label className="flex flex-col items-center justify-center w-full min-h-[120px] rounded-xl border-2 border-dashed border-slate-300 hover:border-pink/50 hover:bg-pink/5 transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    className="hidden"
                    onChange={(e) => {
                      setMissingLogosZipFile(e.target.files?.[0] ?? null);
                      setMissingLogosResult(null);
                      setMissingLogosError(null);
                      e.target.value = '';
                    }}
                  />
                  {missingLogosZipFile ? (
                    <div className="flex flex-col items-center gap-2 p-4">
                      <div className="p-2 rounded-full bg-green-100 text-green-600">
                        <FiUpload className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-slate-800 truncate max-w-[240px]">{missingLogosZipFile.name}</span>
                      <button
                        type="button"
                        onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setMissingLogosZipFile(null); setMissingLogosResult(null); setMissingLogosError(null); }}
                        className="text-xs text-slate-500 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
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
              {missingLogosError && (
                <div className="bg-red-50 border border-red-200/80 text-red-700 px-4 py-3 text-sm rounded-xl">
                  {missingLogosError}
                </div>
              )}
              {missingLogosResult && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                  <p className="font-semibold text-slate-900">
                    ✓ Logos added: {missingLogosResult.summary.logosAdded}
                  </p>
                  {missingLogosResult.summary.filesSkipped > 0 && (
                    <p className="text-sm text-amber-700">Files skipped (no matching exam): {missingLogosResult.summary.filesSkipped}</p>
                  )}
                  {missingLogosResult.summary.uploadErrors > 0 && (
                    <p className="text-sm text-red-700">Upload errors: {missingLogosResult.summary.uploadErrors}</p>
                  )}
                  {missingLogosResult.updated.length > 0 && (
                    <ul className="text-xs text-slate-600 list-disc list-inside max-h-24 overflow-y-auto space-y-0.5">
                      {missingLogosResult.updated.map((u, i) => (
                        <li key={i}>{u.name} ({u.code})</li>
                      ))}
                    </ul>
                  )}
                  {missingLogosResult.skipped.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">Skipped files:</p>
                      <ul className="text-xs text-slate-500 list-disc list-inside max-h-16 overflow-y-auto space-y-0.5">
                        {missingLogosResult.skipped.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-slate-200/80 bg-slate-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowMissingLogosModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleMissingLogosSubmit}
                disabled={!missingLogosZipFile || missingLogosUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-darkGradient rounded-xl hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-pink/20"
              >
                {missingLogosUploading ? 'Uploading…' : 'Upload'}
              </button>
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
        message="Are you sure you want to delete this exam? This will also delete all related data (dates, eligibility, pattern, cutoff). This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeleting}
      />

      <ConfirmationModal
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={handleDeleteAllConfirm}
        title="Delete All Exams"
        message={`Are you sure you want to delete all ${allExams.length} exams? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeletingAll}
      />
    </div>
  );
}
