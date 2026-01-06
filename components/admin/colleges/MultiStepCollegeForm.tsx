'use client';

import { useState, useEffect } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi';
import { useToast } from '@/components/shared';
import { ApiResponse } from '@/api/types';
import { createCollege, updateCollege, College } from '@/api/admin/colleges';
import { createCollegeLocation, updateCollegeLocation, getAllCollegeLocations, CollegeLocation } from '@/api/admin/college-locations';
import { createCollegeGallery, updateCollegeGallery, getAllCollegeGallery, deleteCollegeGallery, CollegeGallery } from '@/api/admin/college-gallery';
import { createCollegeNews, updateCollegeNews, getAllCollegeNews, deleteCollegeNews, CollegeNews } from '@/api/admin/college-news';
import { createCollegeCourse, updateCollegeCourse, getAllCollegeCourses, deleteCollegeCourse, CollegeCourse } from '@/api/admin/college-courses';
import Step1CollegeDetails from './steps/Step1CollegeDetails';
import Step2Location from './steps/Step2Location';
import Step3Gallery from './steps/Step3Gallery';
import Step4News from './steps/Step4News';
import Step5Courses from './steps/Step5Courses';

export interface CollegeFormData {
  // Step 1: College Details
  name: string;
  ranking: number | null;
  description: string;
  logo_url: string;
  logoFile: File | null;
  logoPreview: string | null;

  // Step 2: Location
  state: string;
  city: string;
  google_map_url: string;

  // Step 3: Gallery
  galleryImages: Array<{
    imageFile: File | null;
    imagePreview: string | null;
    caption: string;
    sort_order: number;
  }>;

  // Step 4: News
  newsItems: Array<{
    title: string;
    teaser: string;
    url: string;
    source_name: string;
  }>;

  // Step 5: Courses
  courses: Array<{
    stream_id: string;
    level_id: string;
    program_id: string;
    title: string;
    summary: string;
    duration: string;
    curriculum_detail: string;
    admission_process: string;
    eligibility: string;
    placements: string;
    scholarship: string;
    brochure_url: string;
    fee_per_sem: string;
    total_fee: string;
    brochureFile: File | null;
    subject_ids: number[];
    exam_ids: number[];
  }>;
}

interface MultiStepCollegeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCollege?: College | null;
  viewingCollege?: College | null;
}

const TOTAL_STEPS = 5;

