'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllDocumentsForAgent } from '@/lib/database';
import DocumentList from '@/components/documents/DocumentList';
import type { KYCDocument, Customer } from '@/types';
import { getSignedViewUrl } from '@/lib/storage';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const { user } = useAuth();
  const [allDocs, setAllDocs] = useState<(KYCDocument & { customerName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const docs = await getAllDocumentsForAgent(user.id);
        setAllDocs(docs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const filtered = allDocs.filter((d) =>
    !search || d.fileName.toLowerCase().includes(search.toLowerCase()) ||
    d.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            KYC Documents
          </h1>
          <p className="text-slate-400 mt-0.5">{allDocs.length} total documents across all customers</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename or customer name..."
          className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No documents found</p>
          <p className="text-slate-600 text-sm mt-1">Upload documents from a customer profile</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass rounded-xl px-4 py-3 flex items-center gap-4 group"
            >
              <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{doc.fileName}</p>
                <p className="text-xs text-slate-500">{doc.customerName} · {doc.type.replace('_', ' ').toUpperCase()}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleView(doc.fileUrl)}
                  className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer">
                  View
                </button>
                <button onClick={() => handleDownload(doc.fileUrl, doc.fileName)}
                  className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer">
                  Download
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
