// pdf_to_office_api.js
import { getAuthToken } from "@/services/authUtils";

// Update this with your actual API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Base function for PDF to office file conversion
 * @param {File} file - PDF file to convert
 * @param {String} endpoint - API endpoint for conversion
 * @param {Object} options - Conversion options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with result
 */
const convertPDFToOffice = async (file, endpoint, options = {}, onProgress) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('pdf_file', file);
    
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
          // Calculate upload progress (0-60%)
          // CloudConvert processing takes more time, so we allocate less to upload
          const uploadProgress = Math.round((event.loaded / event.total) * 60);
          onProgress(uploadProgress);
        }
      };
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3) {
          // Headers received, server is processing with CloudConvert
          if (!hasReceivedResponse && typeof onProgress === 'function') {
            hasReceivedResponse = true;
            onProgress(70); // Jump to 70% when CloudConvert starts processing
          }
        }
        else if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            // First go to 90% to show we're processing the response
            if (typeof onProgress === 'function') {
              onProgress(90);
            }
            
            // Simulate the final processing steps
            setTimeout(() => {
              // Set progress to 100% when complete
              if (typeof onProgress === 'function') {
                onProgress(100);
              }
              resolve(JSON.parse(xhr.responseText));
            }, 1000); // Slightly longer delay for CloudConvert processing
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
        // Upload is complete, but CloudConvert processing might still be happening
        if (typeof onProgress === 'function') {
          onProgress(65);
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
 * Convert PDF to Word document
 * @param {File} pdfFile - PDF file to convert
 * @param {Object} options - Conversion options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with result
 */
export const convertPDFToWord = async (pdfFile, options = {}, onProgress) => {
  return convertPDFToOffice(
    pdfFile, 
    'api/pdf/pdf-to-word/', 
    options, 
    onProgress
  );
};

/**
 * Convert PDF to PowerPoint presentation
 * @param {File} pdfFile - PDF file to convert
 * @param {Object} options - Conversion options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with result
 */
export const convertPDFToPowerPoint = async (pdfFile, options = {}, onProgress) => {
  return convertPDFToOffice(
    pdfFile, 
    'api/pdf/pdf-to-ppt/', 
    options, 
    onProgress
  );
};

/**
 * Convert PDF to Excel spreadsheet
 * @param {File} pdfFile - PDF file to convert
 * @param {Object} options - Conversion options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with result
 */
export const convertPDFToExcel = async (pdfFile, options = {}, onProgress) => {
  return convertPDFToOffice(
    pdfFile, 
    'api/pdf/pdf-to-excel/', 
    options, 
    onProgress
  );
};

/**
 * Get download URL for Word files
 * @param {string} fileId - ID of the file to download
 * @param {string} customFilename - Optional custom filename for the download
 * @returns {string} - Full download URL
 */
export const getWordDownloadUrl = (fileId, customFilename = null) => {
  let url = `${API_BASE_URL}/download-word/?file_id=${fileId}`;
  
  // Add custom filename as a query parameter if provided
  if (customFilename) {
    url += `&filename=${encodeURIComponent(customFilename)}`;
  }

  console.log(`Word Download URL: ${url}`);
  
  return url;
};

/**
 * Get download URL for PowerPoint files
 * @param {string} fileId - ID of the file to download
 * @param {string} customFilename - Optional custom filename for the download
 * @returns {string} - Full download URL
 */
export const getPowerPointDownloadUrl = (fileId, customFilename = null) => {
  let url = `${API_BASE_URL}/download-ppt/?file_id=${fileId}`;
  
  // Add custom filename as a query parameter if provided
  if (customFilename) {
    url += `&filename=${encodeURIComponent(customFilename)}`;
  }

  console.log(`PowerPoint Download URL: ${url}`);
  
  return url;
};

/**
 * Get download URL for Excel files
 * @param {string} fileId - ID of the file to download
 * @param {string} customFilename - Optional custom filename for the download
 * @returns {string} - Full download URL
 */
export const getExcelDownloadUrl = (fileId, customFilename = null) => {
  let url = `${API_BASE_URL}/download-excel/?file_id=${fileId}`;
  
  // Add custom filename as a query parameter if provided
  if (customFilename) {
    url += `&filename=${encodeURIComponent(customFilename)}`;
  }

  console.log(`Excel Download URL: ${url}`);
  
  return url;
};

/**
 * Generic download URL getter based on file type
 * @param {string} fileId - ID of the file to download
 * @param {string} fileType - Type of file ('word', 'ppt', 'excel')
 * @param {string} customFilename - Optional custom filename for the download
 * @returns {string} - Full download URL
 */
export const getDownloadUrl = (fileId, fileType, customFilename = null) => {
  const downloadFunctions = {
    'word': getWordDownloadUrl,
    'ppt': getPowerPointDownloadUrl,
    'powerpoint': getPowerPointDownloadUrl,
    'excel': getExcelDownloadUrl,
    'docx': getWordDownloadUrl,
    'pptx': getPowerPointDownloadUrl,
    'xlsx': getExcelDownloadUrl
  };
  
  const downloadFunction = downloadFunctions[fileType.toLowerCase()];
  
  if (!downloadFunction) {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
  
  return downloadFunction(fileId, customFilename);
};

/**
 * Download a file programmatically
 * @param {string} url - URL of the file to download
 * @param {string} filename - Suggested filename (passed in URL parameter)
 */
export const downloadFile = (url, filename) => {
  console.log(`Downloading from: ${url}`);
  
  // Create a URL with the custom filename if provided
  let downloadUrl = url;
  if (filename) {
    // Add or update the filename parameter
    const separator = url.includes('?') ? '&' : '?';
    downloadUrl = `${url}${separator}filename=${encodeURIComponent(filename)}`;
  }
  
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || ''; // Set download attribute
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download file by ID and type
 * @param {string} fileId - ID of the file to download
 * @param {string} fileType - Type of file ('word', 'ppt', 'excel')
 * @param {string} filename - Optional custom filename
 */
export const downloadFileById = (fileId, fileType, filename = null) => {
  const downloadUrl = getDownloadUrl(fileId, fileType, filename);
  downloadFile(downloadUrl, filename);
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
 * Check if a file is a valid PDF document
 * @param {File} file - File to check
 * @returns {boolean} - True if the file is valid PDF
 */
export const isValidPDFFile = (file) => {
  // Check MIME type
  const validTypes = [
    'application/pdf'
  ];
  
  // Also check file extension as a fallback
  const fileName = file.name.toLowerCase();
  const hasValidExtension = fileName.endsWith('.pdf');
  
  return validTypes.includes(file.type) || hasValidExtension;
};

/**
 * Get estimated conversion time based on file size and target format
 * @param {number} fileSize - Size of the file in bytes
 * @param {string} targetFormat - Target format ('word', 'ppt', 'excel')
 * @returns {number} - Estimated time in seconds
 */
export const estimateConversionTime = (fileSize, targetFormat) => {
  // Base upload speed estimation (300 KB/s considering PDF files can be large)
  const uploadTimeEstimate = Math.ceil(fileSize / (300 * 1024));
  
  // CloudConvert processing time varies by target format and complexity
  let processingMultiplier = 1;
  
  switch (targetFormat.toLowerCase()) {
    case 'word':
    case 'docx':
      processingMultiplier = 1.5; // Text extraction and formatting
      break;
    case 'ppt':
    case 'pptx':
    case 'powerpoint':
      processingMultiplier = 2.0; // Complex layout and graphics handling
      break;
    case 'excel':
    case 'xlsx':
      processingMultiplier = 2.5; // Table detection and data extraction
      break;
    default:
      processingMultiplier = 1.5;
      break;
  }
  
  // CloudConvert base processing time (minimum 10 seconds for PDF conversion)
  const processingTime = 10 + (uploadTimeEstimate * 0.8 * processingMultiplier);
  
  // Add extra time for CloudConvert API overhead
  const apiOverhead = 5;
  
  // Return total estimated time
  return Math.ceil(uploadTimeEstimate + processingTime + apiOverhead);
};

/**
 * Get file extension based on target format
 * @param {string} targetFormat - Target format ('word', 'ppt', 'excel')
 * @returns {string} - File extension
 */
export const getFileExtension = (targetFormat) => {
  const extensionMap = {
    'word': 'docx',
    'ppt': 'pptx',
    'powerpoint': 'pptx',
    'excel': 'xlsx',
    'docx': 'docx',
    'pptx': 'pptx',
    'xlsx': 'xlsx'
  };
  
  return extensionMap[targetFormat.toLowerCase()] || 'docx';
};

/**
 * Generate output filename based on input PDF and target format
 * @param {string} pdfFileName - Original PDF filename
 * @param {string} targetFormat - Target format ('word', 'ppt', 'excel')
 * @returns {string} - Generated output filename
 */
export const generateOutputFilename = (pdfFileName, targetFormat) => {
  // Remove .pdf extension and add new extension
  const baseName = pdfFileName.replace(/\.pdf$/i, '');
  const extension = getFileExtension(targetFormat);
  
  return `${baseName}.${extension}`;
};

/**
 * Validate conversion options
 * @param {Object} options - Conversion options to validate
 * @param {string} targetFormat - Target format for validation
 * @returns {Object} - Validated and cleaned options
 */
export const validateConversionOptions = (options, targetFormat) => {
  const validatedOptions = { ...options };
  
  // Validate output filename
  if (validatedOptions.outputFilename) {
    const expectedExtension = getFileExtension(targetFormat);
    if (!validatedOptions.outputFilename.toLowerCase().endsWith(`.${expectedExtension}`)) {
      validatedOptions.outputFilename += `.${expectedExtension}`;
    }
  }
  
  return validatedOptions;
};

/**
 * Handle conversion errors with user-friendly messages
 * @param {Error} error - Error object from conversion
 * @returns {string} - User-friendly error message
 */
export const handleConversionError = (error) => {
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('file size')) {
    return 'File size exceeds the maximum limit of 20MB. Please try with a smaller file.';
  } else if (errorMessage.includes('invalid file format')) {
    return 'Invalid file format. Please upload a valid PDF file.';
  } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
    return 'Service quota exceeded. Please try again later.';
  } else if (errorMessage.includes('timeout')) {
    return 'Conversion timed out. Please try again with a smaller file.';
  } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return 'Network error. Please check your connection and try again.';
  } else {
    return 'Conversion failed. Please try again or contact support if the problem persists.';
  }
};

/**
 * Check conversion status (for potential future use with async processing)
 * @param {string} jobId - Job ID from conversion response
 * @returns {Promise} - Promise that resolves with job status
 */
export const checkConversionStatus = async (jobId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversion-status/${jobId}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to check conversion status: ${error.message}`);
  }
};