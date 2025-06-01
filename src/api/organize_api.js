/**
 * PDF Organization API client
 * Handles communication with the backend API for PDF organization
 */

import { getAuthToken } from "@/services/authUtils";

// Use the same API base URL as defined in the compression client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Reuse the same file extension and type constants
const FILE_EXTENSIONS = {
  PDF: '.pdf',
  ZIP: '.zip'
};

const FILE_TYPES = {
  PDF: 'pdf',
  ZIP: 'zip'
};

/**
 * Organize PDF files
 * @param {FormData} formData - FormData containing the processed PDF file
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with organization results
 */
export const organizePDF = async (formData, onProgress) => {
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
            
            // Parse the response
            let responseData;
            try {
              responseData = JSON.parse(xhr.responseText);
            } catch (e) {
              reject(new Error('Failed to parse server response'));
              return;
            }
            
            // Simulate the final processing steps
            setTimeout(() => {
              // Set progress to 100% when complete
              if (typeof onProgress === 'function') {
                onProgress(100);
              }
              resolve(responseData);
            }, 800); // Small delay to show 95% progress
          } else {
            // Handle error
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || 'PDF organization failed'));
            } catch (e) {
              reject(new Error(`Server error: ${xhr.status}`));
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
      
      // Add metadata to FormData if needed
      if (!formData.has('is_frontend_processed')) {
        formData.append('is_frontend_processed', 'true');
      }
      
      // Open and send the request
      xhr.open('POST', `${API_BASE_URL}/api/pdf/organize-pdf/`, true);
       const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  } catch (error) {
    throw new Error(`PDF organization failed: ${error.message}`);
  }
};

/**
 * Get download URL for an organized PDF file
 * @param {string} fileId - ID of the file to download
 * @param {string} customFilename - Optional custom filename for the download
 * @returns {string} - Full download URL
 */
export const getOrganizedPdfDownloadUrl = (fileId, customFilename = null) => {
  let url = `${API_BASE_URL}/download-pdf/?file_id=${fileId}`;
  
  // Add custom filename as a query parameter if provided
  if (customFilename) {
    // Make sure it has the PDF extension
    if (!customFilename.toLowerCase().endsWith(FILE_EXTENSIONS.PDF)) {
      customFilename += FILE_EXTENSIONS.PDF;
    }
    
    url += `&filename=${encodeURIComponent(customFilename)}`;
  }
  
  return url;
};

/**
 * Download an organized PDF file programmatically
 * @param {string} fileId - ID of the file to download
 * @param {string} filename - Name to save the file as
 */
export const downloadOrganizedPdf = (fileId, filename) => {
  const url = getOrganizedPdfDownloadUrl(fileId, filename);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'organized.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};