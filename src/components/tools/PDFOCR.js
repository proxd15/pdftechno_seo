// components/tools/PDFOCR.jsx

"use client"

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Import auth context
import { performPDFOCR, createOCRFormData, getOCRDownloadUrl, downloadOCRFile, getAvailableOCRLanguages } from '../../api/ocrpdf_api';
import ModalLoader from '../tools_utility/ModalLoader';
import SelectFiles from '../tools_utility/SelectFiles';
import DownloadSection from '../tools_utility/DownloadSection';

const PDFOCR = () => {
  // State for files and UI
  const { user, isAuthenticated } = useAuth();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [ocrResult, setOCRResult] = useState(null);
  const fileInputRef = useRef(null);
  const resultSectionRef = useRef(null);
  const [decryptedPassword, setDecryptedPassword] = useState(null);

  // States for encrypted files and password modal
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    error: '',
    password: '',
    isForProcessing: false // Track if it's for immediate processing
  });

  // Language selection
  const [selectedLanguage, setSelectedLanguage] = useState('eng');
  const availableLanguages = getAvailableOCRLanguages();

  // File size limits (in bytes)
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

  // Calculate estimated processing time based on file size (rough estimate)
  const estimatedProcessingTime = file ? Math.ceil(file.size / (250 * 1024)) : 0;

  // Handle file download
  const handleDownload = (fileId, fileName) => {
    // Ensure the filename has .pdf extension
    const finalFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    downloadOCRFile(getOCRDownloadUrl(fileId, finalFileName), finalFileName);
  };

  // Handle selected file
  const handleFileSelected = (selectedFiles) => {
    if (selectedFiles && selectedFiles.length > 0) {
      // Only use the first file since this tool processes one file at a time
      setFile(selectedFiles[0]);
    }
  };

  // Scroll to results section when OCR completes
  useEffect(() => {
    if (ocrResult && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ocrResult]);

  // Handle decryption with password
  const handleDecryptFile = (forProcessing = false) => {
    setPasswordModal({
      isOpen: true,
      error: '',
      password: '',
      isForProcessing: forProcessing
    });
  };

  // Handle password submission for encrypted PDFs
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const { password, isForProcessing } = passwordModal;
    if (!password.trim()) {
      setPasswordModal(prev => ({
        ...prev,
        error: 'Please enter a password'
      }));
      return;
    }

    try {
      setIsProcessing(true); // Show loading during password verification

      const arrayBuffer = await file.arrayBuffer();

      // Attempt to load the PDF with the password
      const loadingTask = window.pdfjsLib.getDocument({
        data: arrayBuffer,
        password: password,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
        cMapPacked: true
      });

      const pdf = await loadingTask.promise;

      // Password is correct if we reached here
      // Store the password for future use
      setDecryptedPassword(password);
      
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
      setPreview(canvas.toDataURL('image/jpeg', 0.85));
      
      // Mark the file as successfully decrypted
      setIsEncrypted(false);

      // Close the modal
      setPasswordModal({ isOpen: false, error: '', password: '', isForProcessing: false });

      // Clear any error
      setError(null);

      // If this was for processing, proceed with OCR
      if (isForProcessing) {
        handleProcessOCR(password);
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

  // Add this function to the PDFOCR component
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      // We only want to process the first file since this tool handles one file at a time
      addFileWithValidation(selectedFiles);
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = null;
  };

  // Generate preview whenever file changes
  useEffect(() => {
    const generatePreview = async () => {
      if (!file) {
        setPreview(null);
        setIsEncrypted(false);
        return;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();

        // Check if PDF is valid
        try {
          // Use window.pdfjsLib which is loaded from CDN
          const loadingTaskOptions = {
            data: arrayBuffer,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
            cMapPacked: true
          };

          // If we have a stored password, use it
          if (decryptedPassword) {
            loadingTaskOptions.password = decryptedPassword;
          }
          
          const loadingTask = window.pdfjsLib.getDocument(loadingTaskOptions);
          
          const pdf = await loadingTask.promise;

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
          setPreview(canvas.toDataURL('image/jpeg', 0.85));
          
          // If we successfully loaded with a password, mark as not encrypted (since we've handled it)
          if (decryptedPassword) {
            setIsEncrypted(false);
          } else {
            setIsEncrypted(false);
          }

        } catch (error) {
          console.error('Error generating preview:', error);

          // Better error detection for encrypted PDFs
          if (
            error.name === 'PasswordException' || 
            error.message.includes('password') || 
            error.message.includes('Password')
          ) {
            setPreview('encrypted');
            setIsEncrypted(true);
            
            // Automatically show password prompt
            handleDecryptFile(false);
          } else {
            setPreview('invalid');
            setIsEncrypted(false);
            setError(`"${file.name}" is not a valid PDF file or is corrupted. Please try another file.`);
          }
        }
      } catch (error) {
        console.error('General error processing file:', error);
        setPreview('invalid');
        setIsEncrypted(false);
        setError(`"${file.name}" is not a valid PDF file. Please try another file.`);
      }
    };

    if (window.pdfjsLib && file) {
      generatePreview();
    } else {
      setPreview(null);
      setIsEncrypted(false);
    }
  }, [file, decryptedPassword]);

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
        addFileWithValidation(droppedFiles);
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

  // Validate file before adding
  const addFileWithValidation = (newFiles) => {
    // Reset error
    setError(null);

    // Only use the first file
    if (newFiles.length === 0) return;
    const newFile = newFiles[0];

    // Check file type
    if (newFile.type !== 'application/pdf') {
      setError(`"${newFile.name}" is not a PDF file. Only PDF files are supported.`);
      return;
    }

    // Check file size
    if (newFile.size > MAX_FILE_SIZE) {
      setError(`"${newFile.name}" exceeds the ${formatFileSize(MAX_FILE_SIZE)} file size limit.`);
      return;
    }

    // Set the file
    setFile(newFile);
  };

  // Format file size in a readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

// Updated handleProcessOCR function for PDFOCR.jsx:

// Handle PDF OCR Processing
const handleProcessOCR = async (password = null) => {
  if (!file) return;

  // If the file is encrypted and no password provided, prompt for it
  const pdfPassword = password || decryptedPassword;
  if (isEncrypted && !pdfPassword) {
    handleDecryptFile(true); // true indicates it's for processing
    return;
  }

  setIsProcessing(true);
  setProgress(0);
  setError(null);
  setOCRResult(null);

  try {
    // Create FormData with OCR options
    const formData = createOCRFormData(file, selectedLanguage, pdfPassword);
    
    // Call the API to process OCR
    const result = await performPDFOCR(
      formData,
      (progressValue) => setProgress(progressValue)
    );

    setOCRResult(result);
    
    // Auto-scroll to the results section
    if (resultSectionRef.current) {
      setTimeout(() => {
        resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  } catch (error) {
    console.error('OCR processing failed:', error);
    
    // Handle encrypted PDF error specifically
    if (error.requires_password) {
      handleDecryptFile(true);
    } else {
      setError(error.message || 'PDF OCR processing failed. Please try again.');
    }
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
        onChange={handleFileChange}
      />

      {/* Modal Loader */}
      <ModalLoader
        isVisible={isProcessing}
        progress={progress}
        estimatedTime={estimatedProcessingTime}
        text={"Applying OCR to your PDF..."}
      />

      {/* Password Modal */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-semibold mb-4">PDF Password Required</h3>
            <p className="text-gray-600 mb-4">
              {file?.name} is password protected.
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
                    setPasswordModal({ isOpen: false, error: '', password: '', isForProcessing: false });
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
          <span className="text-[#DB1E10]">OCR</span> PDF
        </h1>
        <p className="text-gray-600">Make your scanned PDFs searchable with OCR text recognition</p>
        <p className="text-sm text-gray-500 mt-2">Max file size: 50 MB</p>
      </div>

      {/* Content with Sidebar Layout */}
      <div className="flex flex-col justify-center md:flex-row gap-6">
        {/* Main Content Area */}
        <div className="w-full md:w-3/4">
          {/* Upload Area - Only show if no file uploaded yet */}
          {!file && !ocrResult && (
            <SelectFiles
              onFilesSelected={handleFileSelected}
              onError={setError}
              buttonText="Select PDF File"
              buttonColor="red"
              buttonSize="large"
              maxSingleFileSize={MAX_FILE_SIZE}
              acceptedFileTypes="application/pdf"
              multiple={false}
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

          {/* File Preview */}
          {file && (
            <div className="w-full mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Selected File</h2>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setIsEncrypted(false);
                    setError(null);
                    setOCRResult(null);
                    setDecryptedPassword(null); // Clear stored password
                  }}
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
                  Remove File
                </button>
              </div>

              <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h3 className="font-medium">PDF for OCR Processing</h3>
                </div>
                <div className="p-4">
                  <div className="flex flex-col md:flex-row items-center">
                    {/* PDF Preview */}
                    <div className="w-full md:w-1/3 flex items-center justify-center p-4">
                      {preview === 'encrypted' || isEncrypted ? (
                        <div className="text-center">
                          <div className="text-red-500 flex flex-col items-center">
                            <svg
                              className="w-16 h-16 mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                            <span className="font-medium">Encrypted PDF</span>
                            <button
                              onClick={() => handleDecryptFile(false)}
                              className="mt-2 block text-xs px-3 py-1 bg-[#DB1E10] text-white rounded-full hover:bg-[#C10007] transition-colors cursor-pointer"
                            >
                              Enter Password
                            </button>
                          </div>
                        </div>
                      ) : preview === 'invalid' ? (
                        <div className="text-center">
                          <div className="text-red-500 flex flex-col items-center">
                            <svg
                              className="w-16 h-16 mb-2"
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
                            <span className="font-medium">Invalid PDF</span>
                            <span className="text-xs">Please select another file</span>
                          </div>
                        </div>
                      ) : preview ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <img
                            src={preview}
                            alt={`Preview of ${file.name}`}
                            className="max-h-40 max-w-full object-contain shadow-sm"
                          />
                        </div>
                      ) : (
                        <div className="text-gray-400 flex flex-col items-center">
                          <svg
                            className="w-16 h-16 mb-1"
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
                          <span className="text-sm">Loading preview...</span>
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="w-full md:w-2/3 p-4">
                      <h4 className="font-medium text-lg mb-2 truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Size:</span> {formatFileSize(file.size)}
                        </p>
                        <p>
                          <span className="font-medium">Type:</span> PDF Document
                        </p>
                        {isEncrypted && (
                          <p className="text-amber-600 font-medium">
                            Password Protected
                          </p>
                        )}
                      </div>
                      <div className="mt-4">
                        <h5 className="font-medium mb-1">About OCR Processing</h5>
                        <p className="text-sm text-gray-600">
                          OCR (Optical Character Recognition) converts scanned documents and images to searchable text. After processing, you'll be able to search, copy, and edit the text in your PDF.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {ocrResult && !isProcessing && (
            <div ref={resultSectionRef}>
              <DownloadSection
                files={[ocrResult.file]}
                downloadHandler={handleDownload}
                previewHandler={null}
                title="Download OCR-Processed PDF"
                color="red"
                startOverHandler={() => {
                  setFile(null);
                  setPreview(null);
                  setIsEncrypted(false);
                  setOCRResult(null);
                  setError(null);
                }}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        {file && (
          <div className="w-full md:w-1/4 md:sticky md:top-24 h-fit">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-medium text-lg mb-4">OCR Settings</h3>

              {/* Language Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OCR Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#DB1E10] focus:border-[#DB1E10]"
                >
                  {availableLanguages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the main language of your document for best results
                </p>
              </div>

              {/* Process Button */}
              <button
                onClick={() => handleProcessOCR()}
                className={`w-full ${
                  preview === 'invalid' || (preview === 'encrypted' && !isEncrypted)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#DB1E10] hover:bg-[#C10007]'
                } text-white font-medium cursor-pointer py-4 rounded-xl transition-colors duration-200 shadow-md`}
                disabled={preview === 'invalid' || (preview === 'encrypted' && !isEncrypted)}
              >
                Process OCR
                {preview === 'invalid' && (
                  <span className="text-xs block mt-1">
                    Invalid PDF file
                  </span>
                )}
                {preview === 'encrypted' && !isEncrypted && (
                  <span className="text-xs block mt-1">
                    Please unlock the PDF first
                  </span>
                )}
                {!(preview === 'invalid' || (preview === 'encrypted' && !isEncrypted)) && estimatedProcessingTime > 0 && (
                  <span className="text-xs block mt-1">
                    Est. processing time: {estimatedProcessingTime < 60
                      ? `${estimatedProcessingTime} seconds`
                      : `${Math.floor(estimatedProcessingTime / 60)} min ${estimatedProcessingTime % 60} sec`}
                  </span>
                )}
              </button>

              {/* Information about OCR */}
              <div className="mt-6 text-sm text-gray-600">
                <h4 className="font-medium text-gray-700 mb-2">OCR Benefits</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                   <svg className="w-5 h-5 text-[#DB1E10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Search for text in your PDF</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#DB1E10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Copy and paste text from scans</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#DB1E10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Edit text in scanned documents</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#DB1E10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Improved indexing and archiving</span>
                  </li>
                </ul>
              </div>

              {/* File Info */}
              {file && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">File Information</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex justify-between">
                      <span>File size:</span>
                      <span className="font-medium">{formatFileSize(file.size)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Size limit:</span>
                      <span className="font-medium">{formatFileSize(MAX_FILE_SIZE)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Protected:</span>
                      <span className="font-medium">{isEncrypted ? 'Yes' : 'No'}</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFOCR;