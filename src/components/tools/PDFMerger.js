"use client"

import { useState, useRef, useEffect } from 'react';
import { mergePDFs, getDownloadUrl, downloadFile } from '../../api/merge_api';
import ModalLoader from '../tools_utility/ModalLoader';
import PDFPreviewModal from '../tools_utility/PDFPreviewModal.';
import SelectFiles from '../tools_utility/SelectFiles';
import DownloadSection from '../tools_utility/DownloadSection';

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragMoveEvent,
  CollisionDetection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';

// Custom auto-scroll hook with mobile support
const useAutoScroll = (containerRef, isDragging) => {
  const scrollIntervalRef = useRef(null);
  const lastScrollTime = useRef(Date.now());

  useEffect(() => {
    if (!isDragging || !containerRef.current) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }

    const container = containerRef.current;
    let currentMouseY = 0;

    const handleMouseMove = (e) => {
      // Handle both mouse and touch events
      currentMouseY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    };

    const handleTouchMove = (e) => {
      currentMouseY = e.touches[0].clientY;
    };

    const autoScroll = () => {
      if (!container || !isDragging) return;

      const rect = container.getBoundingClientRect();
      const scrollThreshold = 100; // Larger threshold for mobile
      const maxScrollSpeed = 8; // Slower for smoother experience
      
      const distanceFromTop = currentMouseY - rect.top;
      const distanceFromBottom = rect.bottom - currentMouseY;
      
      let scrollSpeed = 0;
      
      // Scroll up
      if (distanceFromTop < scrollThreshold && distanceFromTop > 0 && container.scrollTop > 0) {
        const intensity = Math.max(0, 1 - (distanceFromTop / scrollThreshold));
        scrollSpeed = -maxScrollSpeed * intensity;
      }
      // Scroll down
      else if (distanceFromBottom < scrollThreshold && distanceFromBottom > 0) {
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (container.scrollTop < maxScroll) {
          const intensity = Math.max(0, 1 - (distanceFromBottom / scrollThreshold));
          scrollSpeed = maxScrollSpeed * intensity;
        }
      }
      
      if (scrollSpeed !== 0) {
        const now = Date.now();
        const timeDelta = now - lastScrollTime.current;
        const adjustedSpeed = scrollSpeed * (timeDelta / 16); // Normalize to 60fps
        
        container.scrollTop += adjustedSpeed;
        lastScrollTime.current = now;
      }
    };

    // Add event listeners for both mouse and touch
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Start auto-scroll interval
    scrollIntervalRef.current = setInterval(autoScroll, 16); // ~60fps

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [isDragging, containerRef]);
};

