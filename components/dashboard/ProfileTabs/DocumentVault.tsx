"use client";

import { useState, useEffect } from "react";
import { FiUpload, FiX, FiEye, FiTrash2, FiFile } from "react-icons/fi";
import { getDocumentVault, uploadDocument, deleteDocument } from "@/api/auth/profile";
import { Button, useToast } from "../../shared";

interface DocumentVaultData {
  id?: number;
  user_id?: number;
  passport_size_photograph: string | null;
  signature_image: string | null;
  matric_marksheet: string | null;
  matric_certificate: string | null;
  postmatric_marksheet: string | null;
  valid_photo_id_proof: string | null;
  sc_certificate: string | null;
  st_certificate: string | null;
  obc_ncl_certificate: string | null;
  ews_certificate: string | null;
  pwbd_disability_certificate: string | null;
  udid_card: string | null;
  domicile_certificate: string | null;
  citizenship_certificate: string | null;
  migration_certificate: string | null;
}

interface DocumentField {
  key: keyof DocumentVaultData;
  label: string;
  section: string;
  required?: boolean;
}

const documentFields: DocumentField[] = [
  // Mandatory Uploads
  { key: 'passport_size_photograph', label: 'Passport-size Photograph', section: 'Mandatory Uploads', required: true },
  { key: 'signature_image', label: 'Signature Image', section: 'Mandatory Uploads', required: true },
  
  // Identity & Academic Proof
  { key: 'matric_marksheet', label: 'Matric Marksheet', section: 'Identity & Academic Proof' },
  { key: 'matric_certificate', label: 'Matric Certificate', section: 'Identity & Academic Proof' },
  { key: 'postmatric_marksheet', label: 'Postmatric Marksheet (if passed)', section: 'Identity & Academic Proof' },
  { key: 'valid_photo_id_proof', label: 'Valid Photo ID Proof', section: 'Identity & Academic Proof' },
  
  // Category and Reservation Documents
  { key: 'sc_certificate', label: 'SC Certificate', section: 'Category and Reservation Documents (if applicable)' },
  { key: 'st_certificate', label: 'ST Certificate', section: 'Category and Reservation Documents (if applicable)' },
  { key: 'obc_ncl_certificate', label: 'OBC-NCL Certificate', section: 'Category and Reservation Documents (if applicable)' },
  { key: 'ews_certificate', label: 'EWS Certificate', section: 'Category and Reservation Documents (if applicable)' },
  { key: 'pwbd_disability_certificate', label: 'PwBD/Disability Certificate', section: 'Category and Reservation Documents (if applicable)' },
  { key: 'udid_card', label: 'UDID Card', section: 'Category and Reservation Documents (if applicable)' },
  { key: 'domicile_certificate', label: 'Domicile Certificate (State Quota Exams)', section: 'Category and Reservation Documents (if applicable)' },
  
  // Additional Uploads
  { key: 'citizenship_certificate', label: 'Citizenship Certificate (OCI/PIO, if applicable)', section: 'Additional Uploads (exam dependent)' },
  { key: 'migration_certificate', label: 'Migration Certificate', section: 'Additional Uploads (exam dependent)' },
];

