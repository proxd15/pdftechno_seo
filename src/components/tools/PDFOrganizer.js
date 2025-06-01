"use client"

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { organizePDF, getOrganizedPdfDownloadUrl, downloadOrganizedPdf } from '../../api/organize_api';
import ModalLoader from '../tools_utility/ModalLoader';
import PDFPreviewModal from '../tools_utility/PDFPreviewModal.';
import SelectFiles from '../tools_utility/SelectFiles';
import DownloadSection from '../tools_utility/DownloadSection';
import Sortable from 'sortablejs';

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
  
  // Get tooltip positioning based on specified position
  const getTooltipStyle = () => {
    // Default styles shared by all positions
    const baseStyle = {
      opacity: 1,
      animation: 'tooltipFadeIn 0.15s ease-out',
    };
    
    // Position-specific styles
    switch(position) {
      case "left":
        return {
          ...baseStyle,
          right: '100%',        // Place tooltip to the left of the button
          top: '50%',           // Center vertically
          marginRight: '10px',  // Add some space between tooltip and button
          transform: 'translateY(-50%)',
        };
      case "right":
        return {
          ...baseStyle,
          left: '100%',         // Place tooltip to the right of the button
          top: '50%',           // Center vertically
          marginLeft: '10px',   // Add some space between tooltip and button
          transform: 'translateY(-50%)',
        };
      case "bottom":
        return {
          ...baseStyle,
          left: '50%',          // Center horizontally
          top: '100%',          // Place tooltip below the button
          marginTop: '10px',    // Add some space between tooltip and button
          transform: 'translateX(-50%)',
        };
      case "top":
      default:
        return {
          ...baseStyle,
          left: '50%',          // Center horizontally
          bottom: '100%',       // Place tooltip above the button
          marginBottom: '10px', // Add some space between tooltip and button
          transform: 'translateX(-50%)',
        };
    }
  };
  
  // Get arrow positioning based on tooltip position
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