// Sortable PDF File Component
const SortablePDFFile = ({ 
  file, 
  index, 
  preview, 
  removeFile, 
  handleDecryptFile, 
  isEncrypted, 
  isDecrypted, 
  listLength, 
  rotation = 0, 
  handleRotate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `${file.name}-${index}`,
    data: {
      type: 'pdf-file',
      file,
      index,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition, // Disable transition while dragging for smoother experience
    zIndex: isDragging ? 1000 : 1,
    touchAction: 'none', // Prevent scrolling while dragging on mobile
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const previewState = preview;
  const isCorrupted = previewState === 'corrupted';
  const hasError = isCorrupted || (isEncrypted && !isDecrypted);
  const isInvalid = previewState === 'invalid';

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`relative border rounded-xl overflow-hidden select-none
                 ${isDragging ? 'opacity-80 scale-105 shadow-2xl rotate-2 z-50' : 'opacity-100'} 
                 ${hasError ? 'border-red-300 bg-red-50' : 'bg-white border-gray-200'} 
                 shadow-sm hover:shadow-md transition-all duration-200`}
    >
      {/* Drag Handle - Larger touch target for mobile */}
      <div 
        className="flex justify-center items-center bg-gray-100 py-3 border-b border-gray-200 cursor-move touch-none"
        {...attributes}
        {...listeners}
        style={{ touchAction: 'none' }}
      >
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
          </svg>
          <span className="text-xs text-gray-500 font-medium">DRAG</span>
        </div>
      </div>
      
      {/* Preview with fixed dimensions */}
      <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden relative">
        {previewState && !hasError && !isInvalid ? (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={previewState}
              alt={`Preview of ${file.name}`}
              className="max-h-full max-w-full object-contain shadow-sm"
              style={{ 
                transform: `rotate(${rotation}deg)`, 
                transition: 'transform 0.3s ease',
                maxHeight: rotation % 180 !== 0 ? '80%' : '100%',
                maxWidth: rotation % 180 !== 0 ? '80%' : '100%'
              }}
            />
          </div>
        ) : hasError ? (
          <div className="text-red-500 flex flex-col items-center p-4 text-center">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Loading preview...</span>
          </div>
        )}
        
        {/* Rotate button */}
        {previewState && !hasError && !isInvalid && (
          <div className="absolute top-2 right-2">
            <button
              onClick={() => handleRotate(index, 'clockwise')}
              className="p-2 bg-white rounded-full shadow hover:bg-gray-100 text-gray-700 touch-none"
              title="Rotate 90°"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="p-3 flex justify-between items-center">
        <div className="truncate mr-2 flex-1">
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
          className="text-red-500 cursor-pointer hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors touch-none"
          title="Remove file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Drag Overlay Component for better visual feedback
const DragOverlayComponent = ({ activeFile, rotation = 0 }) => {
  if (!activeFile) return null;

  return (
    <div className="opacity-95 scale-105 rotate-3 shadow-2xl border rounded-xl overflow-hidden bg-white border-gray-300">
      <div className="flex justify-center items-center bg-gray-100 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
          </svg>
          <span className="text-xs text-gray-500 font-medium">DRAGGING</span>
        </div>
      </div>
      <div className="h-40 bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">{activeFile.name}</p>
        </div>
      </div>
    </div>
  );
};

const PDFMerger = () => {
  // All your existing state variables
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [mergeResult, setMergeResult] = useState(null);
  const fileListRef = useRef(null);
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
  const [fileRotations, setFileRotations] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [isDragInProgress, setIsDragInProgress] = useState(false);

  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    pdfUrl: null,
    fileName: ''
  });

  // Use auto-scroll hook
  useAutoScroll(fileListRef, isDragInProgress);

  // Configure sensors for both desktop and mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required to activate drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay for touch to prevent conflicts with scrolling
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag handlers
  const handleDragStart = (event) => {
    const { active } = event;
    const fileData = active.data.current;
    setActiveFile(fileData?.file);
    setIsDragInProgress(true);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveFile(null);
    setIsDragInProgress(false);

    if (active.id !== over?.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((item, index) => `${item.name}-${index}` === active.id);
        const newIndex = items.findIndex((item, index) => `${item.name}-${index}` === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(items, oldIndex, newIndex);
        }
        return items;
      });
    }
  };

  // File size limits
  const MAX_SINGLE_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
  const MAX_TOTAL_FILES_SIZE = 200 * 1024 * 1024; // 200 MB
  const totalSize = files.reduce((total, file) => total + file.size, 0);
  const estimatedUploadTime = Math.ceil(totalSize / (400 * 1024));

  // Your existing functions (handleDownload, handlePreview, etc.) remain the same
  const handleDownload = (fileId, fileName) => {
    const finalFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    const downloadUrl = getDownloadUrl(fileId, 'pdf', finalFileName);
    downloadFile(downloadUrl, finalFileName);
  };

  const handleFilesSelected = (selectedFiles) => {
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
  };

  const handleRotatePDF = (index, direction) => {
    const file = files[index];
    const currentRotation = fileRotations[file.name] || 0;
    
    let newRotation = currentRotation;
    if (direction === 'clockwise') {
      newRotation = (currentRotation + 90) % 360;
    } else {
      newRotation = (currentRotation - 90 + 360) % 360;
    }
    
    setFileRotations(prev => ({
      ...prev,
      [file.name]: newRotation
    }));
  };

  // Add these functions inside the PDFMerger component, after the existing handlers:

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
    setIsProcessing(true);

    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = window.pdfjsLib.getDocument({
      data: arrayBuffer,
      password: password
    });

    const pdf = await loadingTask.promise;

    setEncryptedFiles(prev => ({
      ...prev,
      [file.name]: true
    }));

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

    setPreviews(prev => ({
      ...prev,
      [file.name]: canvas.toDataURL()
    }));

    setPasswordModal({ isOpen: false, fileIndex: null, fileName: '', password: '', error: '' });
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

const handleMergePDF = async () => {
  if (files.length === 0) return;
  if (files.length < 2) {
    setError("At least two PDF files are required for merging.");
    return;
  }

  const hasUnhandledEncryptedFiles = files.some(
    file => previews[file.name] === 'encrypted' && !decryptedFiles[file.name]
  );

  if (hasUnhandledEncryptedFiles) {
    const fileIndex = files.findIndex(
      file => previews[file.name] === 'encrypted' && !decryptedFiles[file.name]
    );

    if (fileIndex !== -1) {
      handleDecryptFile(fileIndex);
      setError("Please provide passwords for all encrypted PDFs before merging.");
      return;
    }
  }

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
    const formData = new FormData();

    files.forEach(file => {
      formData.append('pdf_files', file);
    });

    const fileOrder = files.map(file => file.name);
    formData.append('file_order', JSON.stringify(fileOrder));

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

    const result = await mergePDFs(
      formData,
      (progressValue) => setProgress(progressValue)
    );

    setMergeResult(result);
    
  } catch (error) {
    console.error('Merge failed:', error);
    setError(error.message || 'PDF merge failed. Please try again.');
  } finally {
    setIsProcessing(false);
  }
};

  const handleOpenPreview = async () => {
    if (mergeResult) {
      try {
        setIsProcessing(true);
        const downloadUrl = getDownloadUrl(mergeResult.job_id, 'pdf');
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        const pdfBlob = await response.blob();
        const objectUrl = URL.createObjectURL(pdfBlob);
        
        setPreviewModal({
          isOpen: true,
          pdfUrl: objectUrl,
          fileName: 'Merged Document.pdf'
        });
      } catch (error) {
        console.error('Error preparing PDF preview:', error);
        setError('Unable to preview the PDF. Please try downloading instead.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleClosePreview = () => {
    setPreviewModal({
      isOpen: false,
      pdfUrl: null,
      fileName: ''
    });
  };

  // Scroll to results section when merge completes
  useEffect(() => {
    if (mergeResult && resultSectionRef.current) {
      setTimeout(() => {
        resultSectionRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 300);
    }
  }, [mergeResult]);

  // Your existing preview generation logic remains the same
  useEffect(() => {
    const generatePreviews = async () => {
      const newPreviews = { ...previews };

      for (const file of files) {
        if (!previews[file.name]) {
          try {
            const arrayBuffer = await Promise.race([
              file.arrayBuffer(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Preview generation timed out')), 8000)
              )
            ]);

            try {
              if (!window.pdfjsLib) {
                console.error('PDF.js library not loaded');
                newPreviews[file.name] = 'invalid';
                continue;
              }
              
              const loadingTask = window.pdfjsLib.getDocument({
                data: arrayBuffer,
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
                cMapPacked: true
              });
              
              const pdf = await loadingTask.promise;
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

              newPreviews[file.name] = canvas.toDataURL('image/jpeg', 0.85);
            } catch (error) {
              console.error('Error generating preview for:', file.name, error);

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

  // All your other existing functions (handleDecryptFile, handlePasswordSubmit, etc.) remain the same...
  // [Include all your existing handler functions here - they don't need to change]

  const addFilesWithValidation = (newFiles) => {
    setError(null);

    const pdfFiles = newFiles.filter(file => {
      if (file.type !== 'application/pdf') {
        setError(`"${file.name}" is not a PDF file. Only PDF files are supported.`);
        return false;
      }
      return true;
    });

    if (pdfFiles.length === 0) return;

    const validSizeFiles = pdfFiles.filter(file => {
      if (file.size > MAX_SINGLE_FILE_SIZE) {
        setError(`"${file.name}" exceeds the 100 MB file size limit.`);
        return false;
      }
      return true;
    });

    if (validSizeFiles.length === 0) return;

    const newTotalSize = totalSize + validSizeFiles.reduce((sum, file) => sum + file.size, 0);
    if (newTotalSize > MAX_TOTAL_FILES_SIZE) {
      setError(`Total file size exceeds the 200 MB limit. Please remove some files.`);
      return;
    }

    setFiles(prevFiles => [...prevFiles, ...validSizeFiles]);
  };

  const removeFile = (index) => {
    const updatedFiles = [...files];
    const removedFile = updatedFiles[index];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);

    // Clean up previews and other state
    if (previews[removedFile.name]) {
      setPreviews(prev => {
        const updated = { ...prev };
        delete updated[removedFile.name];
        return updated;
      });
    }

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

    if (updatedFiles.length === 0) {
      setError(null);
    }
  };

  // Your existing drag and drop handlers for files from outside
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
    e.target.value = null;
  };

  const handleSelectFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeAllFiles = () => {
    setFiles([]);
    setPreviews({});
    setMergeResult(null);
    setError(null);
    setEncryptedFiles({});
    setDecryptedFiles({});
    setFileRotations({});
  };

  const handleReset = () => {
    setFiles([]);
    setPreviews({});
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    setMergeResult(null);
    setEncryptedFiles({});
    setDecryptedFiles({});
    setFileRotations({});
  };

  const sortFilesAlphabetically = (ascending = true) => {
    const sortedFiles = [...files].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
    setFiles(sortedFiles);
  };

  // Check for problematic files
  const hasProblematicFiles = files.some(file => {
    const previewState = previews[file.name];
    return previewState === 'corrupted' || previewState === 'invalid' || 
           (previewState === 'encrypted' && !decryptedFiles[file.name]);
  });

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Create sortable items array for dnd-kit
  const sortableItems = files.map((file, index) => `${file.name}-${index}`);

  return (
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
             {/* File Management Header */}
             <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
               <h2 className="text-lg font-medium">Selected Files ({files.length})</h2>
               <div className="flex flex-wrap items-center gap-2">
                 <button
                   onClick={removeAllFiles}
                   className="text-red-600 cursor-pointer hover:text-red-800 font-medium flex items-center text-sm px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                 >
                   <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                   </svg>
                   Remove All
                 </button>
                 <button
                   onClick={handleSelectFiles}
                   className="text-blue-700 cursor-pointer hover:text-blue-800 font-medium flex items-center text-sm px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                 >
                   <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                   </svg>
                   Add More Files
                 </button>
               </div>
             </div>

             {/* Drop Zone - Always active when files are shown */}
             <div
               className={`w-full border-2 border-dashed rounded-lg mb-6 p-4 text-center drop-zone ${
                 isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
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
             <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="text-gray-700 flex items-center">
                 <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
                 </svg>
                 <span className="font-medium">Sort Files:</span>
               </div>
               <div className="flex gap-2">
                 <button 
                   onClick={() => sortFilesAlphabetically(true)}
                   className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                 >
                   A-Z
                 </button>
                 <button 
                   onClick={() => sortFilesAlphabetically(false)}
                   className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                 >
                   Z-A
                 </button>
               </div>
             </div>

             {/* Instructions for mobile users */}
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 block sm:hidden">
               <div className="flex items-start">
                 <div className="flex-shrink-0 text-blue-600">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                   </svg>
                 </div>
                 <p className="ml-3 text-sm text-blue-800">
                   Touch and hold the "DRAG" area to reorder files. Files will be merged in the order shown below.
                 </p>
               </div>
             </div>

             {/* Desktop Instructions */}
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 hidden sm:block">
               <div className="flex items-start">
                 <div className="flex-shrink-0 text-blue-600">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                   </svg>
                 </div>
                 <p className="ml-3 text-sm text-blue-800">
                   Drag and drop the PDFs by their drag handles to reorder them. Files will be merged in the order shown below.
                 </p>
               </div>
             </div>

             {/* PDF Files with Previews - DndContext wrapping the sortable grid */}
             <DndContext 
               sensors={sensors}
               collisionDetection={closestCenter}
               onDragStart={handleDragStart}
               onDragEnd={handleDragEnd}
             >
               <SortableContext 
                 items={sortableItems}
                 strategy={rectSortingStrategy}
               >
                 <div 
                   ref={fileListRef} 
                   className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8 max-h-[600px] overflow-y-auto p-2 rounded-lg border border-gray-200 bg-gray-50"
                   style={{ touchAction: 'pan-y' }} // Allow vertical scrolling on mobile
                 >
                   {files.map((file, index) => (
                     <SortablePDFFile
                       key={`${file.name}-${index}`}
                       file={file}
                       index={index}
                       preview={previews[file.name]}
                       removeFile={removeFile}
                       handleDecryptFile={handleDecryptFile}
                       isEncrypted={encryptedFiles[file.name]}
                       isDecrypted={!!decryptedFiles[file.name]}
                       listLength={files.length}
                       rotation={fileRotations[file.name] || 0}
                       handleRotate={handleRotatePDF}
                     />
                   ))}
                 </div>
               </SortableContext>
               
               {/* Drag Overlay */}
               <DragOverlay>
                 <DragOverlayComponent 
                   activeFile={activeFile} 
                   rotation={activeFile ? (fileRotations[activeFile.name] || 0) : 0}
                 />
               </DragOverlay>
             </DndContext>
           </div>
         )}

         {/* Results Section */}
         {mergeResult && (
           <div ref={resultSectionRef}>
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
           </div>
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
               className={`w-full ${
                 hasProblematicFiles || files.length < 2 
                   ? 'bg-gray-400 cursor-not-allowed' 
                   : 'bg-[#DA1F10] hover:bg-[#C10007]'
               } text-white font-medium py-4 rounded-xl transition-colors duration-200 shadow-md touch-none`}
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

             {/* Start Over Button */}
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

     {/* Password Modal - Add touch-friendly styles */}
     {passwordModal.isOpen && (
       <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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
                 className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 placeholder="Enter PDF password"
                 autoFocus
               />
             </div>

             <div className="flex flex-col sm:flex-row justify-end gap-3">
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
                 className="px-4 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer touch-none"
               >
                 Cancel
               </button>
               <button
                 type="submit"
                 className="px-4 py-3 text-white bg-[#DA1F10] rounded-lg hover:bg-[#C10007] transition-colors cursor-pointer touch-none"
               >
                 Unlock PDF
               </button>
             </div>
           </form>
         </div>
       </div>
     )}
   </div>
 );
};

export default PDFMerger;