"use client"

import { useState, useRef, useEffect } from 'react';
import { convertPDFToExcel, getExcelDownloadUrl, downloadFile, formatFileSize } from '../../api/pdf_to_office_api';
import ModalLoader from '../tools_utility/ModalLoader';
import DownloadSection from '../tools_utility/DownloadSection';

const PdfToExcelConverter = () => {
  // File input ref
  const fileInputRef = useRef(null);
  
  // State variables
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [pdfInfo, setPdfInfo] = useState(null);
  const resultSectionRef = useRef(null);
  
  // File size limit (in bytes)
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB per file
  
  // Calculate estimated conversion time
  const estimatedTime = file ? Math.ceil(file.size / (200 * 1024) * 2.5) : 0; // Slowest for Excel
  
  // Scroll to results section when conversion completes
  useEffect(() => {
    if (result && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);
  
  // Function to check PDF corruption and encryption
  const validatePDFFile = async (uploadedFile) => {
    try {
      setIsLoadingPreview(true);
      
      const arrayBuffer = await uploadedFile.arrayBuffer();
      
      // Check for PDF signature
      const uint8Array = new Uint8Array(arrayBuffer);
      const header = new TextDecoder().decode(uint8Array.slice(0, 4));
      
      if (header !== '%PDF') {
        throw new Error('File is corrupted or not a valid PDF document');
      }
      
      try {
        // Try to load PDF with PDF.js
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        // Check if PDF is encrypted/password protected
        if (pdf.numPages === 0) {
          throw new Error('encrypted');
        }
        
        // Get PDF info
        const metadata = await pdf.getMetadata();
        setPdfInfo({
          numPages: pdf.numPages,
          title: metadata.info?.Title || 'Untitled',
          author: metadata.info?.Author || 'Unknown',
          creator: metadata.info?.Creator || 'Unknown'
        });
        
        // Generate preview of first page
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        const previewDataUrl = canvas.toDataURL();
        setPdfPreview(previewDataUrl);
        
        return true;
        
      } catch (pdfError) {
        if (pdfError.name === 'PasswordException' || pdfError.message === 'encrypted') {
          throw new Error('encrypted');
        }
        throw new Error('File appears to be corrupted or damaged');
      }
      
    } catch (error) {
      if (error.message === 'encrypted') {
        setError({
          type: 'encrypted',
          message: 'This PDF is password protected',
          action: 'unlock'
        });
      } else {
        setError({
          type: 'corruption',
          message: error.message || 'PDF file validation failed',
          action: 'repair'
        });
      }
      return false;
    } finally {
      setIsLoadingPreview(false);
    }
  };
  
  // Function to validate file
  const validateFile = async (uploadedFile) => {
    // Check file extension
    const fileExtension = uploadedFile.name.split('.').pop().toLowerCase();
    
    if (fileExtension !== 'pdf') {
      setError({
        type: 'format',
        message: 'Invalid file format. Only PDF files are supported.',
        action: null
      });
      return false;
    }
    
    // Check file size
    if (uploadedFile.size > MAX_FILE_SIZE) {
      setError({
        type: 'size',
        message: 'File size exceeds the 20 MB limit.',
        action: null
      });
      return false;
    }
    
    // Validate PDF content, check for corruption and encryption
    return await validatePDFFile(uploadedFile);
  };
  
  // Handler for file selection
  const handleFileSelected = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const uploadedFile = selectedFiles[0];
    
    // Reset previous state
    setError(null);
    setResult(null);
    setPdfPreview(null);
    setPdfInfo(null);
    
    if (await validateFile(uploadedFile)) {
      setFile(uploadedFile);
    } else {
      setFile(null);
    }
  };
  
  // Reset to initial state
  const handleReset = () => {
    setFile(null);
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    setResult(null);
    setPdfPreview(null);
    setPdfInfo(null);
  };
  
  // Local drag event handlers
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
      handleFileSelected([droppedFiles[0]]);
    }
  };
  
  const handleRemoveFile = () => {
    setFile(null);
    setProgress(0);
    setError(null);
    setResult(null);
    setPdfPreview(null);
    setPdfInfo(null);
  };
  
  // Handle conversion to Excel
  const handleConvertToExcel = async () => {
    if (!file) {
      setError({
        type: 'validation',
        message: 'Please select a PDF file first.',
        action: null
      });
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      const result = await convertPDFToExcel(
        file,
        {
          outputFilename: file.name.replace(/\.[^/.]+$/, "") + ".xlsx"
        },
        (progressValue) => setProgress(progressValue)
      );
      
      setResult(result);
      
      if (resultSectionRef.current) {
        setTimeout(() => {
          resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('Conversion failed:', error);
      setError({
        type: 'conversion',
        message: error.message || 'PDF to Excel conversion failed. Please try again.',
        action: null
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle downloading
  const handleDownload = (fileId, fileName) => {
    const finalFileName = fileName.toLowerCase().endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    const downloadUrl = getExcelDownloadUrl(fileId, finalFileName);
    downloadFile(downloadUrl, finalFileName);
  };
  
  // Render error component
  const renderError = () => {
    if (!error) return null;
    
    const isEncrypted = error.type === 'encrypted';
    const isCorrupted = error.type === 'corruption';
    
    return (
      <div className={`w-full p-6 rounded-xl border mb-6 shadow-sm ${
        isEncrypted || isCorrupted ? 'bg-red-50 border-red-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {isEncrypted ? (
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            ) : isCorrupted ? (
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            )}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              {isEncrypted ? 'Password Protected PDF' : isCorrupted ? 'Corrupted PDF File' : 'Error'}
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {error.message}
            </p>
            
            <div className="mt-4 flex flex-wrap gap-3">
              {isEncrypted && (
                <a
                  href="/unlock-pdf"
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path>
                  </svg>
                  Unlock PDF
                </a>
              )}
              
              {isCorrupted && (
                <a
                  href="/repair-pdf"
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  Repair PDF
                </a>
              )}
              
              <button
                onClick={() => setError(null)}
                className="text-sm font-medium text-red-600 hover:text-red-800 px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      <div className='h-8'></div>
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileSelected([e.target.files[0]]);
          }
          e.target.value = null;
        }}
      />
      
      {/* Modal Loader */}
      <ModalLoader
        isVisible={isProcessing}
        progress={progress}
        estimatedTime={estimatedTime}
        text={"Converting PDF to Excel..."}
      />
      
      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl mt-4 font-bold mb-2">
          <span className="text-[#DA1F10]">PDF </span> to Excel
        </h1>
        <p className="text-gray-600">Convert your PDF documents to editable Excel spreadsheets</p>
        <p className="text-sm text-gray-500 mt-2">Only PDF files • Max 20 MB</p>
      </div>
      
      {/* Content with Sidebar Layout */}
      <div className="flex flex-col justify-center md:flex-row gap-6">
        {/* Main Content Area */}
        <div className="w-full md:w-3/4">
          {/* Upload Area */}
          {!file && !result && (
            <SelectFiles 
              onFilesSelected={handleFileSelected}
              onError={(err) => setError({ type: 'validation', message: err, action: null })}
              buttonText="Select PDF File"
              buttonColor="red"
              buttonSize="large"
              multiple={false}
              acceptedFileTypes=".pdf"
              maxSingleFileSize={MAX_FILE_SIZE}
              showHelperText={true}
            />
          )}
          
          {/* Error State */}
          {renderError()}
          
          {/* File Preview */}
          {file && (
            <div className="w-full">
              {/* File Header */}
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-lg font-medium">Selected PDF</h2>
                <button
                  onClick={handleRemoveFile}
                  className="text-red-600 cursor-pointer hover:text-red-800 font-medium flex items-center text-sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  Remove
                </button>
              </div>
              
              {/* Drop Zone */}
              <div
                className={`w-full border-2 cursor-pointer border-dashed rounded-lg mb-6 p-4 text-center drop-zone ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'} transition-all duration-200 hover:border-blue-300`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <p className="text-gray-500 text-sm">
                  Drag and drop a different PDF file here or{' '}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 cursor-pointer hover:text-blue-800 font-medium"
                  >
                    browse
                  </button>
                </p>
              </div>
              
              {/* File Card with Preview */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                <div className="flex p-4 items-center border-b border-gray-100">
                  <div className="bg-red-50 p-3 rounded-lg mr-4">
                    <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#DC3545"/>
                      <path d="M14 2V8H20L14 2Z" fill="#DC3545"/>
                      <text x="12" y="15" fontSize="6" textAnchor="middle" fill="white" fontWeight="bold">PDF</text>
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-medium truncate" title={file.name}>{file.name}</h3>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    {pdfInfo && (
                      <p className="text-sm text-gray-500">{pdfInfo.numPages} pages</p>
                    )}
                  </div>
                </div>
                
                {/* PDF Preview */}
                {isLoadingPreview && (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading preview...</p>
                  </div>
                )}
                
                {pdfPreview && (
                  <div className="p-4 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Preview - Page 1</h4>
                    <div className="flex justify-center">
                      <img 
                        src={pdfPreview} 
                        alt="PDF Preview" 
                        className="max-w-full h-auto max-h-96 border border-gray-200 rounded shadow-sm"
                      />
                    </div>
                    {pdfInfo && (
                      <div className="mt-3 text-xs text-gray-500 space-y-1">
                        {pdfInfo.title !== 'Untitled' && <p><strong>Title:</strong> {pdfInfo.title}</p>}
                        {pdfInfo.author !== 'Unknown' && <p><strong>Author:</strong> {pdfInfo.author}</p>}
                        <p><strong>Pages:</strong> {pdfInfo.numPages}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Results Section */}
          {result && (
            <div ref={resultSectionRef}>
              <DownloadSection
                files={[{
                  id: result.file_id,
                  name: file ? file.name.replace(/\.[^/.]+$/, "") + ".xlsx" : 'Converted Spreadsheet.xlsx',
                  size: result.output_size
                }]}
                downloadHandler={handleDownload}
                title="Download Excel Spreadsheet"
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
                  {pdfInfo && (
                    <li className="flex justify-between">
                      <span>Pages:</span>
                      <span className="font-medium">{pdfInfo.numPages}</span>
                    </li>
                  )}
                  {result && (
                    <li className="flex justify-between">
                      <span>Output size:</span>
                      <span className="font-medium">{formatFileSize(result.output_size)}</span>
                    </li>
                  )}
                </ul>
              </div>
              
              {/* Convert Button */}
              {file && !result && !error && (
                <button
                  onClick={handleConvertToExcel}
                  className="w-full cursor-pointer py-3 px-4 bg-[#DA1F10] hover:bg-red-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DA1F10] mb-4"
                >
                  Convert to Excel
                </button>
              )}
              
              {/* Tips Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">About PDF to Excel</h4>
                <ul className="text-sm text-gray-600 space-y-3">
                  <li className="flex">
                    <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Extracts tables and data</span>
                  </li>
                  <li className="flex">
                    <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Preserves numerical data</span>
                  </li>
                  <li className="flex">
                    <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Creates editable spreadsheets</span>
                  </li>
                  <li className="flex">
                    <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Perfect for data analysis</span>
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

export default PdfToExcelConverter;

const SelectFiles = ({ 
  onFilesSelected, 
  maxFiles = Infinity, // Add this new prop
  currentFileCount = 0, // Add this new prop
  maxSingleFileSize = 300 * 1024 * 1024, // 100 MB
  maxTotalFilesSize = 200 * 1024 * 1024, // 200 MB
  acceptedFileTypes = "application/pdf",
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
  const validateAndAddFiles = (newFiles) => {
    // Reset error
    onError(null);

    // Filter for accepted file types
    const validTypeFiles = newFiles.filter(file => {
      if (!file.type.match(acceptedFileTypes)) {
        onError(`"${file.name}" is not a valid file type. Only ${acceptedFileTypes} files are supported.`);
        return false;
      }
      return true;
    });
    if (currentFileCount + newFiles.length > maxFiles) {
      onError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

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

    // Calculate current total size if needed for total size check
    if (onFilesSelected && typeof onFilesSelected === 'function') {
      onFilesSelected(validSizeFiles);
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

  return (
    <>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={acceptedFileTypes}
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
                or drop files here
              </p>
              <p className="text-gray-500 text-xs mt-4">
                {acceptedFileTypes === "application/pdf" 
                  ? "Only PDF files. " 
                  : `Only ${acceptedFileTypes} files. `}
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};
