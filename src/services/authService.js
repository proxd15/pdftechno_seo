// services/authService.js

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  // Check if the response is JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    
    if (!response.ok) {
      const error = (data && data.detail) || response.statusText;
      throw new Error(error);
    }
    
    return data;
  } else {
    // Handle non-JSON responses
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${text}`);
    }
    return { message: text };
  }
};

// Helper to get the current locale either from cookie or localStorage
const getCurrentLocale = () => {
  if (typeof window !== 'undefined') {
    // Try to get from cookie first
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1];
      
    // If not in cookie, try localStorage
    const localStorageLocale = localStorage.getItem('NEXT_LOCALE');
    
    // Return the first available locale or default to 'en'
    return cookieLocale || localStorageLocale || 'en';
  }
  return 'en';
};

// Login user
export const loginUser = async (email, password) => {
  try {
    // Include current locale in the request headers
    const currentLocale = getCurrentLocale();
    
    const response = await fetch(`${API_URL}/auth/login/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept-Language': currentLocale
      },
      body: JSON.stringify({ email, password }),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Register user
export const registerUser = async (userData) => {
  try {
    const { name, email, password, password_confirm, phone } = userData;
    
    // Split name into first_name and last_name
    let first_name = name;
    let last_name = '';
    
    if (name && name.includes(' ')) {
      const nameParts = name.split(' ');
      first_name = nameParts[0];
      last_name = nameParts.slice(1).join(' ');
    }
    
    const currentLocale = getCurrentLocale();
    
    // Update request data to match backend expectations
    const requestData = { 
      email, 
      first_name,
      last_name,
      password, 
      password_confirm,
      phone: phone || ''
    };
    
    console.log("Sending registration data:", JSON.stringify(requestData));
    
    const response = await fetch(`${API_URL}/auth/register/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept-Language': currentLocale
      },
      body: JSON.stringify(requestData),
    });
    
    // Handle potential errors
    if (!response.ok) {
      let errorMessage = 'Registration failed';
      
      try {
        const errorData = await response.json();
        console.error("Registration error response:", errorData);
        
        // Check for field-specific errors
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'object') {
          // Format field errors nicely
          const fieldErrors = Object.entries(errorData)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            })
            .join('; ');
          
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
      } catch (e) {
        // If not JSON, try to get text
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = `Registration failed (${response.status}): ${errorText.substring(0, 100)}...`;
          }
        } catch (textError) {
          // If we can't get text either, use status
          errorMessage = `Registration failed with status ${response.status}`;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    return handleResponse(response);
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const logoutUser = async (refreshToken) => {
  try {
    console.log("Refresh token being sent:", refreshToken);
    const currentLocale = getCurrentLocale();
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Make sure refresh token exists and is valid
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }
    
    // Explicitly sending the refresh token in the body
    const response = await fetch(`${API_URL}/auth/logout/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept-Language': currentLocale
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Refresh token
export const refreshToken = async (refresh) => {
  try {
    const currentLocale = getCurrentLocale();
    
    const response = await fetch(`${API_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept-Language': currentLocale
      },
      body: JSON.stringify({ refresh }),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    const currentLocale = getCurrentLocale();
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${API_URL}/auth/profile/`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept-Language': currentLocale
      },
    });
    
    return handleResponse(response);
    
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

// Save user's language preference
export const saveLanguagePreference = (locale) => {
  try {
    if (typeof window !== 'undefined') {
      // Save to both cookie and localStorage for robustness
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year
      localStorage.setItem('NEXT_LOCALE', locale);
    }
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};