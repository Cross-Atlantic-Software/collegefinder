'use client';

import { useState, useEffect, useRef } from 'react';
import { FiX, FiImage, FiVideo, FiFileText } from 'react-icons/fi';
import { createBlog, updateBlog, type Blog } from '@/api/admin/blogs';
import { useToast, MultiSelect, RichTextEditor, type MultiSelectOption } from '@/components/shared';
import { getAllStreamsPublic, getAllCareersPublic } from '@/api';
import Image from 'next/image';

interface BlogModalProps {
  blog: Blog | null;
  onClose: () => void;
}

export default function BlogModal({ blog, onClose }: BlogModalProps) {
  const { showSuccess, showError } = useToast();
  const [slug, setSlug] = useState(blog?.slug || '');
  const [title, setTitle] = useState(blog?.title || '');
  const [teaser, setTeaser] = useState(blog?.teaser || '');
  const [summary, setSummary] = useState(blog?.summary || '');
  const [contentType, setContentType] = useState<'TEXT' | 'VIDEO'>(blog?.content_type || 'TEXT');
  const [firstPart, setFirstPart] = useState(blog?.first_part || '');
  const [secondPart, setSecondPart] = useState(blog?.second_part || '');
  const [isFeatured, setIsFeatured] = useState(blog?.is_featured || false);
  const [selectedStreams, setSelectedStreams] = useState<string[]>(blog?.streams?.map(s => String(s)) || []);
  const [selectedCareers, setSelectedCareers] = useState<string[]>(blog?.careers?.map(c => String(c)) || []);
  const [streamOptions, setStreamOptions] = useState<MultiSelectOption[]>([]);
  const [careerOptions, setCareerOptions] = useState<MultiSelectOption[]>([]);
  const [blogImage, setBlogImage] = useState<File | null>(null);
  const [blogImagePreview, setBlogImagePreview] = useState<string | null>(blog?.blog_image || null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [url, setUrl] = useState(blog?.url || '');
  const [sourceName, setSourceName] = useState(blog?.source_name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Fetch streams and careers on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [streamsRes, careersRes] = await Promise.all([
          getAllStreamsPublic(),
          getAllCareersPublic(),
        ]);

        if (streamsRes.success && streamsRes.data) {
          setStreamOptions(
            streamsRes.data.streams.map((s) => ({
              value: String(s.id),
              label: s.name,
            }))
          );
        }

        if (careersRes.success && careersRes.data) {
          setCareerOptions(
            careersRes.data.careers.map((c) => ({
              value: String(c.id),
              label: c.name,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching streams/careers:', err);
      }
    };

    fetchOptions();
  }, []);

  // Helper function to parse JSONB array fields
  const parseJsonbArray = (field: any): number[] => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Update form fields when blog prop changes
  useEffect(() => {
    if (blog) {
      setSlug(blog.slug || '');
      setTitle(blog.title || '');
      setTeaser(blog.teaser || '');
      setSummary(blog.summary || '');
      setContentType(blog.content_type || 'TEXT');
      setFirstPart(blog.first_part || '');
      setSecondPart(blog.second_part || '');
      setIsFeatured(blog.is_featured || false);
      setBlogImagePreview(blog.blog_image || null);
      setUrl(blog.url || '');
      setSourceName(blog.source_name || '');
      
      // Parse and set streams and careers
      const parsedStreams = parseJsonbArray(blog.streams);
      const parsedCareers = parseJsonbArray(blog.careers);
      setSelectedStreams(parsedStreams.map(s => String(s)));
      setSelectedCareers(parsedCareers.map(c => String(c)));
    } else {
      // Reset form for new blog
      setSlug('');
      setTitle('');
      setTeaser('');
      setSummary('');
      setContentType('TEXT');
      setFirstPart('');
      setSecondPart('');
      setIsFeatured(false);
      setBlogImage(null);
      setBlogImagePreview(null);
      setVideoFile(null);
      setSelectedStreams([]);
      setSelectedCareers([]);
      setUrl('');
      setSourceName('');
    }
  }, [blog]);

  // Generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!blog && !slug) {
      // Auto-generate slug from title for new blogs
      setSlug(generateSlug(value));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setBlogImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBlogImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Please select a video file');
        return;
      }
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!slug || !title || !contentType) {
      setError('Slug, title, and content type are required');
      return;
    }

    if (contentType === 'TEXT' && (!firstPart || !secondPart)) {
      setError('First part and second part are required for TEXT content type');
      return;
    }

    if (contentType === 'VIDEO' && !videoFile && !blog?.video_file) {
      setError('Video file is required for VIDEO content type');
      return;
    }

    setIsLoading(true);

    try {
      const blogData: any = {
        slug,
        title,
        teaser: teaser || undefined,
        summary: summary || undefined,
        content_type: contentType,
        is_featured: isFeatured,
        streams: selectedStreams.map(s => parseInt(s)),
        careers: selectedCareers.map(c => parseInt(c)),
      };

      if (contentType === 'TEXT') {
        blogData.first_part = firstPart;
        blogData.second_part = secondPart;
      }

      if (blogImage) {
        blogData.blog_image = blogImage;
      }

      if (contentType === 'VIDEO' && videoFile) {
        blogData.video_file = videoFile;
      }

      // Add URL and source name (always include, even if empty, so they can be cleared)
      blogData.url = url || undefined;
      blogData.source_name = sourceName || undefined;

      if (blog) {
        // Update existing blog
        const response = await updateBlog(blog.id, blogData);
        if (response.success) {
          showSuccess('Blog updated successfully');
          onClose();
        } else {
          const errorMsg = response.message || 'Failed to update blog';
          setError(errorMsg);
          showError(errorMsg);
        }
      } else {
        // Create new blog
        const response = await createBlog(blogData);
        if (response.success) {
          showSuccess('Blog created successfully');
          onClose();
        } else {
          const errorMsg = response.message || 'Failed to create blog';
          setError(errorMsg);
          showError(errorMsg);
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred while saving the blog';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving blog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {blog ? 'Edit Blog' : 'Create Blog'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            {/* Slug and Title Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Slug <span className="text-pink">*</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  placeholder="my-blog-post"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use lowercase letters, numbers, and hyphens only (e.g., my-blog-post)
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Title <span className="text-pink">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                />
              </div>
            </div>

            {/* Teaser and Summary */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Teaser
              </label>
              <textarea
                value={teaser}
                onChange={(e) => setTeaser(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                placeholder="Short teaser text..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Summary
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                placeholder="Blog summary..."
              />
            </div>

            {/* Content Type and Featured */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Content Type <span className="text-pink">*</span>
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as 'TEXT' | 'VIDEO')}
                  required
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                >
                  <option value="TEXT">TEXT</option>
                  <option value="VIDEO">VIDEO</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-pink border-gray-300 rounded focus:ring-pink"
                  />
                  <span className="text-xs font-medium text-gray-700">Featured Blog</span>
                </label>
              </div>
            </div>

            {/* Streams and Careers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Streams
                </label>
                <MultiSelect
                  options={streamOptions}
                  value={selectedStreams}
                  onChange={setSelectedStreams}
                  placeholder="Select streams..."
                  isSearchable={true}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Careers
                </label>
                <MultiSelect
                  options={careerOptions}
                  value={selectedCareers}
                  onChange={setSelectedCareers}
                  placeholder="Select careers..."
                  isSearchable={true}
                />
              </div>
            </div>

            {/* URL and Source Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  URL (Third-party link)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  If provided, blog will open in a new window
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Source Name
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="Source name"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                />
              </div>
            </div>

            {/* Blog Image */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Blog Image
              </label>
              <div className="flex items-center gap-3">
                {blogImagePreview && (
                  <div className="relative h-24 w-24 rounded overflow-hidden border border-gray-300">
                    <Image
                      src={blogImagePreview}
                      alt="Blog preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FiImage className="h-4 w-4" />
                    {blogImagePreview ? 'Change Image' : 'Upload Image'}
                  </button>
                  {blogImagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setBlogImagePreview(null);
                        setBlogImage(null);
                        if (imageInputRef.current) imageInputRef.current.value = '';
                      }}
                      className="ml-2 text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content Type Specific Fields */}
            {contentType === 'TEXT' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    First Part <span className="text-pink">*</span>
                  </label>
                  <RichTextEditor
                    value={firstPart}
                    onChange={setFirstPart}
                    placeholder="First part of the blog content..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Second Part <span className="text-pink">*</span>
                  </label>
                  <RichTextEditor
                    value={secondPart}
                    onChange={setSecondPart}
                    placeholder="Second part of the blog content..."
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Video File <span className="text-pink">*</span>
                </label>
                <div className="flex items-center gap-3">
                  {blog?.video_file && !videoFile && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                      <FiVideo className="h-4 w-4" />
                      <span>Current video file</span>
                    </div>
                  )}
                  {videoFile && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-lg text-sm text-blue-700">
                      <FiVideo className="h-4 w-4" />
                      <span>{videoFile.name}</span>
                    </div>
                  )}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FiVideo className="h-4 w-4" />
                    {videoFile || blog?.video_file ? 'Change Video' : 'Upload Video'}
                  </button>
                  {videoFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setVideoFile(null);
                        if (videoInputRef.current) videoInputRef.current.value = '';
                      }}
                      className="ml-2 text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                {error}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors mr-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : blog ? 'Update Blog' : 'Create Blog'}
          </button>
        </div>
      </div>
    </div>
  );
}


