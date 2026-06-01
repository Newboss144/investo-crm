'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, CreditCard, Calendar, Hash, Banknote, ToggleLeft, ToggleRight } from 'lucide-react';
import { createPolicy } from '@/lib/database';
import { toast } from 'sonner';
import type { PolicyType, PolicyStatus, ModeOfPayment } from '@/types';

const POLICY_TYPES: { value: PolicyType; label: string; icon: string }[] = [
  { value: 'lic', label: 'LIC', icon: '🏛️' },
  { value: 'health', label: 'Health Insurance', icon: '🏥' },
  { value: 'general', label: 'General Insurance', icon: '🛡️' },
  { value: 'mutual_fund', label: 'Mutual Fund', icon: '📈' },
];

const STATUSES: { value: PolicyStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'lapsed', label: 'Lapsed' },
  { value: 'matured', label: 'Matured' },
  { value: 'pending', label: 'Pending' },
];

const PAYMENT_MODES: { value: ModeOfPayment; label: string }[] = [
  { value: 'yearly', label: 'Yearly' },
  { value: 'half_yearly', label: 'Half-Yearly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function NewPolicyPage() {
  const { id: customerId } = useParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'lic' as PolicyType,
    policyNo: '',
    premium: '',
    sumAssured: '',
    investmentValue: '',
    status: 'active' as PolicyStatus,
    maturityDate: '',
    doc: '',
    planNo: '',
    ppt: '',
    term: '',
    modeOfPayment: 'yearly' as ModeOfPayment,
    isECS: false,
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const isLic = form.type === 'lic';
  const isHealth = form.type === 'health';
  const isGeneral = form.type === 'general';
  const isMF = form.type === 'mutual_fund';

  // Build planTerm string like "856-15-26"
  const buildPlanTerm = () => {
    const parts = [form.planNo, form.ppt, form.term].filter(Boolean);
    return parts.length > 0 ? parts.join('-') : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.policyNo.trim()) {
      toast.error('Policy number is required');
      return;
    }
    setSaving(true);
    try {
      await createPolicy({
        customerId,
        type: form.type,
        policyNo: form.policyNo,
        premium: parseFloat(form.premium) || 0,
        sumAssured: (isHealth || isGeneral) ? (parseFloat(form.sumAssured) || 0) : 0,
        investmentValue: isMF ? (parseFloat(form.investmentValue) || 0) : 0,
        status: form.status,
        maturityDate: isLic ? form.maturityDate : '',
        doc: form.doc,
        planTerm: isLic ? buildPlanTerm() : '',
        modeOfPayment: form.modeOfPayment,
        isECS: form.isECS,
      });
      toast.success('Policy added successfully!');
      router.push(`/customers/${customerId}`);
    } catch {
      toast.error('Failed to add policy');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
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
        className="glass rounded-2xl p-6 space-y-6"
      >
        {/* ─── Policy Type Selector ─── */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Policy Type *</label>
          <div className="grid grid-cols-2 gap-2">
            {POLICY_TYPES.map((t) => (
              <button
                key={t.value} type="button"
                onClick={() => setForm((p) => ({ ...p, type: t.value }))}
                className={`py-2.5 px-4 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
                  form.type === t.value
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Core Fields ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Policy Number *"
            id="policyNo"
            value={form.policyNo}
            onChange={set('policyNo')}
            placeholder="e.g. 12345678"
            icon={<Hash className="w-4 h-4" />}
          />
          <InputField
            label="Premium (₹)"
            id="premium"
            value={form.premium}
            onChange={set('premium')}
            placeholder="12000"
            type="number"
            icon={<Banknote className="w-4 h-4" />}
          />
        </div>

        {/* ─── Date of Commencement (always shown) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Date of Commencement (DOC)"
            id="doc"
            value={form.doc}
            onChange={set('doc')}
            placeholder=""
            type="date"
            icon={<Calendar className="w-4 h-4" />}
          />

          {/* Maturity Date – LIC only */}
          {isLic && (
            <InputField
              label="Maturity Date"
              id="maturityDate"
              value={form.maturityDate}
              onChange={set('maturityDate')}
              placeholder=""
              type="date"
              icon={<Calendar className="w-4 h-4" />}
            />
          )}
        </div>

        {/* ─── Plan-PPT-Term (LIC only) ─── */}
        {isLic && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Plan & Term</label>
            <p className="text-xs text-slate-500 mb-2">e.g. Plan 856, Premium Paying Term 15, Term 26 → 856-15-26</p>
            <div className="grid grid-cols-3 gap-3">
              <InputField label="Plan No." id="planNo" value={form.planNo} onChange={set('planNo')} placeholder="856" />
              <InputField label="PPT" id="ppt" value={form.ppt} onChange={set('ppt')} placeholder="15" type="number" />
              <InputField label="Term" id="term" value={form.term} onChange={set('term')} placeholder="26" type="number" />
            </div>
            {buildPlanTerm() && (
              <p className="mt-2 text-sm text-blue-400 font-mono bg-slate-800 px-3 py-1.5 rounded-lg inline-block">
                {buildPlanTerm()}
              </p>
            )}
          </div>
        )}

        {/* ─── Sum Assured (Health & General Insurance) ─── */}
        {(isHealth || isGeneral) && (
          <InputField
            label="Sum Assured (₹)"
            id="sumAssured"
            value={form.sumAssured}
            onChange={set('sumAssured')}
            placeholder="500000"
            type="number"
            icon={<CreditCard className="w-4 h-4" />}
          />
        )}

        {/* ─── Investment Value (Mutual Fund) ─── */}
        {isMF && (
          <InputField
            label="Investment Value (₹)"
            id="investmentValue"
            value={form.investmentValue}
            onChange={set('investmentValue')}
            placeholder="100000"
            type="number"
            icon={<CreditCard className="w-4 h-4" />}
          />
        )}

        {/* ─── Mode of Payment + Status ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Mode of Payment</label>
            <select
              value={form.modeOfPayment} onChange={set('modeOfPayment')}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {PAYMENT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
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

        {/* ─── ECS / Auto-Debit Toggle ─── */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <div>
            <p className="text-sm font-medium text-white">Auto-Debit / ECS</p>
            <p className="text-xs text-slate-500">Premium is deducted automatically via ECS</p>
          </div>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, isECS: !p.isECS }))}
            className={`relative w-12 h-7 rounded-full transition-all ${
              form.isECS ? 'bg-emerald-500' : 'bg-slate-600'
            }`}
          >
            <motion.div
              layout
              className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md"
              style={{ left: form.isECS ? '22px' : '2px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        {/* ─── Action Buttons ─── */}
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

/* ─── Reusable Input Field Component ─── */
function InputField({ label, id, value, onChange, placeholder, type = 'text', icon }: {
  label: string; id: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; type?: string; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        )}
        <input
          id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
          className={`w-full py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
            icon ? 'pl-10 pr-4' : 'px-4'
          }`}
        />
      </div>
    </div>
  );
}
