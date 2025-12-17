'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAllCourseSubjects, createCourseSubject, updateCourseSubject, deleteCourseSubject, CourseSubject } from '@/api/admin/course-subjects';
import { getAllCollegeCourses, CollegeCourse } from '@/api/admin/college-courses';
import { getAllSubjects, Subject } from '@/api/admin/subjects';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import { ConfirmationModal, useToast, Select } from '@/components/shared';

export default function CourseSubjectsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [subjects, setSubjects] = useState<CourseSubject[]>([]);
  const [allSubjects, setAllSubjects] = useState<CourseSubject[]>([]);
  const [courses, setCourses] = useState<CollegeCourse[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<CourseSubject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ course_id: '', subject_id: '' });

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
    if (allSubjects.length === 0) {
      setSubjects([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setSubjects(allSubjects);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allSubjects.filter(s =>
        s.subject_name?.toLowerCase().includes(searchLower) ||
        s.course_title?.toLowerCase().includes(searchLower) ||
        s.college_name?.toLowerCase().includes(searchLower)
      );
      setSubjects(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allSubjects]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [subjectsRes, coursesRes, availableSubjectsRes] = await Promise.all([
        getAllCourseSubjects(),
        getAllCollegeCourses(),
        getAllSubjects(),
      ]);

      if (subjectsRes.success && subjectsRes.data) {
        setAllSubjects(subjectsRes.data.subjects);
        setSubjects(subjectsRes.data.subjects);
      }
      if (coursesRes.success && coursesRes.data) {
        setCourses(coursesRes.data.courses);
      }
      if (availableSubjectsRes.success && availableSubjectsRes.data) {
        setAvailableSubjects(availableSubjectsRes.data.subjects.filter((s: Subject) => s.status));
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

    if (!formData.course_id || !formData.subject_id) {
      setError('Course and Subject are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const subjectData = {
        course_id: parseInt(formData.course_id),
        subject_id: parseInt(formData.subject_id),
      };

      let response;
      if (editingSubject) {
        response = await updateCourseSubject(editingSubject.id, subjectData);
      } else {
        response = await createCourseSubject(subjectData);
      }

      if (response.success) {
        showSuccess(`Course subject ${editingSubject ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        resetForm();
        fetchData();
      } else {
        const errorMsg = response.message || `Failed to ${editingSubject ? 'update' : 'create'} course subject`;
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = `An error occurred while ${editingSubject ? 'updating' : 'creating'} course subject`;
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving course subject:', err);
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
      const response = await deleteCourseSubject(deletingId);
      if (response.success) {
        showSuccess('Course subject deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchData();
      } else {
        const errorMsg = response.message || 'Failed to delete course subject';
        setError(errorMsg);
        showError(errorMsg);
        setShowDeleteConfirm(false);
        setDeletingId(null);
      }
    } catch (err: any) {
      const errorMsg = 'An error occurred while deleting course subject';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error deleting course subject:', err);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (subject: CourseSubject) => {
    setEditingSubject(subject);
    setFormData({
      course_id: subject.course_id.toString(),
      subject_id: subject.subject_id.toString(),
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingSubject(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ course_id: '', subject_id: '' });
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingSubject(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Course Subjects Manager</h1>
            <p className="text-sm text-gray-600">Manage course subjects.</p>
          </div>

          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All subjects</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allSubjects.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by subject, course..."
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
              Add Subject
            </button>
          </div>

          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading subjects...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">SUBJECT</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">COURSE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">COLLEGE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {subjects.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                          {subjects.length < allSubjects.length ? 'No subjects found matching your search' : 'No subjects found'}
                        </td>
                      </tr>
                    ) : (
                      subjects.map((subject) => (
                        <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{subject.subject_name || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700">{subject.course_title || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700">{subject.college_name || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(subject)}
                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(subject.id)}
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
                {editingSubject ? 'Edit Course Subject' : 'Create Course Subject'}
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
                    onChange={(value) => setFormData({ ...formData, course_id: value || '' })}
                    options={courses?.map(c => ({ value: c.id.toString(), label: c.title })) || []}
                    placeholder="Select course"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.subject_id}
                    onChange={(value) => setFormData({ ...formData, subject_id: value || '' })}
                    options={availableSubjects?.map(s => ({ value: s.id.toString(), label: s.name })) || []}
                    placeholder="Select subject"
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
                  {isSubmitting ? 'Saving...' : editingSubject ? 'Update' : 'Create'}
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
        title="Delete Course Subject"
        message="Are you sure you want to delete this course subject? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        confirmButtonStyle="danger"
      />
    </div>
  );
}

