'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getCustomer, createCustomer, updateCustomer } from '@/lib/database';
import { upsertCustomerInSearch } from '@/lib/search';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export default function CustomerFormPage() {
  const params = useParams<{ id?: string }>();
  const isEdit = !!params?.id && params.id !== 'new';
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState<FormData>({ name: '', phone: '', email: '', address: '', notes: '' });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && params?.id) {
      getCustomer(params.id).then((c) => {
        if (c) setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address, notes: c.notes });
        setLoading(false);
      });
    }
  }, [isEdit, params?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && params?.id) {
        await updateCustomer(params.id, form);
        await upsertCustomerInSearch({ id: params.id, ...form, agentId: user.id });
        toast.success('Customer updated!');
        router.push(`/customers/${params.id}`);
      } else {
        const id = await createCustomer({ ...form, agentId: user.id });
        await upsertCustomerInSearch({ id, ...form, agentId: user.id });
        toast.success('Customer added!');
        router.push(`/customers/${id}`);
      }
    } catch {
      toast.error('Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-white">{isEdit ? 'Edit Customer' : 'Add Customer'}</h1>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 space-y-5"
      >
        <Field label="Full Name *" id="name" value={form.name} onChange={set('name')} placeholder="Rajesh Kumar" />
        <Field label="Mobile Number *" id="phone" value={form.phone} onChange={set('phone')} placeholder="9876543210" type="tel" />
        <Field label="Email Address" id="email" value={form.email} onChange={set('email')} placeholder="rajesh@example.com" type="email" />
        <Field label="Address" id="address" value={form.address} onChange={set('address')} placeholder="123 Main St, Mumbai, Maharashtra" />
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={set('notes')}
            rows={3}
            placeholder="Any additional notes about this customer..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all">
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={saving}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Saving...' : isEdit ? 'Update Customer' : 'Add Customer'}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}

function Field({
  label, id, value, onChange, placeholder, type = 'text',
}: {
  label: string; id: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <input
        id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
    </div>
  );
}
