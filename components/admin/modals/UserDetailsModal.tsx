'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, User, BookOpen, Target, Loader2, GraduationCap, IdCard, MapPin, Info } from 'lucide-react';
import { FaUserCircle } from 'react-icons/fa';
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
    matric_state: string | null;
    matric_city: string | null;
    matric_marks_type: string | null;
    matric_cgpa: number | null;
    matric_result_status: string | null;
    matric_subjects: Array<{ name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
    postmatric_board: string | null;
    postmatric_school_name: string | null;
    postmatric_passing_year: number | null;
    postmatric_roll_number: string | null;
    postmatric_total_marks: number | null;
    postmatric_obtained_marks: number | null;
    postmatric_percentage: number | null;
    postmatric_state: string | null;
    postmatric_city: string | null;
    postmatric_marks_type: string | null;
    postmatric_cgpa: number | null;
    postmatric_result_status: string | null;
    stream: string | null;
    stream_id: number | null;
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
  governmentIdentification: {
    id: number;
    user_id: number;
    aadhar_number: string | null;
    apaar_id: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  categoryAndReservation: {
    id: number;
    user_id: number;
    category_id: number | null;
    category_name: string | null;
    ews_status: boolean;
    pwbd_status: boolean;
    type_of_disability: string | null;
    disability_percentage: number | null;
    udid_number: string | null;
    minority_status: string | null;
    ex_serviceman_defence_quota: boolean;
    kashmiri_migrant_regional_quota: boolean;
    state_domicile: boolean;
    home_state_for_quota: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  otherPersonalDetails: {
    id: number;
    user_id: number;
    religion: string | null;
    mother_tongue: string | null;
    annual_family_income: number | null;
    occupation_of_father: string | null;
    occupation_of_mother: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  userAddress: {
    id: number;
    user_id: number;
    correspondence_address_line1: string | null;
    correspondence_address_line2: string | null;
    city_town_village: string | null;
    district: string | null;
    state: string | null;
    country: string | null;
    pincode: string | null;
    permanent_address_same_as_correspondence: boolean;
    permanent_address: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  otherInfo: {
    id: number;
    user_id: number;
    medium: string | null;
    language: string | null;
    program_ids: number[];
    program_names: string[];
    exam_city_ids: number[];
    exam_city_names: string[];
    created_at: string;
    updated_at: string;
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
              {/* Personal Details */}
              <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-pink" />
                  Personal Details
                </h3>
                
                {/* Profile Photo */}
                <div className="mb-4 flex items-center gap-4 pb-4 border-b border-gray-200">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-pink-500 bg-white/10 flex items-center justify-center">
                    {details.user.profile_photo ? (
                      <Image
                        src={details.user.profile_photo}
                        alt="Profile"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <FaUserCircle className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {details.user.first_name && details.user.last_name
                        ? `${details.user.first_name} ${details.user.last_name}`
                        : details.user.name || details.user.email}
                    </p>
                    <p className="text-xs text-gray-600">{details.user.email}</p>
                  </div>
                </div>

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
                  {details.user.alternate_mobile_number && (
                    <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                      <span className="text-xs font-medium text-gray-600">Alternate Mobile:</span>
                      <p className="text-sm text-gray-900 font-medium">{details.user.alternate_mobile_number}</p>
                    </div>
                  )}
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
                    details.user.longitude !== null && details.user.longitude !== undefined &&
                    !isNaN(Number(details.user.latitude)) && !isNaN(Number(details.user.longitude))) && (
                    <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                      <span className="text-xs font-medium text-gray-600">Location:</span>
                      <p className="text-sm text-gray-900 font-medium">
                        {Number(details.user.latitude).toFixed(6)}, {Number(details.user.longitude).toFixed(6)}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Nationality:</span>
                    <p className="text-sm text-gray-900 font-medium">{details.user.nationality || '-'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Marital Status:</span>
                    <p className="text-sm text-gray-900 font-medium">{details.user.marital_status || '-'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Father's Name:</span>
                    <p className="text-sm text-gray-900 font-medium">{details.user.father_full_name || '-'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Mother's Name:</span>
                    <p className="text-sm text-gray-900 font-medium">{details.user.mother_full_name || '-'}</p>
                  </div>
                  {details.user.guardian_name && (
                    <div className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1.5 border border-gray-200">
                      <span className="text-xs font-medium text-gray-600">Guardian Name:</span>
                      <p className="text-sm text-gray-900 font-medium">{details.user.guardian_name}</p>
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
                        {details.academics.matric_marks_type === 'Percentage' && (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Total:</span>
                              <p className="text-sm text-gray-900">{details.academics.matric_total_marks || '-'}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Obtained:</span>
                              <p className="text-sm text-gray-900">{details.academics.matric_obtained_marks || '-'}</p>
                            </div>
                          </>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">State:</span>
                          <p className="text-sm text-gray-900">{details.academics.matric_state || '-'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">City:</span>
                          <p className="text-sm text-gray-900">{details.academics.matric_city || '-'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Marks Type:</span>
                          <p className="text-sm text-gray-900">{details.academics.matric_marks_type || '-'}</p>
                        </div>
                        {details.academics.matric_marks_type === 'Percentage' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-500">Percentage:</span>
                            <p className="text-sm text-gray-900">
                              {details.academics.matric_percentage !== null
                                ? `${details.academics.matric_percentage}%`
                                : '-'}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-500">CGPA:</span>
                            <p className="text-sm text-gray-900">
                              {details.academics.matric_cgpa !== null
                                ? details.academics.matric_cgpa.toString()
                                : '-'}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Result Status:</span>
                          <p className="text-sm text-gray-900 capitalize">{details.academics.matric_result_status || '-'}</p>
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
                        {details.academics.postmatric_marks_type === 'Percentage' && (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Total:</span>
                              <p className="text-sm text-gray-900">{details.academics.postmatric_total_marks || '-'}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Obtained:</span>
                              <p className="text-sm text-gray-900">{details.academics.postmatric_obtained_marks || '-'}</p>
                            </div>
                          </>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">State:</span>
                          <p className="text-sm text-gray-900">{details.academics.postmatric_state || '-'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">City:</span>
                          <p className="text-sm text-gray-900">{details.academics.postmatric_city || '-'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Marks Type:</span>
                          <p className="text-sm text-gray-900">{details.academics.postmatric_marks_type || '-'}</p>
                        </div>
                        {details.academics.postmatric_marks_type === 'Percentage' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-500">Percentage:</span>
                            <p className="text-sm text-gray-900">
                              {details.academics.postmatric_percentage !== null
                                ? `${details.academics.postmatric_percentage}%`
                                : '-'}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-500">CGPA:</span>
                            <p className="text-sm text-gray-900">
                              {details.academics.postmatric_cgpa !== null
                                ? details.academics.postmatric_cgpa.toString()
                                : '-'}
                            </p>
                          </div>
                        )}
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Result Status:</span>
                              <p className="text-sm text-gray-900 capitalize">{details.academics.postmatric_result_status || '-'}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Stream:</span>
                              <p className="text-sm text-gray-900">
                                {details.academics.stream || '-'}
                              </p>
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

              {/* Government Identification */}
              <section className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-green-600" />
                  Government Identification
                </h3>
                {details.governmentIdentification ? (
                  <div className="bg-white rounded-md p-3 border border-gray-200">
                    <div className="grid grid-cols-2 gap-3">
                      {details.governmentIdentification.aadhar_number && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Aadhar Number:</span>
                          <p className="text-sm text-gray-900 font-medium">{details.governmentIdentification.aadhar_number}</p>
                        </div>
                      )}
                      {details.governmentIdentification.apaar_id && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">APAAR ID:</span>
                          <p className="text-sm text-gray-900 font-medium">{details.governmentIdentification.apaar_id}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic bg-white rounded-md p-3 border border-gray-200">No government identification information available</p>
                )}
              </section>

              {/* Other Personal Details */}
              <section className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-teal-600" />
                  Other Personal Details
                </h3>
                {details.otherPersonalDetails ? (
                  <div className="bg-white rounded-md p-3 border border-gray-200">
                    <div className="grid grid-cols-2 gap-3">
                      {details.otherPersonalDetails.religion && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Religion:</span>
                          <p className="text-sm text-gray-900 font-medium">{details.otherPersonalDetails.religion}</p>
                        </div>
                      )}
                      {details.otherPersonalDetails.mother_tongue && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Mother Tongue:</span>
                          <p className="text-sm text-gray-900 font-medium">{details.otherPersonalDetails.mother_tongue}</p>
                        </div>
                      )}
                      {details.otherPersonalDetails.annual_family_income !== null && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Annual Family Income:</span>
                          <p className="text-sm text-gray-900 font-medium">
                            {details.otherPersonalDetails.annual_family_income !== null
                              ? `₹${details.otherPersonalDetails.annual_family_income.toLocaleString('en-IN')}`
                              : '-'}
                          </p>
                        </div>
                      )}
                      {details.otherPersonalDetails.occupation_of_father && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Father's Occupation:</span>
                          <p className="text-sm text-gray-900 font-medium">{details.otherPersonalDetails.occupation_of_father}</p>
                        </div>
                      )}
                      {details.otherPersonalDetails.occupation_of_mother && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Mother's Occupation:</span>
                          <p className="text-sm text-gray-900 font-medium">{details.otherPersonalDetails.occupation_of_mother}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic bg-white rounded-md p-3 border border-gray-200">No other personal details information available</p>
                )}
              </section>

              {/* Category and Reservation */}
              <section className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-indigo-600" />
                  Category and Reservation
                </h3>
                {details.categoryAndReservation ? (
                  <div className="bg-white rounded-md p-3 border border-gray-200">
                    <div className="grid grid-cols-2 gap-3">
                      {details.categoryAndReservation.category_name && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Category:</span>
                          <p className="text-sm text-gray-900 font-medium">{details.categoryAndReservation.category_name}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-500">EWS Status:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          details.categoryAndReservation.ews_status
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {details.categoryAndReservation.ews_status ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-500">PwBD/PWD Status:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          details.categoryAndReservation.pwbd_status
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {details.categoryAndReservation.pwbd_status ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {details.categoryAndReservation.type_of_disability && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Type of Disability:</span>
                          <p className="text-sm text-gray-900 font-medium">{details.categoryAndReservation.type_of_disability}</p>
                        </div>
                      )}
                      {details.categoryAndReservation.disability_percentage !== null && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Disability Percentage:</span>
                          <p className="text-sm text-gray-900 font-medium">{details.categoryAndReservation.disability_percentage}%</p>
                        </div>
                      )}
                      {details.categoryAndReservation.udid_number && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">UDID Number:</span>
                          <p className="text-sm text-gray-900 font-medium">{details.categoryAndReservation.udid_number}</p>
                        </div>
                      )}
                      {details.categoryAndReservation.minority_status && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Minority Status:</span>
                          <p className="text-sm text-gray-900 font-medium">{details.categoryAndReservation.minority_status}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-500">Ex-serviceman/Defence-quota:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          details.categoryAndReservation.ex_serviceman_defence_quota
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {details.categoryAndReservation.ex_serviceman_defence_quota ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-500">Kashmiri-migrant/Regional-quota:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          details.categoryAndReservation.kashmiri_migrant_regional_quota
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {details.categoryAndReservation.kashmiri_migrant_regional_quota ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-500">State Domicile:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          details.categoryAndReservation.state_domicile
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {details.categoryAndReservation.state_domicile ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {details.categoryAndReservation.home_state_for_quota && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Home State for Quota:</span>
                          <p className="text-sm text-gray-900 font-medium">{details.categoryAndReservation.home_state_for_quota}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic bg-white rounded-md p-3 border border-gray-200">No category and reservation information available</p>
                )}
              </section>

              {/* Address */}
              <section className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-600" />
                  Address
                </h3>
                {details.userAddress ? (
                  <div className="space-y-4">
                    {/* Correspondence Address */}
                    <div className="bg-white rounded-md p-3 border border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2.5 uppercase tracking-wide">Correspondence Address</h4>
                      <div className="space-y-2">
                        {details.userAddress.correspondence_address_line1 && (
                          <p className="text-sm text-gray-900">{details.userAddress.correspondence_address_line1}</p>
                        )}
                        {details.userAddress.correspondence_address_line2 && (
                          <p className="text-sm text-gray-900">{details.userAddress.correspondence_address_line2}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {details.userAddress.city_town_village && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">City/Town/Village:</span>
                              <p className="text-sm text-gray-900">{details.userAddress.city_town_village}</p>
                            </div>
                          )}
                          {details.userAddress.district && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">District:</span>
                              <p className="text-sm text-gray-900">{details.userAddress.district}</p>
                            </div>
                          )}
                          {details.userAddress.state && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">State:</span>
                              <p className="text-sm text-gray-900">{details.userAddress.state}</p>
                            </div>
                          )}
                          {details.userAddress.country && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Country:</span>
                              <p className="text-sm text-gray-900">{details.userAddress.country}</p>
                            </div>
                          )}
                          {details.userAddress.pincode && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Pincode:</span>
                              <p className="text-sm text-gray-900">{details.userAddress.pincode}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Permanent Address */}
                    <div className="bg-white rounded-md p-3 border border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2.5 uppercase tracking-wide">Permanent Address</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">Same as Correspondence:</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            details.userAddress.permanent_address_same_as_correspondence
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {details.userAddress.permanent_address_same_as_correspondence ? 'Yes' : 'No'}
                          </span>
                        </div>
                        {!details.userAddress.permanent_address_same_as_correspondence && details.userAddress.permanent_address && (
                          <p className="text-sm text-gray-900 whitespace-pre-line">{details.userAddress.permanent_address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic bg-white rounded-md p-3 border border-gray-200">No address information available</p>
                )}
              </section>

              {/* Other Information */}
              <section className="bg-violet-50 rounded-lg p-4 border border-violet-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-violet-600" />
                  Other Information
                </h3>
                {details.otherInfo ? (
                  <div className="bg-white rounded-md p-3 border border-gray-200">
                    <div className="space-y-4">
                      {/* Medium and Language */}
                      {(details.otherInfo.medium || details.otherInfo.language) && (
                        <div className="grid grid-cols-2 gap-3">
                          {details.otherInfo.medium && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Medium of Examination:</span>
                              <p className="text-sm text-gray-900 font-medium">{details.otherInfo.medium}</p>
                            </div>
                          )}
                          {details.otherInfo.language && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-500">Language Preference:</span>
                              <p className="text-sm text-gray-900 font-medium">{details.otherInfo.language}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Program Preferences */}
                      {details.otherInfo.program_names && details.otherInfo.program_names.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Course & Program Preferences</h4>
                          <div className="flex flex-wrap gap-2">
                            {details.otherInfo.program_names.map((programName, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1.5 rounded-md bg-violet-100 text-violet-800 text-xs font-medium border border-violet-300"
                              >
                                {index + 1}. {programName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Exam City Preferences */}
                      {details.otherInfo.exam_city_names && details.otherInfo.exam_city_names.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Exam City Preferences</h4>
                          <div className="flex flex-wrap gap-2">
                            {details.otherInfo.exam_city_names.map((cityName, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1.5 rounded-md bg-violet-100 text-violet-800 text-xs font-medium border border-violet-300"
                              >
                                {index + 1}. {cityName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Show message if otherInfo exists but all fields are empty */}
                      {!details.otherInfo.medium && 
                       !details.otherInfo.language && 
                       (!details.otherInfo.program_names || details.otherInfo.program_names.length === 0) && 
                       (!details.otherInfo.exam_city_names || details.otherInfo.exam_city_names.length === 0) && (
                        <p className="text-sm text-gray-500 italic">Other information record exists but no data has been entered yet.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic bg-white rounded-md p-3 border border-gray-200">No other information available</p>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

