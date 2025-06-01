// services/authUtils.js

/**
 * Get the current authentication token from storage
 * @returns {string|null} - The authentication token or null if not authenticated
 */
export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || null;
  }
  return null;
};

/**
 * Get the refresh token from storage
 * @returns {string|null} - The refresh token or null if not available
 */
export const getRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken') || null;
  }
  return null;
};

/**
 * Check if the user is authenticated
 * @returns {boolean} - True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return getAuthToken() !== null;
};

/**
 * Clear all authentication tokens
 */
export const clearAuthTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
  }
};