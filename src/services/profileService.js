// services/profileService.js

import { getAuthToken, getRefreshToken } from './authUtils';
import { refreshToken } from './authService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Make an authenticated API request with automatic token refresh
 */
const makeAuthenticatedRequest = async (url, options = {}) => {
  let accessToken = getAuthToken();
  
  // First attempt
  let response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
    }
  });
  
  // If 401, try to refresh token
  if (response.status === 401) {
    console.log('Access token expired, refreshing...');
    
    const refreshTokenValue = getRefreshToken();
    if (refreshTokenValue) {
      try {
        const refreshResponse = await refreshToken(refreshTokenValue);
        
        // Update stored tokens
        const storage = localStorage.getItem('refreshToken') ? localStorage : sessionStorage;
        storage.setItem('accessToken', refreshResponse.access);
        if (refreshResponse.refresh) {
          storage.setItem('refreshToken', refreshResponse.refresh);
        }
        
        // Retry with new token
        response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
            'Authorization': `Bearer ${refreshResponse.access}`
          }
        });
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        throw new Error('Session expired. Please log in again.');
      }
    } else {
      throw new Error('Session expired. Please log in again.');
    }
  }
  
  return response;
};

/**
 * Get user profile data
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async () => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/profile/`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated profile data
 */
export const updateUserProfile = async (profileData) => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/profile/`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Change user password
 * @param {Object} passwordData - Password change data
 * @returns {Promise<Object>} Success message
 */
export const changePassword = async (passwordData) => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/profile/change-password/`, {
      method: 'POST',
      body: JSON.stringify(passwordData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to change password');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

/**
 * Get user statistics
 * @returns {Promise<Object>} User statistics
 */
export const getUserStats = async () => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/profile/stats/`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user stats');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

/**
 * Get user login sessions
 * @returns {Promise<Array>} List of user sessions
 */
export const getUserSessions = async () => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/profile/sessions/`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch sessions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    throw error;
  }
};

/**
 * Revoke a session
 * @param {string} sessionId - Session ID to revoke (optional - if not provided, revokes all other sessions)
 * @returns {Promise<Object>} Success message
 */
export const revokeSession = async (sessionId = null) => {
  try {
    const url = sessionId 
      ? `${API_BASE_URL}/api/profile/sessions/${sessionId}/`
      : `${API_BASE_URL}/api/profile/sessions/`;
      
    const response = await makeAuthenticatedRequest(url, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to revoke session');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error revoking session:', error);
    throw error;
  }
};

/**
 * Get user activity logs
 * @returns {Promise<Array>} List of user activities
 */
export const getUserActivity = async () => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/profile/activity/`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch activity logs');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user activity:', error);
    throw error;
  }
};

/**
 * Delete user account
 * @param {Object} deleteData - Account deletion data
 * @returns {Promise<Object>} Success message
 */
export const deleteAccount = async (deleteData) => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/profile/delete-account/`, {
      method: 'POST',
      body: JSON.stringify(deleteData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete account');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time
 */
export const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
};