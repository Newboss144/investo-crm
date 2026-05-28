'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Plus, Search, Download, Upload, Phone, Mail, ChevronRight,
  Users, Loader2, MoreVertical, Trash2, Edit3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCustomers, deleteCustomer, createCustomer } from '@/lib/database';
import { exportCustomersToCSV, parseCustomersCSV, getCSVTemplate } from '@/lib/csv';
import { upsertCustomerInSearch, deleteCustomerFromSearch } from '@/lib/search';
import { toast } from 'sonner';
import type { Customer } from '@/types';
import { format } from 'date-fns';

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadCustomers();
  }, [user]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(customers);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        customers.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.email.toLowerCase().includes(q)
        )
      );
    }
  }, [search, customers]);

  const loadCustomers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { customers: data } = await getCustomers(user.id, 100);
      setCustomers(data);
      setFiltered(data);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteCustomer(id);
      await deleteCustomerFromSearch(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      toast.success(`${name} deleted`);
    } catch {
      toast.error('Failed to delete customer');
    } finally {
      setDeleting(null);
    }
  };

  const handleExport = () => {
    exportCustomersToCSV(filtered);
    toast.success(`Exported ${filtered.length} customers`);
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const { valid, errors } = await parseCustomersCSV(file);
      if (errors.length > 0) {
        toast.error(`${errors.length} rows had errors:\n${errors.slice(0, 3).join('\n')}`);
      }
      if (valid.length === 0) {
        toast.error('No valid rows to import');
        return;
      }

      let imported = 0;
      for (const row of valid) {
        const id = await createCustomer({ ...row, agentId: user!.id });
        await upsertCustomerInSearch({ id, ...row, agentId: user!.id });
        imported++;
      }
      toast.success(`Imported ${imported} customers!`);
      await loadCustomers();
      setShowImportModal(false);
    } catch {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = getCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'investo-import-template.csv';
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Customers
          </h1>
          <p className="text-slate-400 mt-0.5">{customers.length} total customers</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <Link
            href="/customers/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or email..."
          className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-300 font-medium text-lg">No customers found</p>
          <p className="text-slate-500 mt-1">
            {search ? 'Try a different search term' : 'Add your first customer to get started'}
          </p>
          {!search && (
            <Link
              href="/customers/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {filtered.map((customer, i) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-2xl p-4 card-hover group"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white truncate">{customer.name}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      {/* Phone → WhatsApp link */}
                      <a
                        href={`https://wa.me/91${customer.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Open WhatsApp"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {customer.phone}
                      </a>
                      {customer.email && (
                        <a
                          href={`mailto:${customer.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-sm text-slate-400 hover:text-blue-400 transition-colors truncate"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">{customer.email}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Updated date */}
                  <p className="text-xs text-slate-600 hidden md:block flex-shrink-0">
                    {format(customer.updatedAt, 'dd MMM yyyy')}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/customers/${customer.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-slate-400" />
                    </Link>
                    <button
                      onClick={() => handleDelete(customer.id, customer.name)}
                      disabled={deleting === customer.id}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      {deleting === customer.id ? (
                        <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-400" />
                      )}
                    </button>
                  </div>

                  <Link
                    href={`/customers/${customer.id}`}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Import CSV Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-white mb-2">Import Customers via CSV</h3>
              <p className="text-slate-400 text-sm mb-4">
                Upload a CSV file with columns: name, phone, email, address, notes
              </p>

              <button
                onClick={downloadTemplate}
                className="w-full mb-4 py-2 text-sm text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-xl transition-colors"
              >
                📥 Download Template CSV
              </button>

              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-blue-500/50 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImport(f);
                  }}
                />
                {importing ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Importing...
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                    <p className="text-sm text-slate-400">Click to select CSV file</p>
                  </>
                )}
              </label>

              <button
                onClick={() => setShowImportModal(false)}
                className="w-full mt-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
