/**
 * PDF Signature API client
 * Handles communication with the backend API for signature processing
 */
import { getAuthToken } from "@/services/authUtils";

// Update this with your actual API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Add signatures to a PDF file
 * @param {File} pdfFile - PDF file to process
 * @param {Array} signatures - Array of signature objects with position and image data
 * @param {Function} onProgress - Progress callback (0-100)
 * @param {string} password - Optional PDF password
 * @returns {Promise} - Promise that resolves with result
 */
export const addSignaturesToPDF = async (pdfFile, signatures, onProgress, password = null) => {
  try {
    // Validate inputs
    if (!pdfFile) {
      throw new Error('PDF file is required');
    }
    
    if (!signatures || !Array.isArray(signatures) || signatures.length === 0) {
      throw new Error('At least one signature is required');
    }
    
    // Validate signature data
    for (let i = 0; i < signatures.length; i++) {
      const sig = signatures[i];
      if (!sig.id || !sig.page || sig.x === undefined || sig.y === undefined || 
          !sig.width || !sig.height || !sig.image) {
        throw new Error(`Invalid signature data at index ${i}`);
      }
    }
    
    // Prepare FormData
    const formData = new FormData();
    formData.append('pdf_file', pdfFile);
    formData.append('signatures', JSON.stringify(signatures));
    
    if (password) {
      formData.append('password', password);
    }
    
    // Track upload and processing progress using XMLHttpRequest
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let hasReceivedResponse = false;
      
      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && typeof onProgress === 'function') {
          // Calculate upload progress (0-75%)
          const uploadProgress = Math.round((event.loaded / event.total) * 75);
          onProgress(uploadProgress);
        }
      };
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3) {
          // Headers received, server is processing
          if (!hasReceivedResponse && typeof onProgress === 'function') {
            hasReceivedResponse = true;
            onProgress(80); // Jump to 80% when server starts processing
          }
        }
        else if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Processing steps
            if (typeof onProgress === 'function') {
              onProgress(90); // Processing signatures
            }
            
            // Simulate the final processing steps
            setTimeout(() => {
              if (typeof onProgress === 'function') {
                onProgress(95); // Finalizing PDF
              }
              
              setTimeout(() => {
                // Set progress to 100% when complete
                if (typeof onProgress === 'function') {
                  onProgress(100);
                }
                resolve(JSON.parse(xhr.responseText));
              }, 500);
            }, 800);
          } else {
            // Handle error
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || 'Signature processing failed'));
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
          onProgress(75);
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error occurred during signature processing'));
      };
      
      xhr.ontimeout = () => {
        reject(new Error('Request timeout - signature processing took too long'));
      };
      
      // Set timeout (5 minutes for large files with many signatures)
      xhr.timeout = 300000;
      
      // Open and send the request
      xhr.open('POST', `${API_BASE_URL}/api/pdf/add-signatures/`, true);

      const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.send(formData);
    });
  } catch (error) {
    throw new Error(`Signature processing failed: ${error.message}`);
  }
};

/**
 * Prepare signature data for API submission
 * @param {Array} signatures - Raw signature objects from frontend
 * @returns {Array} - Processed signature data ready for API
 */
export const prepareSignatureData = (signatures) => {
  return signatures.map((sig, index) => {
    // Validate required fields
    if (!sig.id || !sig.page || sig.x === undefined || sig.y === undefined || 
        !sig.width || !sig.height || !sig.image) {
      throw new Error(`Missing required signature data at index ${index}`);
    }
    
    return {
      id: sig.id,
      page: sig.page,
      x: sig.x, // Percentage (0-100)
      y: sig.y, // Percentage (0-100)
      width: sig.width, // Pixels
      height: sig.height, // Pixels
      image: sig.image, // Base64 data URL
      type: sig.type || 'signature' // signature, date, time
    };
  });
};

/**
 * Get download URL for a signed PDF
 * @param {string} fileId - ID of the file to download
 * @param {string} customFilename - Optional custom filename for the download
 * @returns {string} - Full download URL
 */
export const getSignedPDFDownloadUrl = (fileId, customFilename = null) => {
  let url = `${API_BASE_URL}/download-pdf/?file_id=${fileId}`;
  
  // Add custom filename as a query parameter if provided
  if (customFilename) {
    url += `&filename=${encodeURIComponent(customFilename)}`;
  }
  
  return url;
};

/**
 * Download a signed PDF file programmatically
 * @param {string} url - URL of the file to download
 * @param {string} filename - Name to save the file as
 */
export const downloadSignedPDF = (url, filename) => {
  console.log(`Downloading signed PDF from: ${url}`);
  
  const link = document.createElement('a');
  link.href = url;
  // Backend handles the filename through URL parameter
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Validate PDF file before processing
 * @param {File} file - File to validate
 * @returns {boolean} - True if valid
 */
export const validatePDFFile = (file) => {
  if (!file) {
    throw new Error('No file provided');
  }
  
  if (file.type !== 'application/pdf') {
    throw new Error('File must be a PDF');
  }
  
  // Check file size (100MB limit)
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size must be less than 100MB');
  }
  
  return true;
};

/**
 * Validate signature data before submission
 * @param {Array} signatures - Signature array to validate
 * @returns {boolean} - True if valid
 */
export const validateSignatures = (signatures) => {
  if (!Array.isArray(signatures) || signatures.length === 0) {
    throw new Error('At least one signature is required');
  }
  
  for (let i = 0; i < signatures.length; i++) {
    const sig = signatures[i];
    
    if (!sig.id) {
      throw new Error(`Signature ${i + 1}: Missing unique ID`);
    }
    
    if (!sig.page || sig.page < 1) {
      throw new Error(`Signature ${i + 1}: Invalid page number`);
    }
    
    if (sig.x < 0 || sig.x > 100 || sig.y < 0 || sig.y > 100) {
      throw new Error(`Signature ${i + 1}: Position must be between 0-100%`);
    }
    
    if (!sig.width || !sig.height || sig.width <= 0 || sig.height <= 0) {
      throw new Error(`Signature ${i + 1}: Invalid dimensions`);
    }
    
    if (!sig.image || !sig.image.startsWith('data:image')) {
      throw new Error(`Signature ${i + 1}: Invalid image data`);
    }
  }
  
  return true;
};