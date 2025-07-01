// pdftopdfa_api.js

/**
 * PDF to PDF/A API client
 * Handles communication with the backend API for PDF to PDF/A conversion
 */
import { getAuthToken } from "@/services/authUtils";

// Use the same API base URL as other API clients
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Convert PDF file to PDF/A format
 * @param {FormData} formData - FormData containing PDF file and optional password
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with conversion results
 */
export const convertPDFtoPDFA = async (formData, onProgress) => {
  try {
    // Track upload progress using XMLHttpRequest
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let hasReceivedResponse = false;
      
      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && typeof onProgress === 'function') {
          // Calculate upload progress (0-85%)
          const uploadProgress = Math.round((event.loaded / event.total) * 85);
          onProgress(uploadProgress);
        }
      };
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3) {
          // Headers received, server is processing
          if (!hasReceivedResponse && typeof onProgress === 'function') {
            hasReceivedResponse = true;
            onProgress(90); // Jump to 90% when server starts processing
          }
        }
        else if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            // First go to 95% to show we're processing the response
            if (typeof onProgress === 'function') {
              onProgress(95);
            }
            
            // Simulate the final processing steps
            setTimeout(() => {
              // Set progress to 100% when complete
              if (typeof onProgress === 'function') {
                onProgress(100);
              }
              resolve(JSON.parse(xhr.responseText));
            }, 800); // Small delay to show 95% progress
          } else {
            // Handle error
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject({
                ...errorData,
                message: errorData.error || 'Conversion operation failed',
                status: xhr.status
              });
            } catch (e) {
              reject({
                message: `Server error: ${xhr.status}`,
                status: xhr.status
              });
            }
          }
        }
      };
      
      // Set a timeout for server-side processing if the upload completes
      xhr.upload.onload = () => {
        // Upload is complete, but processing might still be happening
        if (typeof onProgress === 'function') {
          onProgress(85);
        }
      };
      

      
      // Open and send the request
      xhr.open('POST', `${API_BASE_URL}/api/pdf/pdf-to-pdfa/`, true);
       const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  } catch (error) {
    throw new Error(`PDF to PDF/A conversion failed: ${error.message}`);
  }
};

/**
 * Create FormData for a PDF to PDF/A conversion request
 * @param {File} pdfFile - The PDF file to convert
 * @param {string} password - Optional password for encrypted PDFs
 * @returns {FormData} - FormData ready to send to the API
 */
export const createConversionFormData = (pdfFile, password = null) => {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  
  // Add password if provided
  if (password) {
    formData.append('password', password);
  }
  
  return formData;
};

/**
 * Get download URL for a file
 * @param {string} fileId - ID of the file to download
 * @param {string} customFilename - Optional custom filename for the download
 * @returns {string} - Full download URL
 */
export const getDownloadUrl = (fileId, customFilename = null) => {
  let url = `${API_BASE_URL}/download-pdf/?file_id=${fileId}`;
  
  // Add custom filename as a query parameter if provided
  if (customFilename) {
    // Make sure it has .pdf extension
    if (!customFilename.toLowerCase().endsWith('.pdf')) {
      customFilename += '.pdf';
    }
    
    url += `&filename=${encodeURIComponent(customFilename)}`;
  }

  
  return url;
};

/**
 * Download a file programmatically
 * @param {string} url - URL of the file to download
 * @param {string} filename - Name to save the file as
 */
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'file';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};