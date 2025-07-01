// office_to_pdf_api.js
import { getAuthToken } from "@/services/authUtils";
// Update this with your actual API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Base function for office file to PDF conversion
 * @param {File} file - Office file to convert
 * @param {String} endpoint - API endpoint for conversion
 * @param {String} fieldName - Field name for the file in the form data
 * @param {Object} options - Conversion options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with result
 */
const convertOfficeToPDF = async (file, endpoint, fieldName, options = {}, onProgress) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append(fieldName, file);
    
    // Add options if provided
    if (options.outputFilename) {
      formData.append('output_filename', options.outputFilename);
    }
    
    // Track upload and conversion progress using XMLHttpRequest
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let hasReceivedResponse = false;
      
      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && typeof onProgress === 'function') {
          // Calculate upload progress (0-75%)
          // Files can be large, so we give more weight to upload
          const uploadProgress = Math.round((event.loaded / event.total) * 75);
          onProgress(uploadProgress);
        }
      };
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3) {
          // Headers received, server is processing
          if (!hasReceivedResponse && typeof onProgress === 'function') {
            hasReceivedResponse = true;
            onProgress(85); // Jump to 85% when server starts processing
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
              reject(new Error(errorData.error || 'Conversion failed'));
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
          onProgress(80);
        }
      };
      
      // Open and send the request
      xhr.open('POST', `${API_BASE_URL}/${endpoint}`, true);
       const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  } catch (error) {
    throw new Error(`Conversion failed: ${error.message}`);
  }
};

/**
 * Convert Word document to PDF
 * @param {File} wordFile - Word document file to convert
 * @param {Object} options - Conversion options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with result
 */
export const convertWordToPDF = async (wordFile, options = {}, onProgress) => {
  return convertOfficeToPDF(
    wordFile, 
    'api/pdf/word-to-pdf/', 
    'word_file', 
    options, 
    onProgress
  );
};

/**
 * Convert PowerPoint presentation to PDF
 * @param {File} pptFile - PowerPoint file to convert
 * @param {Object} options - Conversion options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with result
 */
export const convertPowerPointToPDF = async (pptFile, options = {}, onProgress) => {
  return convertOfficeToPDF(
    pptFile, 
    'api/pdf/ppt-to-pdf/', 
    'pptx_file', 
    options, 
    onProgress
  );
};

/**
 * Convert Excel spreadsheet to PDF
 * @param {File} excelFile - Excel file to convert
 * @param {Object} options - Conversion options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with result
 */
export const convertExcelToPDF = async (excelFile, options = {}, onProgress) => {
  return convertOfficeToPDF(
    excelFile, 
    'api/pdf/excel-to-pdf/', 
    'excel_file', 
    options, 
    onProgress
  );
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
    url += `&filename=${encodeURIComponent(customFilename)}`;
  }

  // console.log(`Download URL: ${url}`);
  
  return url;
};

/**
 * Download a file programmatically
 * @param {string} url - URL of the file to download
 * @param {string} filename - Suggested filename (passed in URL parameter)
 */
export const downloadFile = (url, filename) => {
  // console.log(`Downloading from: ${url}`);
  
  // Create a URL with the custom filename if provided
  let downloadUrl = url;
  if (filename) {
    // Add or update the filename parameter
    const separator = url.includes('?') ? '&' : '?';
    downloadUrl = `${url}${separator}filename=${encodeURIComponent(filename)}`;
  }
  
  const link = document.createElement('a');
  link.href = downloadUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Format file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted size string
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Check if a file is a valid office document
 * @param {File} file - File to check
 * @param {string} fileType - Type of file to validate ('word', 'ppt', 'excel')
 * @returns {boolean} - True if the file is valid
 */
export const isValidOfficeFile = (file, fileType) => {
  // Define valid MIME types based on file type
  const validTypesMap = {
    word: [
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/rtf',
      'application/vnd.oasis.opendocument.text'
    ],
    ppt: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.oasis.opendocument.presentation'
    ],
    excel: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/vnd.oasis.opendocument.spreadsheet'
    ]
  };
  
  const validTypes = validTypesMap[fileType] || [];
  
  return validTypes.includes(file.type);
};

/**
 * Get estimated conversion time based on file size
 * @param {number} fileSize - Size of the file in bytes
 * @param {string} fileType - Type of conversion ('word', 'ppt', 'excel')
 * @returns {number} - Estimated time in seconds
 */
export const estimateConversionTime = (fileSize, fileType) => {
  // Base upload speed estimation (400 KB/s)
  const uploadTimeEstimate = Math.ceil(fileSize / (400 * 1024));
  
  // Processing time varies by file type (based on complexity)
  let processingMultiplier = 1;
  
  switch (fileType) {
    case 'ppt':
      processingMultiplier = 1.5; // PowerPoint can take longer due to graphics
      break;
    case 'excel':
      processingMultiplier = 1.3; // Excel can take longer due to formulas and data
      break;
    case 'word':
    default:
      processingMultiplier = 1.0;
      break;
  }
  
  // Add base processing time (minimum 5 seconds)
  const processingTime = 5 + (uploadTimeEstimate * 0.5 * processingMultiplier);
  
  // Return total estimated time
  return Math.ceil(uploadTimeEstimate + processingTime);
};