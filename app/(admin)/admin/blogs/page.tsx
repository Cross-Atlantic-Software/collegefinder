'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAllBlogs, deleteBlog, getBlogById, type Blog } from '@/api/admin/blogs';
import { getAllStreamsPublic, getAllCareersPublic } from '@/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiImage, FiFileText, FiPlay, FiX, FiEye } from 'react-icons/fi';
import BlogModal from '@/components/admin/modals/BlogModal';
import { ConfirmationModal, useToast } from '@/components/shared';
import Image from 'next/image';

export default function BlogsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [allBlogs, setAllBlogs] = useState<Blog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [streamsMap, setStreamsMap] = useState<Record<number, string>>({});
  const [careersMap, setCareersMap] = useState<Record<number, string>>({});
  const [viewingBlog, setViewingBlog] = useState<Blog | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    // Check admin authentication
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    fetchBlogs();
    fetchStreamsAndCareers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchStreamsAndCareers = async () => {
    try {
      const [streamsRes, careersRes] = await Promise.all([
        getAllStreamsPublic(),
        getAllCareersPublic(),
      ]);

      if (streamsRes.success && streamsRes.data) {
        const map: Record<number, string> = {};
        streamsRes.data.streams.forEach((s) => {
          map[s.id] = s.name;
        });
        setStreamsMap(map);
      }

      if (careersRes.success && careersRes.data) {
        const map: Record<number, string> = {};
        careersRes.data.careers.forEach((c) => {
          map[c.id] = c.name;
        });
        setCareersMap(map);
      }
    } catch (err) {
      console.error('Error fetching streams/careers:', err);
    }
  };

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const response = await getAllBlogs();
      if (response.success && response.data) {
        // Parse JSONB fields (streams and careers) to ensure they're arrays
        const parsedBlogs = response.data.blogs.map(blog => ({
          ...blog,
          streams: parseJsonbField(blog.streams),
          careers: parseJsonbField(blog.careers),
        }));
        setAllBlogs(parsedBlogs);
        setBlogs(parsedBlogs);
      } else {
        setError(response.message || 'Failed to fetch blogs');
      }
    } catch (err) {
      setError('An error occurred while fetching blogs');
      console.error('Error fetching blogs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to parse JSONB fields
  const parseJsonbField = (field: unknown): number[] => {
    if (field === null || field === undefined) return [];
    if (Array.isArray(field)) {
      // Ensure all elements are numbers
      return field.map(item => typeof item === 'number' ? item : Number(item)).filter(n => !isNaN(n));
    }
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) {
          return parsed.map(item => typeof item === 'number' ? item : Number(item)).filter(n => !isNaN(n));
        }
        return [];
      } catch {
        return [];
      }
    }
    // If it's a number, wrap it in an array (shouldn't happen, but handle it)
    if (typeof field === 'number') {
      return [field];
    }
    return [];
  };

  // Debounced search handler
  useEffect(() => {
    if (allBlogs.length === 0) {
      setBlogs([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setBlogs(allBlogs);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allBlogs.filter(blog =>
        blog.title.toLowerCase().includes(searchLower) ||
        blog.slug.toLowerCase().includes(searchLower) ||
        (blog.teaser && blog.teaser.toLowerCase().includes(searchLower))
      );
      setBlogs(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allBlogs]);

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      setIsDeleting(true);
      const response = await deleteBlog(deletingId);
      if (response.success) {
        showSuccess('Blog deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchBlogs();
      } else {
        const errorMsg = response.message || 'Failed to delete blog';
        setError(errorMsg);
        showError(errorMsg);
        setShowDeleteConfirm(false);
        setDeletingId(null);
      }
    } catch (err) {
      const errorMsg = 'An error occurred while deleting blog';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error deleting blog:', err);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleView = async (id: number) => {
    try {
      const response = await getBlogById(id);
      if (response.success && response.data) {
        setViewingBlog(response.data.blog);
        setShowViewModal(true);
      } else {
        showError('Failed to load blog details');
      }
    } catch (err) {
      showError('Failed to load blog details');
      console.error('Error fetching blog:', err);
    }
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingBlog(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingBlog(null);
    fetchBlogs();
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Blog Manager</h1>
            <p className="text-sm text-gray-600">Manage blog posts and content.</p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All blogs</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allBlogs.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or slug"
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
              Add Blog
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Blogs Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading blogs...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        IMAGE
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        TITLE
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        SLUG
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        TYPE
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        FEATURED
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        STREAMS
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        CAREERS
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        CREATED
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {blogs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-4 text-center text-sm text-gray-500">
                          {blogs.length < allBlogs.length ? 'No blogs found matching your search' : 'No blogs found'}
                        </td>
                      </tr>
                    ) : (
                      blogs.map((blog) => (
                        <tr key={blog.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            {blog.blog_image ? (
                              <div className="relative h-12 w-12 rounded overflow-hidden">
                                <Image
                                  src={blog.blog_image}
                                  alt={blog.title}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center">
                                <FiImage className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{blog.title}</span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">{blog.slug}</td>
                          <td className="px-4 py-2">
                            {blog.content_type === 'VIDEO' ? (
                              <button
                                onClick={() => {
                                  if (blog.video_file) {
                                    setSelectedVideo(blog.video_file);
                                    setShowVideoModal(true);
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer"
                                disabled={!blog.video_file}
                              >
                                <FiPlay className="h-3 w-3" />
                                {blog.video_file ? 'Play Video' : 'No Video'}
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <FiFileText className="h-3 w-3" />
                                {blog.content_type}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {blog.is_featured ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                Featured
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {Array.isArray(blog.streams) && blog.streams.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {blog.streams.slice(0, 2).map((streamId) => (
                                  <span
                                    key={streamId}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                                  >
                                    {streamsMap[Number(streamId)] || `Stream ${streamId}`}
                                  </span>
                                ))}
                                {blog.streams.length > 2 && (
                                  <span className="text-xs text-gray-500">+{blog.streams.length - 2}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {Array.isArray(blog.careers) && blog.careers.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {blog.careers.slice(0, 2).map((careerId) => (
                                  <span
                                    key={careerId}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700"
                                  >
                                    {careersMap[Number(careerId)] || `Career ${careerId}`}
                                  </span>
                                ))}
                                {blog.careers.length > 2 && (
                                  <span className="text-xs text-gray-500">+{blog.careers.length - 2}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {new Date(blog.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleView(blog.id)}
                                className="p-2 text-green-600 hover:text-green-800 transition-colors"
                                title="View"
                              >
                                <FiEye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(blog)}
                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(blog.id)}
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

      {/* Blog Modal */}
      {showModal && (
        <BlogModal
          blog={editingBlog}
          onClose={handleModalClose}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Blog"
        message="Are you sure you want to delete this blog? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeleting}
      />

      {/* Video Player Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Video Player</h2>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setSelectedVideo(null);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="flex-1 p-4 bg-black flex items-center justify-center">
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="max-w-full max-h-[70vh] w-auto h-auto"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}

      {/* View Blog Modal */}
      {showViewModal && viewingBlog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">View Blog</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingBlog(null);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {/* Blog Image */}
              {viewingBlog.blog_image && (
                <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={viewingBlog.blog_image}
                    alt={viewingBlog.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Title</label>
                <p className="text-lg font-bold text-gray-900">{viewingBlog.title}</p>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Slug</label>
                <p className="text-sm text-gray-700">{viewingBlog.slug}</p>
              </div>

              {/* Content Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Content Type</label>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  viewingBlog.content_type === 'VIDEO' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {viewingBlog.content_type === 'VIDEO' ? <FiPlay className="h-3 w-3" /> : <FiFileText className="h-3 w-3" />}
                  {viewingBlog.content_type}
                </span>
              </div>

              {/* Featured */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Featured</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  viewingBlog.is_featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {viewingBlog.is_featured ? 'Yes' : 'No'}
                </span>
              </div>

              {/* URL and Source */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">URL</label>
                  {viewingBlog.url ? (
                    <a
                      href={viewingBlog.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {viewingBlog.url}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400">-</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Source</label>
                  <p className="text-sm text-gray-700">
                    {viewingBlog.source_name ? viewingBlog.source_name : <span className="text-gray-400">-</span>}
                  </p>
                </div>
              </div>

              {/* Streams */}
              {viewingBlog.streams && viewingBlog.streams.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Streams</label>
                  <div className="flex flex-wrap gap-1">
                    {viewingBlog.streams.map((streamId) => (
                      <span
                        key={streamId}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                      >
                        {streamsMap[streamId] || `Stream ${streamId}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Careers */}
              {viewingBlog.careers && viewingBlog.careers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Careers</label>
                  <div className="flex flex-wrap gap-1">
                    {viewingBlog.careers.map((careerId) => (
                      <span
                        key={careerId}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700"
                      >
                        {careersMap[careerId] || `Career ${careerId}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Teaser */}
              {viewingBlog.teaser && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Teaser</label>
                  <p className="text-sm text-gray-700">{viewingBlog.teaser}</p>
                </div>
              )}

              {/* Summary */}
              {viewingBlog.summary && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Summary</label>
                  <p className="text-sm text-gray-700">{viewingBlog.summary}</p>
                </div>
              )}

              {/* First Part (for TEXT content) */}
              {viewingBlog.content_type === 'TEXT' && viewingBlog.first_part && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">First Part</label>
                  <div 
                    className="text-sm text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: viewingBlog.first_part }}
                  />
                </div>
              )}

              {/* Second Part (for TEXT content) */}
              {viewingBlog.content_type === 'TEXT' && viewingBlog.second_part && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Second Part</label>
                  <div 
                    className="text-sm text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: viewingBlog.second_part }}
                  />
                </div>
              )}

              {/* Video File (for VIDEO content) */}
              {viewingBlog.content_type === 'VIDEO' && viewingBlog.video_file && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Video</label>
                  <button
                    onClick={() => {
                      setSelectedVideo(viewingBlog.video_file!);
                      setShowVideoModal(true);
                      setShowViewModal(false);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                  >
                    <FiPlay className="h-4 w-4" />
                    Play Video
                  </button>
                </div>
              )}

              {/* Created At */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Created At</label>
                <p className="text-sm text-gray-700">
                  {new Date(viewingBlog.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Updated At */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Updated At</label>
                <p className="text-sm text-gray-700">
                  {new Date(viewingBlog.updated_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-3 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingBlog(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(viewingBlog);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


