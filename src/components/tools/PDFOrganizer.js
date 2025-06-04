"use client"

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { organizePDF, getOrganizedPdfDownloadUrl, downloadOrganizedPdf } from '../../api/organize_api';
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
   pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
   rectIntersection ,
  DragOverlay,
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
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

const customCollisionDetection = (args) => {
  // First, let's see if there are any pointer-based collisions
  const pointerIntersections = pointerWithin(args);
  
  if (pointerIntersections.length > 0) {
    return pointerIntersections;
  }

  // If there are no pointer intersections, return rectangle intersections
  return rectIntersection(args);
};

const CustomSidePanelTooltip = ({ text, children, position = "top" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  const containerRef = useRef(null);
  
  const handleMouseEnter = () => {
    setIsVisible(true);
  };
  
  const handleMouseLeave = () => {
    setIsVisible(false);
  };
  
  const getTooltipStyle = () => {
    const baseStyle = {
      opacity: 1,
      animation: 'tooltipFadeIn 0.15s ease-out',
    };
    
    switch(position) {
      case "left":
        return {
          ...baseStyle,
          right: '100%',
          top: '50%',
          marginRight: '10px',
          transform: 'translateY(-50%)',
        };
      case "right":
        return {
          ...baseStyle,
          left: '100%',
          top: '50%',
          marginLeft: '10px',
          transform: 'translateY(-50%)',
        };
      case "bottom":
        return {
          ...baseStyle,
          left: '50%',
          top: '100%',
          marginTop: '10px',
          transform: 'translateX(-50%)',
        };
      case "top":
      default:
        return {
          ...baseStyle,
          left: '50%',
          bottom: '100%',
          marginBottom: '10px',
          transform: 'translateX(-50%)',
        };
    }
  };
  
  const getArrowStyle = () => {
    switch(position) {
      case "left":
        return {
          right: '-4px',
          top: 'calc(50% - 4px)',
          transform: 'rotate(45deg)'
        };
      case "right":
        return {
          left: '-4px',
          top: 'calc(50% - 4px)',
          transform: 'rotate(45deg)'
        };
      case "bottom":
        return {
          top: '-4px',
          left: 'calc(50% - 4px)',
          transform: 'rotate(45deg)'
        };
      case "top":
      default:
        return {
          bottom: '-4px',
          left: 'calc(50% - 4px)',
          transform: 'rotate(45deg)'
        };
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className="tooltip-container inline-block relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className="absolute z-10 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md shadow-sm whitespace-nowrap pointer-events-none"
          style={getTooltipStyle()}
        >
          {text}
          <div 
            className="absolute w-2 h-2 bg-gray-900" 
            style={getArrowStyle()}
          />
        </div>
      )}
    </div>
  );
};

// Auto-scroll hook for drag container
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
      currentMouseY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    };

    const handleTouchMove = (e) => {
      currentMouseY = e.touches[0].clientY;
    };

    const autoScroll = () => {
      if (!container || !isDragging) return;

      const rect = container.getBoundingClientRect();
      const scrollThreshold = 100;
      const maxScrollSpeed = 8;
      
      const distanceFromTop = currentMouseY - rect.top;
      const distanceFromBottom = rect.bottom - currentMouseY;
      
      let scrollSpeed = 0;
      
      if (distanceFromTop < scrollThreshold && distanceFromTop > 0 && container.scrollTop > 0) {
        const intensity = Math.max(0, 1 - (distanceFromTop / scrollThreshold));
        scrollSpeed = -maxScrollSpeed * intensity;
      }
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
        const adjustedSpeed = scrollSpeed * (timeDelta / 16);
        
        container.scrollTop += adjustedSpeed;
        lastScrollTime.current = now;
      }
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });

    scrollIntervalRef.current = setInterval(autoScroll, 16);

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

