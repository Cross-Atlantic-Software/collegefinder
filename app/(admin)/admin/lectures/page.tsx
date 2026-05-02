'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  getAllTopics,
  getSubtopicsByTopicId,
  getAllSubtopics,
  getAllSubjects,
  getAllExamsAdmin,
  downloadLecturesBulkTemplate,
  downloadLecturesAllExcel,
  bulkUploadLectures,
  getLectureBulkUploadJobStatus,
  downloadLectureBulkUploadFailuresCsv,
  uploadMissingLectureThumbnails,
  fetchYoutubeLectureMetadata,
  getLectureHookSummaryQueueStatus,
  enqueuePendingLectureHookSummaries,
  type LectureHookSummaryQueueStatus,
  type LecturesBulkUploadJobStatus,
  type Subject,
  type Exam,
} from '@/api';
import { FiPlus, FiSearch, FiX, FiImage, FiVideo, FiUpload, FiDownload, FiTrash2 } from 'react-icons/fi';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { AdminTableActions } from '@/components/admin/AdminTableActions';
import { ConfirmationModal, useToast, Select, SelectOption, MultiSelect } from '@/components/shared';
import RichTextEditor from '@/components/shared/RichTextEditor';

export default function LecturesPage() {
  const PAGE_SIZE = 10;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    topic_id: '',
    subtopic_id: '',
    content_type: 'VIDEO' as 'VIDEO' | 'ARTICLE',
    description: '',
    key_topics_to_be_covered: '',
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
  
  const [subjectOptions, setSubjectOptions] = useState<SelectOption[]>([]);
  const [examOptions, setExamOptions] = useState<SelectOption[]>([]);
  const [subjectsCatalog, setSubjectsCatalog] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [thumbnailFilename, setThumbnailFilename] = useState('');

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkExcelFile, setBulkExcelFile] = useState<File | null>(null);
  const [bulkThumbnailsZip, setBulkThumbnailsZip] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkJobId, setBulkJobId] = useState<string | null>(null);
  const [bulkJobStatus, setBulkJobStatus] = useState<LecturesBulkUploadJobStatus | null>(null);
  const bulkPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bulkTerminalNotifiedRef = useRef(false);

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
  const [hookSummaryProgress, setHookSummaryProgress] = useState<LectureHookSummaryQueueStatus | null>(null);
  const [generatingHookSummaries, setGeneratingHookSummaries] = useState(false);

  /** Avoid refetching YouTube metadata when opening edit with unchanged iframe */
  const lastFetchedIframeRef = useRef('');
  const [youtubeDescHint, setYoutubeDescHint] = useState<string | null>(null);
  const getLectureLabel = useCallback(
    (lecture: Pick<Lecture, 'name' | 'youtube_title'>) =>
      (lecture.youtube_title && lecture.youtube_title.trim()) ||
      (lecture.name && lecture.name.trim()) ||
      'Untitled lecture',
    []
  );

  const applyYoutubeMetadata = useCallback(
    async (codeInput: string, force: boolean, toastOnSuccess = false) => {
      const code = codeInput.trim();
      if (!code) {
        setYoutubeDescHint('Paste a YouTube iframe or embed/watch URL first.');
        return;
      }
      if (!force && code === lastFetchedIframeRef.current) return;

      setYoutubeDescHint('Fetching description and thumbnail from YouTube…');
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
        if (res.data!.thumbnailUrl?.trim() && !thumbnailFile) {
          setThumbnailPreview(res.data!.thumbnailUrl);
        }
        const hasDesc = !!res.data!.description?.trim();
        const hasThumb = !!res.data!.thumbnailUrl?.trim();
        setYoutubeDescHint(
          hasDesc
            ? null
            : 'YouTube returned no description for this video (the field may be empty on YouTube).'
        );
        if (toastOnSuccess && (hasDesc || hasThumb)) {
          showSuccess(
            hasDesc && hasThumb
              ? 'Description and thumbnail preview loaded from YouTube'
              : hasDesc
                ? 'Description loaded from YouTube'
                : 'Thumbnail preview loaded from YouTube'
          );
        }
      } catch {
        const m = 'Network error — is the backend running and /api proxy correct?';
        setYoutubeDescHint(m);
        showError(m);
      }
    },
    [showError, showSuccess, thumbnailFile]
  );

  const totalPages = Math.max(1, Math.ceil(lectures.length / PAGE_SIZE));
  const paginatedLectures = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return lectures.slice(start, start + PAGE_SIZE);
  }, [lectures, currentPage]);

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
    fetchHookSummaryProgress();
    fetchTopics();
    fetchAllSubtopics();
    fetchTaxonomyOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchHookSummaryProgress();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTaxonomyOptions = async () => {
    try {
      const [subjectsRes, examsRes] = await Promise.all([getAllSubjects(), getAllExamsAdmin()]);
      if (subjectsRes.success && subjectsRes.data) {
        const active = subjectsRes.data.subjects.filter((s: Subject) => s.status);
        setSubjectsCatalog(active);
        setSubjectOptions(active.map((s: Subject) => ({ value: String(s.id), label: s.name })));
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
      const filtered = allLectures.filter((lecture) => {
        const subtopicData = allSubtopics.find((s) => s.id === lecture.subtopic_id);
        const topic = subtopicData
          ? availableTopics.find((t) => t.value === String(subtopicData.topic_id))
          : null;
        const subtopic = subtopicData?.name || '';
        const topicName = topic?.label || '';
        return (
          topicName.toLowerCase().includes(searchLower) ||
          subtopic.toLowerCase().includes(searchLower)
        );
      });
      setLectures(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allLectures, allSubtopics, availableTopics]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, allLectures.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

  const fetchHookSummaryProgress = async () => {
    try {
      const response = await getLectureHookSummaryQueueStatus();
      if (response.success && response.data) {
        setHookSummaryProgress(response.data);
      }
    } catch (err) {
      console.error('Error fetching lecture hook summary progress:', err);
    }
  };

  const stopBulkPoll = useCallback(() => {
    if (bulkPollRef.current) {
      clearInterval(bulkPollRef.current);
      bulkPollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopBulkPoll(), [stopBulkPoll]);

  useEffect(() => {
    if (!bulkJobId) {
      stopBulkPoll();
      return;
    }
    bulkTerminalNotifiedRef.current = false;

    const poll = async () => {
      try {
        const res = await getLectureBulkUploadJobStatus(bulkJobId);
        if (res.success && res.data) {
          setBulkJobStatus(res.data);
          void fetchHookSummaryProgress();
          const st = res.data.status;
          if ((st === 'completed' || st === 'failed') && !bulkTerminalNotifiedRef.current) {
            bulkTerminalNotifiedRef.current = true;
            stopBulkPoll();
            void fetchLectures();
            if (st === 'completed') {
              showSuccess(
                `Import finished: ${res.data.success} created, ${res.data.failed} failed (of ${res.data.total} rows).`
              );
            } else {
              showError(res.data.errorMessage || 'Bulk import job failed');
            }
          }
        }
      } catch {
        /* transient poll errors */
      }
    };

    void poll();
    bulkPollRef.current = setInterval(poll, 2000);
    return () => stopBulkPoll();
  }, [bulkJobId, stopBulkPoll, showSuccess, showError]);

  const handleDownloadBulkFailuresCsv = async () => {
    if (!bulkJobId) return;
    try {
      await downloadLectureBulkUploadFailuresCsv(bulkJobId);
      showSuccess('Failures CSV downloaded');
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Download failed');
    }
  };

  const handleStartNewBulkUploadSession = () => {
    if (bulkJobStatus?.status === 'pending' || bulkJobStatus?.status === 'processing') {
      const ok = window.confirm(
        'This import is still running on the server. Clear this screen to choose a new file? You can reopen “View import progress” anytime until you start a new upload.'
      );
      if (!ok) return;
    }
    setBulkJobId(null);
    setBulkJobStatus(null);
    bulkTerminalNotifiedRef.current = false;
    setBulkExcelFile(null);
    setBulkThumbnailsZip(null);
    setBulkError(null);
  };

  const handleEnqueuePendingHookSummaries = async () => {
    try {
      setGeneratingHookSummaries(true);
      const response = await enqueuePendingLectureHookSummaries();
      if (response.success) {
        showSuccess(response.message || 'Hook summary jobs queued');
        await fetchHookSummaryProgress();
      } else {
        showError(response.message || 'Failed to queue hook summary jobs');
      }
    } catch (err) {
      console.error('Error queueing hook summary jobs:', err);
      showError('Failed to queue hook summary jobs');
    } finally {
      setGeneratingHookSummaries(false);
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
      formDataToSend.append('content_type', formData.content_type);
      formDataToSend.append(
        'status',
        editingLecture ? String(editingLecture.status) : 'true'
      );
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append(
        'sort_order',
        editingLecture != null && editingLecture.sort_order != null
          ? String(editingLecture.sort_order)
          : '0'
      );
      formDataToSend.append('key_topics_to_be_covered', formData.key_topics_to_be_covered.trim());
      
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

      formDataToSend.append('thumbnail_filename', thumbnailFilename.trim());
      const streamIdsFromSubjects = new Set<number>();
      for (const sid of selectedSubjectIds) {
        const subj = subjectsCatalog.find((s) => String(s.id) === sid);
        if (subj?.streams?.length) {
          for (const x of subj.streams) {
            const n = typeof x === 'number' ? x : parseInt(String(x), 10);
            if (!Number.isNaN(n) && n > 0) streamIdsFromSubjects.add(n);
          }
        }
      }
      formDataToSend.append('stream_ids', JSON.stringify([...streamIdsFromSubjects]));
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
      content_type: lecture.content_type || 'VIDEO',
      description: lecture.description || '',
      key_topics_to_be_covered: lecture.key_topics_to_be_covered?.trim() || '',
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
      content_type: 'VIDEO',
      description: '',
      key_topics_to_be_covered: '',
    });
    setArticleContent('');
    setVideoFile(null);
    setVideoSourceType('file');
    setIframeCode('');
    setThumbnailFile(null);
    setThumbnailPreview(null);
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
    try {
      const res = await bulkUploadLectures(bulkExcelFile, [], bulkThumbnailsZip);
      if (res.success && res.data?.jobId) {
        setBulkJobId(res.data.jobId);
        setBulkJobStatus(null);
        bulkTerminalNotifiedRef.current = false;
        showSuccess(res.message || 'Bulk upload queued — processing in the background.');
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
                  placeholder="Search by topic or subtopic"
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
                  setBulkError(null);
                  setShowBulkModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 bg-white rounded-lg hover:bg-[#F6F8FA]"
              >
                <FiUpload className="h-4 w-4" />
                Bulk upload
              </button>
              {bulkJobId && (
                <button
                  type="button"
                  onClick={() => {
                    setBulkError(null);
                    setShowBulkModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-50 border border-amber-200 text-amber-950 rounded-lg hover:bg-amber-100/90"
                >
                  {bulkJobStatus?.status === 'pending' || bulkJobStatus?.status === 'processing' ? (
                    <>
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full border-2 border-amber-700/30 border-t-amber-800 animate-spin"
                        aria-hidden
                      />
                      Import{' '}
                      {bulkJobStatus
                        ? `${bulkJobStatus.processed}/${bulkJobStatus.total}`
                        : '…'}
                    </>
                  ) : (
                    <>
                      <FiDownload className="h-4 w-4 text-amber-900/90" />
                      View import
                      {bulkJobStatus?.failed ? ` · ${bulkJobStatus.failed} failed` : ''}
                    </>
                  )}
                </button>
              )}
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
          {hookSummaryProgress && hookSummaryProgress.totalVideoLectures > 0 ? (
            <div className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
              <span>
                Hook summaries: <span className="font-semibold text-slate-900">{hookSummaryProgress.completedVideoHookSummaries}/{hookSummaryProgress.totalVideoLectures}</span>
                {' '}done
                {hookSummaryProgress.completedVideoHookSummaries >= hookSummaryProgress.totalVideoLectures ? (
                  <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700 border border-green-200">
                    Completed
                  </span>
                ) : null}
              </span>
              <span className="text-slate-500">
                Pending: {hookSummaryProgress.pendingVideoHookSummaries}
                {hookSummaryProgress.queueAvailable && hookSummaryProgress.queueCounts
                  ? ` | Queue waiting: ${hookSummaryProgress.queueCounts.waiting || 0}, active: ${hookSummaryProgress.queueCounts.active || 0}`
                  : ' | Queue unavailable'}
              </span>
              {hookSummaryProgress.pendingVideoHookSummaries > 0 && (
                <button
                  type="button"
                  onClick={handleEnqueuePendingHookSummaries}
                  disabled={generatingHookSummaries}
                  className="ml-auto inline-flex items-center rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {generatingHookSummaries ? 'Queueing…' : 'Generate summaries'}
                </button>
              )}
            </div>
          ) : null}

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
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">TOPIC</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">SUBTOPIC</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">STREAMS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">SUBJECTS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">EXAMS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">CONTENT TYPE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">STATUS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">CREATED</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {lectures.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-4 text-center text-sm text-slate-500">
                          {lectures.length < allLectures.length ? 'No items match your search' : 'No items yet'}
                        </td>
                      </tr>
                    ) : (
                      paginatedLectures.map((lecture) => {
                        const subtopicData = allSubtopics.find((s) => s.id === lecture.subtopic_id);
                        const topic = subtopicData ? availableTopics.find((t) => t.value === String(subtopicData.topic_id)) : null;
                        const subtopic = availableSubtopics.find((s) => s.value === String(lecture.subtopic_id)) || 
                          (subtopicData ? { value: String(subtopicData.id), label: subtopicData.name } : null);
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
                                  alt={getLectureLabel(lecture)}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center">
                                  <FiImage className="h-5 w-5 text-slate-400" />
                                </div>
                              )}
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
          {lectures.length > 0 && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-600">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}-
                {Math.min(currentPage * PAGE_SIZE, lectures.length)} of {lectures.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded disabled:opacity-50 hover:bg-[#F6F8FA]"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded disabled:opacity-50 hover:bg-[#F6F8FA]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
                    Key topics to be covered
                  </label>
                  <textarea
                    value={formData.key_topics_to_be_covered}
                    onChange={(e) =>
                      setFormData({ ...formData, key_topics_to_be_covered: e.target.value })
                    }
                    placeholder="Optional outline (same as Excel column key_topics_to_be_covered)"
                    rows={3}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Streams are set automatically from the subjects you select below.
                  </p>
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
                            Load description &amp; thumbnail from YouTube
                          </button>
                          <span className="text-xs text-slate-500">
                            Or tab out of the field — it also loads after a short pause. On save, the thumbnail is stored in S3 (like file uploads).
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
                  <p className="text-[11px] text-slate-500 mb-1.5">
                    For YouTube iframe videos, leave empty to use the video&apos;s thumbnail (fetched automatically on save, or preview via &quot;Load from YouTube&quot; above).
                  </p>
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

                {editingLecture ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-700 mb-2">
                      YouTube metadata (from DB)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Title:</span>{' '}
                        <span className="text-slate-900">{editingLecture.youtube_title || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Channel name:</span>{' '}
                        <span className="text-slate-900">{editingLecture.youtube_channel_name || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Channel ID:</span>{' '}
                        <span className="text-slate-900">{editingLecture.youtube_channel_id || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Subscribers:</span>{' '}
                        <span className="text-slate-900">
                          {editingLecture.youtube_subscriber_count != null
                            ? editingLecture.youtube_subscriber_count.toLocaleString()
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Likes:</span>{' '}
                        <span className="text-slate-900">
                          {editingLecture.youtube_like_count != null
                            ? editingLecture.youtube_like_count.toLocaleString()
                            : '—'}
                        </span>
                      </div>
                      <div className="md:col-span-2 break-all">
                        <span className="text-slate-500">Channel URL:</span>{' '}
                        {editingLecture.youtube_channel_url ? (
                          <a
                            href={editingLecture.youtube_channel_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#341050] hover:underline"
                          >
                            {editingLecture.youtube_channel_url}
                          </a>
                        ) : (
                          <span className="text-slate-900">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {editingLecture ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-700 mb-2">AI student hook (from DB)</p>
                    <p className="text-sm text-slate-900 whitespace-pre-wrap">
                      {editingLecture.hook_summary?.trim() ? editingLecture.hook_summary : '—'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Two-sentence summary generated after save (Gemini). Refresh the list or reopen this item
                      if it still shows &quot;—&quot; right after updating.
                    </p>
                  </div>
                ) : null}

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
                    <img src={viewingLecture.thumbnail} alt={getLectureLabel(viewingLecture)} className="w-48 h-32 object-cover rounded border border-slate-200" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">YouTube title</label>
                  <p className="text-sm text-slate-900">{getLectureLabel(viewingLecture)}</p>
                </div>
                {viewingLecture.key_topics_to_be_covered ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Key topics to be covered
                    </label>
                    <p className="text-sm text-slate-900 whitespace-pre-wrap">
                      {viewingLecture.key_topics_to_be_covered}
                    </p>
                  </div>
                ) : null}
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
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">YouTube metadata (DB)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Title:</span>{' '}
                      <span className="text-slate-900">{viewingLecture.youtube_title || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Channel name:</span>{' '}
                      <span className="text-slate-900">{viewingLecture.youtube_channel_name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Channel ID:</span>{' '}
                      <span className="text-slate-900">{viewingLecture.youtube_channel_id || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Subscribers:</span>{' '}
                      <span className="text-slate-900">
                        {viewingLecture.youtube_subscriber_count != null
                          ? viewingLecture.youtube_subscriber_count.toLocaleString()
                          : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Likes:</span>{' '}
                      <span className="text-slate-900">
                        {viewingLecture.youtube_like_count != null
                          ? viewingLecture.youtube_like_count.toLocaleString()
                          : '—'}
                      </span>
                    </div>
                    <div className="md:col-span-2 break-all">
                      <span className="text-slate-500">Channel URL:</span>{' '}
                      {viewingLecture.youtube_channel_url ? (
                        <a
                          href={viewingLecture.youtube_channel_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#341050] hover:underline"
                        >
                          {viewingLecture.youtube_channel_url}
                        </a>
                      ) : (
                        <span className="text-slate-900">—</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">AI student hook (DB)</p>
                  <p className="text-sm text-slate-900 whitespace-pre-wrap">
                    {viewingLecture.hook_summary?.trim() ? viewingLecture.hook_summary : '—'}
                  </p>
                </div>
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
              Template columns: <code className="bg-slate-100 px-1 rounded">topic_name</code>,{' '}
              <code className="bg-slate-100 px-1 rounded">subtopic_name</code>,{' '}
              <code className="bg-slate-100 px-1 rounded">key_topics_to_be_covered</code>,{' '}
              <code className="bg-slate-100 px-1 rounded">subject_names</code>, <code className="bg-slate-100 px-1 rounded">exam_names</code>, and{' '}
              <code className="bg-slate-100 px-1 rounded">youtube_video_link</code> (YouTube URL or direct https video URL). New rows are created as active with sort order 0. Streams follow the subjects you list. Description and YouTube thumbnail are fetched automatically for YouTube links. Optional thumbnails ZIP still matches{' '}
              <code className="bg-slate-100 px-1 rounded">thumbnail_filename</code> if you add that column manually.
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
            {bulkJobId && !bulkJobStatus && (
              <p className="mt-3 text-sm text-slate-600">Job queued — loading progress…</p>
            )}
            {bulkJobStatus && (
              <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>
                    Status:{' '}
                    <strong className="capitalize text-slate-900">{bulkJobStatus.status}</strong>
                  </span>
                  <span>
                    {bulkJobStatus.processed} / {bulkJobStatus.total} rows
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-[#341050] transition-[width] duration-300"
                    style={{
                      width: `${bulkJobStatus.total ? Math.min(100, (bulkJobStatus.processed / bulkJobStatus.total) * 100) : 0}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-slate-600">
                  Success: <span className="font-medium text-slate-900">{bulkJobStatus.success}</span>
                  {' · '}
                  Failed: <span className="font-medium text-slate-900">{bulkJobStatus.failed}</span>
                </div>
                {bulkJobStatus.hookSummariesQueued > 0 && (
                  <p className="text-xs text-slate-600">
                    Hook summaries queued (this import):{' '}
                    <span className="font-medium text-slate-900">{bulkJobStatus.hookSummariesQueued}</span>
                  </p>
                )}
                {hookSummaryProgress && hookSummaryProgress.queueAvailable && (
                  <div className="border-t border-slate-200 pt-2 text-xs text-slate-500">
                    Summary queue: waiting {hookSummaryProgress.queueCounts?.waiting ?? 0}, active{' '}
                    {hookSummaryProgress.queueCounts?.active ?? 0} · Video lectures with hook done{' '}
                    {hookSummaryProgress.completedVideoHookSummaries}/
                    {hookSummaryProgress.totalVideoLectures}
                  </div>
                )}
                {bulkJobStatus.failed > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadBulkFailuresCsv}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#341050] underline hover:no-underline"
                  >
                    <FiDownload className="h-3.5 w-3.5" />
                    Download failed rows (CSV)
                  </button>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <div className="min-w-0">
                {bulkJobId ? (
                  <button
                    type="button"
                    onClick={handleStartNewBulkUploadSession}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2"
                  >
                    Start new upload
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">Select Excel (and optional ZIP) above.</span>
                )}
              </div>
              <div className="flex justify-end gap-2 ml-auto">
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
                  disabled={
                    !bulkExcelFile ||
                    bulkUploading ||
                    bulkJobStatus?.status === 'pending' ||
                    bulkJobStatus?.status === 'processing'
                  }
                  className="px-3 py-1.5 text-sm bg-[#341050] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {bulkUploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
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

