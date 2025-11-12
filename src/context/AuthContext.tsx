"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  email_verified_at?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name: string; email: string }) => Promise<{ success: boolean; message: string }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configuration axios
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8000';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await axios.get('/api/user', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Get CSRF cookie first
      await axios.get('/sanctum/csrf-cookie');
      
      const response = await axios.post('/api/login', {
        email,
        password,
      });

      if (response.status === 200) {
        const userData = response.data.user;
        const token = response.data.token;
        
        if (token && userData) {
          localStorage.setItem('auth_token', token);
          // Stocker les headers axios pour les futures requêtes
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(userData);
          return { success: true, message: 'Login successful' };
        }
      }
      
      return { success: false, message: 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Login failed';
      return { success: false, message };
    }
  };

  const register = async (name: string, email: string, password: string, passwordConfirmation: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Get CSRF cookie first
      await axios.get('/sanctum/csrf-cookie');
      
      const response = await axios.post('/api/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      if (response.status === 201) {
        const userData = response.data.user;
        const token = response.data.token;
        
        if (token && userData) {
          localStorage.setItem('auth_token', token);
          // Stocker les headers axios pour les futures requêtes
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(userData);
          return { success: true, message: 'Registration successful' };
        }
      }
      
      return { success: false, message: 'Registration failed' };
    } catch (error: any) {
      console.error('Registration error:', error);
      console.log('Error details:', error.response?.data);
      
      let message = 'Registration failed';
      
      if (error.response?.data?.errors) {
        // Gérer les erreurs de validation Laravel
        const errors = error.response.data.errors;
        if (errors.email) {
          message = errors.email[0];
        } else if (errors.password) {
          message = errors.password[0];
        } else if (errors.name) {
          message = errors.name[0];
        }
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      return { success: false, message };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await axios.post('/api/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  const updateProfile = async (data: { name: string; email: string }): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axios.put('/api/user/profile', data);
      
      if (response.status === 200) {
        setUser(response.data.user);
        return { success: true, message: 'Profile updated successfully' };
      }
      
      return { success: false, message: 'Profile update failed' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Profile update failed';
      return { success: false, message };
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    updateProfile,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};