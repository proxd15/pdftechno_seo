/**
 * PDF to Image API client
 * Handles communication with the backend API for PDF to image conversion
 */

import { getAuthToken } from "@/services/authUtils";

// Use the same API base URL as other API clients
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Define constants for file extensions and types
const FILE_EXTENSIONS = {
  PDF: '.pdf',
  JPEG: '.jpg',
  PNG: '.png',
  TIFF: '.tiff',
  BMP: '.bmp',
  ZIP: '.zip'
};

const FILE_TYPES = {
  PDF: 'pdf',
  JPEG: 'jpg',
  PNG: 'png',
  TIFF: 'tiff',
  BMP: 'bmp',
  ZIP: 'zip'
};

const IMAGE_FORMATS = {
  JPEG: 'JPEG',
  PNG: 'PNG',
  TIFF: 'TIFF',
  BMP: 'BMP'
};

/**
 * Convert PDF file to images
 * @param {FormData} formData - FormData containing PDF file, conversion options, and optional password
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with conversion results
 */
export const convertPDFToImages = async (formData, onProgress) => {
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
      xhr.open('POST', `${API_BASE_URL}/api/pdf/pdf-to-image/`, true);
       const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  } catch (error) {
    throw new Error(`PDF to image conversion failed: ${error.message}`);
  }
};

// pdftoimage_api.js

/**
 * Create FormData for a PDF to image conversion request
 * @param {Array<File>} pdfFiles - Array of PDF files to convert
 * @param {string} imageFormat - Format for output images (JPEG, PNG, TIFF, BMP)
 * @param {Object} passwords - Object mapping filenames to passwords for encrypted PDFs
 * @returns {FormData} - FormData ready to send to the API
 */
export const createConversionFormData = (
  pdfFiles,
  imageFormat = IMAGE_FORMATS.JPEG,
  passwords = {}
) => {
  const formData = new FormData();
  
  // Add all PDF files
  if (Array.isArray(pdfFiles)) {
    pdfFiles.forEach(file => {
      formData.append('pdf_files', file);
    });
  } else {
    // Single file case
    formData.append('pdf_files', pdfFiles);
  }
  
  // Validate image format
  const validFormats = Object.values(IMAGE_FORMATS);
  imageFormat = validFormats.includes(imageFormat) ? imageFormat : IMAGE_FORMATS.JPEG;
  
  formData.append('image_format', imageFormat);
  
  // Add passwords if provided
  if (Object.keys(passwords).length > 0) {
    formData.append('passwords', JSON.stringify(passwords));
  }
  
  return formData;
};

/**
 * Get download URL for a file
 * @param {string} fileId - ID of the file to download
 * @param {string} fileType - Type of file ('pdf', 'jpg', 'png', 'tiff', 'bmp', or 'zip')
 * @param {string} customFilename - Optional custom filename for the download
 * @returns {string} - Full download URL
 */
export const getDownloadUrl = (fileId, fileType, customFilename = null) => {
  // Determine the correct endpoint based on file type
  let endpoint;
  
  if (fileType === FILE_TYPES.ZIP) {
    endpoint = 'download-zip';
  } else if ([FILE_TYPES.JPEG, FILE_TYPES.PNG, FILE_TYPES.TIFF, FILE_TYPES.BMP].includes(fileType)) {
    endpoint = 'download-file'; // For single image files
  } else {
    // Default to PDF
    endpoint = 'download-pdf';
    fileType = FILE_TYPES.PDF;
  }
  
  let url = `${API_BASE_URL}/${endpoint}/?file_id=${fileId}`;
  
  // Add custom filename as a query parameter if provided
  if (customFilename) {
    // Get the correct extension for the file type
    const extension = FILE_EXTENSIONS[fileType.toUpperCase()] || FILE_EXTENSIONS.PDF;
    
    // Make sure it has the correct extension for the file type
    if (!customFilename.toLowerCase().endsWith(extension)) {
      customFilename += extension;
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

/**
 * Get preview URL for an image or pdf
 * @param {string} fileId - ID of the file to preview
 * @param {string} fileType - Type of file ('jpg', 'png', etc.)
 * @returns {Promise<string>} - Promise that resolves with the preview URL
 */
export const getPreviewUrl = async (fileId, fileType) => {
  try {
    // Determine correct download endpoint
    let endpoint;
    if ([FILE_TYPES.JPEG, FILE_TYPES.PNG, FILE_TYPES.TIFF, FILE_TYPES.BMP].includes(fileType)) {
      endpoint = 'download-file';
    } else {
      endpoint = 'download-pdf';
      fileType = FILE_TYPES.PDF;
    }
    
    // Fetch the file data
    const response = await fetch(`${API_BASE_URL}/${endpoint}/?file_id=${fileId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    // Get the data as a blob
    const blob = await response.blob();
    
    // Create an object URL from the blob
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error preparing preview:', error);
    throw error;
  }
};

/**
 * Get thumbnail preview URLs from a zip file containing images
 * @param {string} fileId - ID of the zip file
 * @param {number} maxThumbnails - Maximum number of thumbnails to extract (default: 5)
 * @returns {Promise<Array<string>>} - Promise that resolves with array of thumbnail URLs
 */
export const getZipThumbnailPreviews = async (fileId, maxThumbnails = 5) => {
  try {
    // Fetch the ZIP file
    const response = await fetch(getDownloadUrl(fileId, FILE_TYPES.ZIP));
    if (!response.ok) {
      throw new Error(`Failed to fetch ZIP: ${response.status} ${response.statusText}`);
    }
    
    // Get the ZIP data as a blob
    const zipBlob = await response.blob();
    
    // Use JSZip to extract image files
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipBlob);
    
    // Filter image files and limit to maxThumbnails
    const imageFiles = Object.values(zipContent.files)
      .filter(file => !file.dir && /\.(jpe?g|png|tiff?|bmp)$/i.test(file.name))
      .slice(0, maxThumbnails);
    
    // Extract and create object URLs for each image
    const thumbnailUrls = await Promise.all(
      imageFiles.map(async (file) => {
        const content = await file.async('blob');
        return URL.createObjectURL(content);
      })
    );
    
    return thumbnailUrls;
  } catch (error) {
    console.error('Error extracting thumbnails from ZIP:', error);
    throw error;
  }
};