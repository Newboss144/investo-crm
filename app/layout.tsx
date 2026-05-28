import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'INVESTO — Fintech CRM',
  description:
    'Professional CRM for investment agents to manage customer portfolios, insurance policies, and KYC documents.',
  keywords: 'fintech, CRM, investment, insurance, LIC, mutual funds, KYC',
  openGraph: {
    title: 'INVESTO — Fintech CRM',
    description: 'Manage customer investments, policies, and KYC with speed and clarity.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
