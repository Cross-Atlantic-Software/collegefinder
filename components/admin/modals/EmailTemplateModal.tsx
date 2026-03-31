'use client';

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { createEmailTemplate, updateEmailTemplate, EmailTemplate } from '@/api';
import { useToast } from '@/components/shared';

interface EmailTemplateModalProps {
  template: EmailTemplate | null;
  onClose: () => void;
}


export default function EmailTemplateModal({ template, onClose }: EmailTemplateModalProps) {
  const { showSuccess, showError } = useToast();
  const [type, setType] = useState(template?.type || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [bodyHtml, setBodyHtml] = useState(template?.body_html || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveType = (template?.type || type || '').toUpperCase();
  const isReferralWhatsApp = effectiveType === 'REFERRAL_WHATSAPP';
  const isReferralInvite = effectiveType === 'REFERRAL_INVITE';
  const isReferralInstituteInvite = effectiveType === 'REFERRAL_INSTITUTE_INVITE';

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
          showSuccess('Email template updated successfully');
          onClose();
        } else {
          const errorMsg = response.message || 'Failed to update template';
          setError(errorMsg);
          showError(errorMsg);
        }
      } else {
        // Create new template
        if (!type) {
          const errorMsg = 'Type is required';
          setError(errorMsg);
          showError(errorMsg);
          setIsLoading(false);
          return;
        }
        const response = await createEmailTemplate(type, subject, bodyHtml);
        if (response.success) {
          showSuccess('Email template created successfully');
          onClose();
        } else {
          const errorMsg = response.message || 'Failed to create template';
          setError(errorMsg);
          showError(errorMsg);
        }
      }
    } catch (err) {
      const errorMsg = 'An error occurred while saving the template';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {template ? 'Edit Email Template' : 'Create Email Template'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 transition-colors"
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
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Type <span className="text-[#341050]">*</span>
                </label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  disabled={!!template}
                  required
                  placeholder="OTP_VERIFICATION"
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Subject <span className="text-[#341050]">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                />
              </div>
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {isReferralWhatsApp ? (
                  <>Message body (plain text) <span className="text-[#341050]">*</span></>
                ) : (
                  <>Body (HTML) <span className="text-[#341050]">*</span></>
                )}
              </label>
              {(isReferralInvite || isReferralWhatsApp) && (
                <p className="text-[11px] text-slate-500 mb-1.5 leading-relaxed">
                  Placeholders:{" "}
                  <code className="bg-slate-100 px-0.5 rounded">
                    {`{{userName}} {{referralCode}} {{shareUrl}} {{signUpLink}} {{platformName}} {{year}}`}
                  </code>
                  {isReferralWhatsApp && (
                    <span className="block mt-1">
                      <code className="bg-slate-100 px-0.5 rounded">signUpLink</code> and{" "}
                      <code className="bg-slate-100 px-0.5 rounded">shareUrl</code> are the same signup URL.
                    </span>
                  )}
                </p>
              )}
              {isReferralInstituteInvite && (
                <p className="text-[11px] text-slate-500 mb-1.5 leading-relaxed">
                  Institute referral HTML. Placeholders:{" "}
                  <code className="bg-slate-100 px-0.5 rounded">
                    {`{{instituteName}} {{referralCode}} {{shareUrl}} {{signUpLink}} {{platformName}} {{year}}`}
                  </code>
                </p>
              )}
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                required
                rows={isReferralWhatsApp ? 8 : 12}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none font-mono"
                placeholder={
                  isReferralWhatsApp
                    ? "Plain text for WhatsApp share (line breaks allowed)…"
                    : "Enter HTML template here..."
                }
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
        <div className="border-t border-slate-200 px-4 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-[#F6F8FA] transition-colors mr-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