// Sortable Page Component
const SortablePage = ({ 
  page, 
  index, 
  onDelete, 
  onRotate, 
  onEnlargePreview,
  onAddBlankBefore,
  onAddBlankAfter,
  onAddFileBefore,
  onAddFileAfter,
  hoveredPage,
  hoveredSide,
  onMouseMove,
  onMouseLeave,
  isDropTarget = false, // Add this prop
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver, // Add this from useSortable
  } = useSortable({ 
    id: `page-${index}`,
    data: {
      type: 'page',
      page,
      index,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : (isOver ? 'none' : transition), // Disable transition when being dragged over
    zIndex: isDragging ? 1000 : 1,
    touchAction: 'none',
  };

  return (
   <div
  ref={setNodeRef}
  style={style}
  className={`pdf-page-item border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200 relative select-none
             ${isDragging ? 'opacity-90 scale-102 shadow-lg' : 'opacity-100'}
             ${isOver && !isDragging ? 'border-blue-400 bg-blue-50 shadow-md' : ''}`}
  data-dragging={isDragging}
  data-drop-target={isOver && !isDragging}
  onMouseMove={(e) => onMouseMove(e, index)}
  onMouseLeave={onMouseLeave}
>
      {/* Drag Handle */}
      <div 
        className="flex justify-center items-center bg-gray-100 py-2 border-b border-gray-200 cursor-move touch-none"
        {...attributes}
        {...listeners}
        style={{ touchAction: 'none' }}
      >
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
          </svg>
          <span className="text-xs text-gray-500 font-medium">DRAG</span>
        </div>
      </div>

      {/* Page Preview */}
      <div 
        className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden relative cursor-pointer"
        style={{ 
          transform: `rotate(${page.rotation}deg)`,
          transition: 'transform 0.3s ease'
        }}
        onClick={() => onEnlargePreview(page.dataUrl, index)}
      >
        <img
          src={page.dataUrl}
          alt={`Page ${index + 1}`}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      
      {/* Eye Button for Enlarged Preview */}
      <button
        onClick={() => onEnlargePreview(page.dataUrl, index)}
        className="absolute top-12 left-2 bg-gray-800 bg-opacity-70 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-opacity-100 transition-colors z-10"
        title="View full page"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        </svg>
      </button>
      
      {/* Delete & Rotate Button Group */}
      <div className="absolute top-12 right-2 flex space-x-1 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRotate(index);
          }}
          className="bg-gray-800 cursor-pointer bg-opacity-70 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-opacity-100 transition-colors"
          title="Rotate page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(index);
          }}
          className="bg-red-600 cursor-pointer bg-opacity-70 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-opacity-100 transition-colors"
          title="Delete page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
      
      {/* Left side add options */}
      {hoveredPage === index && hoveredSide === 'left' && (
        <div className="absolute inset-y-0 left-0 w-10 flex items-center justify-center">
          <div 
            className="bg-white rounded-lg shadow-lg p-1 transform transition-all duration-200 ease-in-out animate-fadeIn"
            style={{animation: 'fadeIn 0.2s ease-in-out'}}
          >
            <div className="flex flex-col space-y-2">
              <CustomSidePanelTooltip text="Add blank page before" position="left">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddBlankBefore(index);
                  }}
                  className="bg-gray-100 cursor-pointer rounded-full w-8 h-8 flex items-center justify-center text-[#DA1F10] hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </button>
              </CustomSidePanelTooltip>
              <CustomSidePanelTooltip text="Add file before" position="left">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddFileBefore(index);
                  }}
                  className="bg-gray-100 cursor-pointer rounded-full w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </button>
              </CustomSidePanelTooltip>
            </div>
          </div>
        </div>
      )}

      {/* Right side add options */}
      {hoveredPage === index && hoveredSide === 'right' && (
        <div className="absolute inset-y-0 right-0 w-10 flex items-center justify-center">
          <div 
            className="bg-white rounded-lg shadow-lg p-1 transform transition-all duration-200 ease-in-out animate-fadeIn"
            style={{animation: 'fadeIn 0.2s ease-in-out'}}
          >
            <div className="flex flex-col space-y-2">
              <CustomSidePanelTooltip text="Add blank page after" position="right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddBlankAfter(index);
                  }}
                  className="bg-gray-100 cursor-pointer rounded-full w-8 h-8 flex items-center justify-center text-[#DA1F10] hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </button>
              </CustomSidePanelTooltip>
              <CustomSidePanelTooltip text="Add file after" position="right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddFileAfter(index);
                  }}
                  className="bg-gray-100 cursor-pointer rounded-full w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </button>
              </CustomSidePanelTooltip>
            </div>
          </div>
        </div>
      )}
      
      {/* Page number */}
      <div className="p-2 text-xs text-gray-500 text-center">
        Page {index + 1} 
        {page.isBlank && " (Blank)"}
        {page.fromFile && ` (From ${page.fromFile.split('-').slice(2).join('-')})`}
      </div>
    </div>
  );
};

const DragOverlayComponent = ({ activePage }) => {
  if (!activePage) return null;

  return (
    <div className="opacity-90 scale-105 shadow-xl border rounded-lg overflow-hidden bg-white border-gray-300">
      <div className="flex justify-center items-center bg-gray-100 py-2 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
          </svg>
          <span className="text-xs text-gray-500 font-medium">DRAGGING</span>
        </div>
      </div>
      <div className="h-48 bg-gray-100 flex items-center justify-center">
        {activePage && (
          <img
            src={activePage.dataUrl}
            alt="Dragging page"
            className="max-h-full max-w-full object-contain"
            style={{ 
              transform: `rotate(${activePage.rotation}deg)`,
            }}
          />
        )}
      </div>
    </div>
  );
};
const PDFOrganizer = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pdfPages, setPdfPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [organizationResult, setOrganizationResult] = useState(null);
  const fileInputRef = useRef(null);
  const resultSectionRef = useRef(null);
  const pagesContainerRef = useRef(null);
  const [hoveredSide, setHoveredSide] = useState(null);
  const [hoveredPage, setHoveredPage] = useState(null);
  const [addedFiles, setAddedFiles] = useState({});
  const [filePasswords, setFilePasswords] = useState({});
  const [encryptedFileIds, setEncryptedFileIds] = useState({});
  
  // dnd-kit state
  const [activeId, setActiveId] = useState(null);
  const [isDragInProgress, setIsDragInProgress] = useState(false);
  const [activePage, setActivePage] = useState(null);
  const [overId, setOverId] = useState(null); // Add this state
  
  // State for enlarged preview
  const [enlargedPreview, setEnlargedPreview] = useState({
    isOpen: false,
    imageData: null,
    pageNumber: null
  });

  // Preview modal state
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    pdfUrl: null,
    fileName: ''
  });

  // Configure sensors for both desktop and mobile
  const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5, // Reduced from 8
    },
  }),
  useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150, // Reduced from 200
      tolerance: 5, // Reduced from 8
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);

  // Use auto-scroll hook
  useAutoScroll(pagesContainerRef, isDragInProgress);

  // Drag handlers
  const handleDragStart = (event) => {
  const { active } = event;
  const pageData = active.data.current;
  setActiveId(active.id);
  setActivePage(pageData?.page);
  setIsDragInProgress(true);
};

