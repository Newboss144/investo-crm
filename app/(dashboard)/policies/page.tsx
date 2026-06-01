'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, TrendingUp, Search, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllPoliciesForAgent, getCustomer } from '@/lib/database';
import type { Policy } from '@/types';
import PolicyCard from '@/components/policies/PolicyCard';
import { toast } from 'sonner';

const TYPE_LABELS = {
  lic: 'LIC',
  health: 'Health Insurance',
  general: 'General Insurance',
  mutual_fund: 'Mutual Fund',
};

const STATUS_LABELS = {
  active: 'Active',
  matured: 'Matured',
  lapsed: 'Lapsed',
  pending: 'Pending',
};

export default function PoliciesPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<(Policy & { customerName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    getAllPoliciesForAgent(user.id)
      .then(setPolicies)
      .catch(() => toast.error('Failed to load policies'))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = policies.filter((p) => {
    if (filterType !== 'all' && p.type !== filterType) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const policyNoMatch = p.policyNo?.toLowerCase().includes(q);
      const customerMatch = p.customerName?.toLowerCase().includes(q);
      if (!policyNoMatch && !customerMatch) return false;
    }
    return true;
  });

  const stats = {
    total: policies.length,
    active: policies.filter((p) => p.status === 'active').length,
    totalPremium: policies.reduce((s, p) => s + p.premium, 0),
    totalValue: policies.reduce((s, p) => s + p.investmentValue, 0),
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-violet-400" />
            All Policies
          </h1>
          <p className="text-slate-400 mt-0.5">{policies.length} total policies</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Policies', value: stats.total, color: 'text-violet-400' },
          { label: 'Active', value: stats.active, color: 'text-emerald-400' },
          { label: 'Total Premium', value: `₹${stats.totalPremium.toLocaleString('en-IN')}`, color: 'text-blue-400' },
          { label: 'Portfolio Value', value: `₹${stats.totalValue.toLocaleString('en-IN')}`, color: 'text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 lg:items-center justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by policy no or customer name..."
            className="w-full pl-10 pr-10 py-2 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all glass"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 overflow-hidden">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {['all', 'lic', 'health', 'general', 'mutual_fund'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  filterType === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Types' : TYPE_LABELS[t as keyof typeof TYPE_LABELS]}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {['all', 'active', 'matured', 'lapsed', 'pending'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  filterStatus === s ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s === 'all' ? 'All Status' : STATUS_LABELS[s as keyof typeof STATUS_LABELS]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Policy list */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No policies found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((policy, i) => (
            <motion.div key={policy.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <PolicyCard policy={policy} customerId={policy.customerId} onDeleted={() => setPolicies((prev) => prev.filter((p) => p.id !== policy.id))} showCustomerLink />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
