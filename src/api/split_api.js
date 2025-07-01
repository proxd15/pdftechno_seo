/**
 * PDF Split API client
 * Handles communication with the backend API for PDF splitting
 */
import { getAuthToken } from "@/services/authUtils";

// Use the same API base URL as other API clients
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
 * Split PDF file
 * @param {FormData} formData - FormData containing PDF file and split options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with split results
 */
export const splitPDF = async (formData, onProgress) => {
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
              reject(new Error(errorData.error || 'Split operation failed'));
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
      xhr.open('POST', `${API_BASE_URL}/api/pdf/split/`, true);
       const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  } catch (error) {
    throw new Error(`PDF split failed: ${error.message}`);
  }
};

/**
 * Helper to create range objects for page ranges
 * @param {number} from - Starting page number (1-based)
 * @param {number} to - Ending page number (inclusive)
 * @returns {Object} - Range object for the API
 */
export const createPageRange = (from, to) => {
  return { from, to };
};

/**
 * Create FormData for a split request
 * @param {File} pdfFile - The PDF file to split
 * @param {Array} ranges - Array of page numbers or range objects
 * @param {boolean} mergeAllRanges - Whether to merge all ranges into a single PDF
 * @param {string} password - Optional password for encrypted PDFs
 * @param {string} outputFilename - Optional custom filename for the output
 * @returns {FormData} - FormData ready to send to the API
 */
export const createSplitFormData = (
  pdfFile,
  ranges,
  mergeAllRanges = false,
  password = null,
  outputFilename = null
) => {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('ranges', JSON.stringify(ranges));
  formData.append('merge_all_ranges', mergeAllRanges.toString());
  
  if (password) {
    formData.append('password', password);
  }
  
  if (outputFilename) {
    formData.append('output_filename', outputFilename);
  }
  
  return formData;
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
  // console.log(url);
  
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

/**
 * Get preview URL for a file
 * @param {string} fileId - ID of the file to preview
 * @returns {Promise<string>} - Promise that resolves with the preview URL
 */
export const getPreviewUrl = async (fileId) => {
  try {
    // Fetch the PDF data
    const response = await fetch(getDownloadUrl(fileId, 'pdf'));
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    // Get the PDF data as a blob
    const pdfBlob = await response.blob();
    
    // Create an object URL from the blob
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    console.error('Error preparing PDF preview:', error);
    throw error;
  }
};