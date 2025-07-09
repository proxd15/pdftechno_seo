// api/user_api.js

import { getAuthToken,getRefreshToken as refreshAuthToken } from "@/services/authUtils";

// import { getAuthToken, refreshToken as refreshAuthToken } from '@services/authUtils';
getAuthToken
// 

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Make an authenticated API request with automatic token refresh
 */
const makeAuthenticatedRequest = async (url, options = {}) => {
  let token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  // First attempt with current token
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  // If unauthorized and we have a refresh token, try to refresh
  if (response.status === 401) {
    // console.log('Access token expired, attempting to refresh...');
    
    try {
      const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Refresh the token
      const refreshResponse = await refreshAuthToken(refreshToken);
      
      // Update stored tokens
      const storage = localStorage.getItem('refreshToken') ? localStorage : sessionStorage;
      storage.setItem('accessToken', refreshResponse.access);
      if (refreshResponse.refresh) {
        storage.setItem('refreshToken', refreshResponse.refresh);
      }

      // Retry the original request with new token
      return fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${refreshResponse.access}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      // Redirect to login or clear auth state
      throw new Error('Session expired. Please log in again.');
    }
  }

  return response;
};

/**
 * Get the files processed by the authenticated user
 * @returns {Promise} - Promise that resolves with user's files
 */
export const getUserFiles = async () => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/user/files/`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.status}`);
    }
    
    const files = await response.json();
    
    // Sort files by creation date (newest first)
    return files.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch (error) {
    console.error('Error fetching user files:', error);
    throw error;
  }
};