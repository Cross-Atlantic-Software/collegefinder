'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAllLectures, getLecturesBySubtopicId, createLecture, updateLecture, deleteLecture, Lecture, getAllPurposes, createPurpose, updatePurpose, deletePurpose, Purpose } from '@/api';
import { getAllSubtopics } from '@/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiEye, FiImage, FiVideo, FiSettings } from 'react-icons/fi';
import { ConfirmationModal, useToast, Select, SelectOption, MultiSelect } from '@/components/shared';
import RichTextEditor from '@/components/shared/RichTextEditor';

export default function LecturesPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [allLectures, setAllLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ 
    subtopic_id: '', 
    name: '', 
    content_type: 'VIDEO' as 'VIDEO' | 'ARTICLE',
    status: true,
    description: '',
    sort_order: 0
  });
  const [articleContent, setArticleContent] = useState('');
  const [availableSubtopics, setAvailableSubtopics] = useState<SelectOption[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingLecture, setViewingLecture] = useState<Lecture | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Purposes management
  const [showPurposeModal, setShowPurposeModal] = useState(false);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [availablePurposes, setAvailablePurposes] = useState<SelectOption[]>([]);
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
  const [purposeFormData, setPurposeFormData] = useState({ name: '', status: true });
  const [editingPurpose, setEditingPurpose] = useState<Purpose | null>(null);
  const [showPurposeDeleteConfirm, setShowPurposeDeleteConfirm] = useState(false);
  const [deletingPurposeId, setDeletingPurposeId] = useState<number | null>(null);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    fetchLectures();
    fetchSubtopics();
    fetchPurposes();
  }, [router]);

  const fetchSubtopics = async () => {
    try {
      const response = await getAllSubtopics();
      if (response.success && response.data) {
        setAvailableSubtopics(
          response.data.subtopics.map((s) => ({
            value: String(s.id),
            label: s.name,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching subtopics:', err);
    }
  };

  const fetchPurposes = async () => {
    try {
      const response = await getAllPurposes();
      if (response.success && response.data) {
        setPurposes(response.data.purposes);
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
      formDataToSend.append('subtopic_id', formData.subtopic_id);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('content_type', formData.content_type);
      formDataToSend.append('status', String(formData.status));
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('sort_order', String(formData.sort_order));
      
      // Add content based on type
      if (formData.content_type === 'VIDEO') {
        if (videoFile) {
          formDataToSend.append('video_file', videoFile);
        } else if (!editingLecture) {
          throw new Error('Video file is required for VIDEO content type');
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

      let response;
      if (editingLecture) {
        response = await updateLecture(editingLecture.id, formDataToSend);
      } else {
        response = await createLecture(formDataToSend);
      }

      if (response.success) {
        showSuccess(editingLecture ? 'Lecture updated successfully' : 'Lecture created successfully');
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
    setEditingLecture(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (lecture: Lecture) => {
    setEditingLecture(lecture);
    setFormData({
      subtopic_id: String(lecture.subtopic_id),
      name: lecture.name,
      content_type: lecture.content_type || 'VIDEO',
      status: lecture.status,
      description: lecture.description || '',
      sort_order: lecture.sort_order
    });
    setArticleContent(lecture.article_content || '');
    setThumbnailPreview(lecture.thumbnail);
    setThumbnailFile(null);
    setVideoFile(null);
    // Set selected purposes
    if (lecture.purposes && lecture.purposes.length > 0) {
      setSelectedPurposes(lecture.purposes.map(p => String(p.id)));
    } else {
      setSelectedPurposes([]);
    }
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
    setFormData({ 
      subtopic_id: '', 
      name: '', 
      content_type: 'VIDEO',
      status: true,
      description: '',
      sort_order: 0
    });
    setArticleContent('');
    setVideoFile(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setSelectedPurposes([]);
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingLecture(null);
    resetForm();
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Lectures Manager</h1>
            <p className="text-sm text-gray-600">Manage lectures that belong to subtopics.</p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All lectures</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allLectures.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none w-64 transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPurposeModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FiSettings className="h-4 w-4" />
                Manage Purpose
              </button>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <FiPlus className="h-4 w-4" />
                Add Lecture
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Lectures Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading lectures...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">THUMBNAIL</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">SUBTOPIC</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">CONTENT TYPE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">PURPOSES</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">STATUS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">CREATED</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lectures.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 text-center text-sm text-gray-500">
                          {lectures.length < allLectures.length ? 'No lectures found matching your search' : 'No lectures found'}
                        </td>
                      </tr>
                    ) : (
                      lectures.map((lecture) => {
                        const subtopic = availableSubtopics.find((s) => s.value === String(lecture.subtopic_id));
                        const lecturePurposes = lecture.purposes || [];
                        return (
                          <tr key={lecture.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2">
                              {lecture.thumbnail ? (
                                <img
                                  src={lecture.thumbnail}
                                  alt={lecture.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                  <FiImage className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm font-medium text-gray-900">{lecture.name}</span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm text-gray-600">{subtopic?.label || `Subtopic ${lecture.subtopic_id}`}</span>
                            </td>
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
                                    <span className="text-xs text-gray-500">+{lecturePurposes.length - 2}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {lecture.status ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-xs text-gray-600">
                              {new Date(lecture.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleView(lecture)}
                                  className="p-2 text-green-600 hover:text-green-800 transition-colors"
                                  title="View"
                                >
                                  <FiEye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEdit(lecture)}
                                  className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Edit"
                                >
                                  <FiEdit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(lecture.id)}
                                  className="p-2 text-red-600 hover:text-red-800 transition-colors"
                                  title="Delete"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              </div>
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
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingLecture ? 'Edit Lecture' : 'Create Lecture'}
              </h2>
              <button
                onClick={handleModalClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Subtopic <span className="text-pink">*</span>
                  </label>
                  <Select
                    options={availableSubtopics}
                    value={formData.subtopic_id}
                    onChange={(value) => setFormData({ ...formData, subtopic_id: value || '' })}
                    placeholder="Select subtopic"
                    isSearchable
                    isClearable={false}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name <span className="text-pink">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Introduction to Algebra, Solving Linear Equations"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Content Type <span className="text-pink">*</span>
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
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Video File <span className="text-pink">*</span>
                    </label>
                    {editingLecture && editingLecture.video_file && !videoFile && (
                      <div className="mb-2 p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-xs text-gray-600">Current: {editingLecture.video_file}</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      required={!editingLecture}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Max file size: 500MB</p>
                  </div>
                )}

                {formData.content_type === 'ARTICLE' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Article Content <span className="text-pink">*</span>
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Thumbnail
                  </label>
                  {thumbnailPreview && (
                    <div className="mb-2">
                      <img
                        src={thumbnailPreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded border border-gray-300"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    rows={3}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                        className="w-4 h-4 text-pink border-gray-300 rounded focus:ring-pink"
                      />
                      <span className="text-xs font-medium text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-darkGradient rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
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
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Lecture Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <div className="space-y-4">
                {viewingLecture.thumbnail && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Thumbnail</label>
                    <img src={viewingLecture.thumbnail} alt={viewingLecture.name} className="w-48 h-32 object-cover rounded border border-gray-200" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-sm text-gray-900">{viewingLecture.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Subtopic</label>
                  <p className="text-sm text-gray-900">
                    {availableSubtopics.find((s) => s.value === String(viewingLecture.subtopic_id))?.label || `Subtopic ${viewingLecture.subtopic_id}`}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Content Type</label>
                  <p className="text-sm text-gray-900">
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
                {viewingLecture.content_type === 'VIDEO' && viewingLecture.video_file && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Video</label>
                    <div className="mt-1">
                      <video
                        src={viewingLecture.video_file}
                        controls
                        className="w-full max-w-md rounded border border-gray-200"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                )}
                {viewingLecture.content_type === 'ARTICLE' && viewingLecture.article_content && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Article Content</label>
                    <div 
                      className="text-sm text-gray-700 prose prose-sm max-w-none border border-gray-200 rounded-lg p-4 [&_img]:max-w-full [&_img]:h-auto [&_img]:block [&_img]:my-4 [&_img]:rounded-lg"
                      dangerouslySetInnerHTML={{ __html: viewingLecture.article_content }}
                    />
                  </div>
                )}
                {viewingLecture.description && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-sm text-gray-900">{viewingLecture.description}</p>
                  </div>
                )}
                {viewingLecture.purposes && viewingLecture.purposes.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Purposes</label>
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <p className="text-sm text-gray-900">{viewingLecture.status ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sort Order</label>
                    <p className="text-sm text-gray-900">{viewingLecture.sort_order}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Created</label>
                    <p className="text-sm text-gray-900">
                      {new Date(viewingLecture.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Updated</label>
                    <p className="text-sm text-gray-900">
                      {new Date(viewingLecture.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
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
        onConfirm={handleDelete}
        title="Delete Lecture"
        message="Are you sure you want to delete this lecture? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        confirmButtonStyle="danger"
      />

      {/* Purpose Management Modal */}
      {showPurposeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Manage Purposes</h2>
              <button
                onClick={() => {
                  setShowPurposeModal(false);
                  setEditingPurpose(null);
                  setPurposeFormData({ name: '', status: true });
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                {/* Purpose Form */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    {editingPurpose ? 'Edit Purpose' : 'Create Purpose'}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Name <span className="text-pink">*</span>
                      </label>
                      <input
                        type="text"
                        value={purposeFormData.name}
                        onChange={(e) => setPurposeFormData({ ...purposeFormData, name: e.target.value })}
                        placeholder="e.g., Exam Preparation, Concept Learning"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="purposeStatus"
                            checked={purposeFormData.status === true}
                            onChange={() => setPurposeFormData({ ...purposeFormData, status: true })}
                            className="w-4 h-4 text-pink focus:ring-pink"
                          />
                          <span className="text-sm text-gray-700">Active</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="purposeStatus"
                            checked={purposeFormData.status === false}
                            onChange={() => setPurposeFormData({ ...purposeFormData, status: false })}
                            className="w-4 h-4 text-pink focus:ring-pink"
                          />
                          <span className="text-sm text-gray-700">Inactive</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!purposeFormData.name.trim()) {
                            showError('Name is required');
                            return;
                          }
                          try {
                            if (editingPurpose) {
                              const response = await updatePurpose(editingPurpose.id, purposeFormData);
                              if (response.success) {
                                showSuccess('Purpose updated successfully');
                                setPurposeFormData({ name: '', status: true });
                                setEditingPurpose(null);
                                fetchPurposes();
                              } else {
                                showError(response.message || 'Failed to update purpose');
                              }
                            } else {
                              const response = await createPurpose(purposeFormData);
                              if (response.success) {
                                showSuccess('Purpose created successfully');
                                setPurposeFormData({ name: '', status: true });
                                fetchPurposes();
                              } else {
                                showError(response.message || 'Failed to create purpose');
                              }
                            }
                          } catch (err: any) {
                            showError(err.message || 'An error occurred');
                          }
                        }}
                        className="px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        {editingPurpose ? 'Update' : 'Create'}
                      </button>
                      {editingPurpose && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPurpose(null);
                            setPurposeFormData({ name: '', status: true });
                          }}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Purposes List */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">All Purposes</h3>
                  <div className="space-y-2">
                    {purposes.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No purposes found</p>
                    ) : (
                      purposes.map((purpose) => (
                        <div
                          key={purpose.id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-900">{purpose.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                purpose.status
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {purpose.status ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingPurpose(purpose);
                                setPurposeFormData({ name: purpose.name, status: purpose.status });
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 transition-colors"
                              title="Edit"
                            >
                              <FiEdit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingPurposeId(purpose.id);
                                setShowPurposeDeleteConfirm(true);
                              }}
                              className="p-1.5 text-red-600 hover:text-red-800 transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purpose Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showPurposeDeleteConfirm}
        onClose={() => {
          setShowPurposeDeleteConfirm(false);
          setDeletingPurposeId(null);
        }}
        onConfirm={async () => {
          if (!deletingPurposeId) return;
          try {
            const response = await deletePurpose(deletingPurposeId);
            if (response.success) {
              showSuccess('Purpose deleted successfully');
              fetchPurposes();
            } else {
              showError(response.message || 'Failed to delete purpose');
            }
          } catch (err: any) {
            showError(err.message || 'An error occurred');
          } finally {
            setShowPurposeDeleteConfirm(false);
            setDeletingPurposeId(null);
          }
        }}
        title="Delete Purpose"
        message="Are you sure you want to delete this purpose? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="danger"
      />
    </div>
  );
}

