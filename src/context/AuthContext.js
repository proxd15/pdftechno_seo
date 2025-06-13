'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, registerUser, logoutUser, refreshToken } from '@/services/authService';
import { getAuthToken, getRefreshToken } from '@/services/authUtils';

// Add the API_BASE_URL constant
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Initialize auth state from localStorage on component mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        const storedToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Setup token refresh interval
  useEffect(() => {
    const checkAndRefreshToken = async () => {
      const token = getAuthToken();
      const refreshTokenValue = getRefreshToken();
      
      if (token && refreshTokenValue && isAuthenticated) {
        try {
          // Check if token is still valid by making a simple request
          const response = await fetch(`${API_BASE_URL}/api/auth/check/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.status === 401) {
            // Token expired, refresh it
            console.log('Token expired, refreshing...');
            const refreshResponse = await refreshToken(refreshTokenValue);
            
            // Update stored tokens
            const storage = localStorage.getItem('refreshToken') ? localStorage : sessionStorage;
            storage.setItem('accessToken', refreshResponse.access);
            if (refreshResponse.refresh) {
              storage.setItem('refreshToken', refreshResponse.refresh);
            }
            
            // Update user data if provided in response
            if (refreshResponse.user) {
              setUser(refreshResponse.user);
              storage.setItem('user', JSON.stringify(refreshResponse.user));
            }
            
            console.log('Token refreshed successfully');
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Clear auth state instead of calling logout API
          clearAuthState();
        }
      }
    };

    // Only set up interval if user is authenticated
    if (isAuthenticated) {
      // Check immediately
      checkAndRefreshToken();
      
      // Set up an interval to check token validity periodically
      const interval = setInterval(checkAndRefreshToken, 5 * 60 * 1000); // Check every 5 minutes
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]); // Only depend on isAuthenticated to prevent infinite loops

  // Helper function to clear auth state
  const clearAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
  };

  const handleLogin = async (email, password, remember) => {
    setError(null);
    try {
      setLoading(true);
      const response = await loginUser(email, password);
      
      if (response.user && response.access) {
        setUser(response.user);
        setIsAuthenticated(true);
        
        // Store auth data in localStorage if remember is checked
        if (remember) {
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('accessToken', response.access);
          localStorage.setItem('refreshToken', response.refresh);
        } else {
          // For session storage (cleared when browser is closed)
          sessionStorage.setItem('user', JSON.stringify(response.user));
          sessionStorage.setItem('accessToken', response.access);
          sessionStorage.setItem('refreshToken', response.refresh);
        }
        
        return { success: true };
      }
    } catch (error) {
      setError(error.message || 'Login failed. Please check your credentials.');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setError(null);
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('Registration response:', data); // Debug log

      if (response.ok) {
        // Registration successful
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Store tokens
        const storage = sessionStorage.getItem('rememberMe') === 'true' ? localStorage : sessionStorage;
        storage.setItem('accessToken', data.access);
        storage.setItem('refreshToken', data.refresh);
        storage.setItem('user', JSON.stringify(data.user));
        
        return {
          success: true,
          user: data.user,
          message: data.message
        };
      } else {
        // Registration failed - return the exact error structure from backend
        return {
          success: false,
          error: data.error || 'Registration failed',
          message: data.message,
          error_type: data.error_type,
          has_google_account: data.has_google_account,
          details: data.details
        };
      }
    } catch (error) {
      console.error('Registration network error:', error);
      return {
        success: false,
        error: 'Network error occurred. Please try again.',
        message: 'Unable to connect to the server'
      };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      
      if (refreshTokenValue) {
        // Pass the refresh token directly to logoutUser
        await logoutUser(refreshTokenValue);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with cleanup even if API call fails
    } finally {
      // Clear user data regardless of API success
      clearAuthState();
      router.push('/');
    }
  };

  const checkAuth = () => {
    return isAuthenticated;
  };

   const loginWithGoogle = async (code) => {
    setError(null);
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/google/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.access) {
        setUser(data.user);
        setIsAuthenticated(true);
        
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        
        return { success: true };
      } else {
        throw new Error(data.detail || 'Google authentication failed');
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    checkAuth,
    loginWithGoogle
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};