// api/contact_api.js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Submit contact form feedback
 * @param {Object} contactData - Contact form data
 * @param {string} contactData.name - User's name
 * @param {string} contactData.email - User's email
 * @param {string} contactData.subject - Contact subject
 * @param {string} contactData.message - Contact message
 * @returns {Promise} - Promise that resolves with submission response
 */
export const submitContactForm = async (contactData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/contact/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `Error: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Error submitting contact form:', error);
    throw error;
  }
};

/**
 * Get available contact form subject choices
 * @returns {Promise} - Promise that resolves with subject choices
 */
export const getContactSubjects = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/contact/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();
    return result.subjects || [];
  } catch (error) {
    console.error('Error fetching contact subjects:', error);
    // Return default subjects if API fails
    return [
      { value: 'general', label: 'General Inquiry' },
      { value: 'support', label: 'Technical Support' },
      { value: 'bug_report', label: 'Bug Report' },
      { value: 'feature_request', label: 'Feature Request' },
      { value: 'business', label: 'Business Inquiry' },
      { value: 'other', label: 'Other' }
    ];
  }
};