export default function MultiStepCollegeForm({ isOpen, onClose, onSuccess, editingCollege, viewingCollege }: MultiStepCollegeFormProps) {
  const { showSuccess, showError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCollegeId, setCreatedCollegeId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [existingLocation, setExistingLocation] = useState<CollegeLocation | null>(null);
  const [existingGallery, setExistingGallery] = useState<CollegeGallery[]>([]);
  const [existingNews, setExistingNews] = useState<CollegeNews[]>([]);
  const [existingCourses, setExistingCourses] = useState<CollegeCourse[]>([]);

  // Determine if we're in view mode
  const isViewMode = !!viewingCollege;

  const [formData, setFormData] = useState<CollegeFormData>({
    name: '',
    ranking: null,
    description: '',
    logo_url: '',
    logoFile: null,
    logoPreview: null,
    state: '',
    city: '',
    google_map_url: '',
    galleryImages: [],
    newsItems: [],
    courses: [],
  });

  // Load existing data when editing or viewing
  useEffect(() => {
    const college = viewingCollege || editingCollege;
    if (isOpen && college) {
      const loadExistingData = async () => {
        setIsLoading(true);
        try {
          setCreatedCollegeId(college.id);
          
          // Load college details
          setFormData(prev => ({
            ...prev,
            name: college.name || '',
            ranking: college.ranking,
            description: college.description || '',
            logo_url: college.logo_url || '',
            logoPreview: college.logo_url || null,
          }));

          // Load location
          const locationsRes = await getAllCollegeLocations();
          if (locationsRes.success && locationsRes.data) {
            const location = locationsRes.data.locations.find(l => l.college_id === college.id);
            if (location) {
              setExistingLocation(location);
              setFormData(prev => ({
                ...prev,
                state: location.state || '',
                city: location.city || '',
                google_map_url: location.google_map_url || '',
              }));
            }
          }

          // Load gallery
          const galleryRes = await getAllCollegeGallery();
          if (galleryRes.success && galleryRes.data) {
            const gallery = galleryRes.data.gallery.filter(g => g.college_id === college.id);
            setExistingGallery(gallery);
            setFormData(prev => ({
              ...prev,
              galleryImages: gallery.map(g => ({
                imageFile: null,
                imagePreview: g.image_url,
                caption: g.caption || '',
                sort_order: g.sort_order || 0,
              })),
            }));
          }

          // Load news
          const newsRes = await getAllCollegeNews();
          if (newsRes.success && newsRes.data) {
            const news = newsRes.data.news.filter(n => n.college_id === college.id);
            setExistingNews(news);
            setFormData(prev => ({
              ...prev,
              newsItems: news.map(n => ({
                title: n.title || '',
                teaser: n.teaser || '',
                url: n.url || '',
                source_name: n.source_name || '',
              })),
            }));
          }

          // Load courses
          const coursesRes = await getAllCollegeCourses();
          if (coursesRes.success && coursesRes.data) {
            const courses = coursesRes.data.courses.filter(c => c.college_id === college.id);
            setExistingCourses(courses);
            setFormData(prev => ({
              ...prev,
              courses: courses.map(c => ({
                stream_id: c.stream_id?.toString() || '',
                level_id: c.level_id?.toString() || '',
                program_id: c.program_id?.toString() || '',
                title: c.title || '',
                summary: c.summary || '',
                duration: c.duration || '',
                curriculum_detail: c.curriculum_detail || '',
                admission_process: c.admission_process || '',
                eligibility: c.eligibility || '',
                placements: c.placements || '',
                scholarship: c.scholarship || '',
                brochure_url: c.brochure_url || '',
                fee_per_sem: c.fee_per_sem?.toString() || '',
                total_fee: c.total_fee?.toString() || '',
                brochureFile: null,
                subject_ids: c.subject_ids || [],
                exam_ids: c.exam_ids || [],
              })),
            }));
          }
        } catch (err) {
          console.error('Error loading existing data:', err);
        } finally {
          setIsLoading(false);
        }
      };

      loadExistingData();
    } else if (isOpen && !viewingCollege && !editingCollege) {
      // Reset form for new college
      resetForm();
    }
  }, [isOpen, viewingCollege, editingCollege]);

  const resetForm = () => {
    setFormData({
      name: '',
      ranking: null,
      description: '',
      logo_url: '',
      logoFile: null,
      logoPreview: null,
      state: '',
      city: '',
      google_map_url: '',
      galleryImages: [],
      newsItems: [],
      courses: [],
    });
    setCurrentStep(1);
    setCreatedCollegeId(null);
    setError(null);
    setExistingLocation(null);
    setExistingGallery([]);
    setExistingNews([]);
    setExistingCourses([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };


  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const handleStep1Submit = async () => {
    if (!formData.name.trim()) {
      setError('College name is required');
      return false;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const collegeData: {
        name: string;
        ranking: number | null;
        description: string | null;
        logo?: File;
        logo_url?: string;
      } = {
        name: formData.name,
        ranking: formData.ranking || null,
        description: formData.description || null,
      };

      if (formData.logoFile) {
        collegeData.logo = formData.logoFile;
      } else if (formData.logo_url) {
        collegeData.logo_url = formData.logo_url;
      }

      let response;
      if (editingCollege && createdCollegeId) {
        // Update existing college
        response = await updateCollege(createdCollegeId, collegeData);
      } else {
        // Create new college
        response = await createCollege(collegeData);
      }

      if (response.success && response.data?.college) {
        if (!createdCollegeId) {
          setCreatedCollegeId(response.data.college.id);
        }
        showSuccess(editingCollege ? 'College updated successfully! Continue with location details.' : 'College created successfully! Continue with location details.');
        setCurrentStep(2);
        return true;
      } else {
        setError(response.message || (editingCollege ? 'Failed to update college' : 'Failed to create college'));
        showError(response.message || (editingCollege ? 'Failed to update college' : 'Failed to create college'));
        return false;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while saving college';
      setError(errorMsg);
      showError(errorMsg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Submit = async () => {
    if (!createdCollegeId) {
      setError('College must be created first');
      return false;
    }

    if (!formData.state.trim() || !formData.city.trim()) {
      setError('State and City are required');
      return false;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const locationData = {
        college_id: createdCollegeId,
        state: formData.state.trim(),
        city: formData.city.trim(),
        google_map_url: formData.google_map_url.trim() || null,
      };

      let response;
      if (existingLocation) {
        // Update existing location
        response = await updateCollegeLocation(existingLocation.id, locationData);
      } else {
        // Create new location
        response = await createCollegeLocation(locationData);
      }

      if (response.success) {
        showSuccess(existingLocation ? 'Location updated successfully! Continue with gallery images.' : 'Location added successfully! Continue with gallery images.');
        setCurrentStep(3);
        return true;
      } else {
        setError(response.message || (existingLocation ? 'Failed to update location' : 'Failed to create location'));
        showError(response.message || (existingLocation ? 'Failed to update location' : 'Failed to create location'));
        return false;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while saving location';
      setError(errorMsg);
      showError(errorMsg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep3Submit = async () => {
    if (!createdCollegeId) {
      setError('College must be created first');
      return false;
    }

    // Gallery is optional, so we can skip if no images
    if (formData.galleryImages.length === 0 && existingGallery.length === 0) {
      setCurrentStep(4);
      return true;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Handle gallery images: update existing ones with new files, create new ones
      const uploadPromises: Promise<ApiResponse<{ image: CollegeGallery } | null>>[] = [];
      
      // Update existing gallery items that have new files or changed captions
      formData.galleryImages.forEach((galleryItem, index) => {
        // Check if this is an existing item (has imagePreview from URL, not from file)
        const existingIndex = existingGallery.findIndex(g => g.image_url === galleryItem.imagePreview && !galleryItem.imageFile);
        
        if (existingIndex >= 0) {
          // Update existing item if caption changed
          const existing = existingGallery[existingIndex];
          if (existing.caption !== galleryItem.caption || galleryItem.imageFile) {
            const galleryData: {
              caption?: string | null;
              sort_order?: number;
              image?: File;
            } = {
              caption: galleryItem.caption || null,
              sort_order: galleryItem.sort_order || index,
            };
            
            if (galleryItem.imageFile) {
              galleryData.image = galleryItem.imageFile;
            }
            
            uploadPromises.push(updateCollegeGallery(existing.id, galleryData));
          }
        } else if (galleryItem.imageFile || galleryItem.imagePreview) {
          // Create new item
          const galleryData: {
            college_id: number;
            caption: string | null;
            sort_order: number;
            image?: File;
            image_url?: string;
          } = {
            college_id: createdCollegeId,
            caption: galleryItem.caption || null,
            sort_order: galleryItem.sort_order || index,
          };

          if (galleryItem.imageFile) {
            galleryData.image = galleryItem.imageFile;
          } else if (galleryItem.imagePreview) {
            galleryData.image_url = galleryItem.imagePreview;
          }

          uploadPromises.push(createCollegeGallery(galleryData));
        }
      });

      // Delete removed gallery items
      const currentImageUrls = formData.galleryImages.map(g => g.imagePreview).filter(Boolean);
      const toDelete = existingGallery.filter(g => !currentImageUrls.includes(g.image_url));
      toDelete.forEach(g => {
        uploadPromises.push(deleteCollegeGallery(g.id));
      });

      if (uploadPromises.length > 0) {
        const results = await Promise.all(uploadPromises);
        const allSuccess = results.every(r => r.success);

        if (allSuccess) {
          showSuccess('Gallery images saved successfully! Continue with news.');
          setCurrentStep(4);
          return true;
        } else {
          setError('Some gallery images failed to save');
          showError('Some gallery images failed to save');
          return false;
        }
      } else {
        // No changes, just proceed
        setCurrentStep(4);
        return true;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while saving gallery images';
      setError(errorMsg);
      showError(errorMsg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep4Submit = async () => {
    if (!createdCollegeId) {
      setError('College must be created first');
      return false;
    }

    // News is optional, so we can skip if no news items
    if (formData.newsItems.length === 0 && existingNews.length === 0) {
      setCurrentStep(5);
      return true;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const newsPromises: Promise<ApiResponse<{ news: CollegeNews } | null>>[] = [];

      // Match form items with existing items by title (simple matching)
      formData.newsItems.forEach((newsItem, index) => {
        const existing = existingNews.find(e => 
          e.title === newsItem.title || 
          (index < existingNews.length && existingNews[index]?.title === newsItem.title)
        );

        const newsData = {
          college_id: createdCollegeId,
          title: newsItem.title.trim(),
          teaser: newsItem.teaser.trim(),
          url: newsItem.url.trim(),
          source_name: newsItem.source_name.trim() || null,
        };

        if (existing) {
          // Update existing
          newsPromises.push(updateCollegeNews(existing.id, newsData));
        } else {
          // Create new
          newsPromises.push(createCollegeNews(newsData));
        }
      });

      // Delete removed news items
      const currentTitles = formData.newsItems.map(n => n.title.trim());
      const toDelete = existingNews.filter(n => !currentTitles.includes(n.title));
      toDelete.forEach(n => {
        newsPromises.push(deleteCollegeNews(n.id));
      });

      if (newsPromises.length > 0) {
        const results = await Promise.all(newsPromises);
        const allSuccess = results.every(r => r.success);

        if (allSuccess) {
          showSuccess('News items saved successfully! Continue with courses.');
          setCurrentStep(5);
          return true;
        } else {
          setError('Some news items failed to save');
          showError('Some news items failed to save');
          return false;
        }
      } else {
        setCurrentStep(5);
        return true;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while saving news items';
      setError(errorMsg);
      showError(errorMsg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep5Submit = async () => {
    if (!createdCollegeId) {
      setError('College must be created first');
      return false;
    }

    // Courses are optional, but if added, they need title
    const invalidCourses = formData.courses.filter(c => !c.title.trim());
    if (invalidCourses.length > 0) {
      setError('All courses must have a title');
      return false;
    }

    if (formData.courses.length === 0 && existingCourses.length === 0) {
      // No courses to add, finish
      showSuccess(editingCollege ? 'College updated successfully with all details!' : 'College created successfully with all details!');
      handleClose();
      onSuccess();
      return true;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const coursePromises: Promise<ApiResponse<{ course: CollegeCourse } | null>>[] = [];

      // Match form items with existing items by title
      formData.courses.forEach((course, index) => {
        const existing = existingCourses.find(e => 
          e.title === course.title || 
          (index < existingCourses.length && existingCourses[index]?.title === course.title)
        );

        const courseData: {
          college_id: number;
          title: string;
          summary?: string | null;
          duration?: string | null;
          curriculum_detail?: string | null;
          admission_process?: string | null;
          eligibility?: string | null;
          placements?: string | null;
          scholarship?: string | null;
          brochure_url?: string | null;
          fee_per_sem?: number | null;
          total_fee?: number | null;
          stream_id?: number | null;
          level_id?: number | null;
          program_id?: number | null;
          subject_ids?: number[] | null;
          exam_ids?: number[] | null;
          brochure?: File;
        } = {
          college_id: createdCollegeId,
          title: course.title.trim(),
          summary: course.summary.trim() || null,
          duration: course.duration.trim() || null,
          curriculum_detail: course.curriculum_detail.trim() || null,
          admission_process: course.admission_process.trim() || null,
          eligibility: course.eligibility.trim() || null,
          placements: course.placements.trim() || null,
          scholarship: course.scholarship.trim() || null,
          brochure_url: course.brochure_url.trim() || null,
          fee_per_sem: course.fee_per_sem ? parseFloat(course.fee_per_sem) : null,
          total_fee: course.total_fee ? parseFloat(course.total_fee) : null,
          subject_ids: course.subject_ids && course.subject_ids.length > 0 ? course.subject_ids : null,
          exam_ids: course.exam_ids && course.exam_ids.length > 0 ? course.exam_ids : null,
        };

        if (course.stream_id) {
          courseData.stream_id = parseInt(course.stream_id);
        }
        if (course.level_id) {
          courseData.level_id = parseInt(course.level_id);
        }
        if (course.program_id) {
          courseData.program_id = parseInt(course.program_id);
        }

        if (course.brochureFile) {
          courseData.brochure = course.brochureFile;
        }

        if (existing) {
          // Update existing
          coursePromises.push(updateCollegeCourse(existing.id, courseData));
        } else {
          // Create new
          coursePromises.push(createCollegeCourse(courseData));
        }
      });

      // Delete removed courses
      const currentTitles = formData.courses.map(c => c.title.trim());
      const toDelete = existingCourses.filter(c => !currentTitles.includes(c.title));
      toDelete.forEach(c => {
        coursePromises.push(deleteCollegeCourse(c.id));
      });

      if (coursePromises.length > 0) {
        const results = await Promise.all(coursePromises);
        const allSuccess = results.every(r => r.success);

        if (allSuccess) {
          showSuccess(editingCollege ? 'College updated successfully with all details!' : 'College created successfully with all details!');
          handleClose();
          onSuccess();
          return true;
        } else {
          setError('Some courses failed to save');
          showError('Some courses failed to save');
          return false;
        }
      } else {
        // No changes, just finish
        showSuccess(editingCollege ? 'College updated successfully with all details!' : 'College created successfully with all details!');
        handleClose();
        onSuccess();
        return true;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while creating courses';
      setError(errorMsg);
      showError(errorMsg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStepSubmit = async () => {
    switch (currentStep) {
      case 1:
        return await handleStep1Submit();
      case 2:
        return await handleStep2Submit();
      case 3:
        return await handleStep3Submit();
      case 4:
        return await handleStep4Submit();
      case 5:
        return await handleStep5Submit();
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink mx-auto mb-4"></div>
            <p className="text-gray-600">Loading college data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-darkGradient text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {viewingCollege ? 'View College' : editingCollege ? 'Edit College' : 'Create College'}
            </h2>
            <p className="text-sm text-white/80 mt-1">
              Step {currentStep} of {TOTAL_STEPS}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
            disabled={isSubmitting}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`flex-1 flex items-center ${
                  step < TOTAL_STEPS ? 'mr-2' : ''
                }`}
              >
                <div
                  className={`flex-1 h-1 rounded ${
                    step <= currentStep ? 'bg-pink' : 'bg-gray-300'
                  }`}
                />
                {step < TOTAL_STEPS && (
                  <div
                    className={`w-1 h-1 rounded-full mx-1 ${
                      step < currentStep ? 'bg-pink' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600">
            {(isViewMode || editingCollege) ? (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`px-2 py-1 rounded transition-colors ${
                    currentStep === 1
                      ? 'font-semibold text-pink bg-pink/10'
                      : 'hover:text-pink hover:bg-gray-200 cursor-pointer'
                  }`}
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className={`px-2 py-1 rounded transition-colors ${
                    currentStep === 2
                      ? 'font-semibold text-pink bg-pink/10'
                      : 'hover:text-pink hover:bg-gray-200 cursor-pointer'
                  }`}
                >
                  Location
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className={`px-2 py-1 rounded transition-colors ${
                    currentStep === 3
                      ? 'font-semibold text-pink bg-pink/10'
                      : 'hover:text-pink hover:bg-gray-200 cursor-pointer'
                  }`}
                >
                  Gallery
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className={`px-2 py-1 rounded transition-colors ${
                    currentStep === 4
                      ? 'font-semibold text-pink bg-pink/10'
                      : 'hover:text-pink hover:bg-gray-200 cursor-pointer'
                  }`}
                >
                  News
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className={`px-2 py-1 rounded transition-colors ${
                    currentStep === 5
                      ? 'font-semibold text-pink bg-pink/10'
                      : 'hover:text-pink hover:bg-gray-200 cursor-pointer'
                  }`}
                >
                  Courses
                </button>
              </>
            ) : (
              <>
                <span className={currentStep >= 1 ? 'font-semibold text-pink' : ''}>
                  Details
                </span>
                <span className={currentStep >= 2 ? 'font-semibold text-pink' : ''}>
                  Location
                </span>
                <span className={currentStep >= 3 ? 'font-semibold text-pink' : ''}>
                  Gallery
                </span>
                <span className={currentStep >= 4 ? 'font-semibold text-pink' : ''}>
                  News
                </span>
                <span className={currentStep >= 5 ? 'font-semibold text-pink' : ''}>
                  Courses
                </span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {currentStep === 1 && (
            <Step1CollegeDetails
              formData={formData}
              setFormData={setFormData}
              isViewMode={isViewMode}
            />
          )}

          {currentStep === 2 && (
            <Step2Location
              formData={formData}
              setFormData={setFormData}
              isViewMode={isViewMode}
            />
          )}

          {currentStep === 3 && (
            <Step3Gallery
              formData={formData}
              setFormData={setFormData}
              isViewMode={isViewMode}
            />
          )}

          {currentStep === 4 && (
            <Step4News
              formData={formData}
              setFormData={setFormData}
              isViewMode={isViewMode}
            />
          )}

          {currentStep === 5 && (
            <Step5Courses
              formData={formData}
              setFormData={setFormData}
              isViewMode={isViewMode}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
          {isViewMode ? (
            <div className="flex items-center gap-3 w-full justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 bg-pink text-white rounded-lg hover:bg-pink/90 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentStep === TOTAL_STEPS}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1 || isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-3">
                {currentStep < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={handleStepSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2 bg-pink text-white rounded-lg hover:bg-pink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : 'Next'}
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStepSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Finishing...' : 'Finish'}
                    <FiCheck className="h-4 w-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

