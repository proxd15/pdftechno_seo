"use client"

import { useState, useRef, useEffect } from 'react';
import { convertExcelToPDF, getDownloadUrl, downloadFile, formatFileSize } from '../../api/office_to_pdf_api';
import ModalLoader from '../tools_utility/ModalLoader';
import PDFPreviewModal from '../tools_utility/PDFPreviewModal.';
import DownloadSection from '../tools_utility/DownloadSection';

const ExcelToPdfConverter = () => {
  // File input ref
  const fileInputRef = useRef(null);
  
  // State variables
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const resultSectionRef = useRef(null);
  
  // State for preview modal
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    pdfUrl: null,
    fileName: ''
  });
  
  // File size limit (in bytes)
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB per file
  
  // Calculate estimated conversion time if file exists
  // Using 400 KB/s as estimation base plus extra processing for complex spreadsheets
  const estimatedTime = file ? Math.ceil(file.size / (400 * 1024) * 1.3) : 0; // 30% more time for Excel
  
  // Scroll to results section when conversion completes
  useEffect(() => {
    if (result && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);
  
  // Function to validate file
  const validateFile = (uploadedFile) => {
    // Check file extension
    const fileExtension = uploadedFile.name.split('.').pop().toLowerCase();
    const validExtensions = ['xls', 'xlsx', 'csv', 'ods'];
    
    if (!validExtensions.includes(fileExtension)) {
      setError(`Invalid file format. Only .xls, .xlsx, .csv, and .ods files are supported.`);
      return false;
    }
    
    // Check file size
    if (uploadedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds the 20 MB limit.`);
      return false;
    }
    
    return true;
  };
  
  // Handler for file selection
  const handleFileSelected = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const uploadedFile = selectedFiles[0]; // Only take the first file
    
    if (validateFile(uploadedFile)) {
      setFile(uploadedFile);
      setError(null);
      setResult(null); // Clear previous result
    }
  };
  
  // Reset to initial state
  const handleReset = () => {
    setFile(null);
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    setResult(null);
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
    if (droppedFiles.length > 0) {
      handleFileSelected([droppedFiles[0]]); // Pass just the first file
    }
  };
  const handleRemoveFile = () => {
  setFile(null);
  setProgress(0);
  setError(null);
  setResult(null); // Clear any previous conversion result
  
  // Reset any file-related state
  if (previewModal.pdfUrl) {
    URL.revokeObjectURL(previewModal.pdfUrl);
  }
  
  setPreviewModal({
    isOpen: false,
    pdfUrl: null,
    fileName: ''
  });
  
  // If you have any other file-specific state, reset it here
};
  // Handle conversion to PDF
  const handleConvertToPdf = async () => {
    if (!file) {
      setError("Please select an Excel spreadsheet first.");
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      // Call the API to convert
      const result = await convertExcelToPDF(
        file,
        {
          outputFilename: file.name.replace(/\.[^/.]+$/, "") + ".pdf"
        },
        (progressValue) => setProgress(progressValue)
      );
      
      setResult(result);
      
      // Auto-scroll to the results section
      if (resultSectionRef.current) {
        setTimeout(() => {
          resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('Conversion failed:', error);
      setError(error.message || 'Excel to PDF conversion failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle downloading the converted PDF
  const handleDownload = (fileId, fileName) => {
    // Ensure the filename has .pdf extension
    const finalFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    
    // Use the correct URL with custom filename
    const downloadUrl = getDownloadUrl(fileId, finalFileName);
    downloadFile(downloadUrl, finalFileName);
  };
  
  // Handle opening preview
  const handleOpenPreview = async () => {
    if (result) {
      try {
        setIsProcessing(true);
        
        // Get the download URL
        const downloadUrl = getDownloadUrl(result.file_id);
        
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
          fileName: file ? file.name.replace(/\.[^/.]+$/, "") + ".pdf" : 'Converted Spreadsheet.pdf'
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
    if (previewModal.pdfUrl) {
      URL.revokeObjectURL(previewModal.pdfUrl);
    }
    
    setPreviewModal({
      isOpen: false,
      pdfUrl: null,
      fileName: ''
    });
  };
  
  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      <div className='h-8'></div>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".xls,.xlsx,.csv,.ods"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileSelected([e.target.files[0]]);
          }
          e.target.value = null; // Reset for selecting same file again
        }}
      />
      
      {/* Modal Loader */}
      <ModalLoader
        isVisible={isProcessing}
        progress={progress}
        estimatedTime={estimatedTime}
        text={"Converting Excel to PDF..."}
      />
      
      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={previewModal.isOpen}
        onClose={handleClosePreview}
        pdfUrl={previewModal.pdfUrl}
        fileName={previewModal.fileName}
      />
      
      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl mt-4 font-bold mb-2">
          <span className="text-[#DA1F10]">Excel </span> to PDF
        </h1>
        <p className="text-gray-600">Convert your Excel spreadsheets to PDF with ease</p>
        <p className="text-sm text-gray-500 mt-2">Supports .xls, .xlsx, .csv, .ods • Max 20 MB</p>
      </div>
      
      {/* Content with Sidebar Layout */}
      <div className="flex flex-col justify-center md:flex-row gap-6">
        {/* Main Content Area */}
        <div className="w-full md:w-3/4">
          {/* Upload Area - Only show if no file uploaded yet */}
          {!file && !result && (
            <SelectFiles 
              onFilesSelected={handleFileSelected}
              onError={setError}
              buttonText="Select Excel File"
              buttonColor="red"
              buttonSize="large"
              multiple={false}
              acceptedFileTypes=".xls, .xlsx, .csv, .ods"
              maxSingleFileSize={MAX_FILE_SIZE}
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
          {file  && (
            <div className="w-full">
              {/* File Header */}
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-lg font-medium">Selected Spreadsheet</h2>
                <button
  onClick={handleRemoveFile}
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
  Remove
</button>
              </div>
              
              {/* Drop Zone for replacing file */}
              <div
                className={`w-full border-2 border-dashed rounded-lg mb-6 p-4 text-center drop-zone ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'} transition-all duration-200 hover:border-blue-300`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <p className="text-gray-500 text-sm">
                  Drag and drop a different Excel file here or{' '}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    browse
                  </button>
                </p>
              </div>
              
              {/* File Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                <div className="flex p-4 items-center border-b border-gray-100">
                  <div className="bg-green-50 p-3 rounded-lg mr-4">
                    <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#217346"/>
                      <path d="M14 2V8H20L14 2Z" fill="#217346"/>
                      <path d="M14 9H10V11H14V9ZM14 12H10V14H14V12ZM14 15H10V17H14V15ZM8 9H6V11H8V9ZM8 12H6V14H8V12ZM8 15H6V17H8V15ZM16 9V11H18V9H16ZM16 12V14H18V12H16ZM16 15V17H18V15H16Z" fill="white"/>
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-medium truncate" title={file.name}>{file.name}</h3>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
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
                  id: result.file_id,
                  name: file ? file.name.replace(/\.[^/.]+$/, "") + ".pdf" : 'Converted Spreadsheet.pdf',
                  size: result.output_size
                }]}
                downloadHandler={handleDownload}
                previewHandler={handleOpenPreview}
                title="Download PDF"
                color="red"
                startOverHandler={handleReset}
              />
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        {(file || result) && (
          <div className="w-full md:w-1/4 md:sticky md:top-24 h-fit">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
              <h3 className="font-medium text-lg mb-4">Conversion Details</h3>
              
              {/* File Info */}
              <div className="mb-6 border-b border-gray-200 pb-4">
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex justify-between">
                    <span>File:</span>
                    <span className="font-medium">{file?.name}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Size:</span>
                    <span className="font-medium">{formatFileSize(file?.size || 0)}</span>
                  </li>
                  {result && (
                    <li className="flex justify-between">
                      <span>Output size:</span>
                      <span className="font-medium">{formatFileSize(result.output_size)}</span>
                    </li>
                  )}
                </ul>
              </div>
              
              {/* Convert Button - Only show when file is selected but not yet converted */}
              {file && (
                <button
                  onClick={handleConvertToPdf}
                  className="w-full cursor-pointer py-3 px-4 bg-[#DA1F10] hover:bg-[#C10007] text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DA1F10] mb-4"
                >
                  Convert to PDF
                </button>
              )}
              
              {/* Tips Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">About Excel to PDF</h4>
                <ul className="text-sm text-gray-600 space-y-3">
                  <li className="flex">
                    <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Preserves cell formatting, formulas and functions</span>
                  </li>
                  <li className="flex">
                    <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Maintains table headers and column widths</span>
                  </li>
                  <li className="flex">
                    <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Supports multi-sheet workbooks</span>
                  </li>
                  <li className="flex">
                    <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Perfect for sharing financial data securely</span>
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

export default ExcelToPdfConverter;

const SelectFiles = ({ 
  onFilesSelected, 
  maxSingleFileSize = 100 * 1024 * 1024, // 100 MB
  maxTotalFilesSize = 200 * 1024 * 1024, // 200 MB
  acceptedFileTypes = ".pdf",  // Changed to extension format by default
  multiple = false,  // Added multiple flag to handle single file selection
  buttonText = "Select Files",
  buttonSize = "large", // "large" or "small"
  buttonColor = "red", // "red" or "blue"
  showHelperText = true,
  fullWidth = false,
  onError = () => {}
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Color class mapping
  const colorClasses = {
    red: "bg-red-600 hover:bg-red-700",
    blue: "bg-blue-600 hover:bg-blue-700"
  };

  // Size class mapping
  const sizeClasses = {
    large: "w-[350px] px-8 py-3 h-[60px] text-xl shadow-lg",
    small: "px-4 py-2 text-sm"
  };

  // Set up page-wide drag and drop
  useEffect(() => {
    // Add dragover event listener to the entire document
    const handleDocumentDragOver = (e) => {
      // Only intercept file drops, not drag operations on DOM elements
      if (e.dataTransfer && e.dataTransfer.types && 
          Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }
    };

    // Add dragleave event listener to the entire document
    const handleDocumentDragLeave = (e) => {
      // Only respond to file drag operations
      if (e.dataTransfer && e.dataTransfer.types && 
          Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        
        // Only set isDragging to false if we're leaving the document
        if (!e.relatedTarget || e.relatedTarget.nodeName === 'HTML') {
          setIsDragging(false);
        }
      }
    };

    // Add drop event listener to the entire document
    const handleDocumentDrop = (e) => {
      // Only handle file drops
      if (e.dataTransfer && e.dataTransfer.types && 
          Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        
        setIsDragging(false);

        // Only add files if the drop didn't happen on a specific drop zone
        const isInsideDropZone = e.target.closest('.drop-zone');
        if (!isInsideDropZone) {
          const droppedFiles = Array.from(e.dataTransfer.files);
          validateAndAddFiles(droppedFiles);
        }
      }
    };

    // Register the event listeners
    document.addEventListener('dragover', handleDocumentDragOver, { passive: false });
    document.addEventListener('dragleave', handleDocumentDragLeave, { passive: false });
    document.addEventListener('drop', handleDocumentDrop, { passive: false });

    return () => {
      document.removeEventListener('dragover', handleDocumentDragOver);
      document.removeEventListener('dragleave', handleDocumentDragLeave);
      document.removeEventListener('drop', handleDocumentDrop);
    };
  }, []);

  // Validate files before adding them
  // Updated function to handle extension-based validation
  const validateAndAddFiles = (newFiles) => {
    // Reset error
    onError(null);
    
    // Create a mapping of MIME types to extensions for validation
    const mimeTypeMap = {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/rtf': ['.rtf'],
      'application/vnd.oasis.opendocument.text': ['.odt'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.oasis.opendocument.presentation': ['.odp'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'application/vnd.oasis.opendocument.spreadsheet': ['.ods']
    };
    
    // Get accepted extensions from the acceptedFileTypes string
    const acceptedExtensions = acceptedFileTypes
      .split(',')
      .map(ext => ext.trim().toLowerCase());
  
    // Filter for accepted file types, using both MIME type and extension validation
    const validTypeFiles = newFiles.filter(file => {
      // First check MIME type mapping
      const validExtensionsForType = mimeTypeMap[file.type] || [];
      const isValidMimeType = validExtensionsForType.some(ext => 
        acceptedExtensions.includes(ext)
      );
      
      // If MIME type check fails, check the file extension directly
      if (!isValidMimeType) {
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        const isValidExtension = acceptedExtensions.includes(fileExtension);
        
        if (!isValidExtension) {
          onError(`"${file.name}" is not a valid file type. Only ${acceptedFileTypes} files are supported.`);
          return false;
        }
      }
      
      return true;
    });
    
    if (validTypeFiles.length === 0) return;
  
    // Check individual file size
    const validSizeFiles = validTypeFiles.filter(file => {
      if (file.size > maxSingleFileSize) {
        onError(`"${file.name}" exceeds the ${formatFileSize(maxSingleFileSize)} file size limit.`);
        return false;
      }
      return true;
    });
  
    if (validSizeFiles.length === 0) return;
  
    // If multiple=false, only take the first file
    const filesToAdd = multiple ? validSizeFiles : [validSizeFiles[0]];
    
    // Calculate total size if we're allowing multiple files
    if (multiple) {
      const totalSize = filesToAdd.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > maxTotalFilesSize) {
        onError(`Total file size exceeds the ${formatFileSize(maxTotalFilesSize)} limit.`);
        return;
      }
    }
    
    // Pass valid files to the handler
    if (onFilesSelected && typeof onFilesSelected === 'function') {
      onFilesSelected(filesToAdd);
    }
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
    validateAndAddFiles(droppedFiles);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      validateAndAddFiles(selectedFiles);
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
      const fileInput = document.querySelector(`input[type="file"][accept="${acceptedFileTypes}"]`);
      if (fileInput) {
        fileInput.click();
      }
    }
  };

  // Format file size in a readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Get display text for file types
  const getFileTypeDisplayText = () => {
    if (acceptedFileTypes === ".pdf") return "Only PDF files.";
    
    // Format display text for extensions
    const extensions = acceptedFileTypes.split(',').map(ext => ext.trim());
    return `Only ${extensions.join(', ')} files.`;
  };

  return (
    <>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={acceptedFileTypes}
        multiple={multiple}
        onChange={handleFileChange}
      />

      {/* File Drop Area */}
      <div
        className={`${fullWidth ? 'w-full' : ''} border-2 border-dashed rounded-xl drop-zone 
          ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'} 
          transition-colors duration-200 hover:border-blue-300`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Select Files Button */}
        <div className="flex flex-col items-center py-12">
          <button
            onClick={handleSelectFiles}
            className={`${colorClasses[buttonColor]} cursor-pointer text-white font-medium 
              ${sizeClasses[buttonSize]} ${fullWidth ? 'w-full' : ''} rounded-full flex justify-center 
              items-center mb-4 transition-colors duration-200`}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            {buttonText}
          </button>

          {/* Helper Text */}
          {showHelperText && (
            <>
              <p className="text-gray-500 text-sm">
                or drop {multiple ? 'files' : 'a file'} here
              </p>
              <p className="text-gray-500 text-xs mt-4">
                {getFileTypeDisplayText()}
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};
