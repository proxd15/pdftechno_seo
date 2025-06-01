import { getAuthToken } from "@/services/authUtils";

/**
 * PDF OCR API client
 * Handles communication with the backend API for PDF OCR processing
 */

// Use the same API base URL as other API clients
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Process a PDF file with OCR
 * @param {FormData} formData - FormData containing PDF file and language option
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with OCR processing results
 */
export const performPDFOCR = async (formData, onProgress) => {
  try {
    // Track upload progress using XMLHttpRequest
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let hasReceivedResponse = false;
      
      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && typeof onProgress === 'function') {
          // Calculate upload progress (0-40%)
          // OCR is more processing-heavy than upload, so allocate less progress to upload
          const uploadProgress = Math.round((event.loaded / event.total) * 40);
          onProgress(uploadProgress);
        }
      };
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3) {
          // Headers received, server is processing
          if (!hasReceivedResponse && typeof onProgress === 'function') {
            hasReceivedResponse = true;
            onProgress(50); // Jump to 50% when server starts OCR processing
          }
        }
        else if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Server responded successfully
            try {
              const response = JSON.parse(xhr.responseText);
              
              // Check if job is queued for async processing
              if (response.status === 'queued') {
                // Start polling for job status
                pollJobStatus(response.job_id, onProgress, resolve, reject);
              } else {
                // Regular synchronous completion
                if (typeof onProgress === 'function') {
                  onProgress(100);
                }
                resolve(response);
              }
            } catch (e) {
              reject({
                message: 'Invalid server response',
                error: e.message
              });
            }
          } else {
            // Handle error
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject({
                ...errorData,
                message: errorData.error || 'OCR operation failed',
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
        // Upload is complete, but OCR processing might still be happening
        if (typeof onProgress === 'function') {
          onProgress(45);
        }
      };
      
      // Log FormData content for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('FormData entries:');
        for (let [key, value] of formData.entries()) {
          if (key === 'pdf_file') {
            console.log(`${key}: [File object]`);
          } else {
            console.log(`${key}:`, value);
          }
        }
      }
      
      // Open and send the request
      xhr.open('POST', `${API_BASE_URL}/api/pdf/ocr-pdf/`, true);

       const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
   
      xhr.send(formData);
    });
  } catch (error) {
    throw new Error(`PDF OCR processing failed: ${error.message}`);
  }
};

/**
 * Poll for job status if the job is processed asynchronously
 * @param {string} jobId - ID of the job to check
 * @param {Function} onProgress - Progress callback function
 * @param {Function} resolve - Promise resolve function
 * @param {Function} reject - Promise reject function
 */
const pollJobStatus = (jobId, onProgress, resolve, reject) => {
  const statusUrl = `${API_BASE_URL}/api/pdf/ocr-pdf/status/${jobId}/`;
  let pollCount = 0;
  const maxPolls = 60; // Maximum 5 minutes (60 x 5s = 300s)
  
  const checkStatus = () => {
    pollCount++;
    fetch(statusUrl)
      .then(response => response.json())
      .then(data => {
        // Update progress based on status
        if (data.status === 'processing') {
          // If processing, show progress between 50-90%
          if (typeof onProgress === 'function') {
            // Calculate progress based on poll count to show movement
            const processingProgress = Math.min(50 + (pollCount * 2), 90);
            onProgress(processingProgress);
          }
          
          // Keep polling if not exceeded max polls
          if (pollCount < maxPolls) {
            setTimeout(checkStatus, 5000); // Check every 5 seconds
          } else {
            reject({
              message: 'OCR processing timed out after 5 minutes',
              status: 'timeout'
            });
          }
        } 
        else if (data.status === 'completed') {
          // Processing complete
          if (typeof onProgress === 'function') {
            onProgress(100);
          }
          resolve(data);
        } 
        else if (data.status === 'failed') {
          // Processing failed
          reject({
            message: data.error_message || 'OCR processing failed',
            status: 'failed'
          });
        } 
        else {
          // Still in queue or unknown status
          if (typeof onProgress === 'function') {
            onProgress(45); // Keep at upload completed progress
          }
          
          // Keep polling if not exceeded max polls
          if (pollCount < maxPolls) {
            setTimeout(checkStatus, 5000);
          } else {
            reject({
              message: 'OCR processing did not complete after 5 minutes',
              status: 'timeout'
            });
          }
        }
      })
      .catch(error => {
        reject({
          message: `Error checking job status: ${error.message}`,
          error: error
        });
      });
  };
  
  // Start polling
  setTimeout(checkStatus, 2000); // First check after 2 seconds
};

/**
 * Create FormData for a PDF OCR request
 * @param {File} pdfFile - The PDF file to process
 * @param {string} language - OCR language code (e.g., 'eng', 'fra', etc.)
 * @param {string} password - Optional password for encrypted PDFs
 * @returns {FormData} - FormData ready to send to the API
 */
export const createOCRFormData = (pdfFile, language = 'eng', password = null) => {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('language', language);
  
  // Add password if provided
  if (password) {
    formData.append('password', password);
  }
  
  return formData;
};

/**
 * Get download URL for the OCR processed file
 * @param {string} fileId - ID of the file to download
 * @param {string} customFilename - Optional custom filename for the download
 * @returns {string} - Full download URL
 */
export const getOCRDownloadUrl = (fileId, customFilename = null) => {
  let url = `${API_BASE_URL}/download-pdf/?file_id=${fileId}`;
  
  // Add custom filename as a query parameter if provided
  if (customFilename) {
    // Make sure it has .pdf extension
    if (!customFilename.toLowerCase().endsWith('.pdf')) {
      customFilename += '.pdf';
    }
    
    url += `&filename=${encodeURIComponent(customFilename)}`;
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Download URL:', url);
  }
  
  return url;
};

/**
 * Download an OCR processed file programmatically
 * @param {string} url - URL of the file to download
 * @param {string} filename - Name to save the file as
 */
export const downloadOCRFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'ocr_document.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Get list of available OCR languages
 * @returns {Array} - Array of language objects with code and name
 */
export const getAvailableOCRLanguages = () => {
  return [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish (Español)' },
    { code: 'fra', name: 'French (Français)' },
    { code: 'deu', name: 'German (Deutsch)' },
    { code: 'ita', name: 'Italian (Italiano)' },
    { code: 'por', name: 'Portuguese (Português)' },
    { code: 'nld', name: 'Dutch (Nederlands)' },
    { code: 'rus', name: 'Russian (Русский)' },
    { code: 'jpn', name: 'Japanese (日本語)' },
    { code: 'chi_sim', name: 'Chinese Simplified (简体中文)' },
    { code: 'chi_tra', name: 'Chinese Traditional (繁體中文)' },
    { code: 'kor', name: 'Korean (한국어)' },
    { code: 'ara', name: 'Arabic (العربية)' },
    { code: 'hin', name: 'Hindi (हिन्दी)' },
    { code: 'vie', name: 'Vietnamese (Tiếng Việt)' },
    { code: 'heb', name: 'Hebrew (עִבְרִית)' },
    { code: 'tur', name: 'Turkish (Türkçe)' },
    { code: 'mul', name: 'Multiple languages' }
  ];
};