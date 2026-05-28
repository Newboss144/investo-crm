'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createPolicy } from '@/lib/database';
import { toast } from 'sonner';
import type { PolicyType, PolicyStatus } from '@/types';

const POLICY_TYPES: { value: PolicyType; label: string }[] = [
  { value: 'lic', label: 'LIC' },
  { value: 'health', label: 'Health Insurance' },
  { value: 'general', label: 'General Insurance' },
  { value: 'mutual_fund', label: 'Mutual Fund' },
];

const STATUSES: { value: PolicyStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'lapsed', label: 'Lapsed' },
  { value: 'pending', label: 'Pending' },
];

export default function NewPolicyPage() {
  const { id: customerId } = useParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'lic' as PolicyType,
    policyNo: '',
    provider: '',
    premium: '',
    investmentValue: '',
    status: 'active' as PolicyStatus,
    maturityDate: '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.policyNo.trim() || !form.provider.trim()) {
      toast.error('Policy number and provider are required');
      return;
    }
    setSaving(true);
    try {
      const isLic = form.type === 'lic';
      const isHealth = form.type === 'health';
      const isMF = form.type === 'mutual_fund';

      await createPolicy({
        customerId,
        type: form.type,
        policyNo: form.policyNo,
        provider: form.provider,
        premium: parseFloat(form.premium) || 0,
        investmentValue: (isHealth || isMF) ? (parseFloat(form.investmentValue) || 0) : 0,
        status: form.status,
        maturityDate: isLic ? form.maturityDate : '',
      });
      toast.success('Policy added!');
      router.push(`/customers/${customerId}`);
    } catch {
      toast.error('Failed to add policy');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-white">Add Policy</h1>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 space-y-5"
      >
        {/* Policy Type */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Policy Type *</label>
          <div className="grid grid-cols-2 gap-2">
            {POLICY_TYPES.map((t) => (
              <button
                key={t.value} type="button"
                onClick={() => setForm((p) => ({ ...p, type: t.value }))}
                className={`py-2.5 px-4 rounded-xl text-sm font-medium border transition-all ${
                  form.type === t.value
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Policy Number *" id="policyNo" value={form.policyNo} onChange={set('policyNo')} placeholder={form.type === 'lic' ? 'LIC-12345678' : form.type === 'health' ? 'H-12345678' : 'P-12345678'} />
          <InputField label="Provider Name *" id="provider" value={form.provider} onChange={set('provider')} placeholder={form.type === 'lic' ? 'LIC of India' : 'HDFC Ergo'} />
          <InputField label="Premium (₹)" id="premium" value={form.premium} onChange={set('premium')} placeholder="12000" type="number" />
          
          {form.type === 'health' && (
            <InputField label="Sum Assured (₹)" id="investmentValue" value={form.investmentValue} onChange={set('investmentValue')} placeholder="500000" type="number" />
          )}
          {form.type === 'mutual_fund' && (
            <InputField label="Investment Value (₹)" id="investmentValue" value={form.investmentValue} onChange={set('investmentValue')} placeholder="500000" type="number" />
          )}

          {form.type === 'lic' && (
            <InputField label="Maturity Date" id="maturityDate" value={form.maturityDate} onChange={set('maturityDate')} placeholder="" type="date" />
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select
              value={form.status} onChange={set('status')}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all">
            Cancel
          </button>
          <motion.button
            type="submit" disabled={saving} whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Add Policy'}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}

function InputField({ label, id, value, onChange, placeholder, type = 'text' }: {
  label: string; id: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <input
        id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      />
    </div>
  );
}
