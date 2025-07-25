import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First check if we have a Supabase session
        if (supabase) {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session && !error) {
            // We have a valid Supabase session, fetch user details from database
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select(`
                *,
                role:roles(*)
              `)
              .eq('id', session.user.id)
              .single();
            
            if (userData && !userError) {
              const user = {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                jurisdiction: userData.jurisdiction,
                isActive: userData.is_active,
                createdAt: new Date(userData.created_at),
                updatedAt: new Date(userData.updated_at)
              };
              
              setUser(user);
              localStorage.setItem('userData', JSON.stringify(user));
              localStorage.setItem('authToken', session.access_token);
              setIsLoading(false);
              return;
            } else {
              // User data fetch failed, clear authentication state
              setUser(null);
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              setIsLoading(false);
              return;
            }
          } else {
            // No valid Supabase session, clear authentication state
            setUser(null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            setIsLoading(false);
            return;
          }
        }
        
        // Fallback to localStorage if no Supabase session
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        
        // Clear authentication state on error
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
      
      setIsLoading(false);
    };
    
    initializeAuth();
  }, []);

  useEffect(() => {
    // Listen for auth state changes if Supabase is available
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_OUT' || !session) {
            setUser(null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
          }
        }
      );
      
      return () => subscription.unsubscribe();
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', email);
      const response = await authApi.login(email, password);
      console.log('Login response:', response);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        console.log('Setting user:', user);
        setUser(user);
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        return { success: true, message: response.message };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}