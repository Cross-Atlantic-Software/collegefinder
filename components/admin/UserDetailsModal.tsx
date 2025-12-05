'use client';

import { useState, useEffect } from 'react';
import { X, User, BookOpen, Target, Loader2, GraduationCap } from 'lucide-react';
import { getUserDetails } from '@/api/admin/users';
import type { SiteUser } from '@/api/types';
import ExpandableSection from './UserDetailsModal/ExpandableSection';
import SubjectMarksList from './UserDetailsModal/SubjectMarksList';
import PreviousAttemptsList from './UserDetailsModal/PreviousAttemptsList';

interface UserDetailsModalProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

interface UserDetails {
  user: SiteUser & {
    auth_provider?: string | null;
    updated_at?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  academics: {
    matric_board: string | null;
    matric_school_name: string | null;
    matric_passing_year: number | null;
    matric_roll_number: string | null;
    matric_total_marks: number | null;
    matric_obtained_marks: number | null;
    matric_percentage: number | null;
    matric_subjects: Array<{ name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
    postmatric_board: string | null;
    postmatric_school_name: string | null;
    postmatric_passing_year: number | null;
    postmatric_roll_number: string | null;
    postmatric_total_marks: number | null;
    postmatric_obtained_marks: number | null;
    postmatric_percentage: number | null;
    stream: string | null;
    subjects: Array<{ name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
    is_pursuing_12th: boolean;
    created_at?: string | null;
    updated_at?: string | null;
  } | null;
  careerGoals: {
    interests: string[];
    created_at?: string | null;
    updated_at?: string | null;
  } | null;
  examPreferences: {
    target_exams: string[];
    previous_attempts: Array<{
      exam_name: string;
      year: number;
      rank: number | null;
    }>;
    created_at?: string | null;
    updated_at?: string | null;
  } | null;
}

export default function UserDetailsModal({ userId, isOpen, onClose }: UserDetailsModalProps) {
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubjectsExpanded, setIsSubjectsExpanded] = useState(false);
  const [isMatricSubjectsExpanded, setIsMatricSubjectsExpanded] = useState(false);
  const [isPreviousAttemptsExpanded, setIsPreviousAttemptsExpanded] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    } else {
      setDetails(null);
      setError(null);
      setIsSubjectsExpanded(false);
      setIsMatricSubjectsExpanded(false);
      setIsPreviousAttemptsExpanded(false);
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getUserDetails(userId);
      if (response.success && response.data) {
        setDetails(response.data);
      } else {
        setError(response.message || 'Failed to fetch user details');
      }
    } catch (err) {
      setError('An error occurred while fetching user details');
      console.error('Error fetching user details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-darkGradient text-white px-4 py-2.5 flex items-center justify-between">
          <h2 className="text-base font-bold">User Details</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-pink" />
              <span className="ml-2 text-sm text-gray-600">Loading user details...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <button
                onClick={fetchUserDetails}
                className="px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
            </div>
          ) : details ? (
            <div className="space-y-5">
              {/* Basic Information */}
              <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-pink" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Email:</span>
                    <p className="text-sm text-gray-900 truncate font-medium" title={details.user.email}>{details.user.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Nickname:</span>
                    <p className="text-sm text-gray-900 font-medium">{details.user.name || '-'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">First Name:</span>
                    <p className="text-sm text-gray-900 font-medium">{details.user.first_name || '-'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Last Name:</span>
                    <p className="text-sm text-gray-900 font-medium">{details.user.last_name || '-'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Date of Birth:</span>
                    <p className="text-sm text-gray-900 font-medium">
                      {details.user.date_of_birth
                        ? new Date(details.user.date_of_birth).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Gender:</span>
                    <p className="text-sm text-gray-900 font-medium">{details.user.gender || '-'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Phone:</span>
                    <p className="text-sm text-gray-900 font-medium">{details.user.phone_number || '-'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Domicile State:</span>
                    <p className="text-sm text-gray-900 font-medium">{details.user.state || '-'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">District:</span>
                    <p className="text-sm text-gray-900 font-medium">{details.user.district || '-'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Email Verified:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      details.user.email_verified
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {details.user.email_verified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Account Status:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      details.user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {details.user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Created At:</span>
                    <p className="text-sm text-gray-900 font-medium">
                      {new Date(details.user.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {details.user.last_login && (
                    <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                      <span className="text-xs font-medium text-gray-600">Last Login:</span>
                      <p className="text-sm text-gray-900 font-medium">
                        {new Date(details.user.last_login).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                  {details.user.updated_at && (
                    <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                      <span className="text-xs font-medium text-gray-600">Last Updated:</span>
                      <p className="text-sm text-gray-900 font-medium">
                        {new Date(details.user.updated_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                  {details.user.auth_provider && (
                    <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                      <span className="text-xs font-medium text-gray-600">Auth Provider:</span>
                      <p className="text-sm text-gray-900 font-medium capitalize">{details.user.auth_provider}</p>
                    </div>
                  )}
                  {(details.user.latitude !== null && details.user.latitude !== undefined && 
                    details.user.longitude !== null && details.user.longitude !== undefined) && (
                    <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                      <span className="text-xs font-medium text-gray-600">Location:</span>
                      <p className="text-sm text-gray-900 font-medium">
                        {details.user.latitude.toFixed(6)}, {details.user.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Academics */}
              <section className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  Academics
                </h3>
                {details.academics ? (
                  <div className="space-y-4">
                    {/* Matric (10th) */}
                    <div className="bg-white rounded-md p-3 border border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2.5 uppercase tracking-wide">Matriculation (10th)</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Board:</span>
                          <p className="text-sm text-gray-900">{details.academics.matric_board || '-'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">School:</span>
                          <p className="text-sm text-gray-900 truncate" title={details.academics.matric_school_name || ''}>{details.academics.matric_school_name || '-'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Year:</span>
                          <p className="text-sm text-gray-900">{details.academics.matric_passing_year || '-'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Roll No:</span>
                          <p className="text-sm text-gray-900">{details.academics.matric_roll_number || '-'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Total:</span>
                          <p className="text-sm text-gray-900">{details.academics.matric_total_marks || '-'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Obtained:</span>
                          <p className="text-sm text-gray-900">{details.academics.matric_obtained_marks || '-'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Percentage:</span>
                          <p className="text-sm text-gray-900">
                            {details.academics.matric_percentage !== null
                              ? `${details.academics.matric_percentage}%`
                              : '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Matric (10th) Subject-wise Marks */}
                    {details.academics.matric_subjects && details.academics.matric_subjects.length > 0 && (
                      <ExpandableSection
                        title="10th Standard Subject-wise Marks"
                        isExpanded={isMatricSubjectsExpanded}
                        onToggle={() => setIsMatricSubjectsExpanded(!isMatricSubjectsExpanded)}
                      >
                        <SubjectMarksList subjects={details.academics.matric_subjects} />
                      </ExpandableSection>
                    )}

                    {/* Post-Matric (12th) */}
                    {details.academics.is_pursuing_12th ? (
                      <div className="bg-white rounded-md p-3 border border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-700 mb-2.5 uppercase tracking-wide">Post-Matriculation (12th)</h4>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 italic">Currently pursuing 12th standard</p>
                          {details.academics.stream && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Stream:</span>
                              <p className="text-sm text-gray-900 font-medium">{details.academics.stream}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white rounded-md p-3 border border-gray-200">
                          <h4 className="text-xs font-semibold text-gray-700 mb-2.5 uppercase tracking-wide">Post-Matriculation (12th)</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Board:</span>
                              <p className="text-sm text-gray-900">{details.academics.postmatric_board || '-'}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">School:</span>
                              <p className="text-sm text-gray-900 truncate" title={details.academics.postmatric_school_name || ''}>{details.academics.postmatric_school_name || '-'}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Year:</span>
                              <p className="text-sm text-gray-900">{details.academics.postmatric_passing_year || '-'}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Roll No:</span>
                              <p className="text-sm text-gray-900">{details.academics.postmatric_roll_number || '-'}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Total:</span>
                              <p className="text-sm text-gray-900">{details.academics.postmatric_total_marks || '-'}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Obtained:</span>
                              <p className="text-sm text-gray-900">{details.academics.postmatric_obtained_marks || '-'}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Percentage:</span>
                              <p className="text-sm text-gray-900">
                                {details.academics.postmatric_percentage !== null
                                  ? `${details.academics.postmatric_percentage}%`
                                  : '-'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Stream:</span>
                              <p className="text-sm text-gray-900">{details.academics.stream || '-'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Subjects */}
                        {details.academics.subjects && details.academics.subjects.length > 0 && (
                          <ExpandableSection
                            title="Subject-wise Marks"
                            isExpanded={isSubjectsExpanded}
                            onToggle={() => setIsSubjectsExpanded(!isSubjectsExpanded)}
                          >
                            <SubjectMarksList subjects={details.academics.subjects} />
                          </ExpandableSection>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic bg-white rounded-md p-3 border border-gray-200">No academic information available</p>
                )}
              </section>

              {/* Career Goals */}
              <section className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  Career Goals
                </h3>
                {details.careerGoals && details.careerGoals.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {details.careerGoals.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1.5 rounded-md bg-pink text-white text-xs font-medium shadow-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic bg-white rounded-md p-3 border border-gray-200">No career goals information available</p>
                )}
              </section>

              {/* Exam Preferences */}
              <section className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-amber-600" />
                  Exam Preferences
                </h3>
                {details.examPreferences ? (
                  <div className="space-y-4">
                    {/* Target Exams */}
                    {details.examPreferences.target_exams && details.examPreferences.target_exams.length > 0 ? (
                      <div className="bg-white rounded-md p-3 border border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Target Exams</h4>
                        <div className="flex flex-wrap gap-2">
                          {details.examPreferences.target_exams.map((exam, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1.5 rounded-md bg-amber-100 text-amber-800 text-xs font-medium border border-amber-300"
                            >
                              {exam}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Previous Exam Attempts */}
                    {details.examPreferences.previous_attempts && details.examPreferences.previous_attempts.length > 0 ? (
                      <ExpandableSection
                        title="Previous Exam Attempts"
                        isExpanded={isPreviousAttemptsExpanded}
                        onToggle={() => setIsPreviousAttemptsExpanded(!isPreviousAttemptsExpanded)}
                      >
                        <PreviousAttemptsList attempts={details.examPreferences.previous_attempts} />
                      </ExpandableSection>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic bg-white rounded-md p-3 border border-gray-200">No exam preferences information available</p>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

