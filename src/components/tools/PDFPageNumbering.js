"use client"

import { useState, useRef, useEffect } from 'react';
import { addPageNumbers, getDownloadUrl, downloadFile } from '../../api/page_numbers_api';
import ModalLoader from '../tools_utility/ModalLoader';
import PDFPreviewModal from '../tools_utility/PDFPreviewModal.';
import SelectFiles from '../tools_utility/SelectFiles';
import DownloadSection from '../tools_utility/DownloadSection';

const positionOptions = [
  { value: 'top-left', label: 'Top Left', icon: '↖️' },
  { value: 'top-center', label: 'Top Center', icon: '⬆️' },
  { value: 'top-right', label: 'Top Right', icon: '↗️' },
  { value: 'bottom-left', label: 'Bottom Left', icon: '↙️' },
  { value: 'bottom-center', label: 'Bottom Center', icon: '⬇️' },
  { value: 'bottom-right', label: 'Bottom Right', icon: '↘️' },
];

const PDFPageNumbering = () => {
  const fileInputRef = useRef(null);
  
  // State variables
  const [file, setFile] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pageImages, setPageImages] = useState([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const resultSectionRef = useRef(null);
  
  // State for options
  const [position, setPosition] = useState('bottom-right');
  const [startNumber, setStartNumber] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const [fontColor, setFontColor] = useState('#000000');
  const [margins, setMargins] = useState(20); // Fixed at 20 as requested
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState('');
  
  // State for password
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    error: '',
    password: ''
  });
  
  // State for preview modal
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    pdfUrl: null,
    fileName: ''
  });
  
  // File size limit (in bytes)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
  
  // Calculate estimated upload time based on file size (rough estimate)
  // Using 400 KB/s as estimation base for average connection
  const estimatedUploadTime = file ? Math.ceil(file.size / (400 * 1024)) : 0;
  
  // Scroll to results section when operation completes
  useEffect(() => {
    if (result && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);
  
  // Validate inputs when they change
  useEffect(() => {
    // Validate start page
    if (pageCount > 0 && startPage) {
      const startPageNum = parseInt(startPage, 10);
      if (startPageNum < 1) {
        setStartPage(1);
      } else if (startPageNum > pageCount) {
        setStartPage(pageCount);
      }
    }
    
    // Validate end page
    if (pageCount > 0 && endPage) {
      const endPageNum = parseInt(endPage, 10);
      if (endPageNum < 1) {
        setEndPage(1);
      } else if (endPageNum > pageCount) {
        setEndPage(pageCount);
      }
    }
    
    // We're not validating margins since it's fixed at 20 now
    // Validate start number
   // Validate start number - only validate if it's not empty string
if (startNumber !== '' && startNumber < 1) {
    setStartNumber(1);
  }
  }, [startPage, endPage, fontSize, startNumber, pageCount]);
  
  // Render all PDF pages for preview
  const renderAllPDFPages = async (pdf, password = null) => {
    setIsLoadingPages(true);
    const totalPages = pdf.numPages;
    const pageArray = [];
    
    try {
      // Only render the first page as requested
      const page = await pdf.getPage(1);
      
      // Use fixed dimensions for preview
      const maxWidth = 400;
      const maxHeight = 600;
      
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
      
      // Store the page image
      pageArray.push({
        index: 1,
        image: canvas.toDataURL('image/jpeg', 0.85),
        width: canvas.width,
        height: canvas.height
      });
      
      setPageImages(pageArray);
    } catch (error) {
      console.error('Error rendering PDF pages:', error);
      setError("Failed to render PDF page. The file may be corrupted.");
    } finally {
      setIsLoadingPages(false);
    }
  };
  
  // Generate preview whenever file changes
  useEffect(() => {
    const generatePreview = async () => {
      if (!file || !window.pdfjsLib) return;
      
      try {
        // Use a promise with timeout to prevent hanging on problematic files
        const arrayBuffer = await Promise.race([
          file.arrayBuffer(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Preview generation timed out')), 8000)
          )
        ]);
        
        try {
          // Attempt to load the PDF (will fail if password protected)
          const loadingTask = window.pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
            cMapPacked: true
          });
          
          const pdf = await loadingTask.promise;
          setPageCount(pdf.numPages);
          setEndPage(pdf.numPages.toString());
          setPdfDocument(pdf);
          
          // Render first page for preview
          await renderAllPDFPages(pdf);
          
          setIsEncrypted(false);
          setError(null);
          
        } catch (error) {
          console.error('Error generating preview:', error);
          
          // Check if the PDF is password protected
          if (
            error.name === 'PasswordException' || 
            error.message.includes('password') || 
            error.message.includes('Password')
          ) {
            setIsEncrypted(true);
            setError("The PDF is password protected. Please enter the password to continue.");
            
            // Show password modal immediately
            setPasswordModal({
              isOpen: true,
              error: '',
              password: ''
            });
          } else {
            setPageImages([]);
            setError("The PDF file is corrupted or invalid. Please try a different file.");
          }
        }
      } catch (error) {
        console.error('General error processing file:', error);
        setPageImages([]);
        setError("This is not a valid PDF file. Please try a different file.");
      }
    };
    
    if (file) {
      generatePreview();
    }
  }, [file]);
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    const { password } = passwordModal;
    if (!password.trim()) {
      setPasswordModal(prev => ({
        ...prev,
        error: 'Please enter a password'
      }));
      return;
    }
    
    try {
      setIsProcessing(true);
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Attempt to load the PDF with the password
      const loadingTask = window.pdfjsLib.getDocument({
        data: arrayBuffer,
        password: password
      });
      
      const pdf = await loadingTask.promise;
      setPageCount(pdf.numPages);
      setEndPage(pdf.numPages.toString());
      setPdfDocument(pdf);
      
      // Render first page for preview
      await renderAllPDFPages(pdf, password);
      
      // Store the password and set state
      setIsEncrypted(true);
      setIsDecrypted(true);
      
      // Close the modal
      setPasswordModal({
        isOpen: false,
        error: '',
        password: ''
      });
      
      // Clear error
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
  
  const handleFilesSelected = (selectedFiles) => {
    if (selectedFiles && selectedFiles.length > 0) {
      // Take only the first file
      const newFile = selectedFiles[0];
      if (validateFile(newFile)) {
        setFile(newFile);
      }
    }
  };
  
  // Reset to initial state
  const handleReset = () => {
    setFile(null);
    setPdfDocument(null);
    setPageImages([]);
    setIsLoadingPages(false);
    setPageCount(0);
    setIsEncrypted(false);
    setIsDecrypted(false);
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    setResult(null);
    setPosition('bottom-right');
    setStartNumber('');
    setFontSize(12);
    setFontColor('#000000');
    // Keep margins at 20
    setStartPage(1);
    setEndPage('');
  };
  
  // Validate files before adding them
  const validateFile = (newFile) => {
    // Reset error
    setError(null);
    
    // Check if it's a PDF
    if (newFile.type !== 'application/pdf') {
      setError(`"${newFile.name}" is not a PDF file. Only PDF files are supported.`);
      return false;
    }
    
    // Check file size
    if (newFile.size > MAX_FILE_SIZE) {
      setError(`"${newFile.name}" exceeds the 100 MB file size limit.`);
      return false;
    }
    
    return true;
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
    if (droppedFiles.length > 0 && validateFile(droppedFiles[0])) {
      setFile(droppedFiles[0]);
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = null;
  };
  
  const handleAddPageNumbers = async () => {
    if (startNumber === '') {
        setError("Start number cannot be empty. Please enter a number.");
        return;
      }
    if (!file) return;
    
    // Validate input
    const endPageNum = parseInt(endPage || pageCount, 10);
    const startPageNum = parseInt(startPage, 10) || 1;
    
    if (startPageNum < 1) {
      setError("Start page must be a positive number.");
      return;
    }
    
    if (endPageNum < startPageNum) {
      setError("End page must be greater than or equal to start page.");
      return;
    }
    
    if (startPageNum > pageCount) {
      setError(`Start page cannot be greater than the total page count (${pageCount}).`);
      return;
    }
    
    if (endPageNum > pageCount) {
      setError(`End page cannot be greater than the total page count (${pageCount}).`);
      return;
    }
    
    if (isEncrypted && !isDecrypted) {
      setError("Please unlock the PDF with a password first.");
      setPasswordModal({
        isOpen: true,
        error: '',
        password: ''
      });
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append('pdf_file', file);
      formData.append('position', position);
      formData.append('start_number', startNumber);
      formData.append('font_size', fontSize);
      formData.append('font_color', fontColor);
      formData.append('margins', margins); // Fixed at 20
      formData.append('page_range', `${startPageNum}-${endPageNum}`);
      
      // Add password if the PDF is encrypted
      if (isEncrypted && isDecrypted) {
        formData.append('password', passwordModal.password);
      }
      
      // Set progress to 0 before starting upload
      setProgress(0);
      
      // Call the API
      const result = await addPageNumbers(
        formData,
        (progressValue) => setProgress(progressValue)
      );
      
      setResult(result);
      
    } catch (error) {
      console.error('Page numbering failed:', error);
      setError(error.message || 'Failed to add page numbers. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handlePositionClick = (newPosition) => {
    setPosition(newPosition);
  };
  
  const handleNumberChange = (e, setter, min = null, max = null) => {
    const value = e.target.value;
    const numberValue = parseInt(value, 10);
    
    if (value === '') {
      setter('');
    } else if (isNaN(numberValue)) {
      // Don't update if not a number
      return;
    } else {
      // Check bounds if provided
      if (min !== null && numberValue < min) {
        setter(min);
      } else if (max !== null && numberValue > max) {
        setter(max);
      } else {
        setter(numberValue);
      }
    }
  };
  
  const handleDownload = (fileId, fileName) => {
    // Ensure the filename has .pdf extension
    const finalFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    
    // Use the correct URL with custom filename
    const downloadUrl = getDownloadUrl(fileId, 'pdf', finalFileName);
    downloadFile(downloadUrl, finalFileName);
  };
  
  const handleOpenPreview = async () => {
    if (result) {
      try {
        setIsProcessing(true);
        
        // Get the download URL
        const downloadUrl = getDownloadUrl(result.job_id, 'pdf');
        
        // Fetch the PDF data
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        // Get the PDF data as a blob
        const pdfBlob = await response.blob();
        
        // Create an object URL from the blob
        const objectUrl = URL.createObjectURL(pdfBlob);
        
        // Open the preview modal with the object URL
        setPreviewModal({
          isOpen: true,
          pdfUrl: objectUrl,
          fileName: 'Numbered Document.pdf'
        });
      } catch (error) {
        console.error('Error preparing PDF preview:', error);
        setError('Unable to preview the PDF. Please try downloading instead.');
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  // Function to close the PDF preview modal
  const handleClosePreview = () => {
    setPreviewModal({
      isOpen: false,
      pdfUrl: null,
      fileName: ''
    });
  };
  
  // Format file size in a readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  // Generate a preview of what the page number will look like
  const renderPageNumberPreview = () => {
    const positions = {
      'top-left': { top: 20, left: 20 },
      'top-center': { top: 20, left: '50%', transform: 'translateX(-50%)' },
      'top-right': { top: 20, right: 20 },
      'bottom-left': { bottom: 20, left: 20 },
      'bottom-center': { bottom: 20, left: '50%', transform: 'translateX(-50%)' },
      'bottom-right': { bottom: 20, right: 20 }
    };
    
    const posStyles = positions[position];
    
    return (
      <div 
        style={{
          position: 'absolute',
          ...posStyles,
          fontSize: `${fontSize}px`,
          color: fontColor,
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 'normal'
        }}
      >
        {startNumber === '' ? '' : startNumber}
      </div>
    );
  };
  
  // Display page range information
  const renderPageRangeInfo = () => {
    if (!file || pageCount === 0) return null;
    
    const startPageNum = parseInt(startPage, 10) || 1;
    const endPageNum = parseInt(endPage, 10) || pageCount;
    
    return (
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <p className="font-medium text-blue-800">Selected Page Range:</p>
            <p className="text-blue-700 mt-1">
              Pages {startPageNum} to {endPageNum} will be numbered, starting from number {startNumber}.
            </p>
            <p className="text-blue-700 mt-1">
              Total: {endPageNum - startPageNum + 1} pages will be numbered.
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full max-w-7xl mx-auto mb-8 px-4 sm:px-6 lg:px-8">
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
        estimatedTime={estimatedUploadTime}
        text={"Adding page numbers..."}
      />
      
      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={previewModal.isOpen}
        onClose={handleClosePreview}
        pdfUrl={previewModal.pdfUrl}
        fileName={previewModal.fileName}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter PDF password"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModal({
                      isOpen: false, 
                      error: '',
                      password: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-[#DA1F10] rounded-lg hover:bg-[#C10007] transition-colors cursor-pointer"
                >
                  Unlock PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Title */}
      <div className="text-center mb-8 lg:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl mt-4 font-bold mb-2">
          <span className="text-[#DA1F10]">Add </span> Page Numbers
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">Add customizable page numbers to your PDF document</p>
        <p className="text-xs sm:text-sm text-gray-500 mt-2">Max file size: 100 MB</p>
      </div>
      
      {/* Content with Responsive Layout */}
      <div className="flex flex-col lg:flex-row gap-6 justify-center">
        {/* Main Content Area */}
        <div className="w-full lg:w-3/4">
          {/* Upload Area - Only show if no file uploaded yet */}
          {!file && !result && (
            <SelectFiles 
              onFilesSelected={handleFilesSelected}
              onError={setError}
              buttonText="Select PDF File"
              buttonColor="red"
              buttonSize="large"
              multiple={false}
            />
          )}
          
          {/* Error State */}
          {error && (
            <div className="w-full p-4 sm:p-6 bg-red-50 rounded-xl border border-red-200 mb-6 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
          
          {/* File Preview and Options */}
          {file && (
            <div className="w-full">
              {/* File Header */}
              <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-lg font-medium truncate">PDF File: {file.name.slice(0,20)}...</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleReset}
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
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-700 cursor-pointer hover:text-blue-800 font-medium flex items-center text-sm"
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
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Change File
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
                  Drag and drop a different PDF here
                </p>
              </div>

              <div className='flex flex-col lg:flex-row gap-6'>
                {/* PDF Preview with Page Numbers */}
                <div className="w-full lg:w-1/2 xl:w-1/3 mb-8 overflow-y-auto">
                  <h3 className="text-lg font-medium mb-4">PDF Preview with Page Numbers</h3>
                  
                  {/* Loading indicator */}
                  {isLoadingPages && (
                    <div className="flex justify-center items-center h-40 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-gray-500 flex flex-col items-center">
                        <svg className="animate-spin h-8 w-8 text-[#DA1F10] mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm">Loading PDF pages...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Page preview display - just show the first page */}
                  {!isLoadingPages && pageImages.length > 0 && (
                    <div className="rounded-lg overflow-hidden shadow-md border border-gray-200 bg-white">
                      {/* Page header */}
                      <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">Page 1 Preview</span>
                        </div>
                      </div>
                      
                      {/* Page content */}
                      <div className="relative h-[300px] sm:h-[350px] flex items-center justify-center p-4">
                        <img 
                          src={pageImages[0].image} 
                          alt="Page 1"
                          className="max-h-full max-w-full object-contain"
                        />
                        
                        {/* Page number overlay */}
                        <div className="absolute inset-0">
                          {renderPageNumberPreview()}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* No pages loaded yet */}
                  {!isLoadingPages && pageImages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 sm:h-80 bg-gray-50 rounded-xl border border-gray-200">
                      <svg
                        className="w-12 h-12 sm:w-16 sm:h-16 mb-4 text-gray-400"
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
                      <span className="text-gray-500 text-center text-sm">
                        {isEncrypted ? "PDF is password protected. Please unlock it to view." : "No PDF preview available"}
                      </span>
                    </div>
                  )}
                  
                  {/* Page Range Information */}
                  {renderPageRangeInfo()}
                </div>
                
                {/* Settings Section */}
                <div className="w-full lg:w-1/2 xl:w-2/3">
                  <div className="bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
                    <h3 className="text-lg font-medium mb-4">Page Number Settings</h3>
                    
                    {/* Position Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Position
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                        {positionOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handlePositionClick(option.value)}
                            className={`
                              flex items-center cursor-pointer py-2 sm:py-3 px-2 sm:px-4 border ${position === option.value ? 'border-[#DA1F10] bg-red-50' : 'border-gray-300 bg-white'} 
                              rounded-md shadow-sm text-xs sm:text-sm font-medium 
                              ${position === option.value ? 'text-[#DA1F10]' : 'text-gray-700'} 
                              hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DA1F10]
                            `}
                          >
                            <span className="mr-1 sm:mr-2 text-lg">{option.icon}</span>
                            <span className="hidden sm:inline">{option.label}</span>
                            <span className="sm:hidden">{option.label.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Page Range */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page Range
                      </label>
                      <div className="flex space-x-4">
                        <div className="w-1/2">
                          <label className="block text-xs text-gray-500 mb-1">
                            Start Page (min: 1)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={pageCount}
                            value={startPage}
                            onChange={(e) => handleNumberChange(e, setStartPage, 1, pageCount)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#DA1F10] focus:border-[#DA1F10] text-sm"
                          />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-xs text-gray-500 mb-1">
                            End Page (max: {pageCount})
                          </label>
                          <input
                            type="number"
                            min={startPage || 1}
                            max={pageCount}
                            value={endPage}
                            onChange={(e) => handleNumberChange(e, setEndPage, startPage || 1, pageCount)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#DA1F10] focus:border-[#DA1F10] text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Start Number and Font Size */}
                    <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mb-6">
                      <div className="w-full sm:w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Numbering From
                        </label>
                        <input
                          type="number"
                          value={startNumber}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setStartNumber('');
                            } else {
                              const num = parseInt(value, 10);
                              if (!isNaN(num) && num >= 1) {
                                setStartNumber(num);
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#DA1F10] focus:border-[#DA1F10] text-sm"
                        />
                      </div>
                      <div className="w-full sm:w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Size
                        </label>
                        <select
                          value={fontSize}
                          onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#DA1F10] focus:border-[#DA1F10] text-sm"
                        >
                          {[...Array(5)].map((_, i) => (
                            <option key={i + 1} value={(i + 1) * 4}>
                              {(i + 1) * 4}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Color */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Color
                      </label>
                      <div className="flex items-center">
                        <input
                          type="color"
                          value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          className="h-10 w-10 mr-2 border-0 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#DA1F10] focus:border-[#DA1F10] text-sm"
                        />
                      </div>
                    </div>
                    
                    {/* Fixed Margins Information */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm mb-6">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p className="text-blue-700">
                          <span className="font-medium text-blue-800">Page Margins:</span> Fixed at 20 points from edge.
                        </p>
                      </div>
                    </div>

                    {/* Mobile Add Page Numbers Button */}
                    <div className="block lg:hidden">
                      <button
                        onClick={handleAddPageNumbers}
                        disabled={isEncrypted && !isDecrypted}
                        className={`w-full cursor-pointer py-3 px-4 ${isEncrypted && !isDecrypted ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#DA1F10] hover:bg-[#C10007]'} text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DA1F10] mb-4`}
                      >
                        Add Page Numbers
                        {isEncrypted && !isDecrypted && (
                          <span className="block text-xs mt-1">
                            Please unlock the PDF first
                          </span>
                        )}
                      </button>
                      
                      {/* Estimated time info */}
                      {file && estimatedUploadTime > 0 && (
                        <p className="text-xs text-gray-500 text-center mb-4">
                          Est. processing time: {estimatedUploadTime < 60
                            ? `${estimatedUploadTime} seconds`
                            : `${Math.floor(estimatedUploadTime / 60)} min ${estimatedUploadTime % 60} sec`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Results Section */}
          {result && (
            <div ref={resultSectionRef}>
              <DownloadSection
                files={[{
                  id: result.job_id,
                  name: file ? file.name.replace('.pdf', '_numbered.pdf') : 'Numbered Document.pdf',
                  size: result.output_size
                }]}
                downloadHandler={handleDownload}
                previewHandler={handleOpenPreview}
                title="Download Numbered PDF"
                color="red"
                startOverHandler={handleReset}
              />
            </div>
          )}
        </div>
        
        {/* Sidebar - Only show when file is uploaded and no result yet */}
        {file && (
          <div className="w-full lg:w-1/4 lg:sticky lg:top-24 h-fit">
            <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
              <h3 className="font-medium text-lg mb-4">Document Details</h3>
              
              {/* File Info */}
              <div className="mb-6 border-b border-gray-200 pb-4">
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex justify-between">
                    <span>File name:</span>
                    <span className="font-medium truncate max-w-[130px]" title={file?.name}>{file?.name}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>File size:</span>
                    <span className="font-medium">{formatFileSize(file?.size || 0)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Page count:</span>
                    <span className="font-medium">{pageCount}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium">
                      {isEncrypted ? 
                        (isDecrypted ? "Unlocked" : "Password Protected") : 
                        "Ready"}
                    </span>
                  </li>
                </ul>
              </div>
              
              {/* Desktop Add Page Numbers Button */}
              <div className="hidden lg:block">
                <button
                  onClick={handleAddPageNumbers}
                  disabled={isEncrypted && !isDecrypted}
                  className={`w-full cursor-pointer py-3 px-4 ${isEncrypted && !isDecrypted ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#DA1F10] hover:bg-[#C10007]'} text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DA1F10] mb-4`}
                >
                  Add Page Numbers
                  {isEncrypted && !isDecrypted && (
                    <span className="block text-xs mt-1">
                      Please unlock the PDF first
                    </span>
                  )}
                </button>
                
                {/* Estimated time info */}
                {file && estimatedUploadTime > 0 && (
                  <p className="text-xs text-gray-500 text-center mb-6">
                    Est. processing time: {estimatedUploadTime < 60
                      ? `${estimatedUploadTime} seconds`
                      : `${Math.floor(estimatedUploadTime / 60)} min ${estimatedUploadTime % 60} sec`}
                  </p>
                )}
              </div>
              
              {/* Tips Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Helpful Tips</h4>
                <ul className="text-sm text-gray-600 space-y-3">
                  <li className="flex">
                    <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Use <strong>Bottom Right</strong> position for standard documents</span>
                  </li>
                  <li className="flex">
                    <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Set <strong>Page Range</strong> to skip cover pages or appendices</span>
                  </li>
                  <li className="flex">
                    <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Use <strong>Start Numbering From</strong> to match existing page numbers</span>
                  </li>
                  <li className="flex">
                    <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Adjust <strong>Font Size</strong> for better visibility</span>
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

export default PDFPageNumbering;