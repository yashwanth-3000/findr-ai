'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useMemo
} from 'react'
import { createBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { Company, CreateCompany } from '@/lib/supabase-types'
import { Session, SupabaseClient, User } from '@supabase/supabase-js'

// Define the shape of our auth context
interface AuthContextType {
  supabase: SupabaseClient
  user: User | null
  company: Company | null
  session: Session | null
  loading: boolean
  error: string | null
  signOut: () => Promise<boolean>
  refreshSession: () => Promise<void>
  resetAuthState: () => void
  signInWithGoogle: () => Promise<void>
  createCompanyProfile: (companyData: Partial<CreateCompany>) => Promise<boolean>
}

// Create the context with an initial empty value
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Define the provider component props
interface AuthProviderProps {
  children: ReactNode
}

// Create the AuthProvider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Use a memo to create the Supabase client only once
  const supabase = useMemo(() => createBrowserClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Use refs to track initialization and prevent multiple fetches
  const initializeRef = useRef(false)
  const companyFetchRef = useRef(false)
  
  const router = useRouter()

  // Function to get the company profile from Supabase
  const fetchCompanyProfile = async (userId: string) => {
    try {
      console.log('🔍 [fetchCompanyProfile] STEP 1: Starting fetch for user ID:', userId);
      console.log('🔍 [fetchCompanyProfile] STEP 2: Calling Supabase query...');
      
      let companyProfiles, error;
      try {
        // Query with reasonable timeout
        const queryPromise = supabase
          .from('companies')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout after 15 seconds')), 15000);
        });
        
        console.log('🔍 [fetchCompanyProfile] STEP 2.5: Waiting for query with 15s timeout...');
        const result = await Promise.race([queryPromise, timeoutPromise]);
        companyProfiles = (result as any).data;
        error = (result as any).error;
      } catch (timeoutError) {
        console.error('🔍 [fetchCompanyProfile] Query timed out:', timeoutError);
        // Don't return null immediately, try a fallback approach
        console.log('🔍 [fetchCompanyProfile] Attempting fallback query...');
        try {
          const fallbackResult = await supabase
            .from('companies')
            .select('*')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();
          
          if (fallbackResult.error) {
            console.error('❌ [fetchCompanyProfile] Fallback query failed:', fallbackResult.error);
            return null;
          }
          
          companyProfiles = fallbackResult.data ? [fallbackResult.data] : [];
          error = null;
        } catch (fallbackError) {
          console.error('❌ [fetchCompanyProfile] Fallback query exception:', fallbackError);
          return null;
        }
      }
      
      console.log('🔍 [fetchCompanyProfile] STEP 3: Query completed. Data:', companyProfiles, 'Error:', error);
      
      if (error) {
        console.log('❌ [fetchCompanyProfile] Error details:', error.code, error.message, error);
        console.error('Error fetching company profile:', error);
        return null;
      }
      
      if (!companyProfiles || companyProfiles.length === 0) {
        console.log('🔍 [fetchCompanyProfile] STEP 4: No company profile found, creating one automatically...');
        
        // Get current user data to create automatic profile
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (currentUser) {
          // Extract name from user metadata (Google OAuth provides this)
          const userName = currentUser.user_metadata?.full_name || 
                         currentUser.user_metadata?.name || 
                         currentUser.email?.split('@')[0] || 
                         'New Company';
          
          const companyData = {
            user_id: userId,
            company_name: `${userName}'s Company`,
            company_email: currentUser.email || '',
            company_website: null,
            company_description: null,
            company_logo_url: null,
            company_size: null,
            industry: null,
            location: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('🔍 [fetchCompanyProfile] STEP 5: Creating automatic company profile with data:', companyData);
          
          const { data: newProfile, error: createError } = await supabase
            .from('companies')
            .insert(companyData)
            .select('*')
            .single();
          
          if (createError) {
            console.error('❌ [fetchCompanyProfile] Failed to create automatic company profile:', createError);
            return null;
          }
          
          console.log('✅ [fetchCompanyProfile] STEP 6: Successfully created automatic company profile:', newProfile);
          return newProfile as Company;
        }
        
        console.log('❌ [fetchCompanyProfile] No current user found for auto-creation');
        return null;
      }
      
      console.log('✅ [fetchCompanyProfile] STEP 4: Found existing company profile:', companyProfiles[0]);
      return companyProfiles[0] as Company;
    } catch (err) {
      console.error('❌ [fetchCompanyProfile] Exception:', err);
      return null;
    }
  };
  
  // Helper to create a company profile
  const createCompanyProfile = async (companyData: Partial<CreateCompany>): Promise<boolean> => {
    try {
      if (!user) {
        console.error('No user available to create company profile');
        return false;
      }
      
      console.log('Creating company profile for user:', user.id);
      
      const now = new Date().toISOString();
      
      const profileData: CreateCompany = {
        user_id: user.id,
        company_name: companyData.company_name || 'New Company',
        company_email: companyData.company_email || user.email || '',
        company_website: companyData.company_website || null,
        company_description: companyData.company_description || null,
        company_logo_url: companyData.company_logo_url || null,
        company_size: companyData.company_size || null,
        industry: companyData.industry || null,
        location: companyData.location || null,
        created_at: now,
        updated_at: now
      };
      
      const { data, error } = await supabase
        .from('companies')
        .insert(profileData)
        .select('*')
        .single();
      
      if (error) {
        console.error('Failed to create company profile:', error);
        return false;
      }
      
      console.log('Created company profile:', data);
      setCompany(data as Company);
      return true;
    } catch (err) {
      console.error('Exception creating company profile:', err);
      return false;
    }
  };

  // Reset all auth state
  const resetAuthState = () => {
    console.log('Resetting auth state');
    setUser(null);
    setCompany(null);
    setSession(null);
    setError(null);
    setIsInitialized(false);
    initializeRef.current = false;
    companyFetchRef.current = false;
    
    // Also clear localStorage when resetting state
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  // Refresh the current session
  const refreshSession = async () => {
    try {
      console.log('Refreshing session');
      setLoading(true);
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        setError('Failed to refresh session');
        resetAuthState();
        return;
      }
      
      if (data.session) {
        console.log('Session refreshed successfully');
        setSession(data.session);
        setUser(data.user);
        
        // Fetch company profile after session refresh
        if (data.user && !companyFetchRef.current) {
          console.log('🔄 [refreshSession] About to fetch company profile for user:', data.user.id);
          companyFetchRef.current = true;
          const companyProfile = await fetchCompanyProfile(data.user.id);
          console.log('🔄 [refreshSession] Company profile result:', companyProfile);
          console.log('🔄 [refreshSession] companyFetchRef.current:', companyFetchRef.current);
          console.log('📊 [setState] Setting company state to:', companyProfile);
          setCompany(companyProfile);
          console.log('🔄 [refreshSession] Company state updated');
          companyFetchRef.current = false;
        }
      }
    } catch (err) {
      console.error('Exception during session refresh:', err);
      setError('Session refresh failed');
      resetAuthState();
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async (): Promise<boolean> => {
    console.log('Signing out user');
    
    // Clear state immediately
    setUser(null);
    setCompany(null);
    setSession(null);
    setError(null);
    
    // Clear storage immediately
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    // Don't wait for Supabase - just redirect
    window.location.href = '/';
    
    // Fire and forget the Supabase signout
    supabase.auth.signOut().catch(console.error);
    
    return true;
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      console.log('Initiating Google sign in');
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('Google sign in failed:', error);
        setError('Failed to sign in with Google');
      }
    } catch (err) {
      console.error('Exception during Google sign in:', err);
      setError('Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  // Initialize auth state
  const initializeAuth = async () => {
    try {
      console.log('Initializing auth');
      setLoading(true);
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Failed to get session:', sessionError);
        setError('Failed to get session');
        resetAuthState();
        return;
      }
      
      if (session) {
        console.log('Found existing session');
        setSession(session);
        setUser(session.user);
        
        // Fetch company profile for the user
        if (session.user && !companyFetchRef.current) {
          console.log('🚀 [initializeAuth] About to fetch company profile for user:', session.user.id);
          companyFetchRef.current = true;
          const companyProfile = await fetchCompanyProfile(session.user.id);
          console.log('🚀 [initializeAuth] Company profile result:', companyProfile);
          console.log('🚀 [initializeAuth] companyFetchRef.current:', companyFetchRef.current);
          console.log('📊 [setState] Setting company state to:', companyProfile);
          setCompany(companyProfile);
          console.log('🚀 [initializeAuth] Company state updated');
          companyFetchRef.current = false;
        }
      } else {
        console.log('No existing session found');
        resetAuthState();
      }
      
      setIsInitialized(true);
    } catch (err) {
      console.error('Exception during auth initialization:', err);
      setError('Auth initialization failed');
      resetAuthState();
    } finally {
      setLoading(false);
    }
  };

  // Set up auth state change listener
  const setupAuthListener = () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        try {
          setLoading(true);
          
          if (event === 'SIGNED_IN' && session) {
            console.log('User signed in, updating state');
            setSession(session);
            setUser(session.user);
            setError(null);
            
            // Fetch company profile for newly signed in user
            if (session.user && !companyFetchRef.current) {
              console.log('👤 [authListener] About to fetch company profile for user:', session.user.id);
              companyFetchRef.current = true;
              const companyProfile = await fetchCompanyProfile(session.user.id);
              console.log('👤 [authListener] Company profile result:', companyProfile);
              console.log('👤 [authListener] companyFetchRef.current:', companyFetchRef.current);
              console.log('📊 [setState] Setting company state to:', companyProfile);
              setCompany(companyProfile);
              console.log('👤 [authListener] Company state updated');
              companyFetchRef.current = false;
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out, clearing state');
            resetAuthState();
          } else if (event === 'TOKEN_REFRESHED' && session) {
            console.log('Token refreshed');
            setSession(session);
            setUser(session.user);
          }
        } catch (err) {
          console.error('Exception in auth state change handler:', err);
          setError('Auth state change failed');
        } finally {
          setLoading(false);
        }
      }
    );

    return subscription;
  };

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      if (initializeRef.current) return;
      
      initializeRef.current = true;
      await initializeAuth();
    };

    initialize();
    
    // Set up auth listener
    const subscription = setupAuthListener();
    
    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Create the context value
  const contextValue: AuthContextType = {
    supabase,
    user,
    company,
    session,
    loading,
    error,
    signOut,
    refreshSession,
    resetAuthState,
    signInWithGoogle,
    createCompanyProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 