'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createCustomer } from '@/lib/database';
import { upsertCustomerInSearch } from '@/lib/search';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState } from 'react';

export default function NewCustomerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    setSaving(true);
    try {
      const id = await createCustomer({ ...form, agentId: user.id });
      await upsertCustomerInSearch({ id, ...form, agentId: user.id });
      toast.success('Customer added successfully!');
      router.push(`/customers/${id}`);
    } catch {
      toast.error('Failed to add customer');
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
        <h1 className="text-2xl font-bold text-white">Add New Customer</h1>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 space-y-5"
      >
        {[
          { label: 'Full Name *', id: 'name', type: 'text', placeholder: 'Rajesh Kumar' },
          { label: 'Mobile Number *', id: 'phone', type: 'tel', placeholder: '9876543210' },
          { label: 'Email Address', id: 'email', type: 'email', placeholder: 'rajesh@example.com' },
          { label: 'Address', id: 'address', type: 'text', placeholder: '123 Main St, Mumbai' },
        ].map(({ label, id, type, placeholder }) => (
          <div key={id}>
            <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
            <input
              id={id} type={type} value={form[id as keyof typeof form]}
              onChange={set(id)} placeholder={placeholder}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        ))}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
          <textarea
            id="notes" value={form.notes} onChange={set('notes')} rows={3}
            placeholder="Additional notes..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all">
            Cancel
          </button>
          <motion.button
            type="submit" disabled={saving} whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Add Customer'}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
