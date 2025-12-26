import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { roleService } from '@/integrations/supabase/roleService';
import { isAuthAllowed, isPasswordResetAllowed } from '@/lib/rateLimiter';

// Check if supabase client is available
if (!supabase) {
  console.warn('Supabase client is not available. Authentication features will be disabled.');
}

type AppRole = 'admin' | 'agent' | 'user';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (userId: string) => {
    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping user data fetch');
      return;
    }

    try {
      // Get user data from profiles table
      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name, phone, address, avatar_url')
        .eq('id', userId)
        .maybeSingle();
        
      if (userData) {
        setProfile({
          id: userId,
          email: user?.email || '', // Get email from auth user object
          full_name: userData.full_name || '',
          phone: userData.phone || '',
          address: userData.address || '',
          avatar_url: userData.avatar_url || ''
        });
      } else {
        // If no profile exists, create a minimal profile with just email from auth
        setProfile({
          id: userId,
          email: user?.email || '',
          full_name: '',
          phone: '',
          address: '',
          avatar_url: ''
        });
      }

      // Get user role using role service
      const role = await roleService.getUserRole(userId);
      
      if (role) {
        setRole(role);
      } else {
        // If no role found, default to 'user'
        setRole('user');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setRole('user');
    }
  }, [user?.email]);

  useEffect(() => {
    // Skip if supabase is not available
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change callback
          // This is recommended in Supabase docs to prevent deadlocks
          setTimeout(() => {
            if (mounted) {
              fetchUserData(session.user.id);
            }
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserData(session.user.id);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initialize auth
    initAuth();

    return () => {
      mounted = false;
      // Only unsubscribe if supabase is available
      if (supabase) {
        subscription.unsubscribe();
      }
    };
  }, [fetchUserData]);

  const signIn = async (email: string, password: string) => {
    // Return early if supabase is not available
    if (!supabase) {
      return { error: new Error('Authentication is not available') };
    }

    // Rate limiting check
    if (!isAuthAllowed(email)) {
      return { error: new Error('Too many authentication attempts. Please try again later.') };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    // Return early if supabase is not available
    if (!supabase) {
      return { error: new Error('Authentication is not available') };
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Return early if supabase is not available
    if (!supabase) {
      setProfile(null);
      setRole(null);
      return;
    }

    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

