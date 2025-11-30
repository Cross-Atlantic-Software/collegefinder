'use client';

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { createEmailTemplate, updateEmailTemplate, EmailTemplate } from '@/lib/api';

interface EmailTemplateModalProps {
  template: EmailTemplate | null;
  onClose: () => void;
}


export default function EmailTemplateModal({ template, onClose }: EmailTemplateModalProps) {
  const [type, setType] = useState(template?.type || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [bodyHtml, setBodyHtml] = useState(template?.body_html || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form fields when template prop changes
  useEffect(() => {
    if (template) {
      setType(template.type || '');
      setSubject(template.subject || '');
      setBodyHtml(template.body_html || '');
    } else {
      // Reset form for new template
      setType('');
      setSubject('');
      setBodyHtml('');
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (template) {
        // Update existing template
        const response = await updateEmailTemplate(template.id, subject, bodyHtml);
        if (response.success) {
          onClose();
        } else {
          setError(response.message || 'Failed to update template');
        }
      } else {
        // Create new template
        if (!type) {
          setError('Type is required');
          setIsLoading(false);
          return;
        }
        const response = await createEmailTemplate(type, subject, bodyHtml);
        if (response.success) {
          onClose();
        } else {
          setError(response.message || 'Failed to create template');
        }
      }
    } catch (err) {
      setError('An error occurred while saving the template');
      console.error('Error saving template:', err);
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
            {template ? 'Edit Email Template' : 'Create Email Template'}
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
            {/* Type and Subject Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type <span className="text-pink">*</span>
                </label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  disabled={!!template}
                  required
                  placeholder="OTP_VERIFICATION"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Subject <span className="text-pink">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                />
              </div>
            </div>

            {/* Body HTML */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Body (HTML) <span className="text-pink">*</span>
              </label>
              
              {/* HTML Editor */}
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                required
                rows={12}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none font-mono"
                placeholder="Enter HTML template here..."
              />
            </div>

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
            {isLoading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

