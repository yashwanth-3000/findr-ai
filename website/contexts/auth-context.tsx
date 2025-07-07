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
      console.log('Fetching company profile for user ID:', userId);
      
      const { data: companyProfile, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          console.log('No company profile found for user');
          return null;
        }
        console.error('Error fetching company profile:', error);
        return null;
      }
      
      console.log('Found company profile:', companyProfile);
      return companyProfile as Company;
    } catch (err) {
      console.error('Exception fetching company profile:', err);
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
          companyFetchRef.current = true;
          const companyProfile = await fetchCompanyProfile(data.user.id);
          setCompany(companyProfile);
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
    try {
      console.log('Signing out user');
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out failed:', error);
        setError('Failed to sign out');
        return false;
      }
      
      resetAuthState();
      router.push('/');
      return true;
    } catch (err) {
      console.error('Exception during sign out:', err);
      setError('Sign out failed');
      return false;
    } finally {
      setLoading(false);
    }
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
          companyFetchRef.current = true;
          const companyProfile = await fetchCompanyProfile(session.user.id);
          setCompany(companyProfile);
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
              companyFetchRef.current = true;
              const companyProfile = await fetchCompanyProfile(session.user.id);
              setCompany(companyProfile);
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