"use client"

import { useState } from 'react';

// Define constants for file extensions and limits
const FILE_EXTENSIONS = {
  PDF: '.pdf',
  ZIP: '.zip'
};

// Character limits for file naming
const NAMING_LIMITS = {
  MAX_FILENAME_LENGTH: 100, // Maximum total filename length (including extension)
  MAX_BASENAME_LENGTH: 95,  // Maximum base name length (without extension)
  MIN_FILENAME_LENGTH: 1,   // Minimum filename length
  WARNING_LENGTH: 80        // Show warning when approaching limit
};

const DownloadSection = ({
  files = [],
  downloadHandler,
  previewHandler,
  zipDownloadHandler = null, // Optional handler for ZIP download
  zipUrl = null, // Direct URL to the ZIP file (optional)
  title = "Download Files",
  showFileInfo = true,
  color = "red", // "red" or "blue"
  startOverHandler = null, // Optional handler for "Start Over" button
  defaultZipName = "files.zip",
  defaultMergedName = "merged_document.pdf",
  forceShowZipDownload = false // Add this new prop
}) => {
  // State for files and naming
  const [fileNames, setFileNames] = useState(() => {
    // Initialize with original filenames
    const names = {};
    files.forEach((file, index) => {
      const fileName = file.name || file.original_filename;
      names[index] = fileName;
    });
    return names;
  });
  
  const [renamingIndex, setRenamingIndex] = useState(null);
  const [zipName, setZipName] = useState(defaultZipName.replace(FILE_EXTENSIONS.ZIP, ''));
  const [isRenamingZip, setIsRenamingZip] = useState(false);
  const [mergedName, setMergedName] = useState(defaultMergedName.replace(FILE_EXTENSIONS.PDF, ''));
  const [isRenamingMerged, setIsRenamingMerged] = useState(false);

  // Validation states
  const [validationErrors, setValidationErrors] = useState({});
  const [tempInputValues, setTempInputValues] = useState({});

  // Validate filename
  const validateFilename = (name, isZip = false) => {
    const errors = [];
    const maxLength = isZip ? NAMING_LIMITS.MAX_BASENAME_LENGTH : NAMING_LIMITS.MAX_BASENAME_LENGTH;
    
    if (!name || name.trim().length === 0) {
      errors.push('Filename cannot be empty');
    } else if (name.trim().length < NAMING_LIMITS.MIN_FILENAME_LENGTH) {
      errors.push('Filename is too short');
    } else if (name.length > maxLength) {
      errors.push(`Filename cannot exceed ${maxLength} characters`);
    }
    
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/g;
    if (invalidChars.test(name)) {
      errors.push('Filename contains invalid characters');
    }
    
    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    if (reservedNames.includes(name.toUpperCase())) {
      errors.push('This filename is reserved and cannot be used');
    }
    
    return errors;
  };

  // Get character count info
  const getCharacterInfo = (text, isZip = false) => {
    const maxLength = isZip ? NAMING_LIMITS.MAX_BASENAME_LENGTH : NAMING_LIMITS.MAX_BASENAME_LENGTH;
    const length = text.length;
    const remaining = maxLength - length;
    const isNearLimit = length >= NAMING_LIMITS.WARNING_LENGTH;
    const isOverLimit = length > maxLength;
    
    return {
      current: length,
      max: maxLength,
      remaining,
      isNearLimit,
      isOverLimit
    };
  };

  // Format file size in a readable format
  const formatFileSize = (bytes) => {
    if (bytes === undefined || bytes === null) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Function to truncate filename if too long (responsive)
  const truncateFilename = (filename, maxLength = 25) => {
    if (!filename) return '';
    
    // Responsive max length based on screen size
    const getMaxLength = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 640) return 15; // sm
        if (window.innerWidth < 768) return 20; // md
        if (window.innerWidth < 1024) return 25; // lg
        return maxLength; // xl and above
      }
      return maxLength;
    };
    
    const responsiveMaxLength = getMaxLength();
    
    // Split filename and extension
    const lastDotIndex = filename.lastIndexOf('.');
    let name = filename;
    let extension = '';
    
    if (lastDotIndex > 0) {
      name = filename.substring(0, lastDotIndex);
      extension = filename.substring(lastDotIndex);
    }
    
    if (filename.length <= responsiveMaxLength) {
      return filename;
    }
    
    // Calculate how much space we have for the name part
    const extensionLength = extension.length;
    const availableLength = responsiveMaxLength - extensionLength - 3; // 3 for "..."
    
    if (availableLength > 0) {
      return name.substring(0, availableLength) + '...' + extension;
    } else {
      // If extension is too long, just truncate the whole thing
      return filename.substring(0, responsiveMaxLength - 3) + '...';
    }
  };

  // Check if a file is a ZIP file
  const isZipFile = (fileName) => {
    return fileName && fileName.toLowerCase().endsWith(FILE_EXTENSIONS.ZIP);
  };

  // Check if a file is a PDF file
  const isPdfFile = (fileName) => {
    return fileName && fileName.toLowerCase().endsWith(FILE_EXTENSIONS.PDF);
  };

  // Color class mapping
  const colorClasses = {
    red: "bg-red-600 hover:bg-red-700",
    blue: "bg-blue-600 hover:bg-blue-700"
  };
  
  // Handle rename action with validation
  const handleRename = (index, newName) => {
    const trimmedName = newName.trim();
    const fileName = fileNames[index] || '';
    const isCurrentlyZip = isZipFile(fileName);
    const isCurrentlyPdf = isPdfFile(fileName);
    
    // Validate the new name
    const errors = validateFilename(trimmedName, isCurrentlyZip);
    
    if (errors.length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        [index]: errors
      }));
      return;
    }
    
    // Clear validation errors
    setValidationErrors(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
    
    // Preserve the correct extension based on file type
    let updatedName = trimmedName;
    if (isCurrentlyZip && !updatedName.toLowerCase().endsWith(FILE_EXTENSIONS.ZIP)) {
      updatedName += FILE_EXTENSIONS.ZIP;
    } else if (isCurrentlyPdf && !updatedName.toLowerCase().endsWith(FILE_EXTENSIONS.PDF)) {
      updatedName += FILE_EXTENSIONS.PDF;
    }
    
    setFileNames(prev => ({
      ...prev,
      [index]: updatedName
    }));
    setRenamingIndex(null);
    
    // Clear temp input value
    setTempInputValues(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };
  
  // Handle ZIP download with current name
  const handleZipDownload = () => {
    const trimmedName = zipName.trim();
    const errors = validateFilename(trimmedName, true);
    
    if (errors.length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        zip: errors
      }));
      return;
    }
    
    // Ensure the ZIP name has the correct extension
    const finalZipName = trimmedName.toLowerCase().endsWith(FILE_EXTENSIONS.ZIP) 
      ? trimmedName 
      : `${trimmedName}${FILE_EXTENSIONS.ZIP}`;
    
    // Call the parent handler with the ZIP name
    if (zipDownloadHandler) {
      zipDownloadHandler(finalZipName);
    }
  };
  
  // Handle file download with current name
  const handleDownload = (fileId, index) => {
    // Determine which filename to use
    let fileName;
    
    if (isSingleMergedPdf) {
      // For merged PDFs, validate and use the mergedName state
      const trimmedName = mergedName.trim();
      const errors = validateFilename(trimmedName, false);
      
      if (errors.length > 0) {
        setValidationErrors(prev => ({
          ...prev,
          merged: errors
        }));
        return;
      }
      
      fileName = trimmedName;
    } else {
      // For regular files, use the fileNames state
      fileName = fileNames[index] || "document";
      
      // Remove extension if present (we'll add it back)
      if (fileName.toLowerCase().endsWith(FILE_EXTENSIONS.PDF)) {
        fileName = fileName.slice(0, -FILE_EXTENSIONS.PDF.length);
      }
      if (fileName.toLowerCase().endsWith(FILE_EXTENSIONS.ZIP)) {
        fileName = fileName.slice(0, -FILE_EXTENSIONS.ZIP.length);
      }
    }
    
    // Determine if this is a ZIP or PDF file
    const originalFileName = files[index]?.name || files[index]?.original_filename || '';
    const isCurrentlyZip = isZipFile(originalFileName);
    
    // Add the correct extension based on file type
    if (isCurrentlyZip) {
      // This is a ZIP file
      if (!fileName.toLowerCase().endsWith(FILE_EXTENSIONS.ZIP)) {
        fileName = `${fileName}${FILE_EXTENSIONS.ZIP}`;
      }
    } else {
      // This is a PDF file
      if (!fileName.toLowerCase().endsWith(FILE_EXTENSIONS.PDF)) {
        fileName = `${fileName}${FILE_EXTENSIONS.PDF}`;
      }
    }
    
    // Call the parent handler with the fileId and custom filename
    if (downloadHandler) {
      downloadHandler(fileId, fileName);
    }
  };
  
  // Handle ZIP name change with validation
  const handleZipNameChange = (e) => {
    let newName = e.target.value;
    
    // Remove .pdf extension if present
    if (newName.toLowerCase().endsWith(FILE_EXTENSIONS.PDF)) {
      newName = newName.slice(0, -FILE_EXTENSIONS.PDF.length);
    }
    
    // Remove .zip extension if present - we'll add it back when needed
    if (newName.toLowerCase().endsWith(FILE_EXTENSIONS.ZIP)) {
      newName = newName.slice(0, -FILE_EXTENSIONS.ZIP.length);
    }
    
    // Enforce max length
    if (newName.length > NAMING_LIMITS.MAX_BASENAME_LENGTH) {
      newName = newName.substring(0, NAMING_LIMITS.MAX_BASENAME_LENGTH);
    }
    
    setZipName(newName);
    
    // Clear validation errors when user types
    if (validationErrors.zip) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated.zip;
        return updated;
      });
    }
  };
  
  // Handle merged PDF name change with validation
  const handleMergedNameChange = (e) => {
    let newName = e.target.value;
    
    // Remove .pdf extension if present - we'll add it back when needed
    if (newName.toLowerCase().endsWith(FILE_EXTENSIONS.PDF)) {
      newName = newName.slice(0, -FILE_EXTENSIONS.PDF.length);
    }
    
    // Enforce max length
    if (newName.length > NAMING_LIMITS.MAX_BASENAME_LENGTH) {
      newName = newName.substring(0, NAMING_LIMITS.MAX_BASENAME_LENGTH);
    }
    
    setMergedName(newName);
    
    // Clear validation errors when user types
    if (validationErrors.merged) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated.merged;
        return updated;
      });
    }
  };

  // Handle individual file input change
  const handleFileInputChange = (index, value) => {
    // Enforce max length
    if (value.length > NAMING_LIMITS.MAX_BASENAME_LENGTH) {
      value = value.substring(0, NAMING_LIMITS.MAX_BASENAME_LENGTH);
    }
    
    setTempInputValues(prev => ({
      ...prev,
      [index]: value
    }));
    
    // Clear validation errors when user types
    if (validationErrors[index]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    }
  };

  // Render character count and validation info
  const renderInputInfo = (text, isZip = false, errorKey = null) => {
    const charInfo = getCharacterInfo(text, isZip);
    const errors = validationErrors[errorKey] || [];
    
    return (
      <div className="mt-1 space-y-1">
        {/* Character count */}
        <div className={`text-xs flex justify-between ${
          charInfo.isOverLimit ? 'text-red-600' : 
          charInfo.isNearLimit ? 'text-yellow-600' : 'text-gray-500'
        }`}>
          <span>{charInfo.current}/{charInfo.max} characters</span>
          {charInfo.isNearLimit && (
            <span>{charInfo.remaining} remaining</span>
          )}
        </div>
        
        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="text-xs text-red-600">
            {errors.map((error, idx) => (
              <div key={idx}>• {error}</div>
            ))}
          </div>
        )}
        
        {/* Warning for approaching limit */}
        {charInfo.isNearLimit && !charInfo.isOverLimit && errors.length === 0 && (
          <div className="text-xs text-yellow-600">
            Approaching character limit
          </div>
        )}
      </div>
    );
  };

  // Determine if this is a single merged PDF case
  const isSingleMergedPdf = files.length === 1 && 
    title.toLowerCase().includes('merged') && 
    !isZipFile(files[0]?.name || files[0]?.original_filename || '');

  return (
    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl border border-gray-200 mb-8 shadow-lg max-w-7xl mx-auto">
      <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-center sm:text-left">{title}</h3>

      {/* All files ZIP download */}
      {(zipDownloadHandler && (files.length > 1 || forceShowZipDownload)) && (
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-grow">
              {isRenamingZip ? (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      type="text"
                      value={zipName}
                      onChange={handleZipNameChange}
                      className={`w-full border rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:border-blue-500 ${
                        validationErrors.zip ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Enter ZIP filename"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const errors = validateFilename(zipName.trim(), true);
                          if (errors.length === 0) {
                            setIsRenamingZip(false);
                          }
                        } else if (e.key === 'Escape') {
                          setIsRenamingZip(false);
                          setValidationErrors(prev => {
                            const updated = { ...prev };
                            delete updated.zip;
                            return updated;
                          });
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const errors = validateFilename(zipName.trim(), true);
                        if (errors.length === 0) {
                          setIsRenamingZip(false);
                        }
                      }}
                      className="self-end sm:self-auto text-gray-600 hover:text-gray-800 p-2 flex-shrink-0"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </button>
                  </div>
                  {renderInputInfo(zipName, true, 'zip')}
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                  </svg>
                  <div className="flex-grow min-w-0">
                    <p className="font-medium text-sm sm:text-lg truncate" title={`${zipName}${FILE_EXTENSIONS.ZIP}`}>
                      {truncateFilename(`${zipName}${FILE_EXTENSIONS.ZIP}`, 30)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">Archive with all files</p>
                  </div>
                  <button
                    onClick={() => setIsRenamingZip(true)}
                    className="text-gray-500 hover:text-gray-700 p-1 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                    title="Rename ZIP file"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                  </button>
                </div>
              )}
              {showFileInfo && (
                <p className="text-xs sm:text-sm text-gray-500 mt-2 ml-0 sm:ml-9">
                  {formatFileSize(files.reduce((sum, file) => sum + (file.size || file.file_size || 0), 0))}
                </p>
              )}
            </div>
            <button
              onClick={handleZipDownload}
              disabled={validationErrors.zip && validationErrors.zip.length > 0}
              className={`${colorClasses[color]} text-white text-sm sm:text-base font-medium px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors duration-200 flex items-center justify-center min-w-[120px] sm:min-w-[140px] w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              Download ZIP
            </button>
          </div>
        </div>
      )}

      {/* Single merged PDF case */}
      {isSingleMergedPdf && (
        <div className="mb-6 p-4 sm:p-5 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-grow min-w-0">
              {isRenamingMerged ? (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      type="text"
                      value={mergedName}
                      onChange={handleMergedNameChange}
                      className={`w-full border rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:border-blue-500 ${
                        validationErrors.merged ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Enter PDF filename"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const errors = validateFilename(mergedName.trim(), false);
                          if (errors.length === 0) {
                            setIsRenamingMerged(false);
                          }
                        } else if (e.key === 'Escape') {
                          setIsRenamingMerged(false);
                          setValidationErrors(prev => {
                            const updated = { ...prev };
                            delete updated.merged;
                            return updated;
                          });
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const errors = validateFilename(mergedName.trim(), false);
                        if (errors.length === 0) {
                          setIsRenamingMerged(false);
                        }
                      }}
                      className="self-end sm:self-auto text-gray-600 hover:text-gray-800 p-2 flex-shrink-0"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </button>
                  </div>
                  {renderInputInfo(mergedName, false, 'merged')}
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <p className="font-medium text-sm sm:text-lg flex-grow truncate" title={`${mergedName}${FILE_EXTENSIONS.PDF}`}>
                    {truncateFilename(`${mergedName}${FILE_EXTENSIONS.PDF}`, 30)}
                  </p>
                  <button
                    onClick={() => setIsRenamingMerged(true)}
                    className="text-gray-500 hover:text-gray-700 p-1 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                    title="Rename PDF file"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                  </button>
                </div>
              )}
              {showFileInfo && (files[0]?.size || files[0]?.file_size) && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{formatFileSize(files[0].size || files[0].file_size)}</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {/* Preview Button */}
              {previewHandler && (
                <button
                  onClick={() => previewHandler(files[0].id || 0, `${mergedName}${FILE_EXTENSIONS.PDF}`)}
                  className="bg-gray-700 hover:bg-gray-800 text-white text-sm sm:text-base font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center min-w-[100px]"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  <span className="hidden sm:inline">Preview</span>
                  <span className="sm:hidden">View</span>
                </button>
              )}

              {/* Download Button */}
              <button
                onClick={() => handleDownload(files[0].id || 0, 0)}
                disabled={validationErrors.merged && validationErrors.merged.length > 0}
                className={`${colorClasses[color]} text-white text-sm sm:text-base font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual file downloads */}
      {!isSingleMergedPdf && (
        <div className={files.length > 3 
          ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4" 
          : "space-y-3 sm:space-y-4"}>
          {files.map((file, index) => {
            // Skip any compressed_pdfs.zip files - they're redundant
            if (file.name && file.name.toLowerCase().includes('compressed_pdfs.zip')) {
              return null;
            }
            
            const fullFileName = fileNames[index] || file.name || file.original_filename;
            const isCurrentlyZip = isZipFile(fullFileName);
            
            // If we're showing a ZIP download button at the top AND this is a ZIP file, skip it
            if (isCurrentlyZip && (zipDownloadHandler && (files.length > 1 || forceShowZipDownload))) {
              return null;
            }
            
            const inputValue = tempInputValues[index] !== undefined ? tempInputValues[index] : (
              fileNames[index] ? (
                isCurrentlyZip 
                  ? fileNames[index].replace(FILE_EXTENSIONS.ZIP, '') 
                  : fileNames[index].replace(FILE_EXTENSIONS.PDF, '')
              ) : ''
            );
            
            return (
              <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex-grow min-w-0">
                  {renamingIndex === index ? (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => handleFileInputChange(index, e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:border-blue-500 ${
                            validationErrors[index] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                          }`}
                          placeholder="Enter filename"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const errors = validateFilename(inputValue.trim(), isCurrentlyZip);
                              if (errors.length === 0) {
                                handleRename(index, inputValue);
                              }
                            } else if (e.key === 'Escape') {
                              setRenamingIndex(null);
                              setTempInputValues(prev => {
                                const updated = { ...prev };
                                delete updated[index];
                                return updated;
                              });
                              setValidationErrors(prev => {
                                const updated = { ...prev };
                                delete updated[index];
                                return updated;
                              });
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const errors = validateFilename(inputValue.trim(), isCurrentlyZip);
                            if (errors.length === 0) {
                              handleRename(index, inputValue);
                            }
                          }}
                          disabled={validationErrors[index] && validationErrors[index].length > 0}
                          className="self-end sm:self-auto text-gray-600 hover:text-gray-800 p-2 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </button>
                      </div>
                      {renderInputInfo(inputValue, isCurrentlyZip, index)}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Show different icon for ZIP vs PDF files */}
                      {isCurrentlyZip ? (
                        <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                        </svg>
                      )}
                      <p className="font-medium text-sm sm:text-base flex-grow truncate min-w-0" title={fullFileName}>
                        {truncateFilename(fullFileName, 25)}
                      </p>
                      <button
                        onClick={() => {
                          setRenamingIndex(index);
                          // Initialize temp input value
                          const baseName = isCurrentlyZip 
                            ? fullFileName.replace(FILE_EXTENSIONS.ZIP, '') 
                            : fullFileName.replace(FILE_EXTENSIONS.PDF, '');
                          setTempInputValues(prev => ({
                            ...prev,
                            [index]: baseName
                          }));
                        }}
                        className="text-gray-500 hover:text-gray-700 p-1 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                        title="Rename file"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                        </svg>
                      </button>
                    </div>
                  )}
                  {showFileInfo && (file.size || file.file_size) && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {formatFileSize(file.size || file.file_size)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 flex-shrink-0">
                  {/* Preview Button - Only show for PDF files, not ZIP files */}
                  {previewHandler && !isCurrentlyZip && (
                    <button
                      onClick={() => previewHandler(file.id || index, fileNames[index] || file.name || file.original_filename)}
                      className="bg-gray-700 hover:bg-gray-800 text-white text-xs sm:text-sm font-medium px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors duration-200 flex items-center justify-center min-w-[70px] sm:min-w-[80px]"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                      <span className="hidden sm:inline">Preview</span>
                      <span className="sm:hidden">View</span>
                    </button>
                  )}

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownload(file.id || index, index)}
                    className={`${colorClasses[color]} text-white text-xs sm:text-sm font-medium px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors duration-200 flex items-center justify-center min-w-[80px] sm:min-w-[90px]`}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Start Over Button */}
      {startOverHandler && (
        <button
          onClick={startOverHandler}
          className="w-full mt-6 sm:mt-8 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-lg transition-colors duration-200"
        >
          Start Over with New Files
        </button>
      )}
    </div>
  );
};

export default DownloadSection;