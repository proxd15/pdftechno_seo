"use client"

import { useState, useRef, useEffect } from 'react';
import { protectPDF, createProtectionFormData, getDownloadUrl, downloadFile } from '../../api/pdfprotect_api';
import ModalLoader from '../tools_utility/ModalLoader';
import SelectFiles from '../tools_utility/SelectFiles';
import DownloadSection from '../tools_utility/DownloadSection';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

const PDFProtector = () => {
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

  // State for protection settings
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('print_only');
  const [passwordError, setPasswordError] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isAlreadyEncrypted, setIsAlreadyEncrypted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    }
  };

  // Calculate password strength
  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return 0;

    let score = 0;

    // Length check
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;

    // Complexity checks
    if (/[a-z]/.test(pwd)) score += 1; // Has lowercase
    if (/[A-Z]/.test(pwd)) score += 1; // Has uppercase
    if (/[0-9]/.test(pwd)) score += 1; // Has number
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1; // Has special character

    // Calculate percentage (0-6 scale to 0-100%)
    return Math.min(Math.floor((score / 6) * 100), 100);
  };

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

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
        setIsAlreadyEncrypted(false);
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
          const pdf = await loadingTask.promise;

          // Check if PDF is already encrypted
          if (pdf.isEncrypted) {
            setIsAlreadyEncrypted(true);
            setPreview('encrypted');
            setError("This PDF is already password protected. Please use the 'Unlock PDF' tool first.");
            pdf.destroy();
            return;
          }

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

          // Clean up
          pdf.destroy();

        } catch (error) {
          console.error('Error generating preview:', error);

          // Check if the error is related to encryption
          if (
            error.name === 'PasswordException' ||
            error.message.includes('password') ||
            error.message.includes('Password')
          ) {
            setPreview('encrypted');
            setIsAlreadyEncrypted(true);
            setError("This PDF is already password protected. Please use the 'Unlock PDF' tool first.");
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
    setIsAlreadyEncrypted(false);

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

    // Also reset password fields when a new file is added
    setPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  };

  // Format file size in a readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Get strength color
  const getStrengthColor = () => {
    if (passwordStrength < 30) return 'bg-red-500';
    if (passwordStrength < 60) return 'bg-yellow-500';
    if (passwordStrength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  // Get strength label
  const getStrengthLabel = () => {
    if (passwordStrength < 30) return 'Weak';
    if (passwordStrength < 60) return 'Fair';
    if (passwordStrength < 80) return 'Good';
    return 'Strong';
  };

  // Validate passwords
  const validatePasswords = () => {
    setPasswordError(null);

    if (!password) {
      setPasswordError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }

    if (passwordStrength < 30) {
      setPasswordError('Password is too weak. Add numbers or special characters');
      return false;
    }

    return true;
  };

  // Handle PDF Protection
  const handleProtectPDF = async () => {
    if (!file) return;

    // Don't proceed if the PDF is already encrypted
    if (isAlreadyEncrypted) {
      setError("This PDF is already password protected. Please use the 'Unlock PDF' tool first.");
      return;
    }

    // Validate passwords
    if (!validatePasswords()) {
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setConversionResult(null);

    try {
      // Create FormData with file, password and permission level
      const formData = createProtectionFormData(file, password, permissionLevel);

      // Call the API to protect PDF
      const result = await protectPDF(
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

      // Reset password fields after successful protection
      setPassword('');
      setConfirmPassword('');

    } catch (error) {
      console.error('Protection failed:', error);
      setError(error.message || 'PDF protection failed. Please try again.');
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
        text={"Protecting your PDF..."}
      />

      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl mt-4 font-bold mb-2">
          <span className="text-[#DB1E10]">Protect PDF</span> with Password
        </h1>
        <p className="text-gray-600">Add password protection to your PDF files</p>
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

          {/* Error State - Show special version for already encrypted files */}
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
                  {isAlreadyEncrypted && (
                    <div className="mt-3">
                      <Link href="/tools/pdf-unlock">
                        <span className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                          Go to Unlock PDF Tool →
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
          {/* File Preview */}
          {file && !isAlreadyEncrypted && (
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
                    setConfirmPassword('');
                    setPasswordError(null);
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
                    <h3 className="font-medium">PDF to Protect</h3>
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Setup Area */}
                <div className="mt-6 w-2/3 border rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <h3 className="font-medium">Password Protection Settings</h3>
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
                          if (passwordError) setPasswordError(null);
                        }}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#DB1E10] focus:border-[#DB1E10]"
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 cursor-pointer flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
    <Eye className="w-5 h-5" />
  ) : (
    <EyeOff className="w-5 h-5" />
  )}
                      </button>
                      </div>

                      {/* Password Strength Meter */}
                      {password.length > 0 && (
                        <div className="mt-2">
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getStrengthColor()} transition-all duration-300`}
                              style={{ width: `${passwordStrength}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Password strength: <span className="font-medium">{getStrengthLabel()}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Strong passwords include uppercase, lowercase, numbers, and special characters.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password Input */}
                    <div className="mb-4">
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                      </label>
                     <div className="relative">
    <input
      type={showConfirmPassword ? "text" : "password"}
      id="confirm-password"
      value={confirmPassword}
      onChange={(e) => {
        setConfirmPassword(e.target.value);
        if (passwordError) setPasswordError(null);
      }}
      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#DB1E10] focus:border-[#DB1E10]"
      placeholder="Confirm password"
    />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
    <Eye className="w-5 h-5" />
  ) : (
    <EyeOff className="w-5 h-5" />
  )}
                      </button>
                    </div>

                      {/* Password match indicator */}
                      {password && confirmPassword && (
                        <p className={`text-xs mt-1 ${password === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                          {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                        </p>
                      )}
                    </div>

                    {/* Permission Level Selection */}
                    <div className="mb-4">
                      <label htmlFor="permission-level" className="block text-sm font-medium text-gray-700 mb-1">
                        Permission Level
                      </label>
                      <select
                        id="permission-level"
                        value={permissionLevel}
                        onChange={(e) => setPermissionLevel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#DB1E10] focus:border-[#DB1E10]"
                      >
                        <option value="print_only">Allow printing only</option>
                        <option value="copy_allowed">Allow printing and copying</option>
                        <option value="edit_allowed">Allow printing, copying, and editing</option>
                        <option value="full_control">Full control (owner access)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Choose what users with the password can do with the document.
                      </p>
                    </div>
                  </div>
                </div>
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
                title="Download Password-Protected PDF"
                color="red"
                startOverHandler={() => {
                  setFile(null);
                  setPreview(null);
                  setError(null);
                  setConversionResult(null);
                  setPassword('');
                  setConfirmPassword('');
                  setPasswordError(null);
                }}
              />
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                    <div className="mt-1 text-sm text-yellow-700">
                      <p>Please remember your password. If you forget it, you may not be able to access your document again.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Only show when there's a file and it's not encrypted already */}
        {file && !isAlreadyEncrypted && (
          <div className="w-full md:w-1/4 md:sticky md:top-24 h-fit">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-medium text-lg mb-4">PDF Protection Info</h3>

              {/* Protection Info */}
              <div className="text-sm text-gray-600">
                <h4 className="font-medium text-gray-700 mb-2">Security Features</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#DB1E10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Strong AES-256 encryption</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#DB1E10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Control content permissions</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#DB1E10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Prevent unauthorized access</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#DB1E10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Secure confidential information</span>
                  </li>
                </ul>
                <button
                  onClick={handleProtectPDF}
                  className="w-full bg-[#DB1E10] hover:bg-[#C10007] mt-4 text-white font-medium py-3 rounded-lg transition-colors cursor-pointer"
                  disabled={preview === 'invalid' || isProcessing}
                >
                  Protect PDF with Password
                </button>
              </div>
              {/* Protect Button */}

              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Password Tips</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                    <span>Use a combination of letters, numbers, and symbols</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                    <span>Avoid using easily guessable information</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                    <span>Do not share your password with unauthorized persons</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                    <span className="font-medium">Important: Keep a backup of your password in a secure location</span>
                  </li>
                </ul>
              </div>

              {/* Use Cases Info */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Common Use Cases</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Sensitive business documents</li>
                  <li>• Financial reports and statements</li>
                  <li>• Personal information and records</li>
                  <li>• Contracts and legal documents</li>
                  <li>• Research papers and intellectual property</li>
                </ul>
              </div>
            </div>

            {/* Related Tools Box */}
            <div className="mt-4 bg-blue-50 p-5 rounded-xl border border-blue-200 shadow-sm">
              <h3 className="font-medium text-lg mb-3 text-blue-800">Related Tools</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/tools/pdf-unlock" className="text-blue-600 hover:text-blue-800 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    Unlock Password-Protected PDF
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
                <li>
                  <Link href="/tools/pdf-to-pdfa" className="text-blue-600 hover:text-blue-800 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2"></path>
                    </svg>
                    Convert PDF to PDF/A
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

export default PDFProtector;