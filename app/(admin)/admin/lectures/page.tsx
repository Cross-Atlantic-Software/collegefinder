'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllLectures,
  createLecture,
  updateLecture,
  deleteLecture,
  deleteAllLectures,
  Lecture,
  getAllPurposes,
  getAllTopics,
  getSubtopicsByTopicId,
  getAllSubtopics,
  getAllStreams,
  getAllSubjects,
  getAllExamsAdmin,
  downloadLecturesBulkTemplate,
  downloadLecturesAllExcel,
  bulkUploadLectures,
  uploadMissingLectureThumbnails,
  fetchYoutubeLectureMetadata,
  type Stream,
  type Subject,
  type Exam,
} from '@/api';
import { FiPlus, FiSearch, FiX, FiImage, FiVideo, FiUpload, FiDownload, FiTrash2 } from 'react-icons/fi';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { AdminTableActions } from '@/components/admin/AdminTableActions';
import { ConfirmationModal, useToast, Select, SelectOption, MultiSelect } from '@/components/shared';
import RichTextEditor from '@/components/shared/RichTextEditor';

export default function LecturesPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { canDownloadExcel, canDelete } = useAdminPermissions();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [allLectures, setAllLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ 
    topic_id: '',
    subtopic_id: '', 
    name: '', 
    content_type: 'VIDEO' as 'VIDEO' | 'ARTICLE',
    status: true,
    description: '',
    sort_order: 0
  });
  const [articleContent, setArticleContent] = useState('');
  const [availableTopics, setAvailableTopics] = useState<SelectOption[]>([]);
  const [availableSubtopics, setAvailableSubtopics] = useState<SelectOption[]>([]);
  const [allSubtopics, setAllSubtopics] = useState<Array<{ id: number; topic_id: number; name: string }>>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSourceType, setVideoSourceType] = useState<'file' | 'iframe'>('file');
  const [iframeCode, setIframeCode] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [viewingLecture, setViewingLecture] = useState<Lecture | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Purposes for lecture form (read-only)
  const [availablePurposes, setAvailablePurposes] = useState<SelectOption[]>([]);
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
  const [streamOptions, setStreamOptions] = useState<SelectOption[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<SelectOption[]>([]);
  const [examOptions, setExamOptions] = useState<SelectOption[]>([]);
  const [selectedStreamIds, setSelectedStreamIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [thumbnailFilename, setThumbnailFilename] = useState('');

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkExcelFile, setBulkExcelFile] = useState<File | null>(null);
  const [bulkThumbnailsZip, setBulkThumbnailsZip] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<{
    created: number;
    errors: number;
    errorDetails: { row: number; message: string }[];
  } | null>(null);

  const [showMissingThumbsModal, setShowMissingThumbsModal] = useState(false);
  const [missingThumbsZip, setMissingThumbsZip] = useState<File | null>(null);
  const [missingThumbsUploading, setMissingThumbsUploading] = useState(false);
  const [missingThumbsError, setMissingThumbsError] = useState<string | null>(null);
  const [missingThumbsResult, setMissingThumbsResult] = useState<{
    updated: { id: number; name: string }[];
    skipped: string[];
    summary: { logosAdded: number; filesSkipped: number; uploadErrors: number };
  } | null>(null);

  const [downloadingExcel, setDownloadingExcel] = useState(false);

  /** Avoid refetching YouTube metadata when opening edit with unchanged iframe */
  const lastFetchedIframeRef = useRef('');
  const [youtubeDescHint, setYoutubeDescHint] = useState<string | null>(null);

  const applyYoutubeMetadata = useCallback(
    async (codeInput: string, force: boolean, toastOnSuccess = false) => {
      const code = codeInput.trim();
      if (!code) {
        setYoutubeDescHint('Paste a YouTube iframe or embed/watch URL first.');
        return;
      }
      if (!force && code === lastFetchedIframeRef.current) return;

      setYoutubeDescHint('Fetching description from YouTube…');
      try {
        const res = await fetchYoutubeLectureMetadata(code);
        if (!res.success || !res.data) {
          const msg = res.message || 'Could not load YouTube metadata.';
          if (msg.includes('not configured') || msg.includes('YOUTUBE_API_KEY')) {
            setYoutubeDescHint(
              'Server has no YouTube API key — use a Google Cloud API key with YouTube Data API v3 enabled (AI Studio / Gemini-only keys will not work).'
            );
          } else {
            setYoutubeDescHint(msg);
          }
          showError(msg);
          return;
        }
        lastFetchedIframeRef.current = code;
        setFormData((prev) => ({ ...prev, description: res.data!.description || '' }));
        setYoutubeDescHint(
          res.data!.description?.trim()
            ? null
            : 'YouTube returned no description for this video (the field may be empty on YouTube).'
        );
        if (toastOnSuccess && res.data!.description?.trim()) {
          showSuccess('Description loaded from YouTube');
        }
      } catch {
        const m = 'Network error — is the backend running and /api proxy correct?';
        setYoutubeDescHint(m);
        showError(m);
      }
    },
    [showError, showSuccess]
  );

  useEffect(() => {
    if (!showModal || formData.content_type !== 'VIDEO' || videoSourceType !== 'iframe') {
      setYoutubeDescHint(null);
      return;
    }
    const code = iframeCode.trim();
    if (!code) {
      setYoutubeDescHint(null);
      return;
    }
    if (code === lastFetchedIframeRef.current) {
      return;
    }

    const t = setTimeout(() => {
      const settled = iframeCode.trim();
      if (!settled || settled !== code) return;
      void applyYoutubeMetadata(settled, false, false);
    }, 600);

    return () => clearTimeout(t);
  }, [showModal, iframeCode, formData.content_type, videoSourceType, applyYoutubeMetadata]);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    fetchLectures();
    fetchTopics();
    fetchAllSubtopics();
    fetchPurposes();
    fetchTaxonomyOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTaxonomyOptions = async () => {
    try {
      const [streamsRes, subjectsRes, examsRes] = await Promise.all([
        getAllStreams(),
        getAllSubjects(),
        getAllExamsAdmin(),
      ]);
      if (streamsRes.success && streamsRes.data) {
        setStreamOptions(
          streamsRes.data.streams
            .filter((s: Stream) => s.status)
            .map((s: Stream) => ({ value: String(s.id), label: s.name }))
        );
      }
      if (subjectsRes.success && subjectsRes.data) {
        setSubjectOptions(
          subjectsRes.data.subjects
            .filter((s: Subject) => s.status)
            .map((s: Subject) => ({ value: String(s.id), label: s.name }))
        );
      }
      if (examsRes.success && examsRes.data) {
        setExamOptions(
          examsRes.data.exams.map((e: Exam) => ({
            value: String(e.id),
            label: `${e.name} (${e.code})`,
          }))
        );
      }
    } catch (e) {
      console.error('Error loading taxonomy options:', e);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await getAllTopics();
      if (response.success && response.data) {
        setAvailableTopics(
          response.data.topics.map((t) => ({
            value: String(t.id),
            label: t.name,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const fetchAllSubtopics = async () => {
    try {
      const response = await getAllSubtopics();
      if (response.success && response.data) {
        setAllSubtopics(
          response.data.subtopics.map((s) => ({
            id: s.id,
            topic_id: s.topic_id,
            name: s.name,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching all subtopics:', err);
    }
  };

  const fetchSubtopicsByTopic = async (topicId: string) => {
    if (!topicId) {
      setAvailableSubtopics([]);
      return;
    }
    try {
      const response = await getSubtopicsByTopicId(parseInt(topicId));
      if (response.success && response.data) {
        setAvailableSubtopics(
          response.data.subtopics.map((s) => ({
            value: String(s.id),
            label: s.name,
          }))
        );
      } else {
        setAvailableSubtopics([]);
      }
    } catch (err) {
      console.error('Error fetching subtopics:', err);
      setAvailableSubtopics([]);
    }
  };

  // Fetch subtopics when topic changes
  useEffect(() => {
    if (formData.topic_id) {
      fetchSubtopicsByTopic(formData.topic_id);
      // Only clear subtopic if we're not editing (editingLecture is null)
      // or if the current subtopic doesn't belong to the new topic
      if (!editingLecture) {
        setFormData(prev => ({ ...prev, subtopic_id: '' }));
      }
    } else {
      setAvailableSubtopics([]);
    }
  }, [formData.topic_id, editingLecture]);

  const fetchPurposes = async () => {
    try {
      const response = await getAllPurposes();
      if (response.success && response.data) {
        setAvailablePurposes(
          response.data.purposes
            .filter(p => p.status)
            .map((p) => ({
              value: String(p.id),
              label: p.name,
            }))
        );
      }
    } catch (err) {
      console.error('Error fetching purposes:', err);
    }
  };

  useEffect(() => {
    if (allLectures.length === 0) {
      setLectures([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setLectures(allLectures);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allLectures.filter(lecture =>
        lecture.name.toLowerCase().includes(searchLower)
      );
      setLectures(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allLectures]);

  const fetchLectures = async () => {
    try {
      setIsLoading(true);
      const response = await getAllLectures();
      if (response.success && response.data) {
        setAllLectures(response.data.lectures);
        setLectures(response.data.lectures);
      } else {
        setError(response.message || 'Failed to fetch lectures');
      }
    } catch (err) {
      setError('An error occurred while fetching lectures');
      console.error('Error fetching lectures:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('topic_id', formData.topic_id);
      formDataToSend.append('subtopic_id', formData.subtopic_id);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('content_type', formData.content_type);
      formDataToSend.append('status', String(formData.status));
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('sort_order', String(formData.sort_order));
      
      // Add content based on type
      if (formData.content_type === 'VIDEO') {
        if (videoSourceType === 'file') {
          if (videoFile) {
            formDataToSend.append('video_file', videoFile);
          }
          // Clear iframe_code when using file
          formDataToSend.append('iframe_code', '');
        } else if (videoSourceType === 'iframe') {
          if (iframeCode) {
            formDataToSend.append('iframe_code', iframeCode);
          } else {
            formDataToSend.append('iframe_code', '');
          }
          // Clear video_file when using iframe - send empty string
          formDataToSend.append('video_file', '');
        }
      } else if (formData.content_type === 'ARTICLE') {
        formDataToSend.append('article_content', articleContent);
      }

      if (thumbnailFile) {
        formDataToSend.append('thumbnail', thumbnailFile);
      }

      // Add purposes
      if (selectedPurposes.length > 0) {
        formDataToSend.append('purposes', JSON.stringify(selectedPurposes.map(id => parseInt(id))));
      } else {
        formDataToSend.append('purposes', JSON.stringify([]));
      }

      formDataToSend.append('thumbnail_filename', thumbnailFilename.trim());
      formDataToSend.append('stream_ids', JSON.stringify(selectedStreamIds.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n))));
      formDataToSend.append('subject_ids', JSON.stringify(selectedSubjectIds.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n))));
      formDataToSend.append('exam_ids', JSON.stringify(selectedExamIds.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n))));

      let response;
      if (editingLecture) {
        response = await updateLecture(editingLecture.id, formDataToSend);
      } else {
        response = await createLecture(formDataToSend);
      }

      if (response.success) {
        showSuccess(editingLecture ? 'Self study item updated' : 'Self study item created');
        fetchLectures();
        handleModalClose();
      } else {
        setError(response.message || 'Failed to save lecture');
        showError(response.message || 'Failed to save lecture');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while saving lecture';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = () => {
    lastFetchedIframeRef.current = '';
    setEditingLecture(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = async (lecture: Lecture) => {
    setEditingLecture(lecture);

    // Use topic_id directly from the lecture object (should already be available)
    const topicId = String(lecture.topic_id);

    setFormData({
      topic_id: topicId,
      subtopic_id: String(lecture.subtopic_id),
      name: lecture.name,
      content_type: lecture.content_type || 'VIDEO',
      status: lecture.status,
      description: lecture.description || '',
      sort_order: lecture.sort_order
    });

    // Fetch subtopics for this topic
    await fetchSubtopicsByTopic(topicId);
    
    setArticleContent(lecture.article_content || '');
    setThumbnailPreview(lecture.thumbnail);
    setThumbnailFile(null);
    setVideoFile(null);
    // Set video source type based on what exists
    if (lecture.iframe_code) {
      setVideoSourceType('iframe');
      setIframeCode(lecture.iframe_code);
      lastFetchedIframeRef.current = String(lecture.iframe_code).trim();
    } else {
      setVideoSourceType('file');
      setIframeCode('');
      lastFetchedIframeRef.current = '';
    }
    // Set selected purposes
    if (lecture.purposes && lecture.purposes.length > 0) {
      setSelectedPurposes(lecture.purposes.map(p => String(p.id)));
    } else {
      setSelectedPurposes([]);
    }
    setSelectedStreamIds((lecture.streams || []).map((s) => String(s.id)));
    setSelectedSubjectIds((lecture.subjects || []).map((s) => String(s.id)));
    setSelectedExamIds((lecture.exams || []).map((e) => String(e.id)));
    setThumbnailFilename(lecture.thumbnail_filename?.trim() || '');
    setShowModal(true);
  };

  const handleView = (lecture: Lecture) => {
    setViewingLecture(lecture);
    setShowViewModal(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      setIsDeleting(true);
      const response = await deleteLecture(deletingId);
      if (response.success) {
        showSuccess('Lecture deleted successfully');
        fetchLectures();
      } else {
        showError(response.message || 'Failed to delete lecture');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to delete lecture');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const resetForm = () => {
    lastFetchedIframeRef.current = '';
    setYoutubeDescHint(null);
    setFormData({ 
      topic_id: '',
      subtopic_id: '', 
      name: '', 
      content_type: 'VIDEO',
      status: true,
      description: '',
      sort_order: 0
    });
    setArticleContent('');
    setVideoFile(null);
    setVideoSourceType('file');
    setIframeCode('');
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setSelectedPurposes([]);
    setSelectedStreamIds([]);
    setSelectedSubjectIds([]);
    setSelectedExamIds([]);
    setThumbnailFilename('');
    setAvailableSubtopics([]);
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingLecture(null);
    resetForm();
  };

  const handleBulkTemplateDownload = async () => {
    try {
      await downloadLecturesBulkTemplate();
      showSuccess('Template downloaded');
    } catch {
      showError('Failed to download template');
    }
  };

  const handleDownloadAllExcel = async () => {
    try {
      setDownloadingExcel(true);
      await downloadLecturesAllExcel();
      showSuccess('Excel downloaded');
    } catch {
      showError('Failed to download Excel');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkExcelFile) return;
    setBulkUploading(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const res = await bulkUploadLectures(bulkExcelFile, [], bulkThumbnailsZip);
      if (res.success && res.data) {
        setBulkResult({
          created: res.data.created,
          errors: res.data.errors,
          errorDetails: res.data.errorDetails || [],
        });
        showSuccess(res.message || 'Bulk upload finished');
        fetchLectures();
      } else {
        setBulkError(res.message || 'Upload failed');
        showError(res.message || 'Upload failed');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setBulkError(msg);
      showError(msg);
    } finally {
      setBulkUploading(false);
    }
  };

  const handleDeleteAllConfirm = async () => {
    try {
      setIsDeletingAll(true);
      const response = await deleteAllLectures();
      if (response.success) {
        showSuccess(response.message || 'All items deleted');
        setShowDeleteAllConfirm(false);
        fetchLectures();
      } else {
        showError(response.message || 'Failed to delete all');
        setShowDeleteAllConfirm(false);
      }
    } catch {
      showError('Failed to delete all items');
      setShowDeleteAllConfirm(false);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleMissingThumbsSubmit = async () => {
    if (!missingThumbsZip) return;
    setMissingThumbsUploading(true);
    setMissingThumbsError(null);
    setMissingThumbsResult(null);
    try {
      const res = await uploadMissingLectureThumbnails(missingThumbsZip);
      if (res.success && res.data) {
        setMissingThumbsResult({
          updated: res.data.updated,
          skipped: res.data.skipped,
          summary: res.data.summary,
        });
        showSuccess(res.message || 'Thumbnails uploaded');
        fetchLectures();
      } else {
        setMissingThumbsError(res.message || 'Upload failed');
        showError(res.message || 'Upload failed');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setMissingThumbsError(msg);
      showError(msg);
    } finally {
      setMissingThumbsUploading(false);
    }
  };

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.replace('/admin/login')}
            className="text-[#341050] hover:underline"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-slate-900 mb-1">Self study material</h1>
            <p className="text-sm text-slate-600">
              Manage videos and articles under topics/subtopics. Tag streams, subjects, and exams; use Excel for bulk import.
            </p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-[#F6F8FA] transition-colors">
                <span className="text-xs font-medium text-slate-700">All items</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                  {allLectures.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none w-64 transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canDownloadExcel && (
                <>
                  <button
                    type="button"
                    onClick={handleBulkTemplateDownload}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 bg-white rounded-lg hover:bg-[#F6F8FA]"
                  >
                    <FiDownload className="h-4 w-4" />
                    Template
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadAllExcel}
                    disabled={downloadingExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 bg-white rounded-lg hover:bg-[#F6F8FA] disabled:opacity-50"
                  >
                    <FiDownload className="h-4 w-4" />
                    {downloadingExcel ? 'Downloading…' : 'Download Excel'}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setBulkExcelFile(null);
                  setBulkThumbnailsZip(null);
                  setBulkError(null);
                  setBulkResult(null);
                  setShowBulkModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 bg-white rounded-lg hover:bg-[#F6F8FA]"
              >
                <FiUpload className="h-4 w-4" />
                Bulk upload
              </button>
              <button
                type="button"
                onClick={() => {
                  setMissingThumbsZip(null);
                  setMissingThumbsError(null);
                  setMissingThumbsResult(null);
                  setShowMissingThumbsModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 bg-white rounded-lg hover:bg-[#F6F8FA]"
              >
                <FiImage className="h-4 w-4" />
                Missing thumbnails
              </button>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <FiPlus className="h-4 w-4" />
                Add item
              </button>
              {canDelete && allLectures.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowDeleteAllConfirm(true)}
                  disabled={isDeletingAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  <FiTrash2 className="h-4 w-4" />
                  Delete all
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Lectures Table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F6F8FA] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">THUMBNAIL</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">TOPIC</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">SUBTOPIC</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">STREAMS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">SUBJECTS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">EXAMS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">CONTENT TYPE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">PURPOSES</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">STATUS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">CREATED</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {lectures.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-4 py-4 text-center text-sm text-slate-500">
                          {lectures.length < allLectures.length ? 'No items match your search' : 'No items yet'}
                        </td>
                      </tr>
                    ) : (
                      lectures.map((lecture) => {
                        const subtopicData = allSubtopics.find((s) => s.id === lecture.subtopic_id);
                        const topic = subtopicData ? availableTopics.find((t) => t.value === String(subtopicData.topic_id)) : null;
                        const subtopic = availableSubtopics.find((s) => s.value === String(lecture.subtopic_id)) || 
                          (subtopicData ? { value: String(subtopicData.id), label: subtopicData.name } : null);
                        const lecturePurposes = lecture.purposes || [];
                        const streamList = lecture.streams || [];
                        const subjectList = lecture.subjects || [];
                        const examList = lecture.exams || [];
                        const chip = (items: { id: number; name: string }[], max = 2) =>
                          items.length ? (
                            <div className="flex flex-wrap gap-1">
                              {items.slice(0, max).map((x) => (
                                <span
                                  key={x.id}
                                  className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700"
                                >
                                  {x.name}
                                </span>
                              ))}
                              {items.length > max && (
                                <span className="text-[10px] text-slate-500">+{items.length - max}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          );
                        return (
                          <tr key={lecture.id} className="hover:bg-[#F6F8FA] transition-colors">
                            <td className="px-4 py-2">
                              {lecture.thumbnail ? (
                                <img
                                  src={lecture.thumbnail}
                                  alt={lecture.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center">
                                  <FiImage className="h-5 w-5 text-slate-400" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm font-medium text-slate-900">{lecture.name}</span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm text-slate-600">{topic?.label || '-'}</span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm text-slate-600">{subtopic?.label || `Subtopic ${lecture.subtopic_id}`}</span>
                            </td>
                            <td className="px-4 py-2 max-w-[140px]">{chip(streamList)}</td>
                            <td className="px-4 py-2 max-w-[140px]">{chip(subjectList)}</td>
                            <td className="px-4 py-2 max-w-[140px]">{chip(examList)}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                lecture.content_type === 'VIDEO' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {lecture.content_type === 'VIDEO' ? (
                                  <>
                                    <FiVideo className="h-3 w-3 mr-1" />
                                    Video
                                  </>
                                ) : (
                                  'Article'
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              {lecturePurposes.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {lecturePurposes.slice(0, 2).map((purpose) => (
                                    <span
                                      key={purpose.id}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                                    >
                                      {purpose.name}
                                    </span>
                                  ))}
                                  {lecturePurposes.length > 2 && (
                                    <span className="text-xs text-slate-500">+{lecturePurposes.length - 2}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {lecture.status ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-xs text-slate-600">
                              {new Date(lecture.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-4 py-2">
                              <AdminTableActions
                                onView={() => handleView(lecture)}
                                onEdit={() => handleEdit(lecture)}
                                onDelete={() => handleDeleteClick(lecture.id)}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Lecture Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingLecture ? 'Edit self study item' : 'Add self study item'}
              </h2>
              <button
                onClick={handleModalClose}
                className="text-slate-500 hover:text-slate-800 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Topic <span className="text-[#341050]">*</span>
                  </label>
                  <Select
                    options={availableTopics}
                    value={formData.topic_id}
                    onChange={(value) => setFormData({ ...formData, topic_id: value || '', subtopic_id: '' })}
                    placeholder="Select topic first"
                    isSearchable
                    isClearable={false}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Subtopic <span className="text-[#341050]">*</span>
                  </label>
                  <Select
                    options={availableSubtopics}
                    value={formData.subtopic_id}
                    onChange={(value) => setFormData({ ...formData, subtopic_id: value || '' })}
                    placeholder={formData.topic_id ? "Select subtopic" : "Select topic first"}
                    isSearchable
                    isClearable={false}
                    disabled={!formData.topic_id}
                  />
                  {!formData.topic_id && (
                    <p className="text-xs text-slate-500 mt-1">Please select a topic first</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Name <span className="text-[#341050]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Introduction to Algebra, Solving Linear Equations"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Streams</label>
                  <MultiSelect
                    options={streamOptions}
                    value={selectedStreamIds}
                    onChange={setSelectedStreamIds}
                    placeholder="Select streams"
                    isSearchable
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Subjects</label>
                  <MultiSelect
                    options={subjectOptions}
                    value={selectedSubjectIds}
                    onChange={setSelectedSubjectIds}
                    placeholder="Select subjects"
                    isSearchable
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Exams</label>
                  <MultiSelect
                    options={examOptions}
                    value={selectedExamIds}
                    onChange={setSelectedExamIds}
                    placeholder="Select exams"
                    isSearchable
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Content Type <span className="text-[#341050]">*</span>
                  </label>
                  <Select
                    options={[
                      { value: 'VIDEO', label: 'Video' },
                      { value: 'ARTICLE', label: 'Article' },
                    ]}
                    value={formData.content_type}
                    onChange={(value) => setFormData({ ...formData, content_type: (value || 'VIDEO') as 'VIDEO' | 'ARTICLE' })}
                    isSearchable={false}
                    isClearable={false}
                  />
                </div>

                {formData.content_type === 'VIDEO' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">
                        Video Source <span className="text-[#341050]">*</span>
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="videoSource"
                            value="file"
                            checked={videoSourceType === 'file'}
                            onChange={() => {
                              setVideoSourceType('file');
                              setIframeCode('');
                              lastFetchedIframeRef.current = '';
                            }}
                            className="w-4 h-4 text-[#341050] border-slate-300 focus:ring-[#341050]/25"
                          />
                          <span className="text-sm text-slate-700">Video File</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="videoSource"
                            value="iframe"
                            checked={videoSourceType === 'iframe'}
                            onChange={() => {
                              setVideoSourceType('iframe');
                              setVideoFile(null);
                              lastFetchedIframeRef.current = '';
                            }}
                            className="w-4 h-4 text-[#341050] border-slate-300 focus:ring-[#341050]/25"
                          />
                          <span className="text-sm text-slate-700">Iframe Code</span>
                        </label>
                      </div>
                    </div>

                    {videoSourceType === 'file' ? (
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Video File
                        </label>
                        {editingLecture && editingLecture.video_file && !videoFile && (
                          <div className="mb-2 p-2 bg-[#F6F8FA] rounded border border-slate-200">
                            <p className="text-xs text-slate-600">Current: {editingLecture.video_file}</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoChange}
                          required={false}
                          className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">Max file size: 500MB</p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Iframe Code <span className="text-[#341050]">*</span>
                        </label>
                        <textarea
                          value={iframeCode}
                          onChange={(e) => setIframeCode(e.target.value)}
                          onBlur={() => {
                            if (iframeCode.trim()) void applyYoutubeMetadata(iframeCode, false, false);
                          }}
                          placeholder="Paste your iframe embed code here (e.g., &lt;iframe src=&quot;...&quot;&gt;&lt;/iframe&gt;)"
                          rows={4}
                          className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none font-mono"
                        />
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => void applyYoutubeMetadata(iframeCode, true, true)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#341050] text-white hover:opacity-90"
                          >
                            Load description from YouTube
                          </button>
                          <span className="text-xs text-slate-500">
                            Or tab out of the field — it also loads after a short pause.
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">
                          Requires a <strong className="font-medium">Google Cloud</strong> API key with{' '}
                          <strong className="font-medium">YouTube Data API v3</strong> enabled (not the same as a Gemini-only key).
                        </p>
                        {youtubeDescHint && (
                          <p className="text-xs text-slate-700 mt-1.5 rounded-md bg-amber-50 border border-amber-100 px-2 py-1.5">
                            {youtubeDescHint}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {formData.content_type === 'ARTICLE' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Article Content <span className="text-[#341050]">*</span>
                    </label>
                    <RichTextEditor
                      value={articleContent}
                      onChange={setArticleContent}
                      placeholder="Write your article content here..."
                      className="min-h-[300px]"
                      imageUploadEndpoint="/admin/lectures/upload-image"
                      imageFormFieldName="lecture_image"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Thumbnail
                  </label>
                  {thumbnailPreview && (
                    <div className="mb-2">
                      <img
                        src={thumbnailPreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded border border-slate-300"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                  />
                  <label className="block text-xs font-medium text-slate-700 mt-2 mb-1">
                    Thumbnail file name (for Excel / ZIP bulk match)
                  </label>
                  <input
                    type="text"
                    value={thumbnailFilename}
                    onChange={(e) => setThumbnailFilename(e.target.value)}
                    placeholder="e.g. intro-thumb.png"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Must match the image file name in the ZIP when using bulk or “Missing thumbnails”.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional; auto-filled for YouTube iframe videos when possible"
                    rows={3}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Purposes
                  </label>
                  <MultiSelect
                    options={availablePurposes}
                    value={selectedPurposes}
                    onChange={setSelectedPurposes}
                    placeholder="Select purposes"
                    isSearchable
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                        className="w-4 h-4 text-[#341050] border-slate-300 rounded focus:ring-[#341050]/25"
                      />
                      <span className="text-xs font-medium text-slate-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-[#F6F8FA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#341050] hover:bg-[#2a0c40] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingLecture ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingLecture && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Self study item</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-slate-500 hover:text-slate-800 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <div className="space-y-4">
                {viewingLecture.thumbnail && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Thumbnail</label>
                    <img src={viewingLecture.thumbnail} alt={viewingLecture.name} className="w-48 h-32 object-cover rounded border border-slate-200" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
                  <p className="text-sm text-slate-900">{viewingLecture.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Topic</label>
                  <p className="text-sm text-slate-900">
                    {(() => {
                      const subtopicData = allSubtopics.find((s) => s.id === viewingLecture.subtopic_id);
                      const topic = subtopicData ? availableTopics.find((t) => t.value === String(subtopicData.topic_id)) : null;
                      return topic?.label || '-';
                    })()}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Subtopic</label>
                  <p className="text-sm text-slate-900">
                    {(() => {
                      const subtopicData = allSubtopics.find((s) => s.id === viewingLecture.subtopic_id);
                      return subtopicData?.name || availableSubtopics.find((s) => s.value === String(viewingLecture.subtopic_id))?.label || `Subtopic ${viewingLecture.subtopic_id}`;
                    })()}
                  </p>
                </div>
                {viewingLecture.thumbnail_filename ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Thumbnail file name</label>
                    <p className="text-sm text-slate-900 font-mono">{viewingLecture.thumbnail_filename}</p>
                  </div>
                ) : null}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Streams</label>
                  <p className="text-sm text-slate-900">
                    {(viewingLecture.streams || []).map((s) => s.name).join(', ') || '—'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Subjects</label>
                  <p className="text-sm text-slate-900">
                    {(viewingLecture.subjects || []).map((s) => s.name).join(', ') || '—'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Exams</label>
                  <p className="text-sm text-slate-900">
                    {(viewingLecture.exams || []).map((e) => e.name).join(', ') || '—'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Content Type</label>
                  <p className="text-sm text-slate-900">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      viewingLecture.content_type === 'VIDEO' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {viewingLecture.content_type === 'VIDEO' ? (
                        <>
                          <FiVideo className="h-3 w-3 mr-1" />
                          Video
                        </>
                      ) : (
                        'Article'
                      )}
                    </span>
                  </p>
                </div>
                {viewingLecture.content_type === 'VIDEO' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Video</label>
                    <div className="mt-1">
                      {viewingLecture.iframe_code ? (
                        <div 
                          className="w-full aspect-video rounded border border-slate-200 overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: viewingLecture.iframe_code }}
                        />
                      ) : viewingLecture.video_file ? (
                        <video
                          src={viewingLecture.video_file}
                          controls
                          className="w-full max-w-md rounded border border-slate-200"
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <p className="text-sm text-slate-500">No video available</p>
                      )}
                    </div>
                  </div>
                )}
                {viewingLecture.content_type === 'ARTICLE' && viewingLecture.article_content && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Article Content</label>
                    <div 
                      className="text-sm text-slate-700 prose prose-sm max-w-none border border-slate-200 rounded-lg p-4 [&_img]:max-w-full [&_img]:h-auto [&_img]:block [&_img]:my-4 [&_img]:rounded-lg"
                      dangerouslySetInnerHTML={{ __html: viewingLecture.article_content }}
                    />
                  </div>
                )}
                {viewingLecture.description && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                    <p className="text-sm text-slate-900">{viewingLecture.description}</p>
                  </div>
                )}
                {viewingLecture.purposes && viewingLecture.purposes.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Purposes</label>
                    <div className="flex flex-wrap gap-2">
                      {viewingLecture.purposes.map((purpose) => (
                        <span
                          key={purpose.id}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800"
                        >
                          {purpose.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                    <p className="text-sm text-slate-900">{viewingLecture.status ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Sort Order</label>
                    <p className="text-sm text-slate-900">{viewingLecture.sort_order}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Created</label>
                    <p className="text-sm text-slate-900">
                      {new Date(viewingLecture.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Updated</label>
                    <p className="text-sm text-slate-900">
                      {new Date(viewingLecture.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold">Bulk upload (Excel)</h2>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="text-slate-500 hover:text-slate-700"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Use the template (columns include <code className="bg-slate-100 px-1 rounded">description</code>,{' '}
              <code className="bg-slate-100 px-1 rounded">thumbnail_filename</code>,{' '}
              <code className="bg-slate-100 px-1 rounded">stream_names</code>,{' '}
              <code className="bg-slate-100 px-1 rounded">subject_names</code>,{' '}
              <code className="bg-slate-100 px-1 rounded">exam_names</code>). Use <code className="bg-slate-100 px-1 rounded">description</code> for{' '}
              <code className="bg-slate-100 px-1 rounded">ARTICLE</code> rows and for <code className="bg-slate-100 px-1 rounded">VIDEO</code> rows with a{' '}
              <code className="bg-slate-100 px-1 rounded">video_file</code> URL. For <code className="bg-slate-100 px-1 rounded">VIDEO</code> +{' '}
              <code className="bg-slate-100 px-1 rounded">iframe_code</code>, leave description blank to pull from YouTube, or fill it to override. Optional ZIP: names must match{' '}
              <code className="bg-slate-100 px-1 rounded">thumbnail_filename</code>.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Excel file *</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setBulkExcelFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm"
                />
                {bulkExcelFile && (
                  <p className="text-xs text-slate-600 mt-1.5">
                    Selected: <span className="font-medium text-slate-800 break-all">{bulkExcelFile.name}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Thumbnails (ZIP)</label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setBulkThumbnailsZip(f?.name.toLowerCase().endsWith('.zip') ? f : null);
                    e.target.value = '';
                  }}
                  className="w-full text-sm"
                />
                {bulkThumbnailsZip ? (
                  <p className="text-xs text-slate-600 mt-1.5">
                    Selected: <span className="font-medium text-slate-800 break-all">{bulkThumbnailsZip.name}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">No ZIP selected (optional)</p>
                )}
              </div>
            </div>
            {bulkError && <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded">{bulkError}</div>}
            {bulkResult && (
              <div className="mt-3 p-2 bg-green-50 text-green-800 text-sm rounded">
                Created: {bulkResult.created}.
                {bulkResult.errors > 0 && ` Errors: ${bulkResult.errors} row(s).`}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-[#F6F8FA]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={!bulkExcelFile || bulkUploading}
                className="px-3 py-1.5 text-sm bg-[#341050] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {bulkUploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMissingThumbsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold">Upload missing thumbnails</h2>
              <button
                type="button"
                onClick={() => setShowMissingThumbsModal(false)}
                className="text-slate-500 hover:text-slate-700"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              ZIP of images only. Each file name must match <code className="bg-slate-100 px-1 rounded">thumbnail_filename</code> on a row that has no thumbnail yet.
            </p>
            <input
              type="file"
              accept=".zip"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setMissingThumbsZip(f?.name.toLowerCase().endsWith('.zip') ? f : null);
                e.target.value = '';
              }}
              className="w-full text-sm"
            />
            {missingThumbsZip ? (
              <p className="text-xs text-slate-600 mt-1.5">
                Selected: <span className="font-medium text-slate-800 break-all">{missingThumbsZip.name}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-1">No ZIP selected yet</p>
            )}
            {missingThumbsError && (
              <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded">{missingThumbsError}</div>
            )}
            {missingThumbsResult && (
              <div className="mt-3 p-2 bg-green-50 text-green-800 text-sm rounded">
                Added {missingThumbsResult.summary.logosAdded} thumbnail(s). Skipped {missingThumbsResult.summary.filesSkipped}{' '}
                file(s).
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowMissingThumbsModal(false)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-[#F6F8FA]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleMissingThumbsSubmit}
                disabled={!missingThumbsZip || missingThumbsUploading}
                className="px-3 py-1.5 text-sm bg-[#341050] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {missingThumbsUploading ? 'Uploading…' : 'Upload'}
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
        onConfirm={handleDelete}
        title="Delete self study item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        confirmButtonStyle="danger"
      />

      <ConfirmationModal
        isOpen={showDeleteAllConfirm}
        onClose={() => {
          setShowDeleteAllConfirm(false);
        }}
        onConfirm={handleDeleteAllConfirm}
        title="Delete all self study material"
        message={`Are you sure you want to delete all ${allLectures.length} item(s)? Videos and thumbnails stored in cloud storage will be removed where possible. This cannot be undone.`}
        confirmText="Delete all"
        cancelText="Cancel"
        isLoading={isDeletingAll}
        confirmButtonStyle="danger"
      />

    </div>
  );
}

