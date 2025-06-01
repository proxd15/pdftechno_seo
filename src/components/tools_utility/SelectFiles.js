"use client"

import { useState, useRef, useEffect } from 'react';

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
        multiple
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

export default SelectFiles;