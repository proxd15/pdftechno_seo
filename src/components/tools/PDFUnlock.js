"use client"

import { useState, useRef, useEffect } from 'react';
import { unlockPDF, createUnlockFormData, getDownloadUrl, downloadFile } from '../../api/pdfunlock_api';
import ModalLoader from '../tools_utility/ModalLoader';
import SelectFiles from '../tools_utility/SelectFiles';
import DownloadSection from '../tools_utility/DownloadSection';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

const PDFUnlock = () => {
  // State for files and UI
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [conversionResult, setConversionResult] = useState(null);
  const fileInputRef = useRef(null);
  const resultSectionRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);

  // State for decryption settings
  const [password, setPassword] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isAlreadyDecrypted, setIsAlreadyDecrypted] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // File size limit (in bytes)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

  // Calculate estimated upload time based on file size (rough estimate)
  const estimatedUploadTime = file ? Math.ceil(file.size / (400 * 1024)) : 0;

  // Handle file download
  const handleDownload = (fileId, fileName) => {
    // Ensure the filename has .pdf extension
    const finalFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    downloadFile(getDownloadUrl(fileId, finalFileName), finalFileName);
  };

  // Handle selected file
  const handleFileSelected = (selectedFiles) => {
    if (selectedFiles && selectedFiles.length > 0) {
      // Only use the first file since this tool processes one file at a time
      setFile(selectedFiles[0]);
      
      // Reset any previous results
      setConversionResult(null);
      setPassword('');
      setPasswordError(null);
    }
  };

  // Scroll to results section when conversion completes
  useEffect(() => {
    if (conversionResult && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversionResult]);

  // Generate preview whenever file changes
  useEffect(() => {
    const generatePreview = async () => {
      if (!file) {
        setPreview(null);
        setIsEncrypted(false);
        setIsAlreadyDecrypted(false);
        return;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();

        // Check if PDF is valid
        try {
          // Use window.pdfjsLib which is loaded from CDN
          const loadingTask = window.pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
            cMapPacked: true
          });
          
          // Check if the PDF is encrypted
          const pdfInfo = await loadingTask.promise;
          
          if (pdfInfo.isEncrypted) {
            setIsEncrypted(true);
            setIsAlreadyDecrypted(false);
            setPreview('encrypted');
          } else {
            // PDF is not encrypted, show preview
            setIsEncrypted(false);
            setIsAlreadyDecrypted(true);
            
            // Generate preview from first page
            const page = await pdfInfo.getPage(1);

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
            
            // Show alert that PDF is already unlocked
            setError("This PDF is not password protected. No need to unlock it.");
          }
          
          // Clean up
          pdfInfo.destroy();

        } catch (error) {
          console.error('Error generating preview:', error);
          
          // Check if the error is related to encryption
          if (
            error.name === 'PasswordException' || 
            error.message.includes('password') || 
            error.message.includes('Password')
          ) {
            setIsEncrypted(true);
            setIsAlreadyDecrypted(false);
            setPreview('encrypted');
          } else {
            setPreview('invalid');
            setError(`"${file.name}" is not a valid PDF file or is corrupted. Please try another file.`);
          }
        }
      } catch (error) {
        console.error('General error processing file:', error);
        setPreview('invalid');
        setError(`"${file.name}" is not a valid PDF file. Please try another file.`);
      }
    };

    if (window.pdfjsLib && file) {
      generatePreview();
    } else {
      setPreview(null);
    }
  }, [file]);

  // Add this function to the component
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      // We only want to process the first file since this tool handles one file at a time
      addFileWithValidation(selectedFiles);
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = null;
  };

  // Validate file before adding
  const addFileWithValidation = (newFiles) => {
    // Reset error and encryption state
    setError(null);
    setIsEncrypted(false);
    setIsAlreadyDecrypted(false);
    setPassword('');
    setPasswordError(null);

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
    
    // Reset any previous results
    setConversionResult(null);
  };

  // Format file size in a readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Handle PDF Unlocking
  const handleUnlockPDF = async () => {
    if (!file) return;
    
    if (!isEncrypted) {
      setError("This PDF is not password protected and doesn't need to be unlocked.");
      return;
    }
    
    if (!password.trim()) {
      setPasswordError('Please enter the password for this PDF');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setPasswordError(null);
    setConversionResult(null);

    try {
      // Create FormData with file and password
      const formData = createUnlockFormData(file, password);
      
      // Call the API to unlock PDF
      const result = await unlockPDF(
        formData,
        (progressValue) => setProgress(progressValue)
      );

      setConversionResult(result);
      
      // Auto-scroll to the results section
      if (resultSectionRef.current) {
        setTimeout(() => {
          resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      
      // Reset password field after successful unlocking
      setPassword('');
      
    } catch (error) {
      console.error('Unlocking failed:', error);
      
      if (error.message && error.message.includes('Incorrect password')) {
        setPasswordError('Incorrect password. Please try again.');
      } else {
        setError(error.message || 'PDF unlocking failed. Please try again.');
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
        estimatedTime={estimatedUploadTime}
        text={"Unlocking your PDF..."}
      />

      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl mt-4 font-bold mb-2">
          <span className="text-[#DB1E10]">Unlock</span> PDF File
        </h1>
        <p className="text-gray-600">Remove password protection from your PDF files</p>
        <p className="text-sm text-gray-500 mt-2">Max file size: 100 MB</p>
      </div>

      {/* Content with Sidebar Layout */}
      <div className="flex flex-col justify-center md:flex-row gap-6">
        {/* Main Content Area */}
        <div className="w-full md:w-3/4">
          {/* Upload Area - Only show if no file uploaded yet */}
          {!file && !conversionResult && (
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

          {/* Error State - Show special version for already unlocked files */}
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
                    {isAlreadyDecrypted ? 'Information' : 'Error'}
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {error}
                  </p>
                  {isAlreadyDecrypted && (
                    <div className="mt-3">
                      <Link href="/tools/pdf-protect">
                        <span className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                          Go to Protect PDF Tool →
                        </span>
                      </Link>
                    </div>
                  )}
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
          {file && !isAlreadyDecrypted && (
            <div className="w-full mb-6">
              <div className="flex border-b border-gray-100 justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Selected File</h2>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setError(null);
                    setConversionResult(null);
                    setPassword('');
                    setPasswordError(null);
                    setIsEncrypted(false);
                    setIsAlreadyDecrypted(false);
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
              
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="border w-1/3 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <h3 className="font-medium">PDF to Unlock</h3>
                  </div>
                  <div className="p-4">
                    <div className="md:flex-row items-center">
                      {/* PDF Preview */}
                      <div className="w-full md:w-1/3 flex items-center justify-center p-4">
                        {preview === 'invalid' ? (
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
                        ) : preview === 'encrypted' ? (
                          <div className="text-center">
                            <div className="text-amber-500 flex flex-col items-center">
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
                              <span className="text-xs">Enter password to unlock</span>
                            </div>
                          </div>
                        ) : preview ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <img
                              src={preview}
                              alt={`Preview of ${file.name}`}
                              className="max-h-80 max-w-full object-contain shadow-sm"
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
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Entry Area */}
                {isEncrypted && (
                  <div className="mt-6 w-2/3 border rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="px-4 py-3 bg-gray-50 border-b">
                      <h3 className="font-medium">Enter PDF Password</h3>
                    </div>
                    <div className="p-6">
                      {/* Password Error (if any) */}
                      {passwordError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                          {passwordError}
                        </div>
                      )}

                      {/* Password Input */}
                      <div className="mb-4">
  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
    Password
  </label>
  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      id="password"
      value={password}
      onChange={(e) => {
        setPassword(e.target.value);
        // Clear error when user types
        if (passwordError) setPasswordError(null);
      }}
      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#DB1E10] focus:border-[#DB1E10]"
      placeholder="Enter PDF password"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute inset-y-0 cursor-pointer right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? (
        <Eye className="h-4 w-4" />
      ) : (
        <EyeOff className="h-4 w-4" />
      )}
    </button>
  </div>
  <p className="text-xs text-gray-500 mt-2">
    Enter the password that was used to protect this PDF file.
  </p>
</div>

                      <p className="text-sm text-gray-600 mb-4">
                        This tool will unlock your PDF file by removing the password protection. You'll receive a new PDF file that can be opened without a password.
                      </p>

                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-xs text-blue-700">
                              Your files are processed securely. We do not store your password or PDF content.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Section */}
          {conversionResult && !isProcessing && (
            <div ref={resultSectionRef}>
              <DownloadSection
                files={[conversionResult.file]}
                downloadHandler={handleDownload}
                previewHandler={null}
                title="Download Unlocked PDF"
                color="red"
                startOverHandler={() => {
                  setFile(null);
                  setPreview(null);
                  setError(null);
                  setConversionResult(null);
                  setPassword('');
                  setPasswordError(null);
                  setIsEncrypted(false);
                  setIsAlreadyDecrypted(false);
                }}
              />
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Success</h3>
                    <div className="mt-1 text-sm text-blue-700">
                      <p>Your PDF has been successfully unlocked. You can now open the document without a password.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Only show when there's a file and it's encrypted */}
        {file && isEncrypted && !conversionResult && (
          <div className="w-full md:w-1/4 md:sticky md:top-24 h-fit">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-medium text-lg mb-4">PDF Unlock Info</h3>

              {/* Unlock Info */}
              <div className="text-sm text-gray-600">
                <h4 className="font-medium text-gray-700 mb-2">About This Tool</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#DB1E10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Removes password protection</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#DB1E10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>No file size changes</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#DB1E10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Fast and secure processing</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#DB1E10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Your files stay private</span>
                  </li>
                </ul>
                
                {/* Unlock Button */}
                <button
                  onClick={handleUnlockPDF}
                  className="w-full bg-[#DB1E10] hover:bg-[#C10007] mt-4 text-white font-medium py-3 rounded-lg transition-colors cursor-pointer"
                  disabled={!isEncrypted || !password || isProcessing}
                >
                  Unlock PDF
                </button>
              </div>

              {/* Use Cases Info */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">When To Use This Tool</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• When you've forgotten your own password</li>
                  <li>• For removing restrictions from your PDFs</li>
                  <li>• To enable editing of protected documents</li>
                  <li>• Before merging with other PDF files</li>
                  <li>• For archiving documents without passwords</li>
                </ul>
              </div>
            </div>

            {/* Related Tools Box */}
            <div className="mt-4 bg-blue-50 p-5 rounded-xl border border-blue-200 shadow-sm">
              <h3 className="font-medium text-lg mb-3 text-blue-800">Related Tools</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/tools/pdf-protect" className="text-blue-600 hover:text-blue-800 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    Protect PDF with Password
                  </Link>
                </li>
                <li>
                  <Link href="/tools/pdf-merge" className="text-blue-600 hover:text-blue-800 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                    Merge PDF Files
                  </Link>
                </li>
                <li>
                  <Link href="/tools/pdf-compress" className="text-blue-600 hover:text-blue-800 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                    Compress PDF
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Sidebar for already unlocked PDFs */}
{file && isAlreadyDecrypted  && (
  <div className="w-full md:w-1/4 md:sticky md:top-24 h-fit">
    <div className="bg-green-50 p-5 rounded-xl border border-green-200 shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-green-800">PDF Already Unlocked</h3>
          <div className="mt-2 text-sm text-green-700">
            <p>This PDF file is not password protected and doesn't need to be unlocked.</p>
            <p className="mt-2">You can use it as is or add password protection if needed.</p>
            
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button 
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setError(null);
                  setIsAlreadyDecrypted(false);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors text-sm font-medium"
              >
                Upload New File
              </button>
              
              <Link href="/tools/protect-pdf">
                <button className="px-4 py-2 bg-[#DB1E10] hover:bg-[#C10007] text-white rounded-lg transition-colors text-sm font-medium">
                  Protect This PDF
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Related Tools Box */}
    <div className="mt-4 bg-blue-50 p-5 rounded-xl border border-blue-200 shadow-sm">
      <h3 className="font-medium text-lg mb-3 text-blue-800">Other PDF Tools</h3>
      <ul className="space-y-2">
        <li>
          <Link href="/tools/pdf-to-pdfa" className="text-blue-600 hover:text-blue-800 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2"></path>
            </svg>
            Convert PDF to PDF/A
          </Link>
        </li>
        <li>
          <Link href="/tools/pdf-to-image" className="text-blue-600 hover:text-blue-800 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            Convert PDF to Image
          </Link>
        </li>
        <li>
          <Link href="/tools/rotate-pdf" className="text-blue-600 hover:text-blue-800 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Rotate PDF Pages
          </Link>
        </li>
      </ul>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default PDFUnlock;