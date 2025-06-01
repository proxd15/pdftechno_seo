// pdfrepair_api.js

/**
 * PDF Repair API client
 * Handles communication with the backend API for PDF repair
 */

import { getAuthToken } from "@/services/authUtils";

// Use the same API base URL as other API clients
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Repair a corrupted PDF file
 * @param {FormData} formData - FormData containing PDF file
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with repair results
 */
export const repairPDF = async (formData, onProgress) => {
  try {
    // Track upload progress using XMLHttpRequest
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let hasReceivedResponse = false;
      
      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && typeof onProgress === 'function') {
          // Calculate upload progress (0-30%)
          const uploadProgress = Math.round((event.loaded / event.total) * 30);
          onProgress(uploadProgress);
        }
      };
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3) {
          // Headers received, server is processing
          if (!hasReceivedResponse && typeof onProgress === 'function') {
            hasReceivedResponse = true;
            onProgress(40); // Jump to 40% when server starts processing
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
                message: errorData.error || 'Repair operation failed',
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
        // Upload is complete, but repair processing might still be happening
        if (typeof onProgress === 'function') {
          onProgress(35);
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
      xhr.open('POST', `${API_BASE_URL}/api/pdf/repair-pdf/`, true);
       const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  } catch (error) {
    throw new Error(`PDF repair failed: ${error.message}`);
  }
}
// pdfrepair_api.js (continued)

/**
 * Create FormData for a PDF repair request
 * @param {File} pdfFile - The PDF file to repair
 * @param {string} repairMethod - Optional repair method
 * @returns {FormData} - FormData ready to send to the API
 */
export const createRepairFormData = (pdfFile, repairMethod = 'all') => {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('repair_method', repairMethod);
  
  return formData;
};

/**
 * Get download URL for the repaired file
 * @param {string} fileId - ID of the file to download
 * @param {string} customFilename - Optional custom filename for the download
 * @returns {string} - Full download URL
 */
export const getRepairDownloadUrl = (fileId, customFilename = null) => {
  // Create a timestamp for URL expiration
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Get signature from the backend
  // For simplicity, I'm showing an API call here, but you could also
  // have the signature generated when the file processing completes
  let url = `${API_BASE_URL}/download-pdf/?file_id=${fileId}&timestamp=${timestamp}`;
  
  // Add signature to URL (this should be generated server-side)
  fetch(`${API_BASE_URL}/api/generate-signature/?file_id=${fileId}&timestamp=${timestamp}`)
    .then(response => response.json())
    .then(data => {
      url += `&signature=${data.signature}`;
    })
    .catch(error => {
      console.error('Error generating signature:', error);
    });
  
  // Add custom filename as a query parameter if provided
  if (customFilename) {
    // Make sure it has .pdf extension
    if (!customFilename.toLowerCase().endsWith('.pdf')) {
      customFilename += '.pdf';
    }
    
    url += `&filename=${encodeURIComponent(customFilename)}`;
  }
  
  return url;
};

/**
 * Download a repaired file programmatically
 * @param {string} url - URL of the file to download
 * @param {string} filename - Name to save the file as
 */
export const downloadRepairedFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'repaired_document.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Check if a PDF file is valid using client-side validation
 * @param {File} pdfFile - The PDF file to check
 * @returns {Promise<Object>} - Promise that resolves with { valid, encrypted, message }
 */
export const checkPDFValidity = async (pdfFile) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = function(e) {
      try {
        const arrayBuffer = e.target.result;
        const pdfBytes = new Uint8Array(arrayBuffer);
        
        // Check if file starts with %PDF header
        const header = String.fromCharCode.apply(null, pdfBytes.slice(0, 5));
        if (!header.startsWith('%PDF')) {
          resolve({ 
            valid: false, 
            encrypted: false, 
            message: "Not a valid PDF file. File header is missing or corrupted." 
          });
          return;
        }
        
        // Use PDF.js to try to parse the PDF
        if (window.pdfjsLib) {
          const loadingTask = window.pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
            cMapPacked: true
          });
          
          loadingTask.promise
            .then(pdf => {
              // Successfully loaded, check for encryption
              if (pdf.encrypted) {
                resolve({ 
                  valid: true, 
                  encrypted: true, 
                  message: "PDF is encrypted and requires a password. Please decrypt it first." 
                });
              } else {
                resolve({ 
                  valid: true, 
                  encrypted: false, 
                  message: "PDF appears to be valid." 
                });
              }
            })
            .catch(error => {
              // Check if it's a password error
              if (error.name === 'PasswordException' || error.message.includes('password')) {
                resolve({ 
                  valid: true, 
                  encrypted: true, 
                  message: "PDF is encrypted and requires a password. Please decrypt it first." 
                });
              } else {
                resolve({ 
                  valid: false, 
                  encrypted: false, 
                  message: `PDF may be corrupted: ${error.message}` 
                });
              }
            });
        } else {
          // If PDF.js is not available, just check the header
          resolve({ 
            valid: header.startsWith('%PDF'), 
            encrypted: false, 
            message: header.startsWith('%PDF') ? 
              "PDF header detected, but full validation requires PDF.js." : 
              "Not a valid PDF file. File header is missing or corrupted." 
          });
        }
      } catch (error) {
        resolve({ 
          valid: false, 
          encrypted: false, 
          message: `Error validating PDF: ${error.message}` 
        });
      }
    };
    
    fileReader.onerror = function() {
      reject(new Error("Error reading file"));
    };
    
    fileReader.readAsArrayBuffer(pdfFile);
  });
};