// ====================
// API CLIENT (heictopdf_api.js)
// ====================

/**
 * HEIC to PDF API client
 * Handles communication with the backend API for converting HEIC images to PDF
 */
import { getAuthToken } from "@/services/authUtils";

// Update this with your actual API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Convert HEIC images to PDF
 * @param {FormData} formData - FormData containing HEIC files and options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with result
 */
export const convertHEICToPDF = async (formData, onProgress) => {
  try {
    // Track upload progress using XMLHttpRequest
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let hasReceivedResponse = false;
      
      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && typeof onProgress === 'function') {
          // Calculate upload progress (0-75%)
          // HEIC files can be larger, so we give more weight to upload
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
              reject(new Error(errorData.error || 'HEIC conversion failed'));
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
      xhr.open('POST', `${API_BASE_URL}/api/pdf/heic-to-pdf/`, true);

      const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  } catch (error) {
    throw new Error(`HEIC to PDF conversion failed: ${error.message}`);
  }
};

/**
 * Generate HEIC preview on server
 * @param {File} heicFile - HEIC file to generate preview for
 * @returns {Promise<string|null>} - Base64 data URL or null if failed
 */
export const generateHEICPreview = async (heicFile) => {
  try {
    const formData = new FormData();
    formData.append('heic_file', heicFile);
    
    const response = await fetch(`${API_BASE_URL}/api/pdf/heic-preview/`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate preview');
    }
    
    const data = await response.json();
    
    if (data.success && data.preview_url) {
      // console.log(`Generated preview for HEIC file: ${heicFile.name}`);
      return {
        previewUrl: data.preview_url,
        originalWidth: data.original_width,
        originalHeight: data.original_height,
        thumbnailWidth: data.thumbnail_width,
        thumbnailHeight: data.thumbnail_height,
        fileSize: data.file_size
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Error generating HEIC preview:', error);
    return null;
  }
};

/**
 * Generate previews for multiple HEIC files
 * @param {File[]} heicFiles - Array of HEIC files
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Array>} - Array of preview data
 */
export const generateMultipleHEICPreviews = async (heicFiles, onProgress) => {
  const previews = [];
  const total = heicFiles.length;
  
  for (let i = 0; i < heicFiles.length; i++) {
    try {
      const preview = await generateHEICPreview(heicFiles[i]);
      previews.push({
        file: heicFiles[i],
        preview: preview?.previewUrl || null,
        metadata: preview || null,
        index: i
      });
      
      // Update progress
      if (onProgress) {
        onProgress(Math.round(((i + 1) / total) * 100));
      }
    } catch (error) {
      console.error(`Failed to generate preview for ${heicFiles[i].name}:`, error);
      previews.push({
        file: heicFiles[i],
        preview: null,
        metadata: null,
        index: i,
        error: error.message
      });
    }
  }
  
  return previews;
};

/**
 * Prepare form data for HEIC to PDF conversion
 * @param {File[]} heicFiles - Array of HEIC files to convert
 * @param {Object} options - Conversion options
 * @returns {FormData} - FormData object ready to send to the API
 */
export const prepareHEICToPdfFormData = (heicFiles, options = {}) => {
  const formData = new FormData();
  
  // Add each HEIC file with the correct prefix
  heicFiles.forEach((file, index) => {
    formData.append(`heic_${index}`, file);
  });
  
  // Add conversion options
  const {
    pageOrientation = 'portrait',
    compressionQuality = 'lossless',
    pageMargins = 'none',
    separatePdfs = false,
    rotations = {}
  } = options;
  
  formData.append('page_orientation', pageOrientation);
  formData.append('compression_quality', compressionQuality);
  formData.append('page_margins', pageMargins);
  formData.append('separate_pdfs', separatePdfs);
  
  // Add rotation angles for specific images if provided
  Object.entries(rotations).forEach(([index, angle]) => {
    formData.append(`rotation_${index}`, angle);
  });
  
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
  // These endpoints should match your Django download URLs
  const endpoint = fileType === 'zip' ? 'download-zip' : 'download-pdf';
  let url = `${API_BASE_URL}/${endpoint}/?file_id=${fileId}`;
  
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
 * Get estimated size reduction based on compression options
 * @param {number} totalSize - Total size of all HEIC files in bytes
 * @param {string} compressionQuality - Selected compression quality
 * @returns {Object} - Estimated size and reduction percentage
 */
export const estimateOutputSize = (totalSize, compressionQuality = 'lossless') => {
  let estimatedReduction = 0;
  
  // HEIC files are typically already compressed, so reduction estimates are different
  switch (compressionQuality) {
    case 'low':
      estimatedReduction = 0.8; // 80% reduction - aggressive compression
      break;
    case 'medium':
      estimatedReduction = 0.6; // 60% reduction - balanced compression
      break;
    case 'lossless':
    default:
      estimatedReduction = 0.3; // 30% reduction - minimal compression
      break;
  }
  
  const estimatedSize = Math.round(totalSize * (1 - estimatedReduction));
  const reductionPercentage = Math.round(estimatedReduction * 100);
  
  return {
    originalSize: totalSize,
    estimatedSize,
    reductionPercentage
  };
};

/**
 * Check if a file is a valid HEIC file
 * @param {File} file - File to check
 * @returns {boolean} - True if the file is a valid HEIC file
 */
export const isValidHEIC = (file) => {
  const validTypes = [
    'image/heic',
    'image/heif'
  ];
  
  // Also check file extension as MIME type might not always be detected
  const fileName = file.name.toLowerCase();
  const validExtensions = ['.heic', '.heif'];
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  
  return validTypes.includes(file.type) || hasValidExtension;
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