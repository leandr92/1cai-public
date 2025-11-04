import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName?: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount (one-time check)
  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Load profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          setProfile(profileData);
        }
      } finally {
        setLoading(false);
      }
    }
    loadUser();

    // Set up auth listener - KEEP SIMPLE, avoid any async operations in callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // NEVER use any async operations in callback
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load profile when user changes
  useEffect(() => {
    async function loadProfile() {
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setProfile(profileData);
      } else {
        setProfile(null);
      }
    }
    
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Sign in method
  async function signIn(email: string, password: string) {
    const result = await supabase.auth.signInWithPassword({ email, password });
    
    if (result.data.user) {
      // Update last_seen
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('user_id', result.data.user.id);
    }
    
    return result;
  }

  // Sign up method
  async function signUp(email: string, password: string, fullName?: string) {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (result.data.user) {
      // Create profile
      await supabase
        .from('profiles')
        .insert({
          user_id: result.data.user.id,
          email: email,
          full_name: fullName || '',
          role: 'user',
          status: 'active',
        });
    }

    return result;
  }

  // Sign out method
  async function signOut() {
    if (user) {
      // Update last_seen before signing out
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('user_id', user.id);
    }
    
    await supabase.auth.signOut();
  }

  // Update profile method
  async function updateProfile(updates: any) {
    // Verify current user identity
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      throw new Error('Ошибка аутентификации. Пожалуйста, войдите снова.');
    }

    // Update user profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', currentUser.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Ошибка обновления профиля:', error);
      throw error;
    }

    setProfile(data);
    return data;
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
