"use client"

import { useState, useRef, useEffect } from 'react';
import { mergePDFs, getDownloadUrl, downloadFile } from '../../api/merge_api';
import ModalLoader from '../tools_utility/ModalLoader';
import { DndProvider, useDrag, useDrop, useDragDropManager } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useScroll } from './useScroll';
import PDFPreviewModal from '../tools_utility/PDFPreviewModal.';
import SelectFiles from '../tools_utility/SelectFiles';
import DownloadSection from '../tools_utility/DownloadSection';

// PDF.js is imported via script tag in the page

const ItemTypes = {
  PDF_FILE: 'pdf_file'
};

const DragScrollManager = ({ children, fileListRef, isDragInProgress, updatePosition }) => {
  const dragDropManager = useDragDropManager();
  const monitor = dragDropManager.getMonitor();
  
  useEffect(() => {
    const unsubscribe = monitor.subscribeToOffsetChange(() => {
      if (isDragInProgress) {
        const offset = monitor.getSourceClientOffset()?.y;
        if (offset !== undefined) {
          updatePosition({ 
            position: offset, 
            isScrollAllowed: isDragInProgress 
          });
        }
      }
    });
    
    return unsubscribe;
  }, [monitor, updatePosition, isDragInProgress]);
  
  return <>{children}</>;
};
// Draggable PDF File Component
// Fixed DraggablePDFFile Component - Remove the duplicate hook call
const DraggablePDFFile = ({ file, index, preview, moveFile, removeFile, handleDecryptFile, isEncrypted, isDecrypted, onDragStart, onDragEnd, listLength, rotation = 0, handleRotate }) => {
  const ref = useRef(null);
  const [dropIndicator, setDropIndicator] = useState(null); // 'top', 'bottom', or null
  const lastMoveTime = useRef(Date.now());
  
  // Set up drag functionality - don't use a nested function that calls hooks
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.PDF_FILE,
    item: () => {
      onDragStart(index);
      return { index };
    },
    end: () => {
      onDragEnd();
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  // Set up drop functionality with improved hover indicators
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.PDF_FILE,
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        setDropIndicator(null);
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      // Set drop indicator position
      if (hoverClientY < hoverMiddleY) {
        setDropIndicator('top');
      } else {
        setDropIndicator('bottom');
      }
      
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // When dragging upwards, only move when the cursor is above 50%
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Reduce debounce time for smoother reordering
      const now = Date.now();
      if (now - lastMoveTime.current > 30) { // reduced from 50ms
        // Time to actually perform the action
        moveFile(dragIndex, hoverIndex);
        item.index = hoverIndex;
        lastMoveTime.current = now;
      }
    },
    drop() {
      setDropIndicator(null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });
  
  // Reset drop indicator when not hovering
  useEffect(() => {
    if (!isOver) {
      setDropIndicator(null);
    }
  }, [isOver]);
  
  // Join the drag and drop refs
  drag(drop(ref));
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  const previewState = preview;
  const isCorrupted = previewState === 'corrupted';
  const hasError = isCorrupted || (isEncrypted && !isDecrypted);
  const isInvalid = previewState === 'invalid';
  
  // JSX remains the same
  return (
    <div 
      ref={ref}
      className={`relative border rounded-xl overflow-hidden 
                 ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'} 
                 ${hasError ? 'border-red-300 bg-red-50' : isOver ? 'border-blue-400 bg-blue-50' : 'bg-white border-gray-200'} 
                 shadow-sm hover:shadow-md transition-all duration-200`}
      data-position={index}
      data-total={listLength}
    >
      {/* Top drop indicator */}
      {dropIndicator === 'top' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 z-10"></div>
      )}
      
      {/* Bottom drop indicator */}
      {dropIndicator === 'bottom' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 z-10"></div>
      )}
      
      {/* Drag Handle */}
      <div className="flex justify-center bg-gray-100 py-1 border-b border-gray-200 cursor-move">
        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
        </svg>
      </div>
      
      {/* Preview with fixed dimensions */}
      <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
        {previewState && !hasError && !isInvalid ? (
          
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={previewState}
              alt={`Preview of ${file.name}`}
              className="max-h-full max-w-full object-contain shadow-sm"
              style={{ 
                transform: `rotate(${rotation}deg)`, 
                transition: 'transform 0.3s ease',
                maxHeight: rotation % 180 !== 0 ? '80%' : '100%',  // Scale down more when rotated to portrait
                maxWidth: rotation % 180 !== 0 ? '80%' : '100%'
              }}
            />
          </div>
        ) : hasError ? (
          <div className="text-red-500 flex flex-col items-center p-4 text-center">
            <svg
              className="w-12 h-12 mb-2"
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

            {isEncrypted ? (
              <div className='flex flex-col'>
                <span className="font-medium">Password Protected PDF</span>
                <button
                  onClick={() => handleDecryptFile(index)}
                  className="mt-2 block text-xs px-3 py-1 bg-[#DA1F10] text-white rounded-full hover:bg-[#C10007] transition-colors cursor-pointer"
                >
                  {isDecrypted ? "Change Password" : "Enter Password"}
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
        ) : (
          <div className="text-gray-400 flex flex-col items-center">
            <svg
              className="w-12 h-12 mb-2"
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
            <span>Loading preview...</span>
          </div>
        
        )}
        {previewState && !hasError && !isInvalid && (
          <div className="absolute top-2 right-2">
            <button
              onClick={() => handleRotate(index, 'clockwise')}
              className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-gray-700"
              title="Rotate 90°"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="p-3 flex justify-between items-center">
        <div className="truncate mr-2">
          <div className="flex items-center">
            <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full mr-2">
              {index + 1}
            </span>
            <p className={`font-medium truncate text-sm ${hasError ? 'text-red-600' : ''}`} title={file.name}>
              {file.name}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formatFileSize(file.size)}
          </p>
        </div>
        <button
          onClick={() => removeFile(index)}
          className="text-red-500 cursor-pointer hover:text-red-700 p-1"
          title="Remove file"
        >
          <svg
            className="w-5 h-5"
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
        </button>
      </div>
    </div>
  );
};
const PDFMerger = () => {
  const fileInputRef = useRef(null);

  const cursorPosRef = useRef(null);



  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [mergeResult, setMergeResult] = useState(null);
  const fileListRef = useRef(null);
  const { updatePosition } = useScroll(fileListRef);
  const resultSectionRef = useRef(null);
  const [encryptedFiles, setEncryptedFiles] = useState({});
  const [decryptedFiles, setDecryptedFiles] = useState({});
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    fileIndex: null,
    fileName: '',
    error: '',
    password: ''
  });
  const [isDragInProgress, setIsDragInProgress] = useState(false);
  const [currentDragIndex, setCurrentDragIndex] = useState(null);
  const lastMoveTimestamp = useRef(Date.now());
  const [fileRotations, setFileRotations] = useState({});
  const prevMouseYRef = useRef(null);


  const dragLogCountRef = useRef(0);
const mouseEventCountRef = useRef(0);
const scrollCheckCountRef = useRef(0);

const handleDownload = (fileId, fileName) => {
  // Ensure the filename has .pdf extension
  const finalFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  
  // Use the correct URL with custom filename
  const downloadUrl = getDownloadUrl(fileId, 'pdf', finalFileName);
  downloadFile(downloadUrl, finalFileName);
};

const handlePreview = async (fileId, fileName) => {
  // Your preview logic here
  setPreviewModal({
    isOpen: true,
    pdfUrl: await getPreviewUrl(fileId),
    fileName: fileName
  });
};

const [previewModal, setPreviewModal] = useState({
  isOpen: false,
  pdfUrl: null,
  fileName: ''
});

const handleFilesSelected = (selectedFiles) => {
  // Add to existing files
  setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
};

// Debug logger to avoid console spam
const dragLog = (message, data = {}, force = false) => {
  dragLogCountRef.current++;
  if (force || dragLogCountRef.current % 10 === 0) {
    console.log(`[DragDebug ${dragLogCountRef.current}] ${message}`, {
      ...data,
      isDragging: isDragInProgress,
      currentIndex: currentDragIndex,
      cursorY: cursorPosRef.current
    });
  }
};

const handleFileDownload = () => {
  downloadFile();
};
// In PDFMerger component
const handleRotatePDF = (index, direction) => {
  const file = files[index];
  
  // Get current rotation (default to 0 if not set)
  const currentRotation = fileRotations[file.name] || 0;
  
  // Calculate new rotation (clockwise: +90, counter-clockwise: -90)
  let newRotation = currentRotation;
  if (direction === 'clockwise') {
    newRotation = (currentRotation + 90) % 360;
  } else {
    newRotation = (currentRotation - 90 + 360) % 360;
  }
  
  // Update rotation state
  setFileRotations(prev => ({
    ...prev,
    [file.name]: newRotation
  }));
};  

const handleOpenPreview = async () => {
  if (mergeResult) {
    try {
      setIsProcessing(true); // Show loading indicator
      
      // Get the download URL
      const downloadUrl = getDownloadUrl(mergeResult.job_id, 'pdf');
      console.log('Fetching PDF from URL:', downloadUrl);
      
      // Fetch the PDF data
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      // Get the PDF data as a blob
      const pdfBlob = await response.blob();
      
      // Create an object URL from the blob
      const objectUrl = URL.createObjectURL(pdfBlob);
      console.log('Created Object URL for preview:', objectUrl);
      
      // Open the preview modal with the object URL
      setPreviewModal({
        isOpen: true,
        pdfUrl: objectUrl,
        fileName: 'Merged Document.pdf'
      });
    } catch (error) {
      console.error('Error preparing PDF preview:', error);
      setError('Unable to preview the PDF. Please try downloading instead.');
    } finally {
      setIsProcessing(false); // Hide loading indicator
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


  // File size limits (in bytes)
  const MAX_SINGLE_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
  const MAX_TOTAL_FILES_SIZE = 200 * 1024 * 1024; // 200 MB

  // Calculate total size of all files
  const totalSize = files.reduce((total, file) => total + file.size, 0);

  // Calculate estimated upload time based on file size (rough estimate)
  // Using 400 KB/s as estimation base for average connection
  const estimatedUploadTime = Math.ceil(totalSize / (400 * 1024));

  // Scroll to results section when merge completes
  useEffect(() => {
    if (mergeResult && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mergeResult]);

  // Generate previews whenever files change
  useEffect(() => {
    const generatePreviews = async () => {
      const newPreviews = { ...previews };

      for (const file of files) {
        if (!previews[file.name]) {
          try {
            // Use a promise with timeout to prevent hanging on problematic files
            const arrayBuffer = await Promise.race([
              file.arrayBuffer(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Preview generation timed out')), 8000)
              )
            ]);

            try {
              // Ensure PDF.js is properly loaded
              if (!window.pdfjsLib) {
                console.error('PDF.js library not loaded');
                newPreviews[file.name] = 'invalid';
                continue;
              }
              
              // Use better PDF.js configuration
              const loadingTask = window.pdfjsLib.getDocument({
                data: arrayBuffer,
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
                cMapPacked: true
              });
              
              const pdf = await loadingTask.promise;
              const page = await pdf.getPage(1);

              // Use fixed dimensions for preview
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

              // Use jpeg format with compression for better performance
              newPreviews[file.name] = canvas.toDataURL('image/jpeg', 0.85);
            } catch (error) {
              console.error('Error generating preview for:', file.name, error);

              // Better error detection
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
              } else {
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
    };

    if (window.pdfjsLib && files.length > 0) {
      generatePreviews();
    }
  }, [files]);

  const handleDecryptFile = (fileIndex) => {
    const file = files[fileIndex];
    setPasswordModal({
      isOpen: true,
      fileIndex,
      fileName: file.name,
      error: '',
      password: ''
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const { fileIndex, password } = passwordModal;
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
        [file.name]: canvas.toDataURL()
      }));

      // Close the modal
      setPasswordModal({ isOpen: false, fileIndex: null, fileName: '', password: '', error: '' });

      // Clear any error
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

  const handleDragStart = () => {
    setIsDragInProgress(true);
  };
  
  const handleDragEnd = () => {
    setIsDragInProgress(false);
  };
  

  
  // 4. Remove or fix the duplicate effect for drag tracking
  // This effect was causing duplicate tracking
  useEffect(() => {
    if (isDragInProgress) {
      console.log("🖱️ Drag in progress:", currentDragIndex);
    }
  }, [isDragInProgress, currentDragIndex]);
  

  // Set up page-wide drag and drop
  useEffect(() => {
    // Get the drag overlay element
    const dragOverlay = document.getElementById('drag-overlay');
    
    // Disable the overlay entirely when we first load
    if (dragOverlay) {
      dragOverlay.style.opacity = '0';
      dragOverlay.style.pointerEvents = 'none';
      dragOverlay.style.display = 'none'; // Completely hide it
    }

    // Add dragover event listener to the entire document
    const handleDocumentDragOver = (e) => {
      // If we're currently dragging a PDF for reordering, don't activate the overlay
      if (isDragInProgress) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      // Only intercept file drops, not drag operations on DOM elements
      if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }
    };

    // Add dragleave event listener to the entire document
    const handleDocumentDragLeave = (e) => {
      // If we're currently dragging a PDF for reordering, ignore
      if (isDragInProgress) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      // Only respond to file drag operations
      if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
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
      // If we're currently dragging a PDF for reordering, ignore
      if (isDragInProgress) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      // Only handle file drops
      if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        
        setIsDragging(false);

        // Only add files if the drop didn't happen on a specific drop zone
        const isInsideDropZone = e.target.closest('.drop-zone');
        if (!isInsideDropZone) {
          const droppedFiles = Array.from(e.dataTransfer.files);
          addFilesWithValidation(droppedFiles);
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
  }, [isDragInProgress]);

  // Move file in the list (for reordering) - Updated to prevent too frequent updates
  const moveFile = (dragIndex, hoverIndex) => {
    // Get timestamp for throttling
    const now = Date.now();
    const timeSinceLastMove = now - lastMoveTimestamp.current;
    
    // Don't move too frequently (throttle)
    if (timeSinceLastMove < 30) { // reduced from 50ms for better responsiveness
      return;
    }
    
    // Perform the move
    const draggedFile = files[dragIndex];
    const newFiles = [...files];
    newFiles.splice(dragIndex, 1);
    newFiles.splice(hoverIndex, 0, draggedFile);
    setFiles(newFiles);
    
    // Record timestamp
    lastMoveTimestamp.current = now;
  };

  // Sort files alphabetically
  const sortFilesAlphabetically = (ascending = true) => {
    const sortedFiles = [...files].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
    
    setFiles(sortedFiles);
  };

  // Validate files before adding them
  const addFilesWithValidation = (newFiles) => {
    // Reset error
    setError(null);

    // Filter for PDF files
    const pdfFiles = newFiles.filter(file => {
      if (file.type !== 'application/pdf') {
        setError(`"${file.name}" is not a PDF file. Only PDF files are supported.`);
        return false;
      }
      return true;
    });

    if (pdfFiles.length === 0) return;

    // Check individual file size
    const validSizeFiles = pdfFiles.filter(file => {
      if (file.size > MAX_SINGLE_FILE_SIZE) {
        setError(`"${file.name}" exceeds the 100 MB file size limit.`);
        return false;
      }
      return true;
    });

    if (validSizeFiles.length === 0) return;

    // Check total file size
    const newTotalSize = totalSize + validSizeFiles.reduce((sum, file) => sum + file.size, 0);
    if (newTotalSize > MAX_TOTAL_FILES_SIZE) {
      setError(`Total file size exceeds the 200 MB limit. Please remove some files.`);
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
    setMergeResult(null);
    setError(null);
    setEncryptedFiles({});
    setDecryptedFiles({});
  };

  // Reset to initial state
  const handleReset = () => {
    setFiles([]);
    setPreviews({});
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    setMergeResult(null);
    setEncryptedFiles({});
    setDecryptedFiles({});
  };

  // Check if any files are problematic (corrupted, encrypted without password, etc.)
  const hasProblematicFiles = files.some(file => {
    const previewState = previews[file.name];
    return previewState === 'corrupted' || previewState === 'invalid' || 
           (previewState === 'encrypted' && !decryptedFiles[file.name]);
  });

  // Handle PDF merging
  const handleMergePDF = async () => {
    if (files.length === 0) return;
    if (files.length < 2) {
      setError("At least two PDF files are required for merging.");
      return;
    }

    // Check for problematic files before merging
    const hasUnhandledEncryptedFiles = files.some(
      file => previews[file.name] === 'encrypted' && !decryptedFiles[file.name]
    );

    if (hasUnhandledEncryptedFiles) {
      // Find the first file that needs decryption
      const fileIndex = files.findIndex(
        file => previews[file.name] === 'encrypted' && !decryptedFiles[file.name]
      );

      if (fileIndex !== -1) {
        handleDecryptFile(fileIndex);
        setError("Please provide passwords for all encrypted PDFs before merging.");
        return;
      }
    }

    // Check for other problematic files
    const hasOtherProblematicFiles = files.some(file => {
      const previewState = previews[file.name];
      return previewState === 'corrupted' || previewState === 'invalid';
    });

    if (hasOtherProblematicFiles) {
      setError("Please remove all corrupted or invalid PDF files before merging.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Create FormData to send files and passwords
      const formData = new FormData();

      // Add files
      files.forEach(file => {
        formData.append('pdf_files', file);
      });

      // Add file order (optional - sent as JSON string)
      const fileOrder = files.map(file => file.name);
      formData.append('file_order', JSON.stringify(fileOrder));

      console.log(fileOrder);
      

      // Add passwords for encrypted files
      const passwords = {};
      Object.entries(decryptedFiles).forEach(([fileName, data]) => {
        passwords[fileName] = data.password;
      });
      
      if (Object.keys(passwords).length > 0) {
        formData.append('pdf_passwords', JSON.stringify(passwords));
      }

      if (Object.keys(fileRotations).length > 0) {
        formData.append('pdf_rotations', JSON.stringify(fileRotations));
      }
      console.log();
      console.log("File rotations:", fileRotations);

      // Set progress to 0 before starting upload
      setProgress(0);
      setError(null);

      // Show progress bar
      const progressBar = document.getElementById('progress-bar');
      if (progressBar) {
        progressBar.style.display = 'block';
      }

      // Call the API to merge PDFs
      const result = await mergePDFs(
        formData,
        (progressValue) => setProgress(progressValue)
      );

      setMergeResult(result);
      
      // Auto-scroll to the results section
      if (resultSectionRef.current) {
        setTimeout(() => {
          resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('Merge failed:', error);
      setError(error.message || 'PDF merge failed. Please try again.');
    }  finally {
      setIsProcessing(false);
    }
  };

  // Handle downloading the merged PDF
  const handleDownloadPDF = (e) => {
    e.preventDefault();
    if (mergeResult) {
      try {
        // As per your instruction, we need to use the job_id to generate the download URL
        const downloadUrl = getDownloadUrl(mergeResult.job_id, 'pdf');
        downloadFile(downloadUrl, 'merged_document.pdf');
      } catch (error) {
        console.error('Error downloading PDF:', error);
        setError('Failed to download the merged PDF. Please try again.');
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
    <DndProvider backend={HTML5Backend}>
        <DragScrollManager 
        fileListRef={fileListRef}
        isDragInProgress={isDragInProgress}
        updatePosition={updatePosition}
      >
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
          text={"Merging PDFs..."}
        />
        <PDFPreviewModal
  isOpen={previewModal.isOpen}
  onClose={handleClosePreview}
  pdfUrl={previewModal.pdfUrl}
  fileName={previewModal.fileName}
/>
        {/* Password Modal */}
        {passwordModal.isOpen && (
          <div className="fixed inset-0 bg-opacity-50 z-50 flex items-center justify-center p-4">
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
                        fileIndex: null, 
                        fileName: '', 
                        password: '', 
                        error: ''
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
        <div className="text-center mb-10">
          <h1 className="text-4xl mt-4 font-bold mb-2">
            <span className="text-[#DA1F10]">Merge</span> PDF
          </h1>
          <p className="text-gray-600">Combine multiple PDF files into a single document</p>
          <p className="text-sm text-gray-500 mt-2">Max file size: 100 MB per file, 200 MB total</p>
        </div>

        {/* Content with Sidebar Layout */}
        <div className="flex flex-col justify-center md:flex-row gap-6">
          {/* Main Content Area */}
          <div className="w-full md:w-3/4">
            {/* Upload Area - Only show if no files uploaded yet */}
            {files.length === 0 && !mergeResult && (
             <SelectFiles 
             onFilesSelected={handleFilesSelected}
             onError={setError}
             buttonText="Select PDF Files"
             buttonColor="red"
             buttonSize="large"
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

                {/* Sort Options */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                  <div className="text-gray-700 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
                    </svg>
                    <span className="font-medium">Sort Files:</span>
                  </div>
                  <div className="space-x-2">
                    <button 
                      onClick={() => sortFilesAlphabetically(true)}
                      className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                      A-Z
                    </button>
                    <button 
                      onClick={() => sortFilesAlphabetically(false)}
                      className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                      Z-A
                    </button>
                  </div>
                </div>

                

                {/* Reordering Instructions
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 text-[#DA1F10]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <p className="ml-3 text-sm text-[#C10007]">
                      Drag and drop the PDFs to reorder them. Files will be merged in the order shown below.
                    </p>
                  </div>
                </div> */}

                {/* PDF Files with Previews - Grid layout for the draggable PDFs */}
                <div 
                  ref={fileListRef} 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-h-[600px] overflow-y-auto p-2 rounded-lg border border-gray-200 bg-gray-50"
                >
                  {files.map((file, index) => (
                    <DraggablePDFFile
                      key={`${file.name}-${index}`}
                      file={file}
                      index={index}
                      preview={previews[file.name]}
                      moveFile={moveFile}
                      removeFile={removeFile}
                      handleDecryptFile={handleDecryptFile}
                      isEncrypted={encryptedFiles[file.name]}
                      isDecrypted={!!decryptedFiles[file.name]}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      listLength={files.length}
                      rotation={fileRotations[file.name] || 0}  // Add rotation prop
  handleRotate={handleRotatePDF}  // Add rotation handler
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Results Section - Below the previews */}
            {mergeResult && (
              <DownloadSection
              files={[{
                id: mergeResult.job_id,
                name: 'Merged Document.pdf',
                size: mergeResult.file_size
              }]}
              downloadHandler={handleDownload}
              previewHandler={handleOpenPreview}
              title="Download Merged PDF"
              color="red"
              startOverHandler={handleReset}
            />
         
            )}
          </div>

          {/* Sidebar */}
          {files.length > 0 && (
            <div className="w-full md:w-1/4 md:sticky md:top-24 h-fit">
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-medium text-lg mb-4">Merge Settings</h3>

                {/* Merge Button */}
                <button
                  onClick={handleMergePDF}
                  className={`w-full ${hasProblematicFiles || files.length < 2 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#DA1F10] hover:bg-[#C10007]'} text-white font-medium cursor-pointer py-4 rounded-xl transition-colors duration-200 shadow-md`}
                  disabled={files.length < 2 || hasProblematicFiles}
                >
                  Merge PDFs
                  {files.length < 2 && (
                    <span className="text-xs block mt-1">
                      Add at least two files
                    </span>
                  )}
                  {hasProblematicFiles && (
                    <span className="text-xs block mt-1">
                      Please remove invalid files first
                    </span>
                  )}
                  {!hasProblematicFiles && files.length >= 2 && estimatedUploadTime > 0 && (
                    <span className="text-xs block mt-1">
                      Est. Merging time: {estimatedUploadTime < 60
                        ? `${estimatedUploadTime} seconds`
                        : `${Math.floor(estimatedUploadTime / 60)} min ${estimatedUploadTime % 60} sec`}
                    </span>
                  )}
                </button>

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
                      <span>Size limit:</span>
                      <span className="font-medium">200 MB</span>
                    </li>
                  </ul>
                </div>

                {/* Start Over Button (Don't hide when results are showing) */}
                {mergeResult && (
                  <button
                    onClick={handleReset}
                    className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition-colors duration-200"
                  >
                    Start Over with New Files
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </DragScrollManager>
    </DndProvider>
  );
};

export default PDFMerger;