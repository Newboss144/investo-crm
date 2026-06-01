import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = !!supabaseUrl && !!supabaseAnonKey && supabaseUrl.startsWith('http');

if (!isConfigured) {
  console.warn('Supabase credentials missing or invalid. Please check your environment variables.');
}

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : ({
      auth: {
        onAuthStateChange: (callback: any) => {
          // Trigger fallback immediately so the application doesn't get stuck on the loader
          if (typeof window !== 'undefined') {
            setTimeout(() => callback('SIGNED_OUT', null), 100);
          }
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
        signInWithPassword: async () => {
          throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Netlify.');
        },
        signOut: async () => {},
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: new Error('Supabase is not configured.') }),
            order: () => ({
              limit: async () => ({ data: [], error: new Error('Supabase is not configured.') }),
            }),
          }),
        }),
      }),
    } as any);
