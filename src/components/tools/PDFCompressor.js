"use client"

import { useState, useRef, useEffect } from 'react';
import { compressPDFs, getDownloadUrl, downloadFile } from '../../api/compress_api';
import ModalLoader from '../tools_utility/ModalLoader';
import DecryptionHandler from '@/components/tools_utility/DecryptionHandler';
import PDFPreviewModal from '../tools_utility/PDFPreviewModal.';
import SelectFiles from '../tools_utility/SelectFiles';
import DownloadSection from '../tools_utility/DownloadSection';


// PDF.js is imported via script tag in the page

const PDFCompressor = () => {


  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState({});
  const [compressionLevel, setCompressionLevel] = useState('recommended');
  const [grayScale, setGrayScale] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [compressionResult, setCompressionResult] = useState(null);
  const fileInputRef = useRef(null);
  const resultSectionRef = useRef(null);
  const [infoTooltip, setInfoTooltip] = useState('');
  const [encryptedFiles, setEncryptedFiles] = useState({});
  const [decryptedFiles, setDecryptedFiles] = useState({});
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    fileIndex: null,
    fileName: '',
    error: ''
  });

  // File size limits (in bytes)
  const MAX_SINGLE_FILE_SIZE = 200 * 1024 * 1024; // 100 MB
  const MAX_TOTAL_FILES_SIZE = 200 * 1024 * 1024; // 200 MB

  // Calculate total size of all files
  const totalSize = files.reduce((total, file) => total + file.size, 0);

  // Calculate estimated upload time based on file size (rough estimate)
  // Using 400 KB/s as estimation base for average connection
  const estimatedUploadTime = Math.ceil(totalSize / (400 * 1024));

  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    pdfUrl: null,
    fileName: ''
  });
  const handlePreview = async (fileId, fileName) => {
    setPreviewModal({
      isOpen: true,
      pdfUrl: await getPreviewUrl(fileId),
      fileName: fileName
    });
  };

  const handleDownload = (fileId, fileName) => {
    // Add .pdf extension if missing
    const finalFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    downloadFile(getDownloadUrl(fileId, 'pdf', finalFileName), finalFileName);
  };
  
  // Update the function to accept a file ID parameter
  const handleOpenPreview = async (fileId, fileName) => {
    if (compressionResult) {
      try {
        setIsProcessing(true); // Show loading indicator
        
        // Get the download URL using the passed fileId
        const downloadUrl = getDownloadUrl(fileId, 'pdf');
        console.log('Fetching PDF from URL:', downloadUrl);
        
        // Fetch the PDF data
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        // Get the PDF data as a blob
        const pdfBlob = await response.blob();
        
        // Create an object URL from the blob
        const objectUrl = URL.createObjectURL(pdfBlob);
        console.log('Created Object URL for preview:', objectUrl);
        
        // Open the preview modal with the object URL and custom filename
        setPreviewModal({
          isOpen: true,
          pdfUrl: objectUrl,
          fileName: fileName || 'Compressed Document.pdf'
        });
      } catch (error) {
        console.error('Error preparing PDF preview:', error);
        setError('Unable to preview the PDF. Please try downloading instead.');
      } finally {
        setIsProcessing(false); // Hide loading indicator
      }
    }
  };
  
const handleFilesSelected = (selectedFiles) => {
  // Add to existing files
  setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
};
  // Function to close the PDF preview modal
  const handleClosePreview = () => {
    setPreviewModal({
      isOpen: false,
      pdfUrl: null,
      fileName: ''
    });
  };
  

  // Scroll to results section when compression completes
  useEffect(() => {
    if (compressionResult && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [compressionResult]);

  // Generate previews whenever files change
  useEffect(() => {
    const generatePreviews = async () => {
      const newPreviews = { ...previews };

      for (const file of files) {
        if (!previews[file.name]) {
          try {
            const arrayBuffer = await file.arrayBuffer();

            // Check if PDF is valid, encrypted, or corrupted
            try {
              // Use window.pdfjsLib which is loaded from CDN
              const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              const page = await pdf.getPage(1);

              // Use fixed dimensions for preview
              const maxWidth = 200;
              const maxHeight = 250;

              const viewport = page.getViewport({ scale: 1.0 });

              // Calculate scale to fit within our constraints while maintaining aspect ratio
              const scaleX = maxWidth / viewport.width;
              const scaleY = maxHeight / viewport.height;
              const scale = Math.min(scaleX, scaleY);

              const scaledViewport = page.getViewport({ scale });

              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');

              canvas.height = scaledViewport.height;
              canvas.width = scaledViewport.width;

              await page.render({
                canvasContext: context,
                viewport: scaledViewport
              }).promise;

              newPreviews[file.name] = canvas.toDataURL();
            } catch (error) {
              console.error('Error generating preview for:', file.name, error);

              // Check for password-protected/encrypted PDF
              if (error.name === 'PasswordException' || error.message.includes('password')) {
                newPreviews[file.name] = 'encrypted';
                setError(`"${file.name}" is password protected or encrypted. Please remove this file.`);
              } else {
                // Assume other errors are due to corruption
                newPreviews[file.name] = 'corrupted';
                setEncryptedFiles(prev => ({
                  ...prev,
                  [file.name]: true
                }));
              }

              // Mark the file as problematic but keep it in the list for now
              // so the user can see which file has the issue
            }
          } catch (error) {
            console.error('General error processing file:', file.name, error);
            newPreviews[file.name] = 'invalid';
            setError(`"${file.name}" is not a valid PDF file. Please remove this file.`);
          }
        }
      }

      setPreviews(newPreviews);
    };

    if (window.pdfjsLib && files.length > 0) {
      generatePreviews();
    }
  }, [files]);

  const handleDecryptFile = (fileIndex) => {
    const file = files[fileIndex];
    setPasswordModal({
      isOpen: true,
      fileIndex,
      fileName: file.name,
      error: ''
    });
  };

  // In the handlePasswordSubmit function:
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const { fileIndex, password } = passwordModal;
    if (!password.trim()) {
      setPasswordModal(prev => ({
        ...prev,
        error: 'Please enter a password'
      }));
      return;
    }

    const file = files[fileIndex];

    try {
      setIsProcessing(true); // Show loading during password verification

      const arrayBuffer = await file.arrayBuffer();

      // Attempt to load the PDF with the password
      const loadingTask = window.pdfjsLib.getDocument({
        data: arrayBuffer,
        password: password
      });

      const pdf = await loadingTask.promise;

      // Password is correct if we reached here
      // Update the encrypted files tracking
      setEncryptedFiles(prev => ({
        ...prev,
        [file.name]: true
      }));

      // Store the password for this file
      setDecryptedFiles(prev => ({
        ...prev,
        [file.name]: {
          file,
          password
        }
      }));

      // Create preview
      const page = await pdf.getPage(1);
      const maxWidth = 200;
      const maxHeight = 250;
      const viewport = page.getViewport({ scale: 1.0 });
      const scaleX = maxWidth / viewport.width;
      const scaleY = maxHeight / viewport.height;
      const scale = Math.min(scaleX, scaleY);
      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      await page.render({
        canvasContext: context,
        viewport: scaledViewport
      }).promise;

      // Store the preview
      setPreviews(prev => ({
        ...prev,
        [file.name]: canvas.toDataURL()
      }));

      // Close the modal
      setPasswordModal({ isOpen: false, fileIndex: null, fileName: '', password: '', error: '' });

      // Clear any error
      setError(null);

    } catch (error) {
      console.error('Error processing password:', error);

      if (error.name === 'PasswordException' || error.message.includes('password')) {
        setPasswordModal(prev => ({
          ...prev,
          error: 'Incorrect password. Please try again.',
          password: ''
        }));
      } else {
        setPasswordModal(prev => ({
          ...prev,
          error: 'Failed to process the file. The file may be corrupted.'
        }));
      }
    } finally {
      setIsProcessing(false);
    }
  };
  const generateDecryptedPreview = async (file, password) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingParams = {
        data: arrayBuffer,
        password: password
      };

      const pdf = await window.pdfjsLib.getDocument(loadingParams).promise;
      const page = await pdf.getPage(1);

      // Use fixed dimensions for preview
      const maxWidth = 200;
      const maxHeight = 250;

      const viewport = page.getViewport({ scale: 1.0 });

      // Calculate scale to fit within our constraints
      const scaleX = maxWidth / viewport.width;
      const scaleY = maxHeight / viewport.height;
      const scale = Math.min(scaleX, scaleY);

      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      await page.render({
        canvasContext: context,
        viewport: scaledViewport
      }).promise;

      // Update preview
      setPreviews(prev => ({
        ...prev,
        [file.name]: canvas.toDataURL()
      }));
    } catch (error) {
      console.error('Error generating preview for decrypted file:', error);
    }
  };

  // Set up page-wide drag and drop
  useEffect(() => {
    // Get the drag overlay element
    const dragOverlay = document.getElementById('drag-overlay');

    // Add dragover event listener to the entire document
    const handleDocumentDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      // Show the drag overlay
      if (dragOverlay) {
        dragOverlay.style.opacity = '1';
      }
    };

    // Add dragleave event listener to the entire document
    const handleDocumentDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Only set isDragging to false if we're leaving the document
      if (!e.relatedTarget || e.relatedTarget.nodeName === 'HTML') {
        setIsDragging(false);

        // Hide the drag overlay
        if (dragOverlay) {
          dragOverlay.style.opacity = '0';
        }
      }
    };

    // Add drop event listener to the entire document
    const handleDocumentDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      // Hide the drag overlay
      if (dragOverlay) {
        dragOverlay.style.opacity = '0';
      }

      // Only add files if the drop didn't happen on a specific drop zone
      const isInsideDropZone = e.target.closest('.drop-zone');
      if (!isInsideDropZone) {
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFilesWithValidation(droppedFiles);
      }
    };

    // Register the event listeners
    document.addEventListener('dragover', handleDocumentDragOver);
    document.addEventListener('dragleave', handleDocumentDragLeave);
    document.addEventListener('drop', handleDocumentDrop);

    // Clean up on component unmount
    return () => {
      document.removeEventListener('dragover', handleDocumentDragOver);
      document.removeEventListener('dragleave', handleDocumentDragLeave);
      document.removeEventListener('drop', handleDocumentDrop);
    };
  }, []);

  // Validate files before adding them
  const addFilesWithValidation = (newFiles) => {
    // Reset error
    setError(null);

    // Filter for PDF files
    const pdfFiles = newFiles.filter(file => {
      if (file.type !== 'application/pdf') {
        setError(`"${file.name}" is not a PDF file. Only PDF files are supported.`);
        return false;
      }
      return true;
    });

    if (pdfFiles.length === 0) return;

    // Check individual file size
    const validSizeFiles = pdfFiles.filter(file => {
      if (file.size > MAX_SINGLE_FILE_SIZE) {
        setError(`"${file.name}" exceeds the 100 MB file size limit.`);
        return false;
      }
      return true;
    });

    if (validSizeFiles.length === 0) return;

    // Check total file size
    const newTotalSize = totalSize + validSizeFiles.reduce((sum, file) => sum + file.size, 0);
    if (newTotalSize > MAX_TOTAL_FILES_SIZE) {
      setError(`Total file size exceeds the 200 MB limit. Please remove some files.`);
      return;
    }

    // Add valid files
    setFiles(prevFiles => [...prevFiles, ...validSizeFiles]);
  };

  // Local drag event handlers for visual feedback
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFilesWithValidation(droppedFiles);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      addFilesWithValidation(selectedFiles);
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = null;
  };

  const handleSelectFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error("File input reference is not available");

      // As a fallback, try to find the input element and click it directly
      const fileInput = document.querySelector('input[type="file"][accept="application/pdf"]');
      if (fileInput) {
        fileInput.click();
      }
    }
  };

  const removeFile = (index) => {
    const updatedFiles = [...files];
    const removedFile = updatedFiles[index];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);

    // Clean up preview
    if (previews[removedFile.name]) {
      setPreviews(prev => {
        const updated = { ...prev };
        delete updated[removedFile.name];
        return updated;
      });
    }

    // Clear error if there are no more files
    if (updatedFiles.length === 0) {
      setError(null);
    }
  };

  const removeAllFiles = () => {
    setFiles([]);
    setPreviews({});
    setCompressionResult(null);
    setError(null);
  };

  // Reset to initial state
  const handleReset = () => {
    setFiles([]);
    setPreviews({});
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    setCompressionResult(null);
  };

  // Check if any files are problematic (corrupted, encrypted, etc.)
  const hasProblematicFiles = Object.values(previews).some(
    preview => preview === 'corrupted' || preview === 'encrypted' || preview === 'invalid'
  );

  // Handle PDF compression
  // Handle PDF compression
  const handleCompressPDF = async () => {
    if (files.length === 0) return;

    // Check for problematic files before compressing
    const hasUnhandledEncryptedFiles = files.some(
      file => previews[file.name] === 'encrypted' && !decryptedFiles[file.name]
    );

    if (hasUnhandledEncryptedFiles) {
      // Find the first file that needs decryption
      const fileIndex = files.findIndex(
        file => previews[file.name] === 'encrypted' && !decryptedFiles[file.name]
      );

      if (fileIndex !== -1) {
        handleDecryptFile(fileIndex);
        setError("Please provide passwords for all encrypted PDFs before compression.");
        return;
      }
    }

    // Check for other problematic files
    const hasOtherProblematicFiles = files.some(file => {
      const previewState = previews[file.name];
      return previewState === 'corrupted' || previewState === 'invalid';
    });

    if (hasOtherProblematicFiles) {
      setError("Please remove all corrupted or invalid PDF files before compression.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setCompressionResult(null);

    try {
      // Create FormData to send files and passwords
      const formData = new FormData();

      // Add compression settings
      const levelMap = {
        'high': '50',     // High compression = 50 in backend
        'recommended': '70', // Recommended compression = 70 in backend
        'low': '100'      // Low compression = 100 in backend
      };

      // Add compression options
      formData.append('compression_level', levelMap[compressionLevel]);
      formData.append('gray_scale', grayScale.toString());

      // Add files and passwords
      files.forEach(file => {
        formData.append('pdf_files', file);

        // If this file has a password, add it with a specific name pattern
        if (decryptedFiles[file.name] && decryptedFiles[file.name].password) {
          formData.append(`password_${file.name}`, decryptedFiles[file.name].password);
        }

      });

      // Call the API to compress PDFs
      const result = await compressPDFs(
        formData,
        (progressValue) => setProgress(progressValue)
      );

      setCompressionResult(result);
    } catch (error) {
      console.error('Compression failed:', error);
      setError(error.message || 'PDF compression failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  // Format file size in a readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  const handleDownloadZip = (zipName) => {
    // Make sure zipName has .zip extension
    const finalZipName = zipName.toLowerCase().endsWith('.zip') ? zipName : `${zipName}.zip`;
    
    // Log the complete compression result to understand its structure
    console.log("Full compression result:", compressionResult);
    
    // Try multiple approaches to find the ZIP file
    if (compressionResult.zip_id) {
      console.log("Found zip_id:", compressionResult.zip_id);
      const url = getDownloadUrl(compressionResult.zip_id, 'zip', finalZipName);
      downloadFile(url, finalZipName);
      return;
    }
    
    if (compressionResult.zip_url) {
      console.log("Found zip_url:", compressionResult.zip_url);
      downloadFile(compressionResult.zip_url, finalZipName);
      return;
    }
    
    // Look for any property that might contain the ZIP information
    for (const key in compressionResult) {
      if (key.toLowerCase().includes('zip')) {
        console.log(`Found zip-related property: ${key}=`, compressionResult[key]);
      }
    }
    
    // Look for ZIP files in the files array
    if (compressionResult.files && Array.isArray(compressionResult.files)) {
      console.log("Searching through files array:", compressionResult.files);
      
      // First approach: Look for file with 'zip' in the name
      const zipByName = compressionResult.files.find(file => 
        file.name && file.name.toLowerCase().includes('zip')
      );
      
      if (zipByName) {
        console.log("Found ZIP file by name:", zipByName);
        const url = getDownloadUrl(zipByName.id, 'zip', finalZipName);
        downloadFile(url, finalZipName);
        return;
      }
      
      // Second approach: Look for a file with ZIP mime type
      const zipByMimeType = compressionResult.files.find(file => 
        file.mime_type && file.mime_type.toLowerCase().includes('zip')
      );
      
      if (zipByMimeType) {
        console.log("Found ZIP file by mime type:", zipByMimeType);
        const url = getDownloadUrl(zipByMimeType.id, 'zip', finalZipName);
        downloadFile(url, finalZipName);
        return;
      }
      
      // Third approach: If all else fails, use the first file but force ZIP type
      if (compressionResult.files.length > 0) {
        const firstFile = compressionResult.files[0];
        console.log("Using first file as ZIP:", firstFile);
        const url = getDownloadUrl(firstFile.id, 'zip', finalZipName);
        downloadFile(url, finalZipName);
        return;
      }
    }
    
    console.error("No ZIP file could be found in the compression result");
  };
  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="application/pdf"
        multiple
        onChange={handleFileChange}
      />
      {/* Modal Loader */}
      <ModalLoader
        isVisible={isProcessing}
        progress={progress}
        estimatedTime={estimatedUploadTime}
        text={"Compressing PDFs..."}
      />
              <PDFPreviewModal
  isOpen={previewModal.isOpen}
  onClose={handleClosePreview}
  pdfUrl={previewModal.pdfUrl}
  fileName={previewModal.fileName}
/>
      {passwordModal.isOpen && (
        <div className="fixed inset-0 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-semibold mb-4">PDF Password Required</h3>
            <p className="text-gray-600 mb-4">
              {passwordModal.fileName} is password protected.
              Please enter the password to continue.
            </p>

            {passwordModal.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {passwordModal.error}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label htmlFor="pdf-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="pdf-password"
                  type="password"
                  value={passwordModal.password || ''}
                  onChange={(e) => setPasswordModal(prev => ({ ...prev, password: e.target.value, error: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter PDF password"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModal({ isOpen: false, fileIndex: null, fileName: '', password: '', error: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Unlock PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl mt-4 font-bold mb-2">
          <span className="text-red-600">Compress</span> PDF
        </h1>
        <p className="text-gray-600">Reduce the size of your PDF files while maintaining quality</p>
        <p className="text-sm text-gray-500 mt-2">Max file size: 100 MB per file, 200 MB total</p>
      </div>

      {/* Content with Sidebar Layout */}
      <div className="flex flex-col justify-center md:flex-row gap-6">
        {/* Main Content Area */}
        <div className="w-full md:w-3/4">
          {/* Upload Area - Only show if no files uploaded yet */}
          {files.length === 0 && !compressionResult && (
           <SelectFiles 
           onFilesSelected={handleFilesSelected}
           onError={setError}
           buttonText="Select PDF Files"
           buttonColor="red"
           buttonSize="large"
         />
          )}

          {/* Error State */}
          {error && (
            <div className="w-full p-6 bg-red-50 rounded-xl border border-red-200 mb-6 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {error}
                  </p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-3 text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* File List with Previews */}
          {files.length > 0 && (
            <div className="w-full">
              {/* Add More Files Button - Only show when files are already uploaded */}
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-lg font-medium">Selected Files ({files.length})</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={removeAllFiles}
                    className="text-red-600 cursor-pointer hover:text-red-800 font-medium flex items-center text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Remove All
                  </button>
                  <button
                    onClick={handleSelectFiles}
                    className="text-blue-600 cursor-pointer hover:text-blue-800 font-medium flex items-center text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add More Files
                  </button>
                </div>
              </div>

              {/* Drop Zone - Always active when files are shown */}
              <div
                className={`w-full border-2 border-dashed rounded-lg mb-6 p-4 text-center drop-zone ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
                  } transition-all duration-200 hover:border-blue-300`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <p className="text-gray-500 text-sm">
                  Drag and drop more PDFs here
                </p>
              </div>

              {/* PDF Files with Previews - Flexible grid based on available width */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {files.map((file, index) => {
                  const previewState = previews[file.name];
                  const isCorrupted = previewState === 'corrupted';
                  const isEncrypted = previewState === 'encrypted';
                  const isInvalid = previewState === 'invalid';
                  const hasError = isCorrupted || isEncrypted || isInvalid;

                  return (
                    <div
                      key={index}
                      className={`border rounded-xl overflow-hidden ${hasError ? 'border-red-300 bg-red-50' : 'bg-white'} shadow-sm hover:shadow-md transition-shadow duration-200`}
                    >
                      {/* Preview with fixed dimensions */}
                      <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                        {previewState && !hasError ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <img
                              src={previewState}
                              alt={`Preview of ${file.name}`}
                              className="max-h-full max-w-full object-contain shadow-sm"
                            />
                          </div>
                        ) : hasError ? (
                          <div className="text-red-500 flex flex-col items-center p-4 text-center">
                            <svg
                              className="w-12 h-12 mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>

                            {isEncrypted ? (
                              <div className='flex flex-col'>
                                <span className="font-medium">Password Protected PDF</span>
                                <button
                                  onClick={() => handleDecryptFile(index)}
                                  className="mt-2 block text-xs px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
                                >
                                  {decryptedFiles[file.name] ? "Change Password" : "Enter Password"}
                                </button>
                              </div>
                            ) : (
                              <div>
                                <span className="font-medium">
                                  {isCorrupted && "Corrupted PDF"}
                                  {isInvalid && "Invalid PDF"}
                                </span>
                                <span className="text-xs mt-1 block">Please remove this file</span>
                              </div>
                            )}

                          </div>
                        ) : (
                          <div className="text-gray-400 flex flex-col items-center">
                            <svg
                              className="w-12 h-12 mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <span>Loading preview...</span>
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="p-3 flex justify-between items-center">
                        <div className="truncate mr-2">
                          <p className={`font-medium truncate text-sm ${hasError ? 'text-red-600' : ''}`} title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 cursor-pointer hover:text-red-700 p-1"
                          title="Remove file"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Results Section - Below the previews */}
              {compressionResult && !isProcessing && (
  <div ref={resultSectionRef}>
    <DownloadSection
      files={compressionResult.files}
      downloadHandler={handleDownload}
      previewHandler={handleOpenPreview}
      zipDownloadHandler={
        compressionResult.file_count > 1 ? handleDownloadZip : null
      }
      
      title="Download Compressed PDFs"
      color="red"
      startOverHandler={handleReset}
    />
  </div>
)}
            </div>
          )}
        </div>

        {/* Sidebar */}
        {files.length > 0 && (
          <div className="w-full md:w-1/4 md:sticky md:top-24 h-fit">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-medium text-lg mb-4">Compression Settings</h3>

              {/* Compression Level Options with tooltips */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compression Level
                </label>
                <div className="flex flex-col gap-2">
                  <div
                    className="relative"
                    onMouseEnter={() => setInfoTooltip('high')}
                    onMouseLeave={() => setInfoTooltip('')}
                  >
                    <button
                      type="button"
                      onClick={() => setCompressionLevel('high')}
                      className={`text-sm cursor-pointer py-3 px-4 rounded-lg border w-full flex justify-between items-center ${compressionLevel === 'high'
                        ? 'bg-red-600 text-white border-transparent'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      High Compression
                      {compressionLevel === 'high' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </button>
                    {infoTooltip === 'high' && (
                      <div className="absolute -top-12 left-0 right-0 bg-gray-800 text-white text-xs rounded py-1 px-2 z-10">
                        Smaller file size, lower quality
                      </div>
                    )}
                  </div>

                  <div
                    className="relative"
                    onMouseEnter={() => setInfoTooltip('recommended')}
                    onMouseLeave={() => setInfoTooltip('')}
                  >
                    <button
                      type="button"
                      onClick={() => setCompressionLevel('recommended')}
                      className={` cursor-pointer text-sm py-3 px-4 rounded-lg border w-full flex justify-between items-center ${compressionLevel === 'recommended'
                        ? 'bg-red-600 text-white border-transparent'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      Recommended
                      {compressionLevel === 'recommended' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </button>
                    {infoTooltip === 'recommended' && (
                      <div className="absolute -top-12 left-0 right-0 bg-gray-800 text-white text-xs rounded py-1 px-2 z-10">
                        Balanced size/quality
                      </div>
                    )}
                  </div>

                  <div
                    className="relative"
                    onMouseEnter={() => setInfoTooltip('low')}
                    onMouseLeave={() => setInfoTooltip('')}
                  >
                    <button
                      type="button"
                      onClick={() => setCompressionLevel('low')}
                      className={`text-sm cursor-pointer py-3 px-4 rounded-lg border w-full flex justify-between items-center ${compressionLevel === 'low'
                        ? 'bg-red-600 text-white border-transparent'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      Low Compression
                      {compressionLevel === 'low' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </button>
                    {infoTooltip === 'low' && (
                      <div className="absolute -top-12 left-0 right-0 bg-gray-800 text-white text-xs rounded py-1 px-2 z-10">
                        Larger file size, better quality
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grayscale Option */}
              <div className="flex items-center mb-6">
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="grayscale"
                    checked={grayScale}
                    onChange={(e) => setGrayScale(e.target.checked)}
                    className="sr-only"
                  />
                  <label
                    htmlFor="grayscale"
                    className={`block overflow-hidden h-4 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${grayScale ? 'bg-red-600' : 'bg-gray-300'
                      }`}
                  >
                    <span
                      className={`block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${grayScale ? 'translate-x-4' : 'translate-x-0'
                        }`}
                    ></span>
                  </label>
                </div>
                <label htmlFor="grayscale" className="text-sm text-gray-700 cursor-pointer">
                  Convert to grayscale (reduces file size further)
                </label>
              </div>

              {/* Compress Button */}
              <button
                onClick={handleCompressPDF}
                className={`w-full ${hasProblematicFiles ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white font-medium cursor-pointer py-4 rounded-xl transition-colors duration-200 shadow-md`}
                disabled={files.length === 0 || hasProblematicFiles}
              >
                Compress PDF{files.length > 1 ? 's' : ''}
                {hasProblematicFiles && (
                  <span className="text-xs block mt-1">
                    Please remove invalid files first
                  </span>
                )}
                {!hasProblematicFiles && estimatedUploadTime > 0 && (
                  <span className="text-xs block mt-1">
                    Est. Compressing time: {estimatedUploadTime < 60
                      ? `${estimatedUploadTime} seconds`
                      : `${Math.floor(estimatedUploadTime / 60)} min ${estimatedUploadTime % 60} sec`}
                  </span>
                )}
              </button>

              {/* File Stats */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">File Information</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex justify-between">
                    <span>Number of files:</span>
                    <span className="font-medium">{files.length}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Total size:</span>
                    <span className="font-medium">{formatFileSize(totalSize)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Size limit:</span>
                    <span className="font-medium">200 MB</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFCompressor;