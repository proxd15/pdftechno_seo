"use client"

import { useState } from 'react';

// Define constants for file extensions
const FILE_EXTENSIONS = {
  PDF: '.pdf',
  ZIP: '.zip'
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
  // State for tracking file names
  const [fileNames, setFileNames] = useState(() => {
    // Initialize with original filenames
    const names = {};
    files.forEach((file, index) => {
      const fileName = file.name || file.original_filename;
      names[index] = fileName;
    });
    return names;
  });
  
  // State for tracking if a file is being renamed
  const [renamingIndex, setRenamingIndex] = useState(null);
  
  // State for the ZIP file name
  const [zipName, setZipName] = useState(defaultZipName);
  const [isRenamingZip, setIsRenamingZip] = useState(false);
  
  // State for merged PDF name (only used in single file case)
  const [mergedName, setMergedName] = useState(defaultMergedName);
  const [isRenamingMerged, setIsRenamingMerged] = useState(false);

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

  // Color class mapping
  const colorClasses = {
    red: "bg-red-600 hover:bg-red-700",
    blue: "bg-blue-600 hover:bg-blue-700"
  };
  
  // Handle rename action
  const handleRename = (index, newName) => {
    // Extract file extension
    const fileName = fileNames[index] || '';
    const hasExtension = fileName.toLowerCase().endsWith(FILE_EXTENSIONS.PDF);
    
    // If the file had a .pdf extension, make sure the new name keeps it
    let updatedName = newName;
    if (hasExtension && !updatedName.toLowerCase().endsWith(FILE_EXTENSIONS.PDF)) {
      updatedName += FILE_EXTENSIONS.PDF;
    }
    
    setFileNames(prev => ({
      ...prev,
      [index]: updatedName
    }));
    setRenamingIndex(null);
  };
  
  // Handle ZIP download with current name
  const handleZipDownload = () => {
    // Ensure the ZIP name has the correct extension
    const finalZipName = zipName.toLowerCase().endsWith(FILE_EXTENSIONS.ZIP) 
      ? zipName 
      : `${zipName}${FILE_EXTENSIONS.ZIP}`;
    
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
      // For merged PDFs, use the mergedName state
      fileName = mergedName;
    } else {
      // For regular files, use the fileNames state
      fileName = fileNames[index] || "document.pdf";
    }
    
    // Add .pdf extension if missing for PDF files
    if (!fileName.toLowerCase().endsWith(FILE_EXTENSIONS.PDF)) {
      fileName = `${fileName}${FILE_EXTENSIONS.PDF}`;
    }
    
    // Call the parent handler with the fileId and custom filename
    if (downloadHandler) {
      downloadHandler(fileId, fileName);
    }
  };
  
  // Handle ZIP name change
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
    
    setZipName(newName);
  };
  
  // Handle merged PDF name change
  const handleMergedNameChange = (e) => {
    let newName = e.target.value;
    
    // Remove .pdf extension if present - we'll add it back when needed
    if (newName.toLowerCase().endsWith(FILE_EXTENSIONS.PDF)) {
      newName = newName.slice(0, -FILE_EXTENSIONS.PDF.length);
    }
    
    setMergedName(newName);
  };

  // Determine if this is a single merged PDF case
  const isSingleMergedPdf = files.length === 1 && title.toLowerCase().includes('merged');

  return (
    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl border border-gray-200 mb-8 shadow-lg max-w-7xl mx-auto">
      <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-center sm:text-left">{title}</h3>

      {/* All files ZIP download (only if multiple files and handler provided) */}
      {(zipDownloadHandler && (files.length > 1 || forceShowZipDownload)) && (
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-grow">
              {isRenamingZip ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="text"
                    value={zipName}
                    onChange={handleZipNameChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsRenamingZip(false);
                      } else if (e.key === 'Escape') {
                        setIsRenamingZip(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => setIsRenamingZip(false)}
                    className="self-end sm:self-auto text-gray-600 hover:text-gray-800 p-2 flex-shrink-0"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
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
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
              className={`${colorClasses[color]} text-white text-sm sm:text-base font-medium px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors duration-200 flex items-center justify-center min-w-[120px] sm:min-w-[140px] w-full sm:w-auto`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              Download ZIP
            </button>
          </div>
        </div>
      )}

      {/* Single merged PDF case (special handling) */}
      {isSingleMergedPdf && (
        <div className="mb-6 p-4 sm:p-5 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-grow min-w-0">
              {isRenamingMerged ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="text"
                    value={mergedName}
                    onChange={handleMergedNameChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsRenamingMerged(false);
                      } else if (e.key === 'Escape') {
                        setIsRenamingMerged(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => setIsRenamingMerged(false)}
                    className="self-end sm:self-auto text-gray-600 hover:text-gray-800 p-2 flex-shrink-0"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </button>
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
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                className={`${colorClasses[color]} text-white text-sm sm:text-base font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center min-w-[120px]`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual file downloads - Only show for compression or other tools with multiple output files */}
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
            
            return (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex-grow min-w-0">
                  {renamingIndex === index ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <input
                        type="text"
                        value={fileNames[index] ? fileNames[index].replace(FILE_EXTENSIONS.PDF, '') : ''}
                        onChange={(e) => setFileNames({...fileNames, [index]: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRename(index, fileNames[index]);
                          } else if (e.key === 'Escape') {
                            setRenamingIndex(null);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleRename(index, fileNames[index])}
                        className="self-end sm:self-auto text-gray-600 hover:text-gray-800 p-2 flex-shrink-0"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <p className="font-medium text-sm sm:text-base flex-grow truncate min-w-0" title={fullFileName}>
                        {truncateFilename(fullFileName, 25)}
                      </p>
                      <button
                        onClick={() => setRenamingIndex(index)}
                        className="text-gray-500 hover:text-gray-700 p-1 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                        title="Rename file"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                  {/* Preview Button */}
                  {previewHandler && (
                    <button
                      onClick={() => previewHandler(file.id || index, fileNames[index] || file.name || file.original_filename)}
                      className="bg-gray-700 hover:bg-gray-800 text-white text-xs sm:text-sm font-medium px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors duration-200 flex items-center justify-center min-w-[70px] sm:min-w-[80px]"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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