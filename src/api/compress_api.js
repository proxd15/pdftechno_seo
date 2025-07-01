/**
 * PDF Compression API client
 * Handles communication with the backend API
 */
import { getAuthToken } from "@/services/authUtils";
// Update this with your actual API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Define constants for file extensions and types
const FILE_EXTENSIONS = {
  PDF: '.pdf',
  ZIP: '.zip'
};

const FILE_TYPES = {
  PDF: 'pdf',
  ZIP: 'zip'
};

/**
 * Compress PDF files
 * @param {File[]} files - Array of PDF files to compress
 * @param {string} compressionLevel - Compression level: 'high', 'recommended', 'low'
 * @param {boolean} grayScale - Convert to grayscale
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with compression results
 */
// Modify the compressPDFs function to accept FormData
export const compressPDFs = async (formData, onProgress) => {
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
              reject(new Error(errorData.error || 'Compression failed'));
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
      
      // Open and send the request
      xhr.open('POST', `${API_BASE_URL}/api/pdf/compress/`, true);
       const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  } catch (error) {
    throw new Error(`PDF compression failed: ${error.message}`);
  }
};

/**
 * Get download URL for a file
 * @param {string} fileId - ID of the file to download
 * @param {string} fileType - Type of file ('pdf' or 'zip')
 * @param {string} customFilename - Optional custom filename for the download
 * @returns {string} - Full download URL
 */
export const getDownloadUrl = (fileId, fileType, customFilename = null) => {
  // Strictly validate file type to ensure correct endpoint
  fileType = (fileType === FILE_TYPES.ZIP) ? FILE_TYPES.ZIP : FILE_TYPES.PDF;
  
  // Use the correct endpoint based on file type
  const endpoint = (fileType === FILE_TYPES.ZIP) ? 'download-zip' : 'download-pdf';
  let url = `${API_BASE_URL}/${endpoint}/?file_id=${fileId}`;
  
  // Add custom filename as a query parameter if provided
  if (customFilename) {
    // Make sure it has the correct extension for the file type
    if (fileType === FILE_TYPES.PDF && !customFilename.toLowerCase().endsWith(FILE_EXTENSIONS.PDF)) {
      customFilename += FILE_EXTENSIONS.PDF;
    } else if (fileType === FILE_TYPES.ZIP && !customFilename.toLowerCase().endsWith(FILE_EXTENSIONS.ZIP)) {
      customFilename += FILE_EXTENSIONS.ZIP;
    }
    
    // Make sure we don't have double extensions
    if (fileType === FILE_TYPES.PDF) {
      customFilename = customFilename.replace(new RegExp(`${FILE_EXTENSIONS.ZIP}${FILE_EXTENSIONS.PDF}$`, 'i'), FILE_EXTENSIONS.PDF);
    } else if (fileType === FILE_TYPES.ZIP) {
      customFilename = customFilename.replace(new RegExp(`${FILE_EXTENSIONS.PDF}${FILE_EXTENSIONS.ZIP}$`, 'i'), FILE_EXTENSIONS.ZIP);
    }
    
    url += `&filename=${encodeURIComponent(customFilename)}`;
  }
  
  // console.log(`Generated URL for ${fileType} download: ${url}`);
  return url;
};

/**
 * Download a file programmatically
 * @param {string} url - URL of the file to download
 * @param {string} filename - Name to save the file as
 */
export const downloadFile = (url, filename) => {
  // console.log(`Downloading file from: ${url}`);
  // console.log(`With filename: ${filename}`);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'file';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};