export default function DocumentVault() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [documentVault, setDocumentVault] = useState<DocumentVaultData | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{ url: string; label: string } | null>(null);

  useEffect(() => {
    fetchDocumentVault();
  }, []);

  const fetchDocumentVault = async () => {
    try {
      setLoading(true);
      const response = await getDocumentVault();
      if (response.success) {
        setDocumentVault(response.data || {
          passport_size_photograph: null,
          signature_image: null,
          matric_marksheet: null,
          matric_certificate: null,
          postmatric_marksheet: null,
          valid_photo_id_proof: null,
          sc_certificate: null,
          st_certificate: null,
          obc_ncl_certificate: null,
          ews_certificate: null,
          pwbd_disability_certificate: null,
          udid_card: null,
          domicile_certificate: null,
          citizenship_certificate: null,
          migration_certificate: null,
        });
      }
    } catch (error: any) {
      console.error('Error fetching document vault:', error);
      showError(error.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (fieldName: string, file: File) => {
    try {
      setUploading(fieldName);
      const response = await uploadDocument(file, fieldName);
      if (response.success) {
        showSuccess('Document uploaded successfully');
        await fetchDocumentVault();
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);
      showError(error.message || 'Failed to upload document');
    } finally {
      setUploading(null);
    }
  };

  const handleFileDelete = async (fieldName: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setDeleting(fieldName);
      const response = await deleteDocument(fieldName);
      if (response.success) {
        showSuccess('Document deleted successfully');
        await fetchDocumentVault();
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
      showError(error.message || 'Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  const handleFileChange = (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Validate file type (MIME type)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        showError('Invalid file type. Only JPEG, PNG, WebP images and PDF files are allowed');
        e.target.value = '';
        return;
      }

      // 2. Validate file extension
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!allowedExtensions.includes(fileExtension)) {
        showError('Invalid file extension. Only .jpg, .jpeg, .png, .webp, and .pdf files are allowed');
        e.target.value = '';
        return;
      }

      // 3. Validate file size (10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        showError(`File size exceeds the maximum limit of ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB`);
        e.target.value = '';
        return;
      }

      // 4. Validate minimum file size (prevent empty files)
      const MIN_FILE_SIZE = 100; // 100 bytes minimum
      if (file.size < MIN_FILE_SIZE) {
        showError('File is too small. Please upload a valid file');
        e.target.value = '';
        return;
      }

      handleFileUpload(fieldName, file);
    }
    // Reset input
    e.target.value = '';
  };

  const getFileExtension = (url: string): string => {
    const match = url.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : '';
  };

  const isImage = (url: string): boolean => {
    const ext = getFileExtension(url);
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  };

  const renderDocumentField = (field: DocumentField) => {
    const value = documentVault?.[field.key] || null;
    const isUploading = uploading === field.key;
    const isDeleting = deleting === field.key;
    const fileInputId = `file-${field.key}`;

    return (
      <div key={field.key} className="space-y-2">
        <label className="block text-sm font-medium text-slate-200">
          {field.label}
          {field.required && <span className="text-pink ml-1">*</span>}
        </label>
        
        {value ? (
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 flex-1">
              <FiFile className="h-5 w-5 text-slate-400" />
              <span className="text-sm text-slate-300">
                {isImage(value) ? 'Image' : 'PDF'} Document
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewingDocument({ url: value, label: field.label })}
                className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                title="View"
              >
                <FiEye className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleFileDelete(field.key)}
                disabled={isDeleting}
                className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                title="Delete"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
              <label
                htmlFor={fileInputId}
                className="p-2 text-green-400 hover:text-green-300 transition-colors cursor-pointer"
                title="Replace"
              >
                <FiUpload className="h-4 w-4" />
                <input
                  type="file"
                  id={fileInputId}
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(field.key, e)}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        ) : (
          <label
            htmlFor={fileInputId}
            className="flex items-center justify-center gap-2 p-4 bg-white/5 rounded-lg border-2 border-dashed border-white/20 hover:border-pink/50 transition-colors cursor-pointer"
          >
            <FiUpload className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-300">
              {isUploading ? 'Uploading...' : 'Browse & Upload'}
            </span>
            <input
              type="file"
              id={fileInputId}
              className="hidden"
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange(field.key, e)}
              disabled={isUploading}
            />
          </label>
        )}
      </div>
    );
  };

  const groupedFields = documentFields.reduce((acc, field) => {
    if (!acc[field.section]) {
      acc[field.section] = [];
    }
    acc[field.section].push(field);
    return acc;
  }, {} as Record<string, DocumentField[]>);

  if (loading) {
    return (
      <div className="space-y-5 rounded-md bg-white/5 p-6">
        <div className="text-center text-slate-400">Loading documents...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedFields).map(([section, fields]) => (
          <div key={section} className="space-y-5 rounded-md bg-white/5 p-6">
            <div>
              <h2 className="text-base font-semibold text-pink sm:text-lg">{section}</h2>
              <p className="text-sm text-slate-300 mt-1">
                {section === 'Mandatory Uploads' && 'These documents are required for all users.'}
                {section === 'Identity & Academic Proof' && 'Upload your academic and identity documents.'}
                {section === 'Category and Reservation Documents (if applicable)' && 'Upload category and reservation documents if applicable to you.'}
                {section === 'Additional Uploads (exam dependent)' && 'Upload additional documents as required by specific exams.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {fields.map(renderDocumentField)}
            </div>
          </div>
        ))}
      </div>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{viewingDocument.label}</h2>
              <button
                onClick={() => setViewingDocument(null)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-800">
              {isImage(viewingDocument.url) ? (
                <img
                  src={viewingDocument.url}
                  alt={viewingDocument.label}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <iframe
                  src={viewingDocument.url}
                  className="w-full h-full min-h-[600px] border-0"
                  title={viewingDocument.label}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

