'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Users, Loader2, Bell, Calendar, ShieldAlert,
  FileWarning, Sparkles, Clock, CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { searchCustomers } from '@/lib/search';
import { getAllPoliciesForAgent, getAllDocumentsForAgent } from '@/lib/database';
import { format } from 'date-fns';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  customerId: string;
  type: 'maturity' | 'status' | 'pending' | 'kyc' | 'cross_sell';
}

export default function TopBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string; phone: string; email: string }>>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Click outside for both notifications and search dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || !user) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      const hits = await searchCustomers(query, user.id);
      setResults(
        hits.map((h) => ({
          id: h.document.id,
          name: h.document.name,
          phone: h.document.phone,
          email: h.document.email,
        }))
      );
      setLoading(false);
    }, 250);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [query, user]);

  // Fetch alerts/notifications dynamically
  const fetchAlerts = async () => {
    if (!user) return;
    try {
      // 1. Fetch policies and documents
      const [policies, documents] = await Promise.all([
        getAllPoliciesForAgent(user.id),
        getAllDocumentsForAgent(user.id),
      ]);

      // 2. Load preferences
      let prefs = {
        maturityAlerts: true,
        pendingAlerts: true,
        kycAlerts: true,
        crossSellAlerts: true,
      };
      const savedPrefs = localStorage.getItem('investo_notification_prefs');
      if (savedPrefs) {
        try { prefs = JSON.parse(savedPrefs); } catch {}
      }

      // 3. Load dismissed lists
      let dismissed: string[] = [];
      const savedDismissed = localStorage.getItem('investo_dismissed_notifications');
      if (savedDismissed) {
        try { dismissed = JSON.parse(savedDismissed); } catch {}
      }

      const list: NotificationItem[] = [];
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Aggregate customers from policies
      const customerPolicies = new Map<string, { name: string; activeCount: number; policies: any[] }>();
      for (const p of policies) {
        const entry = customerPolicies.get(p.customerId) || { name: p.customerName, activeCount: 0, policies: [] };
        entry.policies.push(p);
        if (p.status === 'active') {
          entry.activeCount += 1;
        }
        customerPolicies.set(p.customerId, entry);
      }

      // Map documents by customerId
      const customerDocs = new Map<string, string[]>();
      for (const d of documents) {
        const types = customerDocs.get(d.customerId) || [];
        types.push(d.type);
        customerDocs.set(d.customerId, types);
      }

      for (const p of policies) {
        // Rule 1: LIC Maturing within 30 days
        if (prefs.maturityAlerts && p.type === 'lic' && p.maturityDate) {
          const matDate = new Date(p.maturityDate);
          if (!isNaN(matDate.getTime()) && matDate > now && matDate <= thirtyDaysFromNow) {
            const diffDays = Math.ceil((matDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
            const id = `maturing-${p.id}`;
            if (!dismissed.includes(id)) {
              list.push({
                id,
                title: 'LIC Maturing Soon',
                message: `${p.customerName}'s policy ${p.policyNo} matures in ${diffDays} days (${format(matDate, 'dd MMM yyyy')}).`,
                customerId: p.customerId,
                type: 'maturity',
              });
            }
          }
        }

        // Rule 2: Expired Status
        if (p.status === 'expired') {
          const id = `expired-${p.id}`;
          if (!dismissed.includes(id)) {
            list.push({
              id,
              title: 'Policy Expired',
              message: `${p.provider} policy ${p.policyNo} for ${p.customerName} has expired.`,
              customerId: p.customerId,
              type: 'status',
            });
          }
        }

        // Rule 3: Lapsed Status
        if (p.status === 'lapsed') {
          const id = `lapsed-${p.id}`;
          if (!dismissed.includes(id)) {
            list.push({
              id,
              title: 'Policy Lapsed',
              message: `${p.provider} policy ${p.policyNo} for ${p.customerName} has lapsed.`,
              customerId: p.customerId,
              type: 'status',
            });
          }
        }

        // Rule 4: Pending over 7 days
        if (prefs.pendingAlerts && p.status === 'pending') {
          const createdDate = new Date(p.createdAt);
          if (!isNaN(createdDate.getTime()) && createdDate < sevenDaysAgo) {
            const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (24 * 60 * 60 * 1000));
            const id = `pending-${p.id}`;
            if (!dismissed.includes(id)) {
              list.push({
                id,
                title: 'Action Required',
                message: `Policy ${p.policyNo} for ${p.customerName} has been pending approval for ${diffDays} days.`,
                customerId: p.customerId,
                type: 'pending',
              });
            }
          }
        }
      }

      // Rule 5: KYC Missing (Customers with active policies but no Aadhaar/PAN)
      if (prefs.kycAlerts) {
        for (const [custId, info] of customerPolicies.entries()) {
          if (info.activeCount > 0) {
            const docs = customerDocs.get(custId) || [];
            const hasAadhaar = docs.includes('aadhaar');
            const hasPan = docs.includes('pan');
            if (!hasAadhaar || !hasPan) {
              const missing = [];
              if (!hasAadhaar) missing.push('Aadhaar');
              if (!hasPan) missing.push('PAN');
              const id = `kyc-${custId}`;
              if (!dismissed.includes(id)) {
                list.push({
                  id,
                  title: 'Missing KYC',
                  message: `${info.name} has active policies but is missing: ${missing.join(' & ')}.`,
                  customerId: custId,
                  type: 'kyc',
                });
              }
            }
          }
        }
      }

      // Rule 6: Cross-Sell Opportunity (Customers with MF/LIC but no Health Insurance)
      if (prefs.crossSellAlerts) {
        for (const [custId, info] of customerPolicies.entries()) {
          const hasInvestments = info.policies.some((p) => p.type === 'mutual_fund' || p.type === 'lic');
          const hasHealth = info.policies.some((p) => p.type === 'health');
          if (hasInvestments && !hasHealth) {
            const id = `cross-${custId}`;
            if (!dismissed.includes(id)) {
              list.push({
                id,
                title: 'Cross-Sell Opportunity',
                message: `${info.name} has active investments but no Health Insurance coverage.`,
                customerId: custId,
                type: 'cross_sell',
              });
            }
          }
        }
      }

      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Listen to storage events so changes in Settings update the TopBar notifications instantly
    window.addEventListener('storage', fetchAlerts);
    return () => window.removeEventListener('storage', fetchAlerts);
  }, [user]);

  // Dismiss a notification
  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let dismissed: string[] = [];
    const saved = localStorage.getItem('investo_dismissed_notifications');
    if (saved) {
      try { dismissed = JSON.parse(saved); } catch {}
    }

    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem('investo_dismissed_notifications', JSON.stringify(dismissed));
    }

    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Mark all as read (Clear all)
  const clearAllNotifications = () => {
    let dismissed: string[] = [];
    const saved = localStorage.getItem('investo_dismissed_notifications');
    if (saved) {
      try { dismissed = JSON.parse(saved); } catch {}
    }

    const newDismissed = [...dismissed];
    notifications.forEach((n) => {
      if (!newDismissed.includes(n.id)) {
        newDismissed.push(n.id);
      }
    });

    localStorage.setItem('investo_dismissed_notifications', JSON.stringify(newDismissed));
    setNotifications([]);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'maturity':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-sky-400" />;
      case 'kyc':
        return <FileWarning className="w-4 h-4 text-red-400" />;
      case 'cross_sell':
        return <Sparkles className="w-4 h-4 text-blue-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
    }
  };

  const getAlertColors = (type: string) => {
    switch (type) {
      case 'maturity':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'pending':
        return 'bg-sky-500/10 border-sky-500/20';
      case 'kyc':
        return 'bg-red-500/10 border-red-500/20';
      case 'cross_sell':
        return 'bg-blue-500/10 border-blue-500/20';
      default:
        return 'bg-rose-500/10 border-rose-500/20';
    }
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-6 gap-4 flex-shrink-0">
      {/* Search bar */}
      <div ref={searchContainerRef} className="flex-1 max-w-xl relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search customers & policies... (⌘K)"
            className="w-full pl-10 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown search results */}
        <AnimatePresence>
          {open && query.trim() && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              {loading ? (
                <div className="flex items-center gap-2 px-4 py-3 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-3 text-slate-500 text-sm">No results found</div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  <p className="px-4 py-2 text-xs text-slate-500 font-medium uppercase tracking-wider border-b border-slate-800">
                    Search Results
                  </p>
                  {results.map((r) => (
                    <Link
                      key={r.id}
                      href={`/customers/${r.id}`}
                      onClick={() => { setOpen(false); setQuery(''); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{r.name}</p>
                        <p className="text-xs text-slate-400 truncate">{r.phone} · {r.email}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications bell */}
      <div ref={notificationsRef} className="relative ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-900" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <p className="font-semibold text-white text-sm">Notifications</p>
                  {notifications.length > 0 ? (
                    <button
                      onClick={clearAllNotifications}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Clear All
                    </button>
                  ) : null}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      All clear! No alerts.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {notifications.map((n) => (
                        <div key={n.id} className="relative group/item flex gap-3 p-3 hover:bg-slate-800/60 transition-colors">
                          <Link
                            href={`/customers/${n.customerId}`}
                            onClick={() => setShowNotifications(false)}
                            className="flex gap-3 flex-1 text-left min-w-0"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${getAlertColors(n.type)}`}>
                              {getAlertIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                              <p className="text-xs font-semibold text-white uppercase tracking-wider">{n.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed break-words">{n.message}</p>
                            </div>
                          </Link>
                          {/* Dismiss item button */}
                          <button
                            onClick={(e) => dismissNotification(n.id, e)}
                            className="absolute right-2.5 top-2.5 p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 rounded transition-all cursor-pointer opacity-0 group-hover/item:opacity-100"
                            title="Dismiss alert"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
