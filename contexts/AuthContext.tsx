'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, UserRole } from '@/types';

interface AuthContextValue {
  user: User | null;
  supabaseUser: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<any | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Safety timeout: if auth state doesn't load within 5 seconds, clear the loader
    const timeoutId = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn('Auth loading timed out. Force-clearing loading state.');
        }
        return false;
      });
    }, 5000);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      clearTimeout(timeoutId);
      const sessionUser = session?.user;
      setSupabaseUser(sessionUser || null);

      if (sessionUser) {
        // Set cookie for middleware
        document.cookie = `investo-auth-token=${session.access_token}; path=/; max-age=${3600 * 24 * 7}; SameSite=Lax; Secure`;

        if (lastUserIdRef.current === sessionUser.id) {
          setLoading(false);
          return;
        }
        lastUserIdRef.current = sessionUser.id;

        try {
          // Query user profile
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', sessionUser.id)
            .maybeSingle();

          if (error) throw error;

          if (profile) {
            setUser({
              id: sessionUser.id,
              email: sessionUser.email!,
              name: profile.name || sessionUser.email!.split('@')[0],
              role: (profile.role || 'agent') as UserRole,
              createdAt: new Date(profile.created_at || sessionUser.created_at),
            });
          } else {
            // Create user profile if not exists
            const name = sessionUser.user_metadata?.name || sessionUser.email!.split('@')[0];
            const newProfile = {
              id: sessionUser.id,
              name: name,
              role: 'agent',
            };
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert(newProfile);

            if (insertError) {
              console.error('Error creating user profile:', insertError);
            }

            setUser({
              id: sessionUser.id,
              email: sessionUser.email!,
              name: name,
              role: 'agent',
              createdAt: new Date(sessionUser.created_at),
            });
          }
        } catch (err) {
          console.error('Error fetching or creating user profile:', err);
          // Fallback user structure
          setUser({
            id: sessionUser.id,
            email: sessionUser.email!,
            name: sessionUser.email!.split('@')[0],
            role: 'agent',
            createdAt: new Date(sessionUser.created_at),
          });
        }
      } else {
        // Clear cookie
        document.cookie = `investo-auth-token=; path=/; max-age=0; SameSite=Lax; Secure`;
        lastUserIdRef.current = null;
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
