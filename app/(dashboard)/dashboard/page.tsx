'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, Shield, TrendingUp, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardStats } from '@/lib/database';

interface Stats {
  totalCustomers: number;
  totalPolicies: number;
  activePolicies: number;
  totalDocuments: number;
}

const statCards = (stats: Stats) => [
  {
    label: 'Total Customers',
    value: stats.totalCustomers,
    icon: Users,
    color: 'from-blue-500 to-blue-700',
    glow: 'shadow-blue-500/20',
    href: '/customers',
  },
  {
    label: 'Total Policies',
    value: stats.totalPolicies,
    icon: FileText,
    color: 'from-violet-500 to-violet-700',
    glow: 'shadow-violet-500/20',
    href: '/policies',
  },
  {
    label: 'Active Policies',
    value: stats.activePolicies,
    icon: TrendingUp,
    color: 'from-emerald-500 to-emerald-700',
    glow: 'shadow-emerald-500/20',
    href: '/policies',
  },
  {
    label: 'KYC Documents',
    value: stats.totalDocuments,
    icon: Shield,
    color: 'from-amber-500 to-amber-700',
    glow: 'shadow-amber-500/20',
    href: '/documents',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    totalPolicies: 0,
    activePolicies: 0,
    totalDocuments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats(user.id);
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const cards = statCards(stats);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good morning, <span className="text-blue-400">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">Here&apos;s your portfolio at a glance</p>
        </div>
        <Link
          href="/customers/new"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/25 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </Link>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link href={card.href}>
              <div className={`glass rounded-2xl p-5 card-hover cursor-pointer group shadow-xl ${card.glow}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
                {loading ? (
                  <div className="skeleton h-8 w-16 mb-1" />
                ) : (
                  <p className="text-3xl font-bold text-white mb-1">{card.value.toLocaleString()}</p>
                )}
                <p className="text-sm text-slate-400">{card.label}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Add Customer', href: '/customers/new', icon: Users, color: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20' },
            { label: 'View Policies', href: '/policies', icon: FileText, color: 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border-violet-500/20' },
            { label: 'Upload KYC', href: '/documents', icon: Shield, color: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20' },
            { label: 'All Customers', href: '/customers', icon: TrendingUp, color: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${action.color}`}
            >
              <action.icon className="w-6 h-6" />
              <span className="text-sm font-medium text-slate-200">{action.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
