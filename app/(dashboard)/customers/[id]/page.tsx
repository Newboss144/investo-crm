'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, MapPin, StickyNote, FileText, Shield, Edit3, Loader2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { getCustomer, getPoliciesByCustomer, getDocumentsByCustomer } from '@/lib/database';
import type { Customer, Policy, KYCDocument } from '@/types';
import { toast } from 'sonner';
import PolicyCard from '@/components/policies/PolicyCard';
import DocumentList from '@/components/documents/DocumentList';
import { format } from 'date-fns';

const TABS = ['Profile', 'Policies', 'Documents'] as const;
type Tab = typeof TABS[number];

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('Profile');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [cust, pols, docs] = await Promise.all([
          getCustomer(id),
          getPoliciesByCustomer(id),
          getDocumentsByCustomer(id),
        ]);
        if (!cust) { router.push('/customers'); return; }
        setCustomer(cust);
        setPolicies(pols);
        setDocuments(docs);
      } catch {
        toast.error('Failed to load customer');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }
  if (!customer) return null;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back + Edit */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <Link
          href={`/customers/${id}/edit`}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all"
        >
          <Edit3 className="w-4 h-4" />
          Edit Profile
        </Link>
      </div>

      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-500/25 flex-shrink-0">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Customer since {format(customer.createdAt, 'MMMM yyyy')}
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/91${customer.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
              {/* Call */}
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg text-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                {customer.phone}
              </a>
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm transition-all"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {customer.email}
                </a>
              )}
            </div>
          </div>
          {/* Summary badges */}
          <div className="flex gap-3 flex-shrink-0">
            <div className="text-center px-4 py-2 bg-slate-800 rounded-xl">
              <p className="text-2xl font-bold text-white">{policies.length}</p>
              <p className="text-xs text-slate-400">Policies</p>
            </div>
            <div className="text-center px-4 py-2 bg-slate-800 rounded-xl">
              <p className="text-2xl font-bold text-white">{documents.length}</p>
              <p className="text-xs text-slate-400">Docs</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-900 rounded-xl p-1 w-full sm:w-fit overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
            {tab === 'Policies' && policies.length > 0 && (
              <span className="ml-2 text-xs bg-white/10 px-1.5 py-0.5 rounded-full">{policies.length}</span>
            )}
            {tab === 'Documents' && documents.length > 0 && (
              <span className="ml-2 text-xs bg-white/10 px-1.5 py-0.5 rounded-full">{documents.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'Profile' && (
          <div className="glass rounded-2xl p-6 space-y-4">
            <InfoRow icon={Phone} label="Phone" value={customer.phone} />
            <InfoRow icon={Mail} label="Email" value={customer.email || '—'} />
            <InfoRow icon={MapPin} label="Address" value={customer.address || '—'} />
            <InfoRow icon={StickyNote} label="Notes" value={customer.notes || '—'} multiline />
          </div>
        )}

        {activeTab === 'Policies' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Policies</h2>
              <Link
                href={`/customers/${id}/policies/new`}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all"
              >
                <FileText className="w-4 h-4" />
                Add Policy
              </Link>
            </div>
            {policies.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No policies yet</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {policies.map((p) => (
                  <PolicyCard
                    key={p.id}
                    policy={p}
                    customerId={id}
                    onDeleted={() => setPolicies((prev) => prev.filter((x) => x.id !== p.id))}
                    customerName={customer.name}
                    customerPhone={customer.phone}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Documents' && (
          <div>
            <DocumentList
              customerId={id}
              documents={documents}
              onUpdate={setDocuments}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, multiline }: { icon: React.ElementType; label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className={`text-white ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