const handleDragOver = (event) => {
  const { over } = event;
  setOverId(over?.id || null);
};

const handleDragEnd = (event) => {
  const { active, over } = event;
  setActiveId(null);
  setActivePage(null);
  setIsDragInProgress(false);
  setOverId(null); // Clear drop target

  if (active.id !== over?.id) {
    setPdfPages((items) => {
      const oldIndex = items.findIndex((_, index) => `page-${index}` === active.id);
      const newIndex = items.findIndex((_, index) => `page-${index}` === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        return arrayMove(items, oldIndex, newIndex);
      }
      return items;
    });
  }
};

  // File size limits (in bytes)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

  // Calculate estimated upload time based on file size (rough estimate)
  const estimatedUploadTime = file ? Math.ceil(file.size / (400 * 1024)) : 0;

  // Handle file selection
  const handleFilesSelected = (selectedFiles) => {
    if (selectedFiles.length > 0) {
      handleFileChange({ target: { files: selectedFiles } });
    }
  };

  // Handle encrypted PDF - redirect to unlock-pdf
  const handleEncryptedPDF = (fileName) => {
    const confirmRedirect = window.confirm(
      `"${fileName}" is password protected. Would you like to go to the Unlock PDF tool to decrypt it first?`
    );
    
    if (confirmRedirect) {
      // Redirect to unlock-pdf page
      window.location.href = '/unlock-pdf';
    } else {
      // User chose to cancel
      setFile(null);
      setError('Please decrypt the PDF first using our Unlock PDF tool, or try another file.');
    }
  };

  // Close the PDF preview modal
  const handleClosePreview = () => {
    setPreviewModal({
      isOpen: false,
      pdfUrl: null,
      fileName: ''
    });
  };
  
  // Close the enlarged preview modal
  const handleCloseEnlargedPreview = () => {
    setEnlargedPreview({
      isOpen: false,
      imageData: null,
      pageNumber: null
    });
  };
  
  // Open the enlarged preview for a specific page
  const handleOpenEnlargedPreview = (imageData, pageNumber) => {
    setEnlargedPreview({
      isOpen: true,
      imageData,
      pageNumber
    });
  };

  // Scroll to results section when organization completes
  useEffect(() => {
    if (organizationResult && resultSectionRef.current) {
      setTimeout(() => {
        resultSectionRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 300);
    }
  }, [organizationResult]);

  // Load PDF.js when component mounts
  useEffect(() => {
    if (file && window.pdfjsLib) {
      loadPdfPages();
    }
  }, [file]);

  // Set up drag and drop for file uploads
  useEffect(() => {
    const dragOverlay = document.getElementById('drag-overlay');
    
    let isPageDragging = false;

    const handleDocumentDragStart = (e) => {
      if (e.target.closest('.pdf-page-item')) {
        isPageDragging = true;
      }
    };

    const handleDocumentDragEnd = () => {
      isPageDragging = false;
    };

    const handleDocumentDragOver = (e) => {
      if (isPageDragging || isDragInProgress) return;
      
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      
      if (dragOverlay) {
        dragOverlay.style.opacity = '1';
      }
    };

    const handleDocumentDragLeave = (e) => {
      if (isPageDragging || isDragInProgress) return;
      
      e.preventDefault();
      e.stopPropagation();
      if (!e.relatedTarget || e.relatedTarget.nodeName === 'HTML') {
        setIsDragging(false);
        
        if (dragOverlay) {
          dragOverlay.style.opacity = '0';
        }
      }
    };

    const handleDocumentDrop = (e) => {
      if (isPageDragging || isDragInProgress) return;
      
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      if (dragOverlay) {
        dragOverlay.style.opacity = '0';
      }
      
      const isInsideDropZone = e.target.closest('.drop-zone');
      if (!isInsideDropZone) {
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
          handleFileWithValidation(droppedFiles[0]);
        }
      }
    };

    document.addEventListener('dragstart', handleDocumentDragStart);
    document.addEventListener('dragend', handleDocumentDragEnd);
    document.addEventListener('dragover', handleDocumentDragOver);
    document.addEventListener('dragleave', handleDocumentDragLeave);
    document.addEventListener('drop', handleDocumentDrop);

    return () => {
      document.removeEventListener('dragstart', handleDocumentDragStart);
      document.removeEventListener('dragend', handleDocumentDragEnd);
      document.removeEventListener('dragover', handleDocumentDragOver);
      document.removeEventListener('dragleave', handleDocumentDragLeave);
      document.removeEventListener('drop', handleDocumentDrop);
    };
  }, [isDragInProgress]);

  // Load PDF pages
  const loadPdfPages = async () => {
    if (!file || !window.pdfjsLib) return;
    
    setIsProcessing(true);
    setError(null);
    setPdfPages([]);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      try {
        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        const pageCount = pdf.numPages;
        const pages = [];
        
        // Load each page
        for (let i = 1; i <= pageCount; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.5 });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          pages.push({
            originalIndex: i,
            dataUrl: canvas.toDataURL(),
            rotation: 0
          });
          
          setProgress(Math.round((i / pageCount) * 100));
        }
        
        setPdfPages(pages);
        
      } catch (error) {
        console.error('Error loading PDF:', error);
        
        if (error.name === 'PasswordException' || error.message.includes('password')) {
          handleEncryptedPDF(file.name);
          return;
        } else {
          setError(`Failed to load PDF: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error reading file:', error);
      setError(`Error reading file: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Validate file before setting it
  const handleFileWithValidation = (newFile) => {
    setError(null);
    setFile(null);
    
    if (newFile.type !== 'application/pdf') {
      setError(`"${newFile.name}" is not a PDF file. Only PDF files are supported.`);
      return;
    }
    
    if (newFile.size > MAX_FILE_SIZE) {
      setError(`"${newFile.name}" exceeds the 100 MB file size limit.`);
      return;
    }
    
    setFile(newFile);
    setOrganizationResult(null);
    setPdfPages([]);
  };

  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileWithValidation(e.target.files[0]);
    }if (e.target && e.target.value) {
     e.target.value = null;
   }
 };

 // Handle select files button click
 const handleSelectFiles = () => {
   if (fileInputRef.current) {
     fileInputRef.current.click();
   }
 };

 // Delete a page
 const deletePage = (index) => {
   setPdfPages(prevPages => prevPages.filter((_, i) => i !== index));
 };

 // Rotate a page
 const rotatePage = (index) => {
   setPdfPages(prevPages => 
     prevPages.map((page, i) => 
       i === index 
         ? { ...page, rotation: (page.rotation + 90) % 360 } 
         : page
     )
   );
 };

 // Add a blank page before specified index
 const addBlankPageBefore = (index) => {
   const canvas = document.createElement('canvas');
   const context = canvas.getContext('2d');
   canvas.width = 595;
   canvas.height = 842;
   
   context.fillStyle = '#FFFFFF';
   context.fillRect(0, 0, canvas.width, canvas.height);
   
   const blankPage = {
     originalIndex: -1,
     dataUrl: canvas.toDataURL(),
     rotation: 0,
     isBlank: true
   };
   
   setPdfPages(prevPages => {
     const newPages = [...prevPages];
     newPages.splice(index, 0, blankPage);
     return newPages;
   });
 };

 // Add a blank page after specified index
 const addBlankPageAfter = (index) => {
   const canvas = document.createElement('canvas');
   const context = canvas.getContext('2d');
   canvas.width = 595;
   canvas.height = 842;
   
   context.fillStyle = '#FFFFFF';
   context.fillRect(0, 0, canvas.width, canvas.height);
   
   const blankPage = {
     originalIndex: -1,
     dataUrl: canvas.toDataURL(),
     rotation: 0,
     isBlank: true
   };
   
   setPdfPages(prevPages => {
     const newPages = [...prevPages];
     newPages.splice(index + 1, 0, blankPage);
     return newPages;
   });
 };

 // Add a new file before specified index
 const addFileBeforePage = (index) => {
   const tempFileInput = document.createElement('input');
   tempFileInput.type = 'file';
   tempFileInput.accept = 'application/pdf';
   tempFileInput.style.display = 'none';
   document.body.appendChild(tempFileInput);
   
   tempFileInput.onchange = async (e) => {
     if (e.target.files && e.target.files.length > 0) {
       const newFile = e.target.files[0];
       
       if (newFile.type !== 'application/pdf') {
         setError(`"${newFile.name}" is not a PDF file. Only PDF files are supported.`);
         document.body.removeChild(tempFileInput);
         return;
       }
       
       if (newFile.size > MAX_FILE_SIZE) {
         setError(`"${newFile.name}" exceeds the 100 MB file size limit.`);
         document.body.removeChild(tempFileInput);
         return;
       }
       
       const fileId = `added-${Date.now()}-${newFile.name}`;
       
       setAddedFiles(prev => ({
         ...prev,
         [fileId]: newFile
       }));
       
       setIsProcessing(true);
       try {
         const arrayBuffer = await newFile.arrayBuffer();
         
         try {
           const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
           const pdf = await loadingTask.promise;
           const newPages = [];
           
           for (let i = 1; i <= pdf.numPages; i++) {
             const pdfPage = await pdf.getPage(i);
             const viewport = pdfPage.getViewport({ scale: 0.5 });
             
             const canvas = document.createElement('canvas');
             const context = canvas.getContext('2d');
             canvas.height = viewport.height;
             canvas.width = viewport.width;
             
             await pdfPage.render({
               canvasContext: context,
               viewport: viewport
             }).promise;
             
             newPages.push({
               originalIndex: i,
               dataUrl: canvas.toDataURL(),
               rotation: 0,
               fromFile: fileId
             });
           }
           
           setPdfPages(prevPages => {
             const updatedPages = [...prevPages];
             updatedPages.splice(index, 0, ...newPages);
             return updatedPages;
           });
           
         } catch (pdfError) {
           if (pdfError.name === 'PasswordException' || pdfError.message.includes('password')) {
             const confirmRedirect = window.confirm(
               `"${newFile.name}" is password protected. Would you like to go to the Unlock PDF tool to decrypt it first?`
             );
             
             if (confirmRedirect) {
               window.location.href = '/unlock-pdf';
             } else {
               setError('Please decrypt the PDF first using our Unlock PDF tool.');
             }
           } else {
             setError(`Failed to process the new PDF file: ${pdfError.message}`);
           }
         }
         
       } catch (error) {
         console.error('Error processing new PDF file:', error);
         setError(`Failed to process the new PDF file: ${error.message}`);
       } finally {
         setIsProcessing(false);
         document.body.removeChild(tempFileInput);
       }
     }
   };
   
   tempFileInput.click();
 };

 // Add a new file after specified index
 const addFileAfterPage = (index) => {
   const tempFileInput = document.createElement('input');
   tempFileInput.type = 'file';
   tempFileInput.accept = 'application/pdf';
   tempFileInput.style.display = 'none';
   document.body.appendChild(tempFileInput);
   
   tempFileInput.onchange = async (e) => {
     if (e.target.files && e.target.files.length > 0) {
       const newFile = e.target.files[0];
       
       if (newFile.type !== 'application/pdf') {
         setError(`"${newFile.name}" is not a PDF file. Only PDF files are supported.`);
         document.body.removeChild(tempFileInput);
         return;
       }
       
       if (newFile.size > MAX_FILE_SIZE) {
         setError(`"${newFile.name}" exceeds the 100 MB file size limit.`);
         document.body.removeChild(tempFileInput);
         return;
       }
       
       const fileId = `added-${Date.now()}-${newFile.name}`;
       
       setAddedFiles(prev => ({
         ...prev,
         [fileId]: newFile
       }));
       
       setIsProcessing(true);
       try {
         const arrayBuffer = await newFile.arrayBuffer();
         
         try {
           const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
           const pdf = await loadingTask.promise;
           const newPages = [];
           
           for (let i = 1; i <= pdf.numPages; i++) {
             const pdfPage = await pdf.getPage(i);
             const viewport = pdfPage.getViewport({ scale: 0.5 });
             
             const canvas = document.createElement('canvas');
             const context = canvas.getContext('2d');
             canvas.height = viewport.height;
             canvas.width = viewport.width;
             
             await pdfPage.render({
               canvasContext: context,
               viewport: viewport
             }).promise;
             
             newPages.push({
               originalIndex: i,
               dataUrl: canvas.toDataURL(),
               rotation: 0,
               fromFile: fileId
             });
           }
           
           setPdfPages(prevPages => {
             const updatedPages = [...prevPages];
             updatedPages.splice(index + 1, 0, ...newPages);
             return updatedPages;
           });
           
         } catch (pdfError) {
           if (pdfError.name === 'PasswordException' || pdfError.message.includes('password')) {
             const confirmRedirect = window.confirm(
               `"${newFile.name}" is password protected. Would you like to go to the Unlock PDF tool to decrypt it first?`
             );
             
             if (confirmRedirect) {
               window.location.href = '/unlock-pdf';
             } else {
               setError('Please decrypt the PDF first using our Unlock PDF tool.');
             }
           } else {
             setError(`Failed to process the new PDF file: ${pdfError.message}`);
           }
         }
         
       } catch (error) {
         console.error('Error processing new PDF file:', error);
         setError(`Failed to process the new PDF file: ${error.message}`);
       } finally {
         setIsProcessing(false);
         document.body.removeChild(tempFileInput);
       }
     }
   };
   
   tempFileInput.click();
 };
 
 // Handle mouse move to detect left/right side hover
 const handleMouseMove = (e, index) => {
   const target = e.currentTarget;
   const rect = target.getBoundingClientRect();
   const x = e.clientX - rect.left;
   
   if (x < rect.width / 2) {
     setHoveredSide('left');
   } else {
     setHoveredSide('right');
   }
   
   setHoveredPage(index);
 };
 
 // Handle mouse leave
 const handleMouseLeave = () => {
   setHoveredSide(null);
   setHoveredPage(null);
 };

 // Reset to initial state
 const handleReset = () => {
   setFile(null);
   setPdfPages([]);
   setIsProcessing(false);
   setProgress(0);
   setError(null);
   setOrganizationResult(null);
   setAddedFiles({});
   setFilePasswords({});
   setEncryptedFileIds({});
 };

 // Format file size in a readable format
 const formatFileSize = (bytes) => {
   if (bytes < 1024) return `${bytes} B`;
   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
   return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
 };

 // Create organized PDF
 const createOrganizedPDF = async () => {
   if (pdfPages.length === 0) return;
   
   setIsProcessing(true);
   setProgress(0);
   setError(null);
   
   try {
     const newPdfDoc = await PDFDocument.create();
     setProgress(5);
     
     const originalPdfBytes = await file.arrayBuffer();
     let originalPdfDoc;
     
     const loadStrategies = [
       async () => {
         try {
           return await PDFDocument.load(originalPdfBytes);
         } catch (error) {
           return null;
         }
       },
       async () => {
         try {
           return await PDFDocument.load(originalPdfBytes, { 
             ignoreEncryption: true 
           });
         } catch (error) {
           console.warn('Ignore encryption failed:', error);
           return null;
         }
       }
     ];
     
     for (const strategy of loadStrategies) {
       originalPdfDoc = await strategy();
       if (originalPdfDoc) break;
     }
     
     if (!originalPdfDoc) {
       throw new Error('Unable to load PDF. The file might be encrypted or corrupted.');
     }
     
     const loadedPdfs = {
       'original': originalPdfDoc
     };
     
     let processedCount = 0;
     const totalPages = pdfPages.length;
     
     const createBlankPage = async (pdfDoc, rotation = 0) => {
       const page = pdfDoc.addPage([595, 842]);
       
       if (rotation !== 0) {
         const rotationDegrees = (360 - rotation) % 360;
         page.setRotation(degrees(rotationDegrees));
       }
       
       return page;
     };
     
     for (let i = 0; i < totalPages; i++) {
       const page = pdfPages[i];
       
       const progressValue = 15 + Math.floor((processedCount / totalPages) * 60);
       setProgress(progressValue);
       
       try {
         if (page.isBlank) {
           await createBlankPage(newPdfDoc, page.rotation);
         } else if (page.fromFile && page.fromFile.startsWith('added-')) {
           const fileId = page.fromFile;
           const addedFile = addedFiles[fileId];
           
           if (!addedFile) {
             console.warn(`Added file with ID ${fileId} not found, adding blank page`);
             await createBlankPage(newPdfDoc);
             processedCount++;
             continue;
           }
           
           let addedPdfDoc = loadedPdfs[fileId];
           
           if (!addedPdfDoc) {
             const addedFileBytes = await addedFile.arrayBuffer();
             
             const addedLoadStrategies = [
               async () => {
                 const addedPassword = filePasswords[fileId];
                 if (addedPassword) {
                   try {
                     return await PDFDocument.load(addedFileBytes, { 
                       password: addedPassword 
                     });
                   } catch (passwordError) {
                     console.warn('Password failed for added file:', passwordError);
                     return null;
                   }
                 }
                 return null;
               },
               async () => {
                 try {
                   return await PDFDocument.load(addedFileBytes);
                 } catch (error) {
                   return null;
                 }
               },
               async () => {
                 try {
                   return await PDFDocument.load(addedFileBytes, { 
                     ignoreEncryption: true 
                   });
                 } catch (error) {
                   console.warn('Failed to load added PDF with ignoreEncryption:', error);
                   return null;
                 }
               }
             ];
             
             for (const strategy of addedLoadStrategies) {
               addedPdfDoc = await strategy();
               if (addedPdfDoc) break;
             }
             
             if (!addedPdfDoc) {
               console.error(`Failed to load added PDF file: ${fileId}`);
               await createBlankPage(newPdfDoc);
               processedCount++;
               continue;
             }
             
             loadedPdfs[fileId] = addedPdfDoc;
           }
           
           const sourceIndex = page.originalIndex - 1;
           
           if (sourceIndex >= 0 && sourceIndex < addedPdfDoc.getPageCount()) {
             try {
               const [copiedPage] = await newPdfDoc.copyPages(addedPdfDoc, [sourceIndex]);
               
               if (page.rotation !== 0) {
                 const rotationDegrees = (360 - page.rotation) % 360;
                 copiedPage.setRotation(degrees(rotationDegrees));
               }
               
               newPdfDoc.addPage(copiedPage);
             } catch (copyError) {
               console.error(`Error copying page ${sourceIndex} from added file:`, copyError);
               await createBlankPage(newPdfDoc);
             }
           } else {
             console.warn(`Page index ${sourceIndex} out of range for added file, adding blank page`);
             await createBlankPage(newPdfDoc);
           }
         } else {
           const originalIndex = page.originalIndex - 1;
           
           try {
             const [copiedPage] = await newPdfDoc.copyPages(originalPdfDoc, [originalIndex]);
             
             if (page.rotation !== 0) {
               const rotationDegrees = (360 - page.rotation) % 360;
               copiedPage.setRotation(degrees(rotationDegrees));
             }
             
             newPdfDoc.addPage(copiedPage);
           } catch (copyError) {
             console.error(`Error copying page ${originalIndex} from original PDF:`, copyError);
             await createBlankPage(newPdfDoc);
           }
         }
         
         processedCount++;
       } catch (error) {
         console.error(`Error processing page ${i + 1}:`, error);
       }
     }
     
     setProgress(80);
     const newPdfBytes = await newPdfDoc.save();
     setProgress(85);
     
     const newPdfBlob = new Blob([newPdfBytes], { type: 'application/pdf' });
     
     const newPdfFile = new File(
       [newPdfBlob], 
       file.name.replace(/\.pdf$/i, '_organized.pdf'), 
       { type: 'application/pdf' }
     );
     
     const formData = new FormData();
     formData.append('pdf_file', newPdfFile);
     formData.append('is_frontend_processed', 'true');
     
     const result = await organizePDF(
       formData,
       (progressValue) => {
         setProgress(85 + Math.floor(progressValue * 0.15));
       }
     );
     
     setOrganizationResult({
       files: [result.file]
     });
     
     console.log('PDF organization successful:', result);
     
   } catch (error) {
     console.error('Organization failed:', error);
     setError(error.message || 'PDF organization failed. Please try again.');
   } finally {
     setIsProcessing(false);
   }
 };
 
 // Download the organized PDF
 const handleDownload = (fileId, fileName) => {
   const finalFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
   downloadOrganizedPdf(fileId, finalFileName);
 };

 // Open PDF preview
 const handleOpenPreview = async (fileId, fileName) => {
   if (organizationResult) {
     try {
       setIsProcessing(true);
       
       const downloadUrl = getOrganizedPdfDownloadUrl(fileId);
       
       const response = await fetch(downloadUrl);
       if (!response.ok) {
         throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
       }
       
       const pdfBlob = await response.blob();
       const objectUrl = URL.createObjectURL(pdfBlob);
       
       setPreviewModal({
         isOpen: true,
         pdfUrl: objectUrl,
         fileName: fileName || 'Organized Document.pdf'
       });
     } catch (error) {
       console.error('Error preparing PDF preview:', error);
       setError('Unable to preview the PDF. Please try downloading instead.');
     } finally {
       setIsProcessing(false);
     }
   }
 };

 // Calculate total size of PDF file
 const pdfSize = file ? file.size : 0;

 // Sort pages by page number ascending (1->)
 const sortPagesAscending = () => {
   setPdfPages(prevPages => [...prevPages].sort((a, b) => a.originalIndex - b.originalIndex));
 };

 // Sort pages by page number descending (<-1)
 const sortPagesDescending = () => {
   setPdfPages(prevPages => [...prevPages].sort((a, b) => b.originalIndex - a.originalIndex));
 };

 // Create sortable items array for dnd-kit
 const sortableItems = pdfPages.map((_, index) => `page-${index}`);

 return (
   <div className="w-full max-w-7xl mx-auto p-4">
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
       text={!file ? "Processing PDF..." : pdfPages.length > 0 ? "Organizing PDF..." : "Loading PDF pages..."}
     />
     
     {/* PDF Preview Modal */}
     <PDFPreviewModal
       isOpen={previewModal.isOpen}
       onClose={handleClosePreview}
       pdfUrl={previewModal.pdfUrl}
       fileName={previewModal.fileName}
     />
     
     {/* Enlarged Page Preview Modal */}
     {enlargedPreview.isOpen && (
       <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
           <div className="p-4 border-b border-gray-200 flex justify-between items-center">
             <h3 className="text-xl font-semibold">
               Page {enlargedPreview.pageNumber !== null ? enlargedPreview.pageNumber + 1 : ''} Preview
             </h3>
             <button
               onClick={handleCloseEnlargedPreview}
               className="text-gray-500 hover:text-gray-700"
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
           <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100">
             {enlargedPreview.imageData && (
               <img 
                 src={enlargedPreview.imageData} 
                 alt={`Page ${enlargedPreview.pageNumber + 1}`}
                 className="max-w-full max-h-[calc(90vh-6rem)] object-contain"
               />
             )}
           </div>
         </div>
       </div>
     )}

     {/* Title Section */}
     <div className="text-center mb-10">
       <h1 className="text-4xl mt-4 font-bold mb-2">
         <span className="text-[#DA1F10]">Organize</span> PDF
       </h1>
       <p className="text-gray-600">Rearrange, delete, and rotate pages in your PDF document</p>
       <p className="text-sm text-gray-500 mt-2">Max file size: 100 MB</p>
     </div>

     {/* Main Content */}
     {!file && !organizationResult && (
       <SelectFiles 
         onFilesSelected={handleFilesSelected}
         onError={setError}
         buttonText="Select PDF File"
         buttonColor="red"
         buttonSize="large"
         multipleFiles={false}
       />
     )}

     {/* Error State */}
     {error && (
       <div className="w-full p-6 bg-red-50 rounded-xl border border-red-200 mb-6 shadow-sm">
         <div className="flex items-start">
           <div className="flex-shrink-0">
             <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

     {file && (
       <div className="flex flex-col md:flex-row gap-6">
         {/* Left column (PDF Pages) */}
         <div className="w-full md:w-3/4">
           {/* File header with controls */}
           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
             <h2 className="text-lg font-medium">
               Selected File ({file.name})
             </h2>
             <div className="flex flex-wrap items-center gap-2">
               <button
                 onClick={handleReset}
                 className="text-red-600 cursor-pointer hover:text-red-800 font-medium flex items-center text-sm px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
               >
                 <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                 </svg>
                 Remove File
               </button>
               <button
                 onClick={handleSelectFiles}
                 className="text-blue-600 cursor-pointer hover:text-blue-800 font-medium flex items-center text-sm px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
               >
                 <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                 </svg>
                 Select Another File
               </button>
             </div>
           </div>

           {/* Drag and drop zone */}
           <div 
             className="w-full border-2 border-dashed rounded-lg mb-6 p-4 text-center drop-zone border-gray-200 bg-gray-50 transition-all duration-200 hover:border-blue-300"
             onDragOver={(e) => {
               if (!isDragInProgress) {
                 e.preventDefault();
               }
             }}
             onDrop={(e) => {
               if (!isDragInProgress) {
                 e.preventDefault();
                 e.stopPropagation();
                 const droppedFiles = Array.from(e.dataTransfer.files);
                 if (droppedFiles.length > 0) {
                   handleFileWithValidation(droppedFiles[0]);
                 }
               }
             }}
           >
             <p className="text-gray-500 text-sm">
               Drag and drop a PDF here to replace current file
             </p>
           </div>

           {pdfPages.length > 0 && (
             <>
               {/* PDF Pages header with sort options */}
               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                 <div className="flex items-center">
                   <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
                   </svg>
                   <h3 className="text-lg font-medium">Sort Pages:</h3>
                 </div>
                 <div className="flex gap-2">
                   <button
                     onClick={sortPagesAscending}
                     className="px-3 py-2 border cursor-pointer border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center transition-colors"
                   >
                     <span className="mr-1">1→</span> Ascending
                   </button>
                   <button
                     onClick={sortPagesDescending}
                     className="px-3 py-2 border cursor-pointer border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center transition-colors"
                   >
                     <span className="mr-1">←1</span> Descending
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
                     Touch and hold the "DRAG" area to reorder pages. Pages will be organized in the order shown below.
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
                     Drag and drop the pages by their drag handles to reorder them. Pages will be organized in the order shown below.
                   </p>
                 </div>
               </div>
               
               {/* PDF Pages container with DndContext */}
               <DndContext 
                 sensors={sensors}
                 collisionDetection={customCollisionDetection} // Change this
                  onDragOver={handleDragOver} // Add this
                 onDragStart={handleDragStart}
                 onDragEnd={handleDragEnd}
>
  <SortableContext 
    items={sortableItems}
    strategy={rectSortingStrategy}
  >
    <div 
      ref={pagesContainerRef}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-8 max-h-[600px] overflow-y-auto p-2 rounded-lg border border-gray-200 bg-gray-50"
      style={{ touchAction: 'pan-y' }} // Allow vertical scrolling on mobile
    >
      {pdfPages.map((page, index) => {
  const pageId = `page-${index}`;
  const isDropTarget = overId === pageId;
  
  return (
    <SortablePage
      key={pageId}
      page={page}
      index={index}
      onDelete={deletePage}
      onRotate={rotatePage}
      onEnlargePreview={handleOpenEnlargedPreview}
      onAddBlankBefore={addBlankPageBefore}
      onAddBlankAfter={addBlankPageAfter}
      onAddFileBefore={addFileBeforePage}
      onAddFileAfter={addFileAfterPage}
      hoveredPage={hoveredPage}
      hoveredSide={hoveredSide}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      isDropTarget={isDropTarget} // Pass the drop target state
    />
  );
})}
    </div>
  </SortableContext>
  
  {/* Drag Overlay */}
  <DragOverlay>
    <DragOverlayComponent activePage={activePage} />
  </DragOverlay>
</DndContext>
            </> // Close the pdfPages.length > 0 conditional
          )} 
        </div> 

        {/* Right column (Sidebar) */}
        <div className="w-full md:w-1/4">
          <div className="sticky top-4">
            {pdfPages.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium mb-4">Document Info</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Pages:</span>
                    <span className="font-medium">{pdfPages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">File Size:</span>
                    <span className="font-medium">{formatFileSize(pdfSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original File:</span>
                    <span className="font-medium text-xs truncate" title={file.name}>
                      {file.name.length > 20 ? `${file.name.substring(0, 17)}...` : file.name}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={createOrganizedPDF}
                    disabled={isProcessing || pdfPages.length === 0}
                    className={`w-full ${
                      isProcessing || pdfPages.length === 0
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-[#DA1F10] hover:bg-[#B81A0E]'
                    } text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed`}
                  >
                    {isProcessing ? 'Organizing...' : 'Organize PDF'}
                    {!isProcessing && estimatedUploadTime > 0 && (
                      <span className="text-xs block mt-1">
                        Est. time: {estimatedUploadTime < 60
                          ? `${estimatedUploadTime} seconds`
                          : `${Math.floor(estimatedUploadTime / 60)} min ${estimatedUploadTime % 60} sec`}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div> // Close flex container
    )}

    {/* Results Section */}
    {organizationResult && (
      <div ref={resultSectionRef} className="mt-10">
        <DownloadSection
          files={organizationResult.files}
          onDownload={handleDownload}
          onPreview={handleOpenPreview}
          title="Organized PDF Ready"
          description="Your PDF has been successfully organized. You can preview or download it below."
        />
        
        <div className="text-center mt-6">
          <button
            onClick={handleReset}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Organize Another PDF
          </button>
        </div>
      </div>
    )}

    {/* Global drag overlay for file drops */}
    <div
      id="drag-overlay"
      className="fixed inset-0 backdrop-filter backdrop-blur-md z-40 flex items-center justify-center transition-opacity duration-200 pointer-events-none"
      style={{ opacity: 0 }}
    >
      <div className="bg-white rounded-xl p-8 shadow-2xl border-2 border-blue-400 border-dashed">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p className="text-xl font-semibold text-blue-600">Drop PDF file here</p>
          <p className="text-gray-600 mt-2">Release to upload</p>
        </div>
      </div>
    </div>

    <style jsx>{`
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes tooltipFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.15s ease-out;
  }
  
  .scale-102 {
    transform: scale(1.02);
  }
  
  /* Prevent weird animations during drag operations */
  .pdf-page-item[data-dragging="true"] {
    transition: none !important;
  }
  
  .pdf-page-item[data-drop-target="true"] {
    transition: border-color 0.15s ease, background-color 0.15s ease !important;
  }
`}</style>
  </div> // Close main container
);
};

export default PDFOrganizer;