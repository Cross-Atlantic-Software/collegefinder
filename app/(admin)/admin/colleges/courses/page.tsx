'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { 
  getAllCollegeCourses, 
  createCollegeCourse, 
  updateCollegeCourse, 
  deleteCollegeCourse,
  CollegeCourse 
} from '@/api/admin/college-courses';
import { getAllColleges, College } from '@/api/admin/colleges';
import { getAllStreams, Stream } from '@/api/admin/streams';
import { getAllLevels, Level } from '@/api/admin/levels';
import { getAllPrograms, Program } from '@/api/admin/programs';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiFileText, FiEye, FiDownload } from 'react-icons/fi';
import { ConfirmationModal, useToast, Select } from '@/components/shared';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/shared/RichTextEditor'), {
  ssr: false,
});

export default function CollegeCoursesPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [courses, setCourses] = useState<CollegeCourse[]>([]);
  const [allCourses, setAllCourses] = useState<CollegeCourse[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CollegeCourse | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCourse, setViewingCourse] = useState<CollegeCourse | null>(null);
  const [showBrochureModal, setShowBrochureModal] = useState(false);
  const [brochureUrl, setBrochureUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [brochurePreview, setBrochurePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    college_id: '',
    stream_id: '',
    level_id: '',
    program_id: '',
    title: '',
    summary: '',
    duration: '',
    curriculum_detail: '',
    admission_process: '',
    eligibility: '',
    placements: '',
    scholarship: '',
    brochure_url: '',
    fee_per_sem: '',
    total_fee: '',
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
      const filtered = allCourses.filter(c =>
        c.title.toLowerCase().includes(searchLower) ||
        c.college_name?.toLowerCase().includes(searchLower) ||
        c.stream_name?.toLowerCase().includes(searchLower) ||
        c.level_name?.toLowerCase().includes(searchLower) ||
        c.program_name?.toLowerCase().includes(searchLower)
      );
      setCourses(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allCourses]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [coursesRes, collegesRes, streamsRes, levelsRes, programsRes] = await Promise.all([
        getAllCollegeCourses(),
        getAllColleges(),
        getAllStreams(),
        getAllLevels(),
        getAllPrograms(),
      ]);

      if (coursesRes.success && coursesRes.data) {
        setAllCourses(coursesRes.data.courses);
        setCourses(coursesRes.data.courses);
      }
      if (collegesRes.success && collegesRes.data) {
        setColleges(collegesRes.data.colleges);
      }
      if (streamsRes.success && streamsRes.data) {
        setStreams(streamsRes.data.streams.filter((s: Stream) => s.status));
      }
      if (levelsRes.success && levelsRes.data) {
        setLevels(levelsRes.data.levels.filter((l: Level) => l.status));
      }
      if (programsRes.success && programsRes.data) {
        setPrograms(programsRes.data.programs.filter((p: Program) => p.status));
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

    if (!formData.college_id || !formData.title.trim()) {
      setError('College and Title are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const courseData: any = {
        college_id: parseInt(formData.college_id),
        stream_id: formData.stream_id ? parseInt(formData.stream_id) : null,
        level_id: formData.level_id ? parseInt(formData.level_id) : null,
        program_id: formData.program_id ? parseInt(formData.program_id) : null,
        title: formData.title,
        summary: formData.summary || null,
        duration: formData.duration || null,
        curriculum_detail: formData.curriculum_detail || null,
        admission_process: formData.admission_process || null,
        eligibility: formData.eligibility || null,
        placements: formData.placements || null,
        scholarship: formData.scholarship || null,
        fee_per_sem: formData.fee_per_sem ? parseFloat(formData.fee_per_sem) : null,
        total_fee: formData.total_fee ? parseFloat(formData.total_fee) : null,
      };

      // Only include brochure_url if no file is being uploaded
      if (brochureFile) {
        courseData.brochure = brochureFile;
        // Don't send brochure_url when uploading a file
      } else if (formData.brochure_url && formData.brochure_url.trim()) {
        courseData.brochure_url = formData.brochure_url;
      } else if (editingCourse && !brochureFile) {
        // When editing and no file/URL provided, set to null to clear existing brochure
        courseData.brochure_url = null;
      }

      let response;
      if (editingCourse) {
        response = await updateCollegeCourse(editingCourse.id, courseData);
      } else {
        response = await createCollegeCourse(courseData);
      }

      if (response.success) {
        showSuccess(`Course ${editingCourse ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        resetForm();
        fetchData();
      } else {
        const errorMsg = response.message || `Failed to ${editingCourse ? 'update' : 'create'} course`;
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
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
      const response = await deleteCollegeCourse(deletingId);
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
    } catch (err: any) {
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

  const handleEdit = (course: CollegeCourse) => {
    setEditingCourse(course);
    setFormData({
      college_id: course.college_id.toString(),
      stream_id: course.stream_id?.toString() || '',
      level_id: course.level_id?.toString() || '',
      program_id: course.program_id?.toString() || '',
      title: course.title,
      summary: course.summary || '',
      duration: course.duration || '',
      curriculum_detail: course.curriculum_detail || '',
      admission_process: course.admission_process || '',
      eligibility: course.eligibility || '',
      placements: course.placements || '',
      scholarship: course.scholarship || '',
      brochure_url: course.brochure_url || '',
      fee_per_sem: course.fee_per_sem?.toString() || '',
      total_fee: course.total_fee?.toString() || '',
    });
    setBrochureFile(null);
    setBrochurePreview(course.brochure_url);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingCourse(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      college_id: '',
      stream_id: '',
      level_id: '',
      program_id: '',
      title: '',
      summary: '',
      duration: '',
      curriculum_detail: '',
      admission_process: '',
      eligibility: '',
      placements: '',
      scholarship: '',
      brochure_url: '',
      fee_per_sem: '',
      total_fee: '',
    });
    setBrochureFile(null);
    setBrochurePreview(null);
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCourse(null);
    resetForm();
  };

  const handleBrochureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setBrochureFile(file);
        setBrochurePreview(URL.createObjectURL(file));
        setFormData({ ...formData, brochure_url: '' }); // Clear URL if file is selected
      } else {
        showError('Please select a PDF file');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-gray-900 mb-1">College Courses Manager</h1>
            <p className="text-sm text-gray-600">Manage college courses.</p>
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
                  placeholder="Search by title, college, stream..."
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
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">TITLE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">COLLEGE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">STREAM</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">LEVEL</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">PROGRAM</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">DURATION</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">TOTAL FEE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {courses.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 text-center text-sm text-gray-500">
                          {courses.length < allCourses.length ? 'No courses found matching your search' : 'No courses found'}
                        </td>
                      </tr>
                    ) : (
                      courses.map((course) => (
                        <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{course.title}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700">{course.college_name || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700">{course.stream_name || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700">{course.level_name || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700">{course.program_name || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700">{course.duration || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700">
                              {course.total_fee ? `₹${course.total_fee.toLocaleString()}` : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setViewingCourse(course);
                                  setShowViewModal(true);
                                }}
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
                {/* College (Required) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    College <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.college_id}
                    onChange={(value) => setFormData({ ...formData, college_id: value || '' })}
                    options={colleges?.map(c => ({ value: c.id.toString(), label: c.name })) || []}
                    placeholder="Select college"
                  />
                </div>

                {/* Title (Required) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                    required
                  />
                </div>

                {/* Stream, Level, Program */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
                    <Select
                      value={formData.stream_id}
                      onChange={(value) => setFormData({ ...formData, stream_id: value || '' })}
                    options={[
                      { value: '', label: 'None' },
                      ...(streams?.map(s => ({ value: s.id.toString(), label: s.name })) || [])
                    ]}
                      placeholder="Select stream"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                    <Select
                      value={formData.level_id}
                      onChange={(value) => setFormData({ ...formData, level_id: value || '' })}
                    options={[
                      { value: '', label: 'None' },
                      ...(levels?.map(l => ({ value: l.id.toString(), label: l.name })) || [])
                    ]}
                      placeholder="Select level"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                    <Select
                      value={formData.program_id}
                      onChange={(value) => setFormData({ ...formData, program_id: value || '' })}
                    options={[
                      { value: '', label: 'None' },
                      ...(programs?.map(p => ({ value: p.id.toString(), label: p.name })) || [])
                    ]}
                      placeholder="Select program"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                  <textarea
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 4 years, 2 years"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                  />
                </div>

                {/* Curriculum Detail (Rich Text) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Curriculum Detail</label>
                  <RichTextEditor
                    value={formData.curriculum_detail}
                    onChange={(value) => setFormData({ ...formData, curriculum_detail: value })}
                    placeholder="Enter curriculum details..."
                  />
                </div>

                {/* Admission Process */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admission Process</label>
                  <textarea
                    value={formData.admission_process}
                    onChange={(e) => setFormData({ ...formData, admission_process: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                  />
                </div>

                {/* Eligibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility</label>
                  <textarea
                    value={formData.eligibility}
                    onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                  />
                </div>

                {/* Placements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placements</label>
                  <textarea
                    value={formData.placements}
                    onChange={(e) => setFormData({ ...formData, placements: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                  />
                </div>

                {/* Scholarship */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship</label>
                  <textarea
                    value={formData.scholarship}
                    onChange={(e) => setFormData({ ...formData, scholarship: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                  />
                </div>

                {/* Fees */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee Per Semester</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.fee_per_sem}
                      onChange={(e) => setFormData({ ...formData, fee_per_sem: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.total_fee}
                      onChange={(e) => setFormData({ ...formData, total_fee: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Brochure */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brochure (PDF)</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleBrochureChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                  />
                  {brochurePreview && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <FiFileText className="h-4 w-4" />
                      <a
                        href={brochurePreview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink hover:underline"
                      >
                        View current brochure
                      </a>
                    </div>
                  )}
                  {!brochureFile && !brochurePreview && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Or enter brochure URL</label>
                      <input
                        type="url"
                        value={formData.brochure_url}
                        onChange={(e) => setFormData({ ...formData, brochure_url: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
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
                  {isSubmitting ? 'Saving...' : editingCourse ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

          {/* View Course Modal */}
          {showViewModal && viewingCourse && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Course Details</h2>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setViewingCourse(null);
                    }}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                          <p className="text-sm text-gray-900">{viewingCourse.title}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">College</label>
                          <p className="text-sm text-gray-900">{viewingCourse.college_name || `College ID: ${viewingCourse.college_id}`}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Stream</label>
                          <p className="text-sm text-gray-900">{viewingCourse.stream_name || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Level</label>
                          <p className="text-sm text-gray-900">{viewingCourse.level_name || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Program</label>
                          <p className="text-sm text-gray-900">{viewingCourse.program_name || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Duration</label>
                          <p className="text-sm text-gray-900">{viewingCourse.duration || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    {viewingCourse.summary && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Summary</label>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingCourse.summary}</p>
                      </div>
                    )}

                    {/* Curriculum Detail */}
                    {viewingCourse.curriculum_detail && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Curriculum Detail</label>
                        <div 
                          className="text-sm text-gray-900 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: viewingCourse.curriculum_detail }}
                        />
                      </div>
                    )}

                    {/* Admission Process */}
                    {viewingCourse.admission_process && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Admission Process</label>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingCourse.admission_process}</p>
                      </div>
                    )}

                    {/* Eligibility */}
                    {viewingCourse.eligibility && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Eligibility</label>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingCourse.eligibility}</p>
                      </div>
                    )}

                    {/* Placements */}
                    {viewingCourse.placements && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Placements</label>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingCourse.placements}</p>
                      </div>
                    )}

                    {/* Scholarship */}
                    {viewingCourse.scholarship && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Scholarship</label>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingCourse.scholarship}</p>
                      </div>
                    )}

                    {/* Fees */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Fees</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Fee per Semester</label>
                          <p className="text-sm text-gray-900">
                            {viewingCourse.fee_per_sem ? `₹${viewingCourse.fee_per_sem.toLocaleString()}` : '-'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Total Fee</label>
                          <p className="text-sm text-gray-900">
                            {viewingCourse.total_fee ? `₹${viewingCourse.total_fee.toLocaleString()}` : '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Brochure */}
                    {viewingCourse.brochure_url && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Brochure</label>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {
                              setBrochureUrl(viewingCourse.brochure_url!);
                              setShowBrochureModal(true);
                            }}
                            className="inline-flex items-center gap-2 text-sm text-pink hover:underline cursor-pointer"
                          >
                            <FiFileText className="h-4 w-4" />
                            View
                          </button>
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = viewingCourse.brochure_url!;
                              link.download = `course-brochure-${viewingCourse.id}.pdf`;
                              link.setAttribute('download', `course-brochure-${viewingCourse.id}.pdf`);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <FiDownload className="h-4 w-4" />
                            Download
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Timestamps</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Created At</label>
                          <p className="text-sm text-gray-900">
                            {new Date(viewingCourse.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Last Updated</label>
                          <p className="text-sm text-gray-900">
                            {new Date(viewingCourse.updated_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-end">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setViewingCourse(null);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Brochure View Modal */}
          {showBrochureModal && brochureUrl && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold">View Brochure</h2>
                  <button
                    onClick={() => {
                      setShowBrochureModal(false);
                      setBrochureUrl(null);
                    }}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 overflow-hidden bg-gray-100">
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(brochureUrl)}&embedded=true`}
                    className="w-full h-full border-0"
                    title="Course Brochure"
                    style={{ minHeight: '600px' }}
                  />
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                  <a
                    href={brochureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-pink hover:underline"
                  >
                    Open in new tab
                  </a>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = brochureUrl;
                      link.download = `course-brochure.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiDownload className="h-4 w-4" />
                    Download
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

