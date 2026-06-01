'use client';

import { deletePolicy } from '@/lib/database';
import { toast } from 'sonner';
import WhatsAppReminderButton from './WhatsAppReminderButton';
import { useState } from 'react';
import { Trash2, Loader2, ExternalLink, Calendar, IndianRupee, CreditCard, Repeat } from 'lucide-react';
import Link from 'next/link';
import type { Policy } from '@/types';
import { format } from 'date-fns';

const TYPE_CONFIG = {
  lic: { label: 'LIC', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  health: { label: 'Health Insurance', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  general: { label: 'General Insurance', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  mutual_fund: { label: 'Mutual Fund', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

const STATUS_CONFIG = {
  active: { label: 'Active', css: 'status-active' },
  matured: { label: 'Matured', css: 'status-matured' },
  lapsed: { label: 'Lapsed', css: 'status-lapsed' },
  pending: { label: 'Pending', css: 'status-pending' },
};

const MODE_LABELS: Record<string, string> = {
  yearly: 'Yearly',
  half_yearly: 'Half-Yearly',
  quarterly: 'Quarterly',
  monthly: 'Monthly',
};

interface PolicyCardProps {
  policy: Policy;
  customerId: string;
  onDeleted: () => void;
  showCustomerLink?: boolean;
  customerName?: string;
  customerPhone?: string;
}

export default function PolicyCard({
  policy,
  customerId,
  onDeleted,
  showCustomerLink,
  customerName,
  customerPhone,
}: PolicyCardProps) {
  const [deleting, setDeleting] = useState(false);
  const typeConfig = TYPE_CONFIG[policy.type];
  const statusConfig = STATUS_CONFIG[policy.status] || STATUS_CONFIG.active;
  const name = customerName || (policy as any).customerName;
  const phone = customerPhone || (policy as any).customerPhone;

  const handleDelete = async () => {
    if (!confirm(`Delete policy ${policy.policyNo}?`)) return;
    setDeleting(true);
    try {
      await deletePolicy(policy.id);
      onDeleted();
      toast.success('Policy deleted');
    } catch {
      toast.error('Failed to delete policy');
    } finally {
      setDeleting(false);
    }
  };

  const isLic = policy.type === 'lic';
  const isHealth = policy.type === 'health';
  const isGeneral = policy.type === 'general';
  const isMF = policy.type === 'mutual_fund';

  return (
    <div className="glass rounded-2xl p-4 card-hover group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.css}`}>
              {statusConfig.label}
            </span>
            {policy.isECS && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                ECS
              </span>
            )}
            {showCustomerLink && (
              <Link
                href={`/customers/${customerId}`}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs text-slate-400 hover:text-blue-400 bg-slate-800 transition-colors"
              >
                <ExternalLink className="w-3 h-3 text-slate-500" />
                {(policy as any).customerName || 'View Customer'}
              </Link>
            )}
          </div>

          {/* Policy number + plan-term */}
          <div className="flex items-center gap-3 flex-wrap">
            <p className="font-semibold text-white text-lg">{policy.policyNo}</p>
            {isLic && policy.planTerm && (
              <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                {policy.planTerm}
              </span>
            )}
          </div>

          {/* Details row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {policy.premium > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <IndianRupee className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">Premium:</span>
                <span className="text-white font-medium">₹{policy.premium.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Sum Assured for Health & General */}
            {(isHealth || isGeneral) && policy.sumAssured > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">Sum Assured:</span>
                <span className="text-emerald-400 font-medium">₹{policy.sumAssured.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Investment Value for Mutual Fund */}
            {isMF && policy.investmentValue > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">Value:</span>
                <span className="text-emerald-400 font-medium">₹{policy.investmentValue.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Mode of Payment */}
            {policy.modeOfPayment && (
              <div className="flex items-center gap-1 text-sm">
                <Repeat className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">Mode:</span>
                <span className="text-white font-medium">{MODE_LABELS[policy.modeOfPayment] || policy.modeOfPayment}</span>
              </div>
            )}

            {/* DOC */}
            {policy.doc && !isNaN(Date.parse(policy.doc)) && (
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">DOC:</span>
                <span className="text-white font-medium">{format(new Date(policy.doc), 'dd MMM yyyy')}</span>
              </div>
            )}

            {/* Maturity Date – LIC only */}
            {isLic && policy.maturityDate && !isNaN(Date.parse(policy.maturityDate)) && (
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">Matures:</span>
                <span className="text-white font-medium">{format(new Date(policy.maturityDate), 'dd MMM yyyy')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isLic && name && phone && (
            <WhatsAppReminderButton
              clientName={name}
              clientPhone={phone}
              policyNumber={policy.policyNo}
            />
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 opacity-100 lg:opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all"
          >
            {deleting ? <Loader2 className="w-4 h-4 text-red-400 animate-spin" /> : <Trash2 className="w-4 h-4 text-red-400" />}
          </button>
        </div>
      </div>
    </div>
  );
}
