'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Download, Trash2, Loader2, Shield, Eye,
} from 'lucide-react';
import { uploadDocument, deleteStorageFile, getSignedViewUrl } from '@/lib/storage';
import { createDocument, deleteDocument } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { KYCDocument, DocumentType } from '@/types';
import { format } from 'date-fns';

const DOC_TYPES: { value: DocumentType; label: string; desc: string }[] = [
  { value: 'aadhaar', label: 'Aadhaar Card', desc: 'Government ID' },
  { value: 'pan', label: 'PAN Card', desc: 'Tax ID' },
  { value: 'bank_proof', label: 'Bank Proof', desc: 'Passbook / Statement' },
  { value: 'other', label: 'Other', desc: 'Any other document' },
];

const DOC_TYPE_CONFIG = {
  aadhaar: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  pan: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  bank_proof: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  other: { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
};

interface DocumentListProps {
  customerId: string;
  documents: KYCDocument[];
  onUpdate: (docs: KYCDocument[]) => void;
}

export default function DocumentList({ customerId, documents, onUpdate }: DocumentListProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedType, setSelectedType] = useState<DocumentType>('aadhaar');
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const fileUrl = await uploadDocument(customerId, file, setUploadProgress);
      const id = await createDocument({
        customerId,
        type: selectedType,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        uploadedBy: user.id,
      });
      onUpdate([
        {
          id,
          customerId,
          type: selectedType,
          fileName: file.name,
          fileUrl,
          fileSize: file.size,
          uploadedAt: new Date(),
          uploadedBy: user.id,
        },
        ...documents,
      ]);
      toast.success('Document uploaded successfully');
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes('Bucket not found') || err?.status === 404) {
        toast.error('Storage bucket "documents" not found. Please create it in your Supabase Storage Console.');
      } else {
        toast.error('Upload failed. Please check your Supabase Storage rules.');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (doc: KYCDocument) => {
    if (!confirm(`Delete "${doc.fileName}"?`)) return;
    setDeleting(doc.id);
    try {
      await Promise.all([deleteDocument(doc.id), deleteStorageFile(doc.fileUrl)]);
      onUpdate(documents.filter((d) => d.id !== doc.id));
      toast.success('Document deleted');
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  const handleView = async (fileUrl: string) => {
    const toastId = toast.loading('Generating secure link...');
    try {
      const signedUrl = await getSignedViewUrl(fileUrl);
      toast.dismiss(toastId);
      window.open(signedUrl, '_blank');
    } catch {
      toast.dismiss(toastId);
      window.open(fileUrl, '_blank');
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    const toastId = toast.loading('Preparing download...');
    try {
      const signedUrl = await getSignedViewUrl(fileUrl);
      toast.dismiss(toastId);

      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.dismiss(toastId);
      window.open(fileUrl, '_blank');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">KYC Documents</h2>
        <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all cursor-pointer">
          <Upload className="w-4 h-4" />
          Upload Document
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
        </label>
      </div>

      {/* Document type selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {DOC_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setSelectedType(t.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              selectedType === t.value
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Upload progress */}
      {uploading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass rounded-xl p-4 mb-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-sm text-slate-300">Uploading... {uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </motion.div>
      )}

      {/* Document list */}
      {documents.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No documents uploaded yet</p>
          <p className="text-slate-600 text-sm mt-1">Select a document type and click Upload Document</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {documents.map((doc) => {
              const config = DOC_TYPE_CONFIG[doc.type];
              const docLabel = DOC_TYPES.find((t) => t.value === doc.type)?.label || doc.type;
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass rounded-xl p-4 group flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${config.bg} flex-shrink-0`}>
                    <FileText className={`w-5 h-5 ${config.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white truncate">{doc.fileName}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${config.bg} ${config.color} flex-shrink-0`}>
                        {docLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatSize(doc.fileSize)} · {format(doc.uploadedAt, 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => handleView(doc.fileUrl)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="View"
                    >
                      <Eye className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc.fileUrl, doc.fileName)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={deleting === doc.id}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      {deleting === doc.id
                        ? <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                        : <Trash2 className="w-4 h-4 text-red-400" />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