// Step 2: Update the animation keyframes to match the new positioning
<style jsx global>{`
  @keyframes tooltipFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .tooltip-container {
    position: relative;
  }
`}</style>

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
  const [draggedPage, setDraggedPage] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [autoScrollActive, setAutoScrollActive] = useState(false);
  const [autoScrollDirection, setAutoScrollDirection] = useState(null);
  const autoScrollInterval = useRef(null);
  const [hoveredSide, setHoveredSide] = useState(null);
  const [hoveredPage, setHoveredPage] = useState(null);
  const [addedFiles, setAddedFiles] = useState({});
  const [filePasswords, setFilePasswords] = useState({});
  const [encryptedFileIds, setEncryptedFileIds] = useState({});
  
  // State for enlarged preview
  const [enlargedPreview, setEnlargedPreview] = useState({
    isOpen: false,
    imageData: null,
    pageNumber: null
  });

  const sortableRef = useRef(null);
  const sortableInstance = useRef(null);

  // IMPROVED: Auto-scroll constants for better sensitivity
  const AUTO_SCROLL_THRESHOLD = 100; // px from edge (reduced to make it more sensitive)
  const AUTO_SCROLL_SPEED = 25;     // px per interval (increased for smoother scrolling)

  // FIXED: Initialize SortableJS with improved scroll configuration
  useEffect(() => {
    if (pdfPages.length > 0 && pagesContainerRef.current && !sortableInstance.current) {
      const container = pagesContainerRef.current.querySelector('.pdf-pages-container');
      
      if (container) {
        sortableInstance.current = new Sortable(container, {
          animation: 150,
          ghostClass: 'sortable-ghost',
          chosenClass: 'sortable-chosen',
          dragClass: 'sortable-drag',
          // REMOVE THIS LINE: handle: '.pdf-page-item', // <- This is restricting drag area
          scroll: true,
          scrollSensitivity: 30,
          scrollSpeed: 30,
          forceFallback: true,
          fallbackOnBody: true,
          // Add delay to prevent accidental drags when trying to click
          delay: 100, 
          // Add distance requirement to start dragging
          distance: 5,
          // Add this for better drag behavior
          dragoverBubble: true,
          onStart: (evt) => {
            setDraggedPage(evt.oldIndex);
            evt.item.classList.add('dragging');
          },
          onEnd: (evt) => {
            setDraggedPage(null);
            evt.item.classList.remove('dragging');
          },
          onUpdate: (evt) => {
            // Update the pages array when reordered
            const newPages = [...pdfPages];
            const [movedItem] = newPages.splice(evt.oldIndex, 1);
            newPages.splice(evt.newIndex, 0, movedItem);
            setPdfPages(newPages);
          },
        });
      }
    }
    return () => {
      if (sortableInstance.current) {
        sortableInstance.current.destroy();
        sortableInstance.current = null;
      }
    };
  }, [pdfPages.length]);

  // Add this modal for handling passwords for added files
  const [addedFilePasswordModal, setAddedFilePasswordModal] = useState({
    isOpen: false,
    fileId: null,
    fileName: '',
    password: '',
    error: '',
    callback: null
  });

  const handleAddedFilePasswordSubmit = async (e) => {
    e.preventDefault();
    
    const { fileId, password, callback } = addedFilePasswordModal;
    if (!password.trim()) {
      setAddedFilePasswordModal(prev => ({
        ...prev,
        error: 'Please enter a password'
      }));
      return;
    }
    
    // Store the password
    setFilePasswords(prev => ({
      ...prev,
      [fileId]: password
    }));
    
    // Close the modal
    setAddedFilePasswordModal({
      isOpen: false,
      fileId: null,
      fileName: '',
      password: '',
      error: '',
      callback: null
    });
    
    // If there's a callback, execute it
    if (callback && typeof callback === 'function') {
      callback(password);
    }
  };
  
  // IMPROVED: Enhanced auto-scrolling implementation
  useEffect(() => {
    if (autoScrollActive && autoScrollDirection && pagesContainerRef.current) {
      if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
      
      // Use a faster interval for smoother scrolling
      autoScrollInterval.current = setInterval(() => {
        if (pagesContainerRef.current) {
          if (autoScrollDirection === 'up') {
            // Apply faster scroll for up direction
            pagesContainerRef.current.scrollTop -= AUTO_SCROLL_SPEED;
          } else if (autoScrollDirection === 'down') {
            // Apply faster scroll for down direction
            pagesContainerRef.current.scrollTop += AUTO_SCROLL_SPEED;
          }
        }
      }, 10); // Faster interval (60fps)
    } else {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
        autoScrollInterval.current = null;
      }
    }
    
    return () => {
      if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
    };
  }, [autoScrollActive, autoScrollDirection]);
  
  
  // Password modal state
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    password: '',
    error: ''
  });

  // Preview modal state
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    pdfUrl: null,
    fileName: ''
  });

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
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [organizationResult]);

  // Load PDF.js when component mounts
  useEffect(() => {
    // This assumes PDF.js is already loaded via script tag
    if (file && window.pdfjsLib) {
      loadPdfPages();
    }
  }, [file]);

  // Set up drag and drop for file uploads, but avoid interfering with page reordering
  useEffect(() => {
    const dragOverlay = document.getElementById('drag-overlay');
    
    // Flag to track if we're currently dragging a page
    let isPageDragging = false;

    const handleDocumentDragStart = (e) => {
      // Set the flag when a page drag starts
      if (e.target.closest('.pdf-page-item')) {
        isPageDragging = true;
      }
    };

    const handleDocumentDragEnd = () => {
      // Reset the flag when drag ends
      isPageDragging = false;
    };

    const handleDocumentDragOver = (e) => {
      // If we're dragging a page, don't show the document-wide overlay
      if (isPageDragging || draggedPage !== null) return;
      
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      
      if (dragOverlay) {
        dragOverlay.style.opacity = '1';
      }
    };

    const handleDocumentDragLeave = (e) => {
      // If we're dragging a page, don't handle document-wide drag leave
      if (isPageDragging || draggedPage !== null) return;
      
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
      // If we're dragging a page, don't handle document-wide drop
      if (isPageDragging || draggedPage !== null) return;
      
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
  }, [draggedPage]);

  // Load PDF pages
  const loadPdfPages = async () => {
    if (!file || !window.pdfjsLib) return;
    
    setIsProcessing(true);
    setError(null);
    setPdfPages([]);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      try {
        // Try to load PDF
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
            originalIndex: i, // Keep track of original index
            dataUrl: canvas.toDataURL(),
            rotation: 0
          });
          
          // Update loading progress
          setProgress(Math.round((i / pageCount) * 100));
        }
        
        setPdfPages(pages);
        
      } catch (error) {
        console.error('Error loading PDF:', error);
        
        // Check if PDF is password protected
        if (error.name === 'PasswordException' || error.message.includes('password')) {
          setPasswordModal({
            isOpen: true,
            password: '',
            error: ''
          });
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

  // Handle password submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    const { password } = passwordModal;
    if (!password.trim()) {
      setPasswordModal(prev => ({
        ...prev,
        error: 'Please enter a password'
      }));
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Attempt to load the PDF with the password
      const loadingTask = window.pdfjsLib.getDocument({
        data: arrayBuffer,
        password: password
      });
      
      const pdf = await loadingTask.promise;
      
      // Password is correct if we reached here
      // Close the modal
      setPasswordModal({
        isOpen: false,
        password: '',
        error: ''
      });
      
      // Load pages
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
          originalIndex: i, // Keep track of original index
          dataUrl: canvas.toDataURL(),
          rotation: 0,
          password: password // Store password for each page
        });
        
        // Update loading progress
        setProgress(Math.round((i / pageCount) * 100));
      }
      
      setPdfPages(pages);
      
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

  const handleAddedFilePassword = async (fileId, password, arrayBuffer) => {
    // Store the password for this file
    setFilePasswords(prev => ({
      ...prev, 
      [fileId]: password
    }));
    
    // Return the loaded PDF document
    return await PDFDocument.load(arrayBuffer, { password });
  };
  
  // Validate file before setting it
  const handleFileWithValidation = (newFile) => {
    // Reset error
    setError(null);
    setFile(null);
    
    // Check file type
    if (newFile.type !== 'application/pdf') {
      setError(`"${newFile.name}" is not a PDF file. Only PDF files are supported.`);
      return;
    }
    
    // Check file size
    if (newFile.size > MAX_FILE_SIZE) {
      setError(`"${newFile.name}" exceeds the 100 MB file size limit.`);
      return;
    }
    
    // Set the file if it passes validation
    setFile(newFile);
    
    // Reset the result and pages
    setOrganizationResult(null);
    setPdfPages([]);
  };

  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileWithValidation(e.target.files[0]);
    }
    // Reset the input value to allow selecting the same file again
    if (e.target && e.target.value) {
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
    // Create a blank canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 595; // A4 width in pixels at 72 DPI
    canvas.height = 842; // A4 height in pixels at 72 DPI
    
    // Fill with white
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create new blank page
    const blankPage = {
      originalIndex: -1, // Use negative to indicate it's not from original PDF
      dataUrl: canvas.toDataURL(),
      rotation: 0,
      isBlank: true
    };
    
    // Insert at position before the specified index
    setPdfPages(prevPages => {
      const newPages = [...prevPages];
      newPages.splice(index, 0, blankPage);
      return newPages;
    });
  };

  // Add a blank page after specified index
  const addBlankPageAfter = (index) => {
    // Create a blank canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 595; // A4 width in pixels at 72 DPI
    canvas.height = 842; // A4 height in pixels at 72 DPI
    
    // Fill with white
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create new blank page
    const blankPage = {
      originalIndex: -1, // Use negative to indicate it's not from original PDF
      dataUrl: canvas.toDataURL(),
      rotation: 0,
      isBlank: true
    };
    
    // Insert at position after specified index
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
        
        // Validate file
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
        
        // Generate a unique ID for this file
        const fileId = `added-${Date.now()}-${newFile.name}`;
        
        // Store the file in our state
        setAddedFiles(prev => ({
          ...prev,
          [fileId]: newFile
        }));
        
        // Process the new PDF file
        setIsProcessing(true);
        try {
          const arrayBuffer = await newFile.arrayBuffer();
          const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          const newPages = [];
          
          // Load each page from the new PDF
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
              fromFile: fileId // Store the fileId instead of just the name
            });
          }
          
          // Insert the new pages before the specified index
          setPdfPages(prevPages => {
            const updatedPages = [...prevPages];
            updatedPages.splice(index, 0, ...newPages);
            return updatedPages;
          });
          
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
        
        // Validate file
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
        
        // Generate a unique ID for this file
        const fileId = `added-${Date.now()}-${newFile.name}`;
        
        // Store the file in our state
        setAddedFiles(prev => ({
          ...prev,
          [fileId]: newFile
        }));
        
        // Process the new PDF file
        setIsProcessing(true);
        try {
          const arrayBuffer = await newFile.arrayBuffer();
          const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          const newPages = [];
          
          // Load each page from the new PDF
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
              fromFile: fileId // Store the fileId instead of just the name
            });
          }
          
          // Insert the new pages after the specified index
          setPdfPages(prevPages => {
            const updatedPages = [...prevPages];
            updatedPages.splice(index + 1, 0, ...newPages);
            return updatedPages;
          });
          
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
  
  // FIXED: Handle drag start with improved visuals
  const handleDragStart = (e, index) => {
    e.stopPropagation(); // Prevent event bubbling
    setDraggedPage(index);
    
    // Get the dragged element to make a "ghost" image
    const draggedElement = e.currentTarget;
    const rect = draggedElement.getBoundingClientRect();
    
    // Make the drag image semi-transparent
    if (draggedElement) {
      // Add a class for visual feedback during drag
      draggedElement.classList.add('dragging');
      
      // Create a clone for a better drag image
      const clone = draggedElement.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.top = '-1000px';
      clone.style.opacity = '0.8';
      clone.style.transform = 'rotate(2deg)';
      clone.style.zIndex = '9999';
      clone.style.width = `${rect.width}px`;
      clone.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
      
      document.body.appendChild(clone);
      
      // Set the drag image to our styled clone
      e.dataTransfer.setDragImage(clone, rect.width / 2, rect.height / 2);
      
      // Remove the clone after drag starts
      setTimeout(() => {
        document.body.removeChild(clone);
      }, 0);
    }
    
    e.dataTransfer.effectAllowed = 'move';
  };

  // FIXED: Handle drag over with improved visuals for drop indicators
  // This is a key fix - removing the page reordering that was conflicting with SortableJS
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    // Set this index as the drop target for visual feedback only
    setDropTarget(index);
    
    // Get the position for visual feedback
    const targetRect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - targetRect.top;
    const isTopHalf = relY < targetRect.height / 2;
    
    // Update the drag indicator position
    const dragIndicator = document.getElementById('drag-indicator');
    if (dragIndicator) {
      // Position at top or bottom based on mouse position
      const top = isTopHalf ? targetRect.top : targetRect.bottom - 3;
      
      dragIndicator.style.top = `${top}px`;
      dragIndicator.style.left = `${targetRect.left}px`;
      dragIndicator.style.width = `${targetRect.width}px`;
      dragIndicator.style.opacity = '1';
      dragIndicator.style.height = '4px';
      dragIndicator.style.transform = 'scaleX(1.05)'; // Slightly wider for emphasis
    }
    
    // Check for auto-scrolling
    if (pagesContainerRef.current) {
      const container = pagesContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // Check if we're near the top or bottom edge
      if (e.clientY - containerRect.top < AUTO_SCROLL_THRESHOLD) {
        // Near top edge, scroll up
        setAutoScrollDirection('up');
        setAutoScrollActive(true);
      } else if (containerRect.bottom - e.clientY < AUTO_SCROLL_THRESHOLD) {
        // Near bottom edge, scroll down
        setAutoScrollDirection('down');
        setAutoScrollActive(true);
      } else {
        // Not near edges, stop auto-scrolling
        setAutoScrollActive(false);
        setAutoScrollDirection(null);
      }
    }
    
    // REMOVED: The problematic code that was trying to manually reorder pages
    // This was conflicting with SortableJS's own reordering
  };

  // Handle drag end with improved visuals
  const handleDragEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove visual indicators
    const draggedElements = document.querySelectorAll('.dragging');
    draggedElements.forEach(el => el.classList.remove('dragging'));
    
    // Hide the drag indicator
    const dragIndicator = document.getElementById('drag-indicator');
    if (dragIndicator) {
      dragIndicator.style.opacity = '0';
      // Add a nice transition effect
      dragIndicator.style.transform = 'scaleX(0.5)';
    }
    
    setDraggedPage(null);
    setDropTarget(null);
    setAutoScrollActive(false);
    setAutoScrollDirection(null);
  };

  // Handle drop with improved visuals
  const handleDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Reset drop target and auto-scroll
    setDropTarget(null);
    setAutoScrollActive(false);
    setAutoScrollDirection(null);
    
    // Remove visual indicators
    const draggedElements = document.querySelectorAll('.dragging');
    draggedElements.forEach(el => el.classList.remove('dragging'));
    
    // Hide the drag indicator with a transition
    const dragIndicator = document.getElementById('drag-indicator');
    if (dragIndicator) {
      dragIndicator.style.opacity = '0';
      dragIndicator.style.transform = 'scaleX(0.5)';
    }
    
    setDraggedPage(null);
  };
  
  // Handle mouse move to detect left/right side hover
  const handleMouseMove = (e, index) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // If mouse is on the left side of the page
    if (x < rect.width / 2) {
      setHoveredSide('left');
    } else {
      // Mouse is on the right side of the page
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
  };

  // Format file size in a readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const createOrganizedPDF = async () => {
    if (pdfPages.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      // Step 1: Create a new PDF document
      const newPdfDoc = await PDFDocument.create();
      setProgress(5);
      
      // Load the original PDF document
      const originalPdfBytes = await file.arrayBuffer();
      let originalPdfDoc;
      
      // Comprehensive PDF loading strategies
      const loadStrategies = [
        // Strategy 1: Try with specific password from pages
        async () => {
          const specificPassword = pdfPages.find(p => p.password)?.password;
          if (specificPassword) {
            try {
              return await PDFDocument.load(originalPdfBytes, { 
                password: specificPassword 
              });
            } catch (passwordError) {
              console.warn('Stored page password failed:', passwordError);
              return null;
            }
          }
          return null;
        },
        
        // Strategy 2: Try without password
        async () => {
          try {
            return await PDFDocument.load(originalPdfBytes);
          } catch (error) {
            // If it fails, this strategy returns null
            return null;
          }
        },
        
        // Strategy 3: Ignore encryption
        async () => {
          try {
            return await PDFDocument.load(originalPdfBytes, { 
              ignoreEncryption: true 
            });
          } catch (error) {
            console.warn('Ignore encryption failed:', error);
            return null;
          }
        },
        
        // Strategy 4: Prompt for password with user interaction
        async () => {
          return new Promise((resolve) => {
            // Open password modal with a promise resolver
            setPasswordModal({
              isOpen: true,
              password: '',
              error: 'This PDF requires a password to open.',
              resolveLoading: (loadedPdf) => resolve(loadedPdf)
            });
          });
        }
      ];
      
      // Try each loading strategy
      for (const strategy of loadStrategies) {
        originalPdfDoc = await strategy();
        if (originalPdfDoc) break;
      }
      
      // Verify PDF loading
      if (!originalPdfDoc) {
        throw new Error('Unable to load PDF. The file might be encrypted or password-protected.');
      }
      
      // Create a map to cache loaded PDFs
      const loadedPdfs = {
        'original': originalPdfDoc
      };
      
      // Step 2: Process each page according to the order and rotation in pdfPages
      let processedCount = 0;
      const totalPages = pdfPages.length;
      
      // Function to handle blank pages
      const createBlankPage = async (pdfDoc, rotation = 0) => {
        // Create a blank page in standard A4 size
        const page = pdfDoc.addPage([595, 842]); // A4 size in points
        
        // Apply rotation if needed
        if (rotation !== 0) {
          const rotationDegrees = (360 - rotation) % 360;
          page.setRotation(degrees(rotationDegrees));
        }
        
        return page;
      };
      
      // Process each page in the order specified in pdfPages
      for (let i = 0; i < totalPages; i++) {
        const page = pdfPages[i];
        
        // Update progress (15-75%)
        const progressValue = 15 + Math.floor((processedCount / totalPages) * 60);
        setProgress(progressValue);
        
        try {
          // Handle different types of pages
          if (page.isBlank) {
            // Pass the rotation to createBlankPage
            await createBlankPage(newPdfDoc, page.rotation);
          } else if (page.fromFile && page.fromFile.startsWith('added-')) {
            // It's from an added file
            const fileId = page.fromFile;
            const addedFile = addedFiles[fileId];
            
            if (!addedFile) {
              console.warn(`Added file with ID ${fileId} not found, adding blank page`);
              await createBlankPage(newPdfDoc);
              processedCount++;
              continue;
            }
            
            // Check if we've already loaded this PDF
            let addedPdfDoc = loadedPdfs[fileId];
            
            if (!addedPdfDoc) {
              // Load the PDF if not already loaded
              const addedFileBytes = await addedFile.arrayBuffer();
              
              // Attempt to load with multiple strategies
              const addedLoadStrategies = [
                // First, try with stored password
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
                // Then try without password
                async () => {
                  try {
                    return await PDFDocument.load(addedFileBytes);
                  } catch (error) {
                    return null;
                  }
                },
                // Fallback with ignore encryption
                async () => {
                  try {
                    return await PDFDocument.load(addedFileBytes, { 
                      ignoreEncryption: true 
                    });
                  } catch (error) {
                    console.warn('Failed to load added PDF with ignoreEncryption:', error);
                    return null;
                  }
                },
                // Prompt for password for added file
                async () => {
                  return new Promise((resolve) => {
                    setAddedFilePasswordModal({
                      isOpen: true,
                      fileId: fileId,
                      fileName: addedFile.name,
                      password: '',
                      error: 'This PDF requires a password to open.',
                      callback: async (password) => {
                        try {
                          const loadedPdf = await PDFDocument.load(addedFileBytes, { 
                            password: password 
                          });
                          resolve(loadedPdf);
                        } catch (error) {
                          console.warn('Added file password failed:', error);
                          resolve(null);
                        }
                      }
                    });
                  });
                }
              ];
              
              // Try each loading strategy
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
            
            // Get the page from the added file
            const sourceIndex = page.originalIndex - 1; // Convert to 0-based
            
            if (sourceIndex >= 0 && sourceIndex < addedPdfDoc.getPageCount()) {
              try {
                // Copy the page from the added PDF
                const [copiedPage] = await newPdfDoc.copyPages(addedPdfDoc, [sourceIndex]);
                
                // Apply rotation if needed
                // PDF-lib uses counterclockwise rotation, so we need to convert
                if (page.rotation !== 0) {
                  const rotationDegrees = (360 - page.rotation) % 360;
                  copiedPage.setRotation(degrees(rotationDegrees));
                }
                
                // Add the page to the new PDF
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
            // It's from the original PDF
            const originalIndex = page.originalIndex - 1; // Convert to 0-based index
            
            try {
              // Copy the page from the original PDF
              const [copiedPage] = await newPdfDoc.copyPages(originalPdfDoc, [originalIndex]);
              
              // Apply rotation if needed
              if (page.rotation !== 0) {
                // PDF-lib uses counterclockwise rotation, our UI uses clockwise
                const rotationDegrees = (360 - page.rotation) % 360;
                copiedPage.setRotation(degrees(rotationDegrees));
              }
              
              // Add the page to the new PDF
              newPdfDoc.addPage(copiedPage);
            } catch (copyError) {
              console.error(`Error copying page ${originalIndex} from original PDF:`, copyError);
              await createBlankPage(newPdfDoc);
            }
          }
          
          processedCount++;
        } catch (error) {
          console.error(`Error processing page ${i + 1}:`, error);
          // Continue with other pages even if one fails
        }
      }
      
      // Step 3: Generate the final PDF bytes
      setProgress(80);
      const newPdfBytes = await newPdfDoc.save();
      setProgress(85);
      
      // Create a Blob from the PDF bytes
      const newPdfBlob = new Blob([newPdfBytes], { type: 'application/pdf' });
      
      // Create a File object from the Blob
      const newPdfFile = new File(
        [newPdfBlob], 
        file.name.replace(/\.pdf$/i, '_organized.pdf'), 
        { type: 'application/pdf' }
      );
      
      // Step 4: Send the processed PDF to the backend
      const formData = new FormData();
      formData.append('pdf_file', newPdfFile);
      formData.append('is_frontend_processed', 'true');
      
      // Call the API to save the organized PDF
      const result = await organizePDF(
        formData,
        (progressValue) => {
          // Map the upload progress from 85-100%
          setProgress(85 + Math.floor(progressValue * 0.15));
        }
      );
      
      // Store the result properly formatted for DownloadSection
      setOrganizationResult({
        files: [result.file] // Make sure the result has a files array with the file object
      });
      
      // Scroll to results section after processing is complete
      setTimeout(() => {
        if (resultSectionRef.current) {
          resultSectionRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 500);
      
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
    // Add .pdf extension if missing
    const finalFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    downloadOrganizedPdf(fileId, finalFileName);
  };

  // Open PDF preview
  const handleOpenPreview = async (fileId, fileName) => {
    if (organizationResult) {
      try {
        setIsProcessing(true);
        
        // Get the download URL
        const downloadUrl = getOrganizedPdfDownloadUrl(fileId);
        
        // Fetch the PDF data
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        // Get the PDF data as a blob
        const pdfBlob = await response.blob();
        
        // Create an object URL from the blob
        const objectUrl = URL.createObjectURL(pdfBlob);
        
        // Open the preview modal
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
      
      {/* Password Modal for Added Files */}
      {addedFilePasswordModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-semibold mb-4">PDF Password Required</h3>
            <p className="text-gray-600 mb-4">
              {addedFilePasswordModal.fileName} is password protected.
              Please enter the password to continue.
            </p>

            {addedFilePasswordModal.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {addedFilePasswordModal.error}
              </div>
            )}

            <form onSubmit={handleAddedFilePasswordSubmit}>
              <div className="mb-4">
                <label htmlFor="added-pdf-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="added-pdf-password"
                  type="password"
                  value={addedFilePasswordModal.password || ''}
                  onChange={(e) => setAddedFilePasswordModal(prev => ({ 
                    ...prev, 
                    password: e.target.value, 
                    error: '' 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter PDF password"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setAddedFilePasswordModal({
                      isOpen: false,
                      fileId: null,
                      fileName: '',
                      password: '',
                      error: '',
                      callback: null
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-[#DA1F10] rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Unlock PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Password Modal */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-semibold mb-4">PDF Password Required</h3>
            <p className="text-gray-600 mb-4">
              {file ? file.name : 'This PDF'} is password protected.
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
                    setPasswordModal({ isOpen: false, password: '', error: '' });
                    setFile(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-[#DA1F10] rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Unlock PDF
                </button>
              </div>
            </form>
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

      {file && (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left column (PDF Pages) */}
          <div className="w-full md:w-3/4">
            {/* File header with controls */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">
                Selected File ({file.name})
              </h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleReset}
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
                <button
                  onClick={handleSelectFiles}
                  className="text-blue-600 cursor-pointer hover:text-blue-800 font-medium flex items-center text-sm"
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
                    Select Another File
                  </button>
                </div>
              </div>
  
              {/* Drag and drop zone */}
              <div 
                className="w-full border-2 border-dashed rounded-lg mb-6 p-4 text-center drop-zone border-gray-200 bg-gray-50 transition-all duration-200 hover:border-blue-300"
                onDragOver={(e) => {
                  // Only handle drag over if not dragging a page
                  if (draggedPage === null) {
                    e.preventDefault();
                  }
                }}
                onDrop={(e) => {
                  // Only handle drop if not dragging a page
                  if (draggedPage === null) {
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
                  Drag and drop more PDFs here
                </p>
              </div>
  
              {pdfPages.length > 0 && (
                <>
                  {/* PDF Pages header with sort options */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
                      </svg>
                      <h3 className="text-lg font-medium">Sort Pages:</h3>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={sortPagesAscending}
                        className="px-3 py-2 border cursor-pointer border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center"
                      >
                        <span className="mr-1">1→</span> Ascending
                      </button>
                      <button
                        onClick={sortPagesDescending}
                        className="px-3 py-2 border cursor-pointer border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center"
                      >
                        <span className="mr-1">←1</span> Descending
                      </button>
                    </div>
                  </div>
                  
                  {/* IMPROVED: PDF Pages container with better scroll config */}
                  <div 
                    ref={pagesContainerRef}
                    className="max-h-[600px] overflow-y-auto p-2 mb-6 border border-gray-200 rounded-lg"
                  >
                    <div className="pdf-pages-container grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {pdfPages.map((page, index) => (
                        <div
                          key={index}
                          className={`pdf-page-item border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200 relative`}
                          onMouseMove={(e) => handleMouseMove(e, index)}
                          onMouseLeave={handleMouseLeave}
                        >                        
                          {/* Page Preview */}
                          <div 
                            className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden relative cursor-pointer"
                            style={{ 
                              transform: `rotate(${page.rotation}deg)`,
                              transition: 'transform 0.3s ease'
                            }}
                            onClick={() => handleOpenEnlargedPreview(page.dataUrl, index)}
                          >
                            <img
                              src={page.dataUrl}
                              alt={`Page ${index + 1}`}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          
                          {/* Eye Button for Enlarged Preview */}
                          <button
                            onClick={() => handleOpenEnlargedPreview(page.dataUrl, index)}
                            className="absolute top-2 left-2 bg-gray-800 bg-opacity-70 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-opacity-100 transition-colors z-10"
                            title="View full page"
                          >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                          </button>
                          
                          {/* Delete & Rotate Button Group */}
                          <div className="absolute top-2 right-2 flex space-x-1 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                rotatePage(index);
                              }}
                              className="bg-gray-800 cursor-pointer bg-opacity-70 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-opacity-100 transition-colors"
                              title="Rotate page"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePage(index);
                              }}
                              className="bg-red-600 cursor-pointer bg-opacity-70 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-opacity-100 transition-colors"
                              title="Delete page"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                                        addBlankPageBefore(index);
                                      }}
                                      className="bg-gray-100 cursor-pointer rounded-full w-8 h-8 flex items-center justify-center text-[#DA1F10] hover:bg-blue-50 transition-colors"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                      </svg>
                                    </button>
                                  </CustomSidePanelTooltip>
                                  <CustomSidePanelTooltip text="Add file before" position="left">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addFileBeforePage(index);
                                      }}
                                      className="bg-gray-100 cursor-pointer rounded-full w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                                        addBlankPageAfter(index);
                                      }}
                                      className="bg-gray-100 cursor-pointer rounded-full w-8 h-8 flex items-center justify-center text-[#DA1F10] hover:bg-blue-50 transition-colors"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                      </svg>
                                    </button>
                                  </CustomSidePanelTooltip>
                                  <CustomSidePanelTooltip text="Add file after" position="right">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addFileAfterPage(index);
                                      }}
                                      className="bg-gray-100 cursor-pointer rounded-full w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Right column (Organize Settings) */}
            <div className="w-full md:w-1/4">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm sticky top-4">
                <h3 className="font-medium text-lg mb-4">Organize Settings</h3>
                
                {/* Organize Button */}
                <button
                  onClick={createOrganizedPDF}
                  className="w-full bg-[#DA1F10] hover:bg-red-700 text-white font-medium cursor-pointer py-4 rounded-xl transition-colors duration-200 shadow-md mb-4"
                  disabled={pdfPages.length === 0}
                >
                  Organize PDF
                  <span className="text-xs block mt-1">
                    Est. Processing time: {estimatedUploadTime < 60
                      ? `${estimatedUploadTime} seconds`
                      : `${Math.floor(estimatedUploadTime / 60)} min ${estimatedUploadTime % 60} sec`}
                  </span>
                </button>
                
                {/* File Information */}
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-medium mb-2">File Information</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Number of pages:</span>
                      <span className="font-semibold">{pdfPages.length}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total size:</span>
                      <span className="font-semibold">{formatFileSize(pdfSize)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size limit:</span>
                      <span className="font-semibold">100 MB</span>
                    </div>
                  </div>
                </div>
            
                
                {/* Start Over */}
                <button
                  onClick={handleReset}
                  className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium cursor-pointer py-3 rounded-xl transition-colors duration-200"
                >
                  Start Over with New File
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Results Section */}
        {organizationResult && (
          <div ref={resultSectionRef} className="mt-10">
            <DownloadSection
              files={organizationResult.files || []}
              downloadHandler={handleDownload}
              previewHandler={handleOpenPreview}
              title="Download Organized PDF"
              color="red"
              startOverHandler={handleReset}
            />
          </div>
        )}
        
        {/* Add an element to show drop position with an animated line */}
        <div 
          id="drag-indicator"
          className="fixed h-4 bg-blue-500 transition-all duration-200 opacity-0 pointer-events-none z-50 rounded-full"
          style={{
            top: 0,
            left: 0,
            width: 0,
            opacity: 0,
            transform: 'scaleX(0.5)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        />
        
        {/* Optional: Add an overlay div for document-wide drag and drop that doesn't interfere with page dragging */}
        <div 
          id="drag-overlay" 
          className="fixed inset-0 bg-[#DA1F10] bg-opacity-10 pointer-events-none z-50 opacity-0 transition-opacity duration-300"
          style={{ display: draggedPage !== null ? 'none' : 'block' }}
        />
        
        {/* Add custom CSS for animations */}
        <style jsx global>{`
          .sortable-ghost {
            opacity: 0.5;
            background: #c8ebfb;
          }
          
          .sortable-chosen {
            opacity: 0.8;
            transform: scale(1.02);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          }
          
          .sortable-drag {
            opacity: 1 !important;
            transform: rotate(2deg) scale(1.02);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10;
          }
          
          /* Animation for smoother drag and drop */
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .pdf-page-item {
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          
          .pdf-page-item.dragging {
            opacity: 0.7;
            transform: rotate(2deg) scale(1.02);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10;
          }
          
          /* Improve hover effects */
          .pdf-page-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          }
            .pdf-page-item {
  cursor: grab;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.pdf-page-item:active {
  cursor: grabbing;
}

.pdf-page-item.dragging {
  opacity: 0.7;
  transform: rotate(2deg) scale(1.05);
  box-shadow: 0 15px 35px rgba(0,0,0,0.25);
  z-index: 100;
}

.sortable-ghost {
  opacity: 0.4;
  background: #e3f2fd;
  border: 2px dashed #2196f3;
}

/* Improve the drag indicator for more noticeable feedback */
#drag-indicator {
  height: 6px;
  background: #2196f3;
  box-shadow: 0 0 8px rgba(33, 150, 243, 0.6);
}
        `}</style>
      </div>
    );
  };
  
  export default PDFOrganizer;

  const DragHandle = () => (
    <div className="absolute top-0 left-0 right-0 h-6 bg-gray-100 flex items-center justify-center cursor-grab active:cursor-grabbing z-10 rounded-t-lg">
      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
      </svg>
    </div>
  );