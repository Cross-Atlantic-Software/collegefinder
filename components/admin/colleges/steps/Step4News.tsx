'use client';

import { useState } from 'react';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { CollegeFormData } from '../MultiStepCollegeForm';

interface Step4NewsProps {
  formData: CollegeFormData;
  setFormData: React.Dispatch<React.SetStateAction<CollegeFormData>>;
  isViewMode?: boolean;
}

export default function Step4News({ formData, setFormData, isViewMode = false }: Step4NewsProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [tempNews, setTempNews] = useState({
    title: '',
    teaser: '',
    url: '',
    source_name: '',
  });

  const handleAddNews = () => {
    setTempNews({
      title: '',
      teaser: '',
      url: '',
      source_name: '',
    });
    setEditingIndex(null);
    setViewingIndex(null);
    setShowModal(true);
  };

  const handleEditNews = (index: number) => {
    setTempNews(formData.newsItems[index]);
    setEditingIndex(index);
    setViewingIndex(null);
    setShowModal(true);
  };

  const handleViewNews = (index: number) => {
    setTempNews(formData.newsItems[index]);
    setViewingIndex(index);
    setEditingIndex(null);
    setShowModal(true);
  };

  const handleDeleteNews = (index: number) => {
    setFormData({
      ...formData,
      newsItems: formData.newsItems.filter((_, i) => i !== index),
    });
  };

  const handleSaveNews = () => {
    if (!tempNews.title.trim() || !tempNews.teaser.trim() || !tempNews.url.trim()) {
      return;
    }

    if (tempNews.teaser.length > 30) {
      alert('Teaser must be 30 characters or less');
      return;
    }

    if (editingIndex !== null) {
      // Update existing
      const updated = [...formData.newsItems];
      updated[editingIndex] = { ...tempNews };
      setFormData({ ...formData, newsItems: updated });
    } else {
      // Add new
      setFormData({
        ...formData,
        newsItems: [...formData.newsItems, { ...tempNews }],
      });
    }

    setShowModal(false);
    setEditingIndex(null);
    setViewingIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">News Articles</h3>
        <button
          type="button"
          onClick={handleAddNews}
          className="flex items-center gap-2 px-3 py-1.5 bg-pink text-white rounded-lg hover:bg-pink/90 transition-colors text-sm"
        >
          <FiPlus className="h-4 w-4" />
          Add News
        </button>
      </div>

      {formData.newsItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No news articles added yet. Click "Add News" to add one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {formData.newsItems.map((news, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{news.title}</p>
                {news.source_name && (
                  <p className="text-sm text-gray-500 mt-1">Source: {news.source_name}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleViewNews(index)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="View Details"
                >
                  <FiEye className="h-4 w-4" />
                </button>
                {!isViewMode && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleEditNews(index)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNews(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        Note: News articles are optional. You can skip this step or add articles later.
      </p>

      {/* News Detail/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-darkGradient text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {viewingIndex !== null ? 'View News' : editingIndex !== null ? 'Edit News' : 'Add News'}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tempNews.title}
                    onChange={(e) => setTempNews({ ...tempNews, title: e.target.value })}
                    disabled={viewingIndex !== null}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent disabled:bg-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teaser <span className="text-red-500">*</span> (Max 30 characters)
                  </label>
                  <input
                    type="text"
                    value={tempNews.teaser}
                    onChange={(e) => setTempNews({ ...tempNews, teaser: e.target.value })}
                    disabled={viewingIndex !== null}
                    maxLength={30}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent disabled:bg-gray-100"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{tempNews.teaser.length}/30</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={tempNews.url}
                    onChange={(e) => setTempNews({ ...tempNews, url: e.target.value })}
                    disabled={viewingIndex !== null}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent disabled:bg-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source Name</label>
                  <input
                    type="text"
                    value={tempNews.source_name}
                    onChange={(e) => setTempNews({ ...tempNews, source_name: e.target.value })}
                    disabled={viewingIndex !== null}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
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
                  onClick={handleSaveNews}
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

