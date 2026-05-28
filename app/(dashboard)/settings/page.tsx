'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Preferences {
  maturityAlerts: boolean;
  pendingAlerts: boolean;
  kycAlerts: boolean;
  crossSellAlerts: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Preferences>({
    maturityAlerts: true,
    pendingAlerts: true,
    kycAlerts: true,
    crossSellAlerts: true,
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('investo_notification_prefs');
    if (saved) {
      try {
        setPrefs(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse preferences', e);
      }
    }
  }, []);

  // Save preference
  const togglePref = (key: keyof Preferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem('investo_notification_prefs', JSON.stringify(updated));
    // Trigger storage event so TopBar updates instantly
    window.dispatchEvent(new Event('storage'));
    toast.success('Preferences updated');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6 text-slate-400" />
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Agent Profile</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-500/20">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold">{user?.name}</p>
              <p className="text-slate-400 text-sm">{user?.email}</p>
              <span className="mt-1.5 inline-block px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-full capitalize font-medium">
                {user?.role}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Preferences card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                key: 'maturityAlerts',
                title: 'LIC Policy Maturity',
                desc: 'Alerts when an LIC policy is maturing within the next 30 days.',
              },
              {
                key: 'pendingAlerts',
                title: 'Long-Pending Policies',
                desc: 'Warnings for policies remaining in pending status for over 7 days.',
              },
              {
                key: 'kycAlerts',
                title: 'Missing KYC Warnings',
                desc: 'Alerts when active clients do not have PAN or Aadhaar uploaded.',
              },
              {
                key: 'crossSellAlerts',
                title: 'Cross-Sell Gaps',
                desc: 'Identifies active clients with mutual funds but no health or life insurance.',
              },
            ].map((p) => {
              const active = prefs[p.key as keyof Preferences];
              return (
                <div key={p.key} className="flex items-center justify-between gap-4 py-3 border-b border-slate-800 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{p.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{p.desc}</p>
                  </div>
                  <button
                    onClick={() => togglePref(p.key as keyof Preferences)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                      active ? 'bg-blue-600' : 'bg-slate-800'
                    }`}
                  >
                    <motion.div
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-5 h-5 bg-white rounded-full shadow"
                      animate={{ x: active ? 20 : 0 }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
