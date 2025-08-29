import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../lib/axios';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  isRedirecting: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Initialize user from localStorage if available
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Track if we're in the process of checking auth to prevent duplicates
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  
  // Use refs to prevent stale closure issues
  const locationRef = useRef(location);
  const userRef = useRef(user);
  const authCheckedRef = useRef(authChecked);
  
  // Helper functions for localStorage
  const saveUserToStorage = (userData: User | null) => {
    try {
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.warn('Failed to save user to localStorage:', error);
    }
  };
  
  // Update refs when values change
  useEffect(() => {
    locationRef.current = location;
  }, [location]);
  
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  
  useEffect(() => {
    authCheckedRef.current = authChecked;
  }, [authChecked]);

  // Separate navigation logic to prevent re-render loops
  const handleLoginRedirect = useCallback(() => {
    if (locationRef.current.pathname === '/login') {
      setIsRedirecting(true);
      setTimeout(() => {
        navigate('/admin/dashboard');
        setIsRedirecting(false);
      }, 100);
    }
  }, [navigate]);

  const checkAuth = useCallback(async () => {
    // Skip auth check if already checked or in progress
    if (authCheckedRef.current || isCheckingAuth) return;
    
    setIsCheckingAuth(true);
    
    // Skip auth check for public pages that don't need authentication
    const isPublicPage = !locationRef.current.pathname.startsWith('/admin');
    const isLoginPage = locationRef.current.pathname === '/login';
    
    // console.log(`🔍 checkAuth callback - Page: ${locationRef.current.pathname}, isPublic: ${isPublicPage}, isLogin: ${isLoginPage}`);
    
    // For public pages, just mark as checked without making API call
    if (isPublicPage && !isLoginPage) {
      // console.log('✅ Skipping auth check for public page (callback)');
      setIsLoading(false);
      setAuthChecked(true);
      setUser(null);
      saveUserToStorage(null);
      setIsCheckingAuth(false);
      return;
    }
    
    // Retry mechanism for network errors
    let retries = 0;
    const maxRetries = 3;
    
    const attemptAuthCheck = async (): Promise<void> => {
      try {
        setIsLoading(true);
        
        const response = await api.get('/api/me');
        const userData = response.data;
        setUser(userData);
        saveUserToStorage(userData);
        
        // Handle redirect after setting user
        setTimeout(() => {
          handleLoginRedirect();
        }, 50);
        
      } catch (error: unknown) {
        console.error(`Auth check error (attempt ${retries + 1}):`, error);
        
        // Check if it's a network error or server error that we should retry
        const isNetworkError = !error || 
          (typeof error === 'object' && !('response' in error)) ||
          (typeof error === 'object' && 'response' in error && 
           error.response && typeof error.response === 'object' && 
           'status' in error.response && 
           (typeof error.response.status === 'number' && 
            (error.response.status >= 500 || error.response.status === 0)));
        
        // Retry on network errors
        if (isNetworkError && retries < maxRetries) {
          retries++;
          console.log(`Retrying auth check in 1 second... (${retries}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return attemptAuthCheck();
        }
        
        // Handle authentication errors
        const isAuthError = error && 
          typeof error === 'object' && 
          'response' in error && 
          error.response && 
          typeof error.response === 'object' && 
          'status' in error.response && 
          typeof error.response.status === 'number' &&
          error.response.status === 401;
        
        if (isAuthError) {
          console.log('Auth check failed - user not authenticated');
          setUser(null);
          saveUserToStorage(null);
          
          // Only redirect to login for admin pages
          if (!isLoginPage && !isPublicPage) {
            setTimeout(() => {
              navigate('/login');
            }, 100);
          }
        } else {
          // For non-auth errors, keep existing user state if we had one
          console.log('Auth check failed due to network/server error, keeping existing state');
          // Don't clear user state on network errors - keep existing user or load from localStorage
          if (!userRef.current) {
            try {
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                console.log('Restored user from localStorage due to network error');
              }
            } catch (e) {
              console.warn('Failed to restore user from localStorage:', e);
            }
          }
        }
      }
    };
    
    try {
      await attemptAuthCheck();
    } finally {
      setIsLoading(false);
      setAuthChecked(true);
      setIsCheckingAuth(false);
    }
  }, [navigate, handleLoginRedirect, isCheckingAuth]);

  // Add timeout protection for loading state
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading && !authChecked) {
        console.warn('Auth check timeout - forcing completion');
        setIsLoading(false);
        setAuthChecked(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeoutId);
  }, [isLoading, authChecked]);

  // Only check auth once on mount - removed checkAuth from dependencies to prevent loops
  useEffect(() => {
    let mounted = true;
    
    const performAuthCheck = async () => {
      if (authCheckedRef.current || !mounted || isCheckingAuth) return;
      
      setIsCheckingAuth(true);
      
      // Skip auth check for public pages that don't need authentication
      const isPublicPage = !locationRef.current.pathname.startsWith('/admin');
      const isLoginPage = locationRef.current.pathname === '/login';
      
      // console.log(`🔍 Auth check - Page: ${locationRef.current.pathname}, isPublic: ${isPublicPage}, isLogin: ${isLoginPage}`);
      
      // For public pages, just mark as checked without making API call
      if (isPublicPage && !isLoginPage) {
        // console.log('✅ Skipping auth check for public page');
        if (mounted) {
          setIsLoading(false);
          setAuthChecked(true);
          setUser(null);
          saveUserToStorage(null);
          setIsCheckingAuth(false);
        }
        return;
      }
      
      // Retry mechanism for network errors
      let retries = 0;
      const maxRetries = 3;
      
      const attemptInitialAuthCheck = async (): Promise<void> => {
        try {
          setIsLoading(true);
          
          const response = await api.get('/api/me');
          
          if (mounted) {
            const userData = response.data;
            setUser(userData);
            saveUserToStorage(userData);
            
            // Handle redirect after setting user
            setTimeout(() => {
              if (mounted && locationRef.current.pathname === '/login') {
                setIsRedirecting(true);
                setTimeout(() => {
                  if (mounted) {
                    navigate('/admin/dashboard');
                    setIsRedirecting(false);
                  }
                }, 100);
              }
            }, 50);
          }
          
        } catch (error: unknown) {
          console.error(`Initial auth check error (attempt ${retries + 1}):`, error);
          
          // Check if it's a network error or server error that we should retry
          const isNetworkError = !error || 
            (typeof error === 'object' && !('response' in error)) ||
            (typeof error === 'object' && 'response' in error && 
             error.response && typeof error.response === 'object' && 
             'status' in error.response && 
             (typeof error.response.status === 'number' && 
              (error.response.status >= 500 || error.response.status === 0)));
          
          // Retry on network errors
          if (isNetworkError && retries < maxRetries && mounted) {
            retries++;
            console.log(`Retrying initial auth check in 1 second... (${retries}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return attemptInitialAuthCheck();
          }
          
          if (mounted) {
            // Handle authentication errors
            const isAuthError = error && 
              typeof error === 'object' && 
              'response' in error && 
              error.response && 
              typeof error.response === 'object' && 
              'status' in error.response && 
              typeof error.response.status === 'number' &&
              error.response.status === 401;
            
            if (isAuthError) {
              console.log('Initial auth check failed - user not authenticated');
              setUser(null);
              saveUserToStorage(null);
              
              // Only redirect to login for admin pages
              if (!isLoginPage && !isPublicPage) {
                setTimeout(() => {
                  if (mounted) navigate('/login');
                }, 100);
              }
            } else {
              // For non-auth errors, don't clear user state - keep existing or restore from localStorage
              console.log('Initial auth check failed due to network/server error');
              if (!userRef.current) {
                try {
                  const storedUser = localStorage.getItem('user');
                  if (storedUser) {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                    console.log('Restored user from localStorage due to initial auth check network error');
                  }
                } catch (e) {
                  console.warn('Failed to restore user from localStorage:', e);
                }
              }
            }
          }
        }
      };
      
      try {
        await attemptInitialAuthCheck();
      } catch (finalError) {
        console.error('Final auth check attempt failed:', finalError);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setAuthChecked(true);
          setIsCheckingAuth(false);
        }
      }
    };

    if (!authChecked) {
      performAuthCheck();
    }

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.post('/api/sessions', { email, password });
      // console.log('Login response:', response.data);
      const userData = response.data.user;
      setUser(userData);
      saveUserToStorage(userData);
      toast.success('Login berhasil');
      
      // Mark as checked after successful login
      setAuthChecked(true);
      
      // Redirect to dashboard after successful login
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 100);
    } catch (error: unknown) {
      console.error('Login error:', error);
      let message = 'Login gagal. Silakan cek email dan password Anda.';
      
      if (
        error && 
        typeof error === 'object' && 
        'response' in error && 
        error.response && 
        typeof error.response === 'object' && 
        'data' in error.response && 
        error.response.data && 
        typeof error.response.data === 'object' && 
        'error' in error.response.data
      ) {
        message = String(error.response.data.error);
      }
      
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.delete('/api/sessions/logout');
      setUser(null);
      saveUserToStorage(null);
      setAuthChecked(true); // Keep as checked after logout
      toast.success('Logout berhasil');
      navigate('/'); // Redirect to homepage instead of login
    } catch (error) {
      console.error('Logout failed', error);
      toast.error('Gagal logout. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: !!user && (user.role === 'admin' || user.role === 'super_admin'),
    isLoading,
    isRedirecting,
    login,
    logout,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 