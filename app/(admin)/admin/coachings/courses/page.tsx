'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllCoachingCourses,
  createCoachingCourse,
  updateCoachingCourse,
  deleteCoachingCourse,
  CoachingCourse
} from '@/api/admin/coaching-courses';
import { getAllCoachings, Coaching } from '@/api/admin/coachings';
import { getAllExamsAdmin, Exam } from '@/api/admin/exams';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiEye, FiDollarSign, FiStar } from 'react-icons/fi';
import { ConfirmationModal, useToast, Select, MultiSelect } from '@/components/shared';
import RichTextEditor from '@/components/shared/RichTextEditor';

export default function CoachingCoursesPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [courses, setCourses] = useState<CoachingCourse[]>([]);
  const [allCourses, setAllCourses] = useState<CoachingCourse[]>([]);
  const [coachings, setCoachings] = useState<Coaching[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CoachingCourse | null>(null);
  const [viewingCourse, setViewingCourse] = useState<CoachingCourse | null>(null);
  const [formData, setFormData] = useState({
    coaching_id: '',
    exam_ids: [] as string[],
    title: '',
    summary: '',
    duration: '',
    mode: '' as 'Online' | 'Offline' | 'Hybrid' | '',
    fee: '',
    contact_email: '',
    contact: '',
    rating: '',
    features: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modeOptions = [
    { value: 'Online', label: 'Online' },
    { value: 'Offline', label: 'Offline' },
    { value: 'Hybrid', label: 'Hybrid' },
  ];

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    fetchData();
  }, [router]);

  useEffect(() => {
    if (allCourses.length === 0) {
      setCourses([]);
      return;
    }

    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setCourses(allCourses);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allCourses.filter(course =>
        course.title.toLowerCase().includes(searchLower) ||
        course.summary?.toLowerCase().includes(searchLower) ||
        course.coaching_name?.toLowerCase().includes(searchLower)
      );
      setCourses(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allCourses]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [coursesRes, coachingsRes, examsRes] = await Promise.all([
        getAllCoachingCourses(),
        getAllCoachings(),
        getAllExamsAdmin(),
      ]);

      if (coursesRes.success && coursesRes.data) {
        setAllCourses(coursesRes.data.courses);
        setCourses(coursesRes.data.courses);
      }
      if (coachingsRes.success && coachingsRes.data) {
        setCoachings(coachingsRes.data.coachings);
      }
      if (examsRes.success && examsRes.data) {
        setExams(examsRes.data.exams);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.coaching_id || !formData.title.trim() || !formData.mode) {
      setError('Coaching, title, and mode are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const courseData = {
        coaching_id: parseInt(formData.coaching_id),
        exam_ids: formData.exam_ids.map(id => parseInt(id)),
        title: formData.title,
        summary: formData.summary || undefined,
        duration: formData.duration || undefined,
        mode: formData.mode as 'Online' | 'Offline' | 'Hybrid',
        fee: formData.fee ? parseFloat(formData.fee) : undefined,
        contact_email: formData.contact_email || undefined,
        contact: formData.contact || undefined,
        rating: formData.rating ? parseFloat(formData.rating) : undefined,
        features: formData.features || undefined,
      };

      let response;
      if (editingCourse) {
        response = await updateCoachingCourse(editingCourse.id, courseData);
      } else {
        response = await createCoachingCourse(courseData);
      }

      if (response.success) {
        showSuccess(editingCourse ? 'Course updated successfully' : 'Course created successfully');
        setShowModal(false);
        resetForm();
        fetchData();
      } else {
        const errorMsg = response.message || `Failed to ${editingCourse ? 'update' : 'create'} course`;
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err) {
      const errorMsg = `An error occurred while ${editingCourse ? 'updating' : 'creating'} course`;
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving course:', err);
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
      const response = await deleteCoachingCourse(deletingId);
      if (response.success) {
        showSuccess('Course deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchData();
      } else {
        const errorMsg = response.message || 'Failed to delete course';
        setError(errorMsg);
        showError(errorMsg);
        setShowDeleteConfirm(false);
        setDeletingId(null);
      }
    } catch (err) {
      const errorMsg = 'An error occurred while deleting course';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error deleting course:', err);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (course: CoachingCourse) => {
    setEditingCourse(course);
    setFormData({
      coaching_id: course.coaching_id.toString(),
      exam_ids: course.exam_ids ? course.exam_ids.map(id => id.toString()) : [],
      title: course.title,
      summary: course.summary || '',
      duration: course.duration || '',
      mode: course.mode,
      fee: course.fee?.toString() || '',
      contact_email: course.contact_email || '',
      contact: course.contact || '',
      rating: course.rating?.toString() || '',
      features: course.features || '',
    });
    setShowModal(true);
  };

  const handleView = (course: CoachingCourse) => {
    setViewingCourse(course);
  };

  const handleCreate = () => {
    setEditingCourse(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      coaching_id: '',
      exam_ids: [],
      title: '',
      summary: '',
      duration: '',
      mode: '',
      fee: '',
      contact_email: '',
      contact: '',
      rating: '',
      features: '',
    });
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCourse(null);
    setViewingCourse(null);
    resetForm();
  };

  const formatExams = (examIds: number[] | undefined, examsList: Exam[]) => {
    if (!examIds || examIds.length === 0) return 'None';
    return examIds.map(id => {
      const exam = examsList.find(e => e.id === id);
      return exam ? exam.name : `Exam ${id}`;
    }).join(', ');
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Coaching Courses Manager</h1>
            <p className="text-sm text-gray-600">Manage coaching center courses and programs.</p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All courses</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allCourses.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, summary, coaching..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none w-64 transition-all duration-200"
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <FiPlus className="h-4 w-4" />
              Add Course
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Courses Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading courses...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">COACHING</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">TITLE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">MODE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">FEE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">RATING</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {courses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                          {courses.length < allCourses.length ? 'No courses found matching your search' : 'No courses found'}
                        </td>
                      </tr>
                    ) : (
                      courses.map((course) => (
                        <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{course.coaching_name || `Coaching ${course.coaching_id}`}</span>
                          </td>
                          <td className="px-4 py-2">
                            <div>
                              <span className="text-sm font-medium text-gray-900">{course.title}</span>
                              {course.duration && (
                                <p className="text-xs text-gray-500">{course.duration}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              course.mode === 'Online' ? 'bg-blue-100 text-blue-800' :
                              course.mode === 'Offline' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {course.mode}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1">
                              <FiDollarSign className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {course.fee ? `₹${course.fee.toLocaleString()}` : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1">
                              <FiStar className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-700">
                                {course.rating ? parseFloat(course.rating.toString()).toFixed(1) : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleView(course)}
                                className="p-2 text-green-600 hover:text-green-800 transition-colors"
                                title="View"
                              >
                                <FiEye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(course)}
                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(course.id)}
                                className="p-2 text-red-600 hover:text-red-800 transition-colors"
                                title="Delete"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            </div>
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

      {/* Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingCourse ? 'Edit Course' : 'Create Course'}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Coaching <span className="text-pink">*</span>
                    </label>
                    <Select
                      value={formData.coaching_id}
                      onChange={(value) => setFormData({ ...formData, coaching_id: value || '' })}
                      options={coachings?.map(c => ({ value: c.id.toString(), label: c.name })) || []}
                      placeholder="Select coaching center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Mode <span className="text-pink">*</span>
                    </label>
                    <Select
                      value={formData.mode}
                      onChange={(value) => setFormData({ ...formData, mode: value as 'Online' | 'Offline' | 'Hybrid' | '' })}
                      options={modeOptions}
                      placeholder="Select course mode"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Title <span className="text-pink">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., JEE Main Complete Course"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Exams (Optional)
                  </label>
                  <MultiSelect
                    value={formData.exam_ids}
                    onChange={(values) => setFormData({ ...formData, exam_ids: values })}
                    options={exams?.map(e => ({ value: e.id.toString(), label: e.name })) || []}
                    placeholder="Select exams this course prepares for"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g., 6 months, 1 year"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.fee}
                      onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                      placeholder="e.g., 50000"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="contact@coaching.com"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="e.g., +91-9876543210"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Rating (1-5)
                  </label>
                  <input
                    type="number"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    placeholder="e.g., 4.5"
                    min="0"
                    max="5"
                    step="0.1"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Summary
                  </label>
                  <textarea
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Brief summary of the course"
                    rows={3}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Features
                  </label>
                  <RichTextEditor
                    value={formData.features}
                    onChange={(value) => setFormData({ ...formData, features: value })}
                    placeholder="Describe course features and benefits..."
                    className="min-h-[150px]"
                    imageUploadEndpoint="/admin/coaching-courses/upload-image"
                    imageFormFieldName="course_image"
                  />
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
                  {isSubmitting ? 'Saving...' : editingCourse ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Course Details</h2>
              <button
                onClick={() => setViewingCourse(null)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Coaching</label>
                    <p className="text-sm text-gray-900">{viewingCourse.coaching_name || `Coaching ${viewingCourse.coaching_id}`}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                    <p className="text-sm text-gray-900">{viewingCourse.title}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Mode</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      viewingCourse.mode === 'Online' ? 'bg-blue-100 text-blue-800' :
                      viewingCourse.mode === 'Offline' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {viewingCourse.mode}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                      <p className="text-sm text-gray-900">{viewingCourse.duration || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fee</label>
                      <p className="text-sm text-gray-900">{viewingCourse.fee ? `₹${viewingCourse.fee.toLocaleString()}` : 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rating</label>
                    <div className="flex items-center gap-1">
                      <FiStar className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-900">{viewingCourse.rating ? parseFloat(viewingCourse.rating.toString()).toFixed(1) : 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Exams</label>
                    <p className="text-sm text-gray-900">{formatExams(viewingCourse.exam_ids || undefined, exams)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {viewingCourse.summary && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Summary</label>
                      <p className="text-sm text-gray-900">{viewingCourse.summary}</p>
                    </div>
                  )}
                  {viewingCourse.contact_email && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Contact Email</label>
                      <p className="text-sm text-gray-900">{viewingCourse.contact_email}</p>
                    </div>
                  )}
                  {viewingCourse.contact && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Contact</label>
                      <p className="text-sm text-gray-900">{viewingCourse.contact}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Created</label>
                      <p className="text-sm text-gray-900">
                        {new Date(viewingCourse.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Updated</label>
                      <p className="text-sm text-gray-900">
                        {new Date(viewingCourse.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {viewingCourse.features && (
                <div className="mt-6">
                  <label className="block text-xs font-medium text-gray-700 mb-2">Features</label>
                  <div
                    className="text-sm text-gray-900 prose prose-sm max-w-none p-3 border border-gray-200 rounded-lg bg-gray-50"
                    dangerouslySetInnerHTML={{ __html: viewingCourse.features }}
                  />
                </div>
              )}
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
        title="Delete Course"
        message="Are you sure you want to delete this course? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        confirmButtonStyle="danger"
      />
    </div>
  );
}
