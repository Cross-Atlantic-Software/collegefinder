'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAllCourseCutoffs, createCourseCutoff, updateCourseCutoff, deleteCourseCutoff, CourseCutoff } from '@/api/admin/course-cutoffs';
import { getAllCollegeCourses, CollegeCourse } from '@/api/admin/college-courses';
import { getAllCourseExams, CourseExam } from '@/api/admin/course-exams';
import { getAllCategories, Category } from '@/api/admin/categories';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import { ConfirmationModal, useToast, Select } from '@/components/shared';

export default function CourseCutoffsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [cutoffs, setCutoffs] = useState<CourseCutoff[]>([]);
  const [allCutoffs, setAllCutoffs] = useState<CourseCutoff[]>([]);
  const [courses, setCourses] = useState<CollegeCourse[]>([]);
  const [exams, setExams] = useState<CourseExam[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCutoff, setEditingCutoff] = useState<CourseCutoff | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    course_id: '',
    exam_id: '',
    year: new Date().getFullYear().toString(),
    category: '',
    cutoff_value: '',
  });

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
    if (allCutoffs.length === 0) {
      setCutoffs([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setCutoffs(allCutoffs);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allCutoffs.filter(c =>
        c.exam_name?.toLowerCase().includes(searchLower) ||
        c.course_title?.toLowerCase().includes(searchLower) ||
        c.college_name?.toLowerCase().includes(searchLower) ||
        c.category_name?.toLowerCase().includes(searchLower)
      );
      setCutoffs(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allCutoffs]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [cutoffsRes, coursesRes, examsRes, categoriesRes] = await Promise.all([
        getAllCourseCutoffs(),
        getAllCollegeCourses(),
        getAllCourseExams(),
        getAllCategories(),
      ]);

      if (cutoffsRes.success && cutoffsRes.data) {
        setAllCutoffs(cutoffsRes.data.cutoffs);
        setCutoffs(cutoffsRes.data.cutoffs);
      }
      if (coursesRes.success && coursesRes.data) {
        setCourses(coursesRes.data.courses);
      }
      if (examsRes.success && examsRes.data) {
        setExams(examsRes.data.exams);
      }
      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data.categories);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.course_id || !formData.exam_id || !formData.year || !formData.cutoff_value) {
      setError('Course, Exam, Year, and Cutoff Value are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const cutoffData = {
        course_id: parseInt(formData.course_id),
        exam_id: parseInt(formData.exam_id),
        year: parseInt(formData.year),
        category_id: formData.category_id || null,
        cutoff_value: parseFloat(formData.cutoff_value),
      };

      let response;
      if (editingCutoff) {
        response = await updateCourseCutoff(editingCutoff.id, cutoffData);
      } else {
        response = await createCourseCutoff(cutoffData);
      }

      if (response.success) {
        showSuccess(`Cutoff ${editingCutoff ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        resetForm();
        fetchData();
      } else {
        const errorMsg = response.message || `Failed to ${editingCutoff ? 'update' : 'create'} cutoff`;
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = `An error occurred while ${editingCutoff ? 'updating' : 'creating'} cutoff`;
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving cutoff:', err);
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
      const response = await deleteCourseCutoff(deletingId);
      if (response.success) {
        showSuccess('Cutoff deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchData();
      } else {
        const errorMsg = response.message || 'Failed to delete cutoff';
        setError(errorMsg);
        showError(errorMsg);
        setShowDeleteConfirm(false);
        setDeletingId(null);
      }
    } catch (err: any) {
      const errorMsg = 'An error occurred while deleting cutoff';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error deleting cutoff:', err);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (cutoff: CourseCutoff) => {
    setEditingCutoff(cutoff);
    setFormData({
      course_id: cutoff.course_id.toString(),
      exam_id: cutoff.exam_id.toString(),
      year: cutoff.year.toString(),
      category_id: cutoff.category_id?.toString() || '',
      cutoff_value: cutoff.cutoff_value.toString(),
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingCutoff(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      course_id: '',
      exam_id: '',
      year: new Date().getFullYear().toString(),
      category: '',
      cutoff_value: '',
    });
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCutoff(null);
    resetForm();
  };

  // Filter exams by selected course
  const filteredExams = formData.course_id
    ? exams.filter(e => e.course_id === parseInt(formData.course_id))
    : exams;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Course Cutoffs Manager</h1>
            <p className="text-sm text-gray-600">Manage course cutoffs.</p>
          </div>

          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All cutoffs</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allCutoffs.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by exam, course, category..."
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
              Add Cutoff
            </button>
          </div>

          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading cutoffs...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">EXAM</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">COURSE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">YEAR</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">CATEGORY</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">CUTOFF</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cutoffs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                          {cutoffs.length < allCutoffs.length ? 'No cutoffs found matching your search' : 'No cutoffs found'}
                        </td>
                      </tr>
                    ) : (
                      cutoffs.map((cutoff) => (
                        <tr key={cutoff.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{cutoff.exam_name || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700">{cutoff.course_title || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700">{cutoff.year}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700">{cutoff.category_name || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700">{cutoff.cutoff_value}</span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(cutoff)}
                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(cutoff.id)}
                                className="p-2 text-red-600 hover:text-red-800 transition-colors"
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingCutoff ? 'Edit Cutoff' : 'Create Cutoff'}
              </h2>
              <button
                onClick={handleModalClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.course_id}
                    onChange={(value) => setFormData({ ...formData, course_id: value, exam_id: '' })}
                    options={courses.map(c => ({ value: c.id.toString(), label: c.title }))}
                    placeholder="Select course"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.exam_id}
                    onChange={(value) => setFormData({ ...formData, exam_id: value })}
                    options={filteredExams?.map(e => ({ value: e.id.toString(), label: e.exam_name })) || []}
                    placeholder="Select exam"
                    disabled={!formData.course_id}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    min="2000"
                    max="2100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <Select
                    options={categories.map(cat => ({ value: cat.id.toString(), label: cat.name }))}
                    value={formData.category_id}
                    onChange={(value) => setFormData({ ...formData, category_id: value || '' })}
                    placeholder="Select category"
                    isClearable
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cutoff Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cutoff_value}
                    onChange={(e) => setFormData({ ...formData, cutoff_value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
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
                  {isSubmitting ? 'Saving...' : editingCutoff ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Cutoff"
        message="Are you sure you want to delete this cutoff? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        confirmButtonStyle="danger"
      />
    </div>
  );
}

