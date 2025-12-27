'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { CollegeFormData } from '../MultiStepCollegeForm';
import { getAllStreams, Stream } from '@/api/admin/streams';
import { getAllLevels, Level } from '@/api/admin/levels';
import { getAllPrograms, Program } from '@/api/admin/programs';
import { Select } from '@/components/shared';

interface Step5CoursesProps {
  formData: CollegeFormData;
  setFormData: React.Dispatch<React.SetStateAction<CollegeFormData>>;
  isViewMode?: boolean;
}

export default function Step5Courses({ formData, setFormData, isViewMode = false }: Step5CoursesProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [tempCourse, setTempCourse] = useState({
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
    brochureFile: null as File | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [streamsRes, levelsRes, programsRes] = await Promise.all([
          getAllStreams(),
          getAllLevels(),
          getAllPrograms(),
        ]);

        if (streamsRes.success && streamsRes.data) {
          setStreams(streamsRes.data.streams.filter((s: Stream) => s.status));
        }
        if (levelsRes.success && levelsRes.data) {
          setLevels(levelsRes.data.levels.filter((l: Level) => l.status));
        }
        if (programsRes.success && programsRes.data) {
          setPrograms(programsRes.data.programs.filter((p: Program) => p.status));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  const handleAddCourse = () => {
    setTempCourse({
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
      brochureFile: null,
    });
    setEditingIndex(null);
    setViewingIndex(null);
    setShowModal(true);
  };

  const handleEditCourse = (index: number) => {
    setTempCourse({
      ...formData.courses[index],
      brochureFile: null,
    });
    setEditingIndex(index);
    setViewingIndex(null);
    setShowModal(true);
  };

  const handleViewCourse = (index: number) => {
    setTempCourse({
      ...formData.courses[index],
      brochureFile: null,
    });
    setViewingIndex(index);
    setEditingIndex(null);
    setShowModal(true);
  };

  const handleDeleteCourse = (index: number) => {
    setFormData({
      ...formData,
      courses: formData.courses.filter((_, i) => i !== index),
    });
  };

  const handleSaveCourse = () => {
    if (!tempCourse.title.trim()) {
      alert('Course title is required');
      return;
    }

    if (editingIndex !== null) {
      // Update existing
      const updated = [...formData.courses];
      updated[editingIndex] = { ...tempCourse };
      setFormData({ ...formData, courses: updated });
    } else {
      // Add new
      setFormData({
        ...formData,
        courses: [...formData.courses, { ...tempCourse }],
      });
    }

    setShowModal(false);
    setEditingIndex(null);
    setViewingIndex(null);
  };

  return (
    <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Courses</h3>
              {!isViewMode && (
                <button
                  type="button"
                  onClick={handleAddCourse}
                  className="flex items-center gap-2 px-3 py-1.5 bg-pink text-white rounded-lg hover:bg-pink/90 transition-colors text-sm"
                >
                  <FiPlus className="h-4 w-4" />
                  Add Course
                </button>
              )}
            </div>

      {formData.courses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No courses added yet. Click &quot;Add Course&quot; to add one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {formData.courses.map((course, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{course.title}</p>
                {course.summary && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{course.summary}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleViewCourse(index)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="View Details"
                >
                  <FiEye className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleEditCourse(index)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Edit"
                >
                  <FiEdit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCourse(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        Note: Courses are optional. You can skip this step or add courses later.
      </p>

      {/* Course Detail/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-darkGradient text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {viewingIndex !== null ? 'View Course' : editingIndex !== null ? 'Edit Course' : 'Add Course'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingIndex(null);
                  setViewingIndex(null);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
                    <Select
                      options={streams.map(s => ({ value: s.id.toString(), label: s.name }))}
                      value={tempCourse.stream_id}
                      onChange={(value) => setTempCourse({ ...tempCourse, stream_id: value || '' })}
                      placeholder="Select Stream"
                      isSearchable={true}
                      isClearable={true}
                      disabled={viewingIndex !== null}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                    <Select
                      options={levels.map(l => ({ value: l.id.toString(), label: l.name }))}
                      value={tempCourse.level_id}
                      onChange={(value) => setTempCourse({ ...tempCourse, level_id: value || '' })}
                      placeholder="Select Level"
                      isSearchable={true}
                      isClearable={true}
                      disabled={viewingIndex !== null}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                    <Select
                      options={programs.map(p => ({ value: p.id.toString(), label: p.name }))}
                      value={tempCourse.program_id}
                      onChange={(value) => setTempCourse({ ...tempCourse, program_id: value || '' })}
                      placeholder="Select Program"
                      isSearchable={true}
                      isClearable={true}
                      disabled={viewingIndex !== null}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tempCourse.title}
                    onChange={(e) => setTempCourse({ ...tempCourse, title: e.target.value })}
                    disabled={viewingIndex !== null}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent disabled:bg-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                  <textarea
                    value={tempCourse.summary}
                    onChange={(e) => setTempCourse({ ...tempCourse, summary: e.target.value })}
                    disabled={viewingIndex !== null}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      value={tempCourse.duration}
                      onChange={(e) => setTempCourse({ ...tempCourse, duration: e.target.value })}
                      disabled={viewingIndex !== null}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee per Semester</label>
                    <input
                      type="number"
                      value={tempCourse.fee_per_sem}
                      onChange={(e) => setTempCourse({ ...tempCourse, fee_per_sem: e.target.value })}
                      disabled={viewingIndex !== null}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee</label>
                  <input
                    type="number"
                    value={tempCourse.total_fee}
                    onChange={(e) => setTempCourse({ ...tempCourse, total_fee: e.target.value })}
                    disabled={viewingIndex !== null}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility</label>
                  <textarea
                    value={tempCourse.eligibility}
                    onChange={(e) => setTempCourse({ ...tempCourse, eligibility: e.target.value })}
                    disabled={viewingIndex !== null}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admission Process</label>
                  <textarea
                    value={tempCourse.admission_process}
                    onChange={(e) => setTempCourse({ ...tempCourse, admission_process: e.target.value })}
                    disabled={viewingIndex !== null}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placements</label>
                  <textarea
                    value={tempCourse.placements}
                    onChange={(e) => setTempCourse({ ...tempCourse, placements: e.target.value })}
                    disabled={viewingIndex !== null}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship</label>
                  <textarea
                    value={tempCourse.scholarship}
                    onChange={(e) => setTempCourse({ ...tempCourse, scholarship: e.target.value })}
                    disabled={viewingIndex !== null}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Curriculum Detail</label>
                  <textarea
                    value={tempCourse.curriculum_detail}
                    onChange={(e) => setTempCourse({ ...tempCourse, curriculum_detail: e.target.value })}
                    disabled={viewingIndex !== null}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brochure URL</label>
                  <input
                    type="url"
                    value={tempCourse.brochure_url}
                    onChange={(e) => setTempCourse({ ...tempCourse, brochure_url: e.target.value })}
                    disabled={viewingIndex !== null}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {viewingIndex === null && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brochure File</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setTempCourse({ ...tempCourse, brochureFile: e.target.files?.[0] || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>

            {viewingIndex === null && (
              <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 bg-gray-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingIndex(null);
                    setViewingIndex(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCourse}
                  className="px-4 py-2 bg-pink text-white rounded-lg hover:bg-pink/90 transition-colors"
                >
                  {editingIndex !== null ? 'Update' : 'Add'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

