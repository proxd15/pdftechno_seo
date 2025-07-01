/**
 * XML to PDF Converter API client
 * Handles communication with the backend API
 */
import { getAuthToken } from "@/services/authUtils";

// Update this with your actual API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Convert XML files to PDF
 * @param {FormData} formData - FormData containing XML files and options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with conversion results
 */
export const convertXMLToPDF = async (formData, onProgress) => {
  try {
    // Track upload progress using XMLHttpRequest
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
              reject(new Error(errorData.error || 'XML to PDF conversion failed'));
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
      
      // Open and send the request
      xhr.open('POST', `${API_BASE_URL}/api/pdf/xml-to-pdf/`, true);
      const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  } catch (error) {
    throw new Error(`XML to PDF conversion failed: ${error.message}`);
  }
};

/**
 * Analyze XML file structure without converting
 * @param {File} xmlFile - Single XML file to analyze
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with analysis results
 */
export const analyzeXMLStructure = async (xmlFile, onProgress) => {
  try {
    const formData = new FormData();
    formData.append('xml_file', xmlFile);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && typeof onProgress === 'function') {
          const uploadProgress = Math.round((event.loaded / event.total) * 90);
          onProgress(uploadProgress);
        }
      };
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            if (typeof onProgress === 'function') {
              onProgress(100);
            }
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || 'XML analysis failed'));
            } catch (e) {
              reject(new Error(`Server error: ${xhr.status}`));
            }
          }
        }
      };
      
      // Open and send the request with action=analyze query parameter
      xhr.open('POST', `${API_BASE_URL}/api/pdf/xml-to-pdf/?action=analyze`, true);
      const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  } catch (error) {
    throw new Error(`XML analysis failed: ${error.message}`);
  }
};

/**
 * Get conversion options and recommendations
 * @returns {Promise} - Promise that resolves with available options
 */
export const getConversionOptions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pdf/xml-to-pdf/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch options: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Failed to get conversion options: ${error.message}`);
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
  // These endpoints should match your Django download URLs
  const endpoint = fileType === 'zip' ? 'download-zip' : 'download-pdf';
  let url = `${API_BASE_URL}/${endpoint}/?file_id=${fileId}`;
  
  // Add custom filename as a query parameter if provided
  if (customFilename) {
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
  // console.log(`Downloading from: ${url}`);
  
  const link = document.createElement('a');
  link.href = url;
  // Let the backend handle the filename
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Validate XML file before upload
 * @param {File} file - File to validate
 * @returns {Object} - Validation result with isValid and error message
 */
export const validateXMLFile = (file) => {
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const SUPPORTED_EXTENSIONS = ['.xml', '.xsd', '.xsl', '.xslt'];
  
  // Check file type
  if (!file.type.includes('xml') && !file.type.includes('text')) {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: `"${file.name}" is not a valid XML file. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`
      };
    }
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `"${file.name}" exceeds the 20MB file size limit.`
    };
  }
  
  return { isValid: true };
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Get complexity level color for UI
 * @param {string} complexityLevel - Complexity level from analysis
 * @returns {string} - CSS color class
 */
export const getComplexityColor = (complexityLevel) => {
  switch (complexityLevel?.toLowerCase()) {
    case 'simple':
      return 'text-green-600 bg-green-100';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100';
    case 'complex':
      return 'text-orange-600 bg-orange-100';
    case 'very complex':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Get recommended format based on complexity
 * @param {string} complexityLevel - Complexity level from analysis
 * @returns {string} - Recommended format
 */
export const getRecommendedFormat = (complexityLevel) => {
  switch (complexityLevel?.toLowerCase()) {
    case 'simple':
      return 'structured';
    case 'medium':
      return 'table';
    case 'complex':
    case 'very complex':
      return 'hybrid';
    default:
      return 'hybrid';
  }
};