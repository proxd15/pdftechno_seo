"use client"

import { useState, useRef, useEffect } from 'react';
import { convertPDFToImages, createConversionFormData, getDownloadUrl, downloadFile, getPreviewUrl, getZipThumbnailPreviews } from '../../api/pdftoimage_api';
import ModalLoader from '../tools_utility/ModalLoader';
import PDFPreviewModal from '../tools_utility/PDFPreviewModal.';
import SelectFiles from '../tools_utility/SelectFiles';
import DownloadSection from '../tools_utility/DownloadSection';

const MAX_FILES = 3;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50 MB

// Update the file size limits
const MAX_SINGLE_FILE_SIZE = 15 * 1024 * 1024; // Individual file can still be up to 100MB
const MAX_TOTAL_FILES_SIZE = MAX_TOTAL_SIZE;   // But total is limited to 50MB

const PDFToImage = () => {
  // State for files and UI
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState({});
  const [pageInfo, setPageInfo] = useState({}); // Stores page count for each PDF
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [conversionResult, setConversionResult] = useState(null);
  const fileInputRef = useRef(null);
  const resultSectionRef = useRef(null);

  // States for encrypted files and password modal
  const [encryptedFiles, setEncryptedFiles] = useState({});
  const [decryptedFiles, setDecryptedFiles] = useState({});
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    fileIndex: null,
    fileName: '',
    error: '',
    password: '',
    isForConversion: false // Track if it's for immediate conversion
  });

  // State for image preview modal
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    imageUrl: null,
    fileName: ''
  });

  // State for image format selection
  const [imageFormat, setImageFormat] = useState('JPEG');

  // Calculate total size of all files
  const totalSize = files.reduce((total, file) => total + file.size, 0);

  // Calculate estimated upload time based on file size (rough estimate)
  // Using 400 KB/s as estimation base for average connection
  const estimatedUploadTime = Math.ceil(totalSize / (400 * 1024));

  // Handle file preview
  const handlePreview = async (fileId, fileName, fileType) => {
    try {
      setIsProcessing(true);
      
      if (fileType === 'zip') {
        // For ZIP files, get thumbnail previews
        const thumbnails = await getZipThumbnailPreviews(fileId, 5);
        // Just display the first thumbnail for preview
        if (thumbnails.length > 0) {
          setPreviewModal({
            isOpen: true,
            imageUrl: thumbnails[0],
            fileName
          });
        }
      } else {
        // For single image files
        const imageUrl = await getPreviewUrl(fileId, fileType);
        setPreviewModal({
          isOpen: true,
          imageUrl,
          fileName
        });
      }
    } catch (error) {
      console.error('Error preparing preview:', error);
      setError('Unable to preview the image. Please try downloading instead.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file download
  const handleDownload = (fileId, fileName, fileType) => {
    // Add appropriate extension if missing
    let extension = '.jpg'; // Default
    
    switch (fileType) {
      case 'jpg':
      case 'jpeg':
        extension = '.jpg';
        break;
      case 'png':
        extension = '.png';
        break;
      case 'tiff':
        extension = '.tiff';
        break;
      case 'bmp':
        extension = '.bmp';
        break;
      case 'zip':
        extension = '.zip';
        break;
      default:
        extension = '.jpg';
    }
    
    const finalFileName = fileName.toLowerCase().endsWith(extension) ? fileName : `${fileName}${extension}`;
    downloadFile(getDownloadUrl(fileId, fileType, finalFileName), finalFileName);
  };

  // Handle ZIP download for multiple images
  const handleDownloadZip = (zipName) => {
    // Make sure zipName has .zip extension
    const finalZipName = zipName.toLowerCase().endsWith('.zip') ? zipName : `${zipName}.zip`;

    if (conversionResult) {
      downloadFile(getDownloadUrl(conversionResult.file.id, 'zip', finalZipName), finalZipName);
    }
  };

  // Handle selected files
  const handleFilesSelected = (selectedFiles) => {
    // Add to existing files
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
  };

  // Close the image preview modal
  const handleClosePreview = () => {
    setPreviewModal({
      isOpen: false,
      imageUrl: null,
      fileName: ''
    });
  };

  // Scroll to results section when conversion completes
  useEffect(() => {
    if (conversionResult && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversionResult]);

  // Generate previews and get page counts whenever files change
  useEffect(() => {
    const generatePreviews = async () => {
      const newPreviews = { ...previews };
      const newPageInfo = { ...pageInfo };

      for (const file of files) {
        if (!previews[file.name]) {
          try {
            const arrayBuffer = await file.arrayBuffer();

            // Check if PDF is valid, encrypted, or corrupted
            try {
              // Use window.pdfjsLib which is loaded from CDN
              const loadingTask = window.pdfjsLib.getDocument({
                data: arrayBuffer,
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
                cMapPacked: true
              });
              
              const pdf = await loadingTask.promise;

              // Store page count
              const numPages = pdf.numPages;
              newPageInfo[file.name] = numPages;

              // Generate preview from first page
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

              // Use jpeg format with compression for better performance
              newPreviews[file.name] = canvas.toDataURL('image/jpeg', 0.85);

            } catch (error) {
              console.error('Error generating preview for:', file.name, error);

              // Better error detection for encrypted PDFs
              if (
                error.name === 'PasswordException' || 
                error.message.includes('password') || 
                error.message.includes('Password')
              ) {
                newPreviews[file.name] = 'encrypted';
                setEncryptedFiles(prev => ({
                  ...prev,
                  [file.name]: true
                }));
                
                // Automatically show password prompt for the first encrypted file
                const fileIndex = files.findIndex(f => f.name === file.name);
                if (fileIndex !== -1 && !passwordModal.isOpen) {
                  handleDecryptFile(fileIndex);
                }
              } else {
                // Assume other errors are due to corruption
                newPreviews[file.name] = 'corrupted';
                setError(`"${file.name}" is corrupted or invalid. Please remove this file.`);
              }
            }
          } catch (error) {
            console.error('General error processing file:', file.name, error);
            newPreviews[file.name] = 'invalid';
            setError(`"${file.name}" is not a valid PDF file. Please remove this file.`);
          }
        }
      }

      setPreviews(newPreviews);
      setPageInfo(newPageInfo);
    };

    if (window.pdfjsLib && files.length > 0) {
      generatePreviews();
    }
  }, [files]);

  // Handle decryption for encrypted files
  const handleDecryptFile = (fileIndex, forConversion = false) => {
    const file = files[fileIndex];
    setPasswordModal({
      isOpen: true,
      fileIndex,
      fileName: file.name,
      error: '',
      password: '',
      isForConversion: forConversion
    });
  };

  // Handle password submission for encrypted PDFs
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const { fileIndex, password, isForConversion } = passwordModal;
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

      // Store page count
      const numPages = pdf.numPages;
      setPageInfo(prev => ({
        ...prev,
        [file.name]: numPages
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
        [file.name]: canvas.toDataURL('image/jpeg', 0.85)
      }));

      // Close the modal
      setPasswordModal({ isOpen: false, fileIndex: null, fileName: '', password: '', error: '', isForConversion: false });

      // Clear any error
      setError(null);

      // If this was for conversion, proceed with conversion
      if (isForConversion) {
        handleConvertPDF(file, password);
      }

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

  // Set up document-wide drag and drop
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

  // Check file count limit
  if (files.length + newFiles.length > MAX_FILES) {
    setError(`Maximum ${MAX_FILES} PDF files allowed.`);
    return;
  }

  // Filter for PDF files - keep this existing code
  const pdfFiles = newFiles.filter(file => {
    if (file.type !== 'application/pdf') {
      setError(`"${file.name}" is not a PDF file. Only PDF files are supported.`);
      return false;
    }
    return true;
  });

  if (pdfFiles.length === 0) return;

  // Check individual file size - keep this existing code
  const validSizeFiles = pdfFiles.filter(file => {
    if (file.size > MAX_SINGLE_FILE_SIZE) {
      setError(`"${file.name}" exceeds the 100 MB file size limit.`);
      return false;
    }
    return true;
  });

  if (validSizeFiles.length === 0) return;

  // Check total file size with updated limit
  const newTotalSize = totalSize + validSizeFiles.reduce((sum, file) => sum + file.size, 0);
  if (newTotalSize > MAX_TOTAL_FILES_SIZE) {
    setError(`Total file size exceeds the ${MAX_TOTAL_SIZE / (1024 * 1024)} MB limit. Please remove some files.`);
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

    // Clean up page info
    if (pageInfo[removedFile.name]) {
      setPageInfo(prev => {
        const updated = { ...prev };
        delete updated[removedFile.name];
        return updated;
      });
    }

    // Also clean up from encrypted and decrypted trackers
    if (encryptedFiles[removedFile.name]) {
      setEncryptedFiles(prev => {
        const updated = { ...prev };
        delete updated[removedFile.name];
        return updated;
      });
    }

    if (decryptedFiles[removedFile.name]) {
      setDecryptedFiles(prev => {
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
    setPageInfo({});
    setConversionResult(null);
    setError(null);
    setEncryptedFiles({});
    setDecryptedFiles({});
  };

  // Reset to initial state
  const handleReset = () => {
    setFiles([]);
    setPreviews({});
    setPageInfo({});
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    setConversionResult(null);
    setEncryptedFiles({});
    setDecryptedFiles({});
  };

  // Format file size in a readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Check if any files are problematic (corrupted, encrypted without password, etc.)
  const hasProblematicFiles = files.some(file => {
    const previewState = previews[file.name];
    return previewState === 'corrupted' || previewState === 'invalid' || 
           (previewState === 'encrypted' && !decryptedFiles[file.name]);
  });

  // Handle PDF to Image Conversion with a specific file and password
 const handleConvertPDF = async () => {
  if (files.length === 0) return;

  // Check for encrypted files that need passwords
  const hasEncryptedFileWithoutPassword = files.some(file => 
    previews[file.name] === 'encrypted' && !decryptedFiles[file.name]
  );

  if (hasEncryptedFileWithoutPassword) {
    // Find the first encrypted file without password
    const fileIndex = files.findIndex(file => 
      previews[file.name] === 'encrypted' && !decryptedFiles[file.name]
    );
    
    if (fileIndex !== -1) {
      handleDecryptFile(fileIndex, true);
      return;
    }
  }

  setIsProcessing(true);
  setProgress(0);
  setError(null);
  setConversionResult(null);

  try {
    // Collect passwords for all files
    const passwords = {};
    files.forEach(file => {
      if (decryptedFiles[file.name]?.password) {
        passwords[file.name] = decryptedFiles[file.name].password;
      }
    });

    // Create FormData with all files and passwords
    const formData = createConversionFormData(files, imageFormat, passwords);
    
    // Call the API
    const result = await convertPDFToImages(
      formData,
      (progressValue) => setProgress(progressValue)
    );

    setConversionResult(result);
    
    // Auto-scroll to results
    if (resultSectionRef.current) {
      setTimeout(() => {
        resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  } catch (error) {
    // Error handling remains the same
  } finally {
    setIsProcessing(false);
  }
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
        text={"Converting PDF to Images..."}
      />

      {/* Image Preview Modal */}
      <PDFPreviewModal
        isOpen={previewModal.isOpen}
        onClose={handleClosePreview}
        pdfUrl={previewModal.imageUrl}
        fileName={previewModal.fileName}
      />

      {/* Password Modal */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#DB1E10] focus:border-[#DB1E10]"
                  placeholder="Enter PDF password"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModal({ isOpen: false, fileIndex: null, fileName: '', password: '', error: '', isForConversion: false });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-[#DB1E10] rounded-lg hover:bg-[#DB1E10] transition-colors cursor-pointer"
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
          <span className="text-[#DB1E10]">PDF to</span> Image
        </h1>
        <p className="text-gray-600">Convert PDF files to high-quality images in various formats</p>
        <p className="text-sm text-gray-500 mt-2">Max {MAX_FILES} files, {MAX_TOTAL_SIZE / (1024 * 1024)} MB total</p>
      </div>

      {/* Content with Sidebar Layout */}
      <div className="flex flex-col justify-center md:flex-row gap-6">
        {/* Main Content Area */}
        <div className="w-full md:w-3/4">
          {/* Upload Area - Only show if no files uploaded yet */}
          {files.length === 0 && !conversionResult && (
  <SelectFiles
    onFilesSelected={handleFilesSelected}
    onError={setError}
    buttonText="Select PDF Files"
    buttonColor="red"
    buttonSize="large"
    maxFiles={MAX_FILES}                      // Add this
    currentFileCount={files.length}           // Add this
    maxSingleFileSize={MAX_SINGLE_FILE_SIZE}
    maxTotalFilesSize={MAX_TOTAL_SIZE}
    acceptedFileTypes="application/pdf"
    multiple={true}
    showHelperText={true}
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

              {/* PDF Files Grid */}
              <div className="border rounded-xl overflow-hidden bg-white shadow-sm mb-6">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h3 className="font-medium">PDF Files to Convert</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {files.map((file, index) => {
                      const previewState = previews[file.name];
                      const isCorrupted = previewState === 'corrupted';
                      const isEncrypted = previewState === 'encrypted';
                      const isInvalid = previewState === 'invalid';
                      const hasError = isCorrupted || (isEncrypted && !decryptedFiles[file.name]) || isInvalid;
                      const numPages = pageInfo[file.name] || 0;

                      return (
                        <div 
                          key={index} 
                          className={`relative border rounded-lg overflow-hidden ${
                            hasError ? 'border-red-300 bg-red-50' : 'bg-white'
                          } shadow-sm`}
                        >
                          {/* Remove Button */}
                          <button
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 z-10 p-1 bg-white text-red-500 rounded-full hover:bg-red-100 transition-colors shadow-sm"
                            title="Remove file"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                          
                          {/* PDF Preview */}
                          <div className="flex items-center justify-center p-6 h-40">
                            {hasError ? (
                              <div className="text-red-500 flex flex-col items-center text-center">
                                <svg
                                  className="w-10 h-10 mb-2"
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
                                {isEncrypted && !decryptedFiles[file.name] ? (
                                  <div className='flex flex-col'>
                                    <span className="font-medium">Encrypted PDF</span>
                                    <button
                                      onClick={() => handleDecryptFile(index)}
                                      className="mt-2 block text-xs px-3 py-1 bg-[#DB1E10] text-white rounded-full hover:bg-[#DB1E10] transition-colors cursor-pointer"
                                    >
                                      Enter Password
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
                            ) : previewState ? (
                              <img
                                src={previewState}
                                alt={`Preview of ${file.name}`}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <div className="text-gray-400 flex flex-col items-center">
                                <svg
                                  className="w-10 h-10 mb-1"
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
                                <span className="text-xs">Loading...</span>
                              </div>
                            )}
                          </div>
                          
                          {/* File Info */}
                          <div className="p-3 bg-gray-50 border-t">
                            <p className="font-medium text-sm truncate" title={file.name}>
                              {file.name}
                            </p>
                            <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                              <span>{formatFileSize(file.size)}</span>
                              <span>{numPages} {numPages === 1 ? 'page' : 'pages'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Results Section */}
              {conversionResult && !isProcessing && (
                <div ref={resultSectionRef}>
                  <DownloadSection
                    files={conversionResult.is_single_image ? [conversionResult.file] : [conversionResult.file]}
                    downloadHandler={(fileId, fileName) => handleDownload(
                      fileId, 
                      fileName, 
                      conversionResult.is_single_image ? 
                        imageFormat.toLowerCase() === 'jpeg' ? 'jpg' : imageFormat.toLowerCase() : 
                        'zip'
                    )}
                    previewHandler={null}
                    zipDownloadHandler={
                      !conversionResult.is_single_image ? 
                        (zipName) => handleDownloadZip(zipName) : 
                        null
                    }
                    title={conversionResult.is_single_image ? 
                      `Download Converted Image` : 
                      `Download Converted Images (ZIP)`
                    }
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
              <h3 className="font-medium text-lg mb-4">Conversion Settings</h3>

              {/* Image Format Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Format
                </label>
                <select
                  value={imageFormat}
                  onChange={(e) => setImageFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#DB1E10] focus:border-[#DB1E10]"
                >
                  <option value="JPEG">JPEG (High quality, smaller size)</option>
                  <option value="PNG">PNG (Lossless, transparent background)</option>
                  <option value="TIFF">TIFF (High quality for printing)</option>
                  <option value="BMP">BMP (Raw image data)</option>
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  {imageFormat === 'JPEG' && "JPEG is ideal for photos and general use with good compression."}
                  {imageFormat === 'PNG' && "PNG preserves transparency and is best for graphics, logos, and text."}
                  {imageFormat === 'TIFF' && "TIFF maintains highest quality suitable for professional printing."}
                  {imageFormat === 'BMP' && "BMP is an uncompressed format with full image data."}
                </p>
              </div>

              {/* Convert Button */}
              <button
                onClick={() => handleConvertPDF()}
                className={`w-full ${hasProblematicFiles
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#DB1E10] hover:bg-[#DB1E10]'
                  } text-white font-medium cursor-pointer py-4 rounded-xl transition-colors duration-200 shadow-md`}
                disabled={files.length === 0 || hasProblematicFiles}
              >
                Convert to {imageFormat}
                {hasProblematicFiles && (
                  <span className="text-xs block mt-1">
                    Please remove invalid files first
                  </span>
                )}
                {!hasProblematicFiles && estimatedUploadTime > 0 && (
                  <span className="text-xs block mt-1">
                    Est. processing time: {estimatedUploadTime < 60
                      ? `${estimatedUploadTime} seconds`
                      : `${Math.floor(estimatedUploadTime / 60)} min ${estimatedUploadTime % 60} sec`}
                  </span>
                )}
              </button>

              {/* Output Info */}
              <div className="mt-6 text-sm text-gray-600">
                <h4 className="font-medium text-gray-700 mb-2">Output Details</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#DB1E10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Single-page PDFs convert to a single image file</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#DB1E10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Multi-page PDFs convert to a ZIP file containing one image per page</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#DB1E10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Images maintain original document quality and resolution</span>
                  </li>
                </ul>
              </div>

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
                    <span>Total pages:</span>
                    <span className="font-medium">
                      {Object.values(pageInfo).reduce((sum, pages) => sum + pages, 0)}
                    </span>
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

export default PDFToImage;