"use client"

import { useState, useRef, useEffect } from 'react';
import { convertImagesToPDF, prepareImageToPdfFormData, getDownloadUrl, downloadFile, formatFileSize, estimateOutputSize, isValidImage } from '../../api/imgtopdf_api';
import ModalLoader from '../tools_utility/ModalLoader';
import PDFPreviewModal from '../tools_utility/PDFPreviewModal.';
import DownloadSection from '../tools_utility/DownloadSection';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Define the orientation options with SVG icons
const orientationOptions = [
  { 
    value: 'portrait', 
    label: 'Portrait', 
    description: 'Vertical orientation',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="3" width="12" height="18" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M9 8h6M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  { 
    value: 'landscape', 
    label: 'Landscape', 
    description: 'Lanscape orientation',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="6" width="18" height="12" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M8 9v6M12 9v6M16 9v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
];

// Define the compression quality options with SVG icons
const compressionOptions = [
  { 
    value: 'lossless', 
    label: 'Lossless', 
    description: 'Best quality',
    icon: (
      <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    )
  },
  { 
    value: 'medium', 
    label: 'Medium', 
    description: 'Good balance',
    icon: (
      <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    )
  },
  { 
    value: 'low', 
    label: 'Low', 
    description: 'Smaller size',
    icon: (
      <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 12l-5-5L4 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    )
  },
];

// Define the margin options with SVG icons
const marginOptions = [
  { 
    value: 'none', 
    label: 'None', 
    description: '0mm margins',
    icon: (
      <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
        <rect x="3" y="3" width="18" height="18" rx="1" fill="currentColor" fillOpacity="0.1"/>
      </svg>
    )
  },
  { 
    value: 'low', 
    label: 'Small', 
    description: '5mm margins',
    icon: (
      <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
        <rect x="5" y="5" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
        <rect x="5" y="5" width="14" height="14" rx="1" fill="currentColor" fillOpacity="0.1"/>
      </svg>
    )
  },
  { 
    value: 'high', 
    label: 'Large', 
    description: '10mm margins',
    icon: (
      <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
        <rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
        <rect x="7" y="7" width="10" height="10" rx="1" fill="currentColor" fillOpacity="0.1"/>
      </svg>
    )
  },
];

// Draggable Image Item Component
const DraggableImage = ({ image, index, moveImage, rotateImage, removeImage, orientation, margin }) => {
  const ref = useRef(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'IMAGE',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: 'IMAGE',
    hover: (item, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Move the content
      moveImage(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });
  
  // Initialize drag and drop refs
  drag(drop(ref));
  
  // Get rotation for this image
  const rotation = image.rotation || 0;
  
  // Define margin styles based on margin setting
  const marginStyles = {
    'none': '0px',
    'low': '8px',
    'high': '16px'
  };
  
  // Define orientation styles
  const previewContainerStyles = orientation === 'landscape' 
    ? { width: '160px', height: '113px' } // 16:9 aspect ratio for landscape
    : { width: '113px', height: '160px' }; // 9:16 aspect ratio for portrait
  
  // Apply margin to the inner preview
  const innerPreviewStyles = {
    margin: marginStyles[margin],
    height: `calc(100% - ${2 * parseInt(marginStyles[margin])}px)`,
    width: `calc(100% - ${2 * parseInt(marginStyles[margin])}px)`,
  };
  
  return (
    <div 
      ref={ref} 
      className={`relative rounded-lg overflow-hidden border-2 ${isDragging ? 'opacity-50 border-blue-400' : 'border-gray-200'} transition-all duration-200 bg-white shadow-sm flex flex-col h-[220px]`}
    >
      <div className="bg-gray-50 p-2 border-b border-gray-200 flex justify-between items-center">
        <span className="text-sm font-medium truncate max-w-[100px]" title={image.file.name}>
          {image.file.name}
        </span>
        <div className="flex space-x-1">
          <button 
            onClick={() => rotateImage(index, (rotation + 90) % 360)}
            className="p-1 hover:bg-gray-200 rounded-full"
            title="Rotate"
          >
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
          <button 
            onClick={() => removeImage(index)}
            className="p-1 hover:bg-gray-200 rounded-full"
            title="Remove"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-2 bg-gray-100">
        {/* Show preview of page with margins and orientation */}
        <div className="bg-white shadow-sm rounded-sm flex items-center justify-center" style={previewContainerStyles}>
          <div 
            className="bg-gray-50 flex items-center justify-center overflow-hidden"
            style={innerPreviewStyles}
          >
            <div 
              className="w-full h-full flex items-center justify-center overflow-hidden"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <img 
                src={image.preview} 
                alt={`Preview ${index + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 p-2 border-t border-gray-200 flex justify-between items-center">
        <span className="text-xs text-gray-500">
          {formatFileSize(image.file.size)}
        </span>
        <span className="text-xs text-gray-500">
          {rotation > 0 ? `Rotated ${rotation}°` : 'No rotation'}
        </span>
      </div>
      <div className="absolute left-2 top-9 flex justify-center items-center bg-gray-800 bg-opacity-70 text-white rounded-full w-7 h-7 text-xs font-bold">
        {index + 1}
      </div>
    </div>
  );
};

const ImageToPdfConverter = () => {
  // File input ref
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  
  // State variables
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const resultSectionRef = useRef(null);
  
  // Auto-scroll state and refs
  const [autoScrollActive, setAutoScrollActive] = useState(false);
  const [autoScrollDirection, setAutoScrollDirection] = useState(null);
  const autoScrollInterval = useRef(null);
  
  // Auto-scroll settings
  const AUTO_SCROLL_THRESHOLD = 100; // px from edge
  const AUTO_SCROLL_SPEED = 30; // px per interval
  
  // State for options
  const [orientation, setOrientation] = useState('portrait');
  const [compressionQuality, setCompressionQuality] = useState('lossless');
  const [margin, setMargin] = useState('none');
  const [separatePdfs, setSeparatePdfs] = useState(false);
  
  // State for preview modal
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    pdfUrl: null,
    fileName: ''
  });
  
  // File size limit (in bytes)
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB per image
  const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100 MB total
  const MAX_FILES = 20; // Maximum number of files
  
  // Calculate total file size
  const totalFileSize = images.reduce((total, img) => total + img.file.size, 0);
  
  // Calculate estimated upload time based on file size (rough estimate)
  // Using 400 KB/s as estimation base for average connection
  const estimatedUploadTime = Math.ceil(totalFileSize / (400 * 1024));
  
  // Estimated output size
  const outputEstimate = estimateOutputSize(totalFileSize, compressionQuality);
  
  // Scroll to results section when operation completes
  useEffect(() => {
    if (result && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);
  
  // Handle auto-scrolling for drag operations
  useEffect(() => {
    if (autoScrollActive && autoScrollDirection && containerRef.current) {
      if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
      
      autoScrollInterval.current = setInterval(() => {
        if (containerRef.current) {
          if (autoScrollDirection === 'up') {
            containerRef.current.scrollTop -= AUTO_SCROLL_SPEED;
          } else if (autoScrollDirection === 'down') {
            containerRef.current.scrollTop += AUTO_SCROLL_SPEED;
          }
        }
      }, 16); // ~60fps
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
  
  const validateImageFile = (file) => {
    // Check if it's a valid image type (JPG, JPEG, PNG)
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      return `"${file.name}" is not a supported image format. Only JPG, JPEG, and PNG files are supported.`;
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" exceeds the 20 MB file size limit per image.`;
    }
    
    return null; // No error
  };
  
  // Handle files selection
  const handleFilesSelected = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    // Check if adding these files would exceed the max count
    if (images.length + selectedFiles.length > MAX_FILES) {
      setError(`You can only upload up to ${MAX_FILES} images at once.`);
      return;
    }
    
    // Calculate new total size
    const newTotalSize = totalFileSize + selectedFiles.reduce((size, file) => size + file.size, 0);
    if (newTotalSize > MAX_TOTAL_SIZE) {
      setError(`Total file size exceeds the 100 MB limit.`);
      return;
    }
    
    // Validate files
    const invalidFiles = [];
    const validFiles = [];
    
    for (const file of selectedFiles) {
      const error = validateImageFile(file);
      if (error) {
        invalidFiles.push({ file, error });
      } else {
        validFiles.push(file);
      }
    }
    
    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      setError(`${invalidFiles.length} file(s) were rejected: ${invalidFiles.map(f => f.error).join('; ')}`);
    }
    
    // Process valid files
    if (validFiles.length > 0) {
      // Create image objects with previews
      const newImages = validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        rotation: 0
      }));
      
      setImages([...images, ...newImages]);
      setResult(null); // Clear previous result
    }
  };
  
  // Reset to initial state
  const handleReset = () => {
    // Revoke object URLs to avoid memory leaks
    images.forEach(image => {
      if (image.preview) URL.revokeObjectURL(image.preview);
    });
    
    setImages([]);
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    setResult(null);
    setOrientation('portrait');
    setCompressionQuality('lossless');
    setMargin('none');
    setSeparatePdfs(false);
  };
  
  // Move image (change position)
  const moveImage = (fromIndex, toIndex) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    setImages(updatedImages);
  };
  
  // Rotate image
  const rotateImage = (index, newRotation) => {
    const updatedImages = [...images];
    updatedImages[index] = {
      ...updatedImages[index],
      rotation: newRotation
    };
    setImages(updatedImages);
  };
  
  // Remove image
  const removeImage = (index) => {
    const updatedImages = [...images];
    // Revoke the object URL
    if (updatedImages[index].preview) {
      URL.revokeObjectURL(updatedImages[index].preview);
    }
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };
  
  // Handle drag over for auto-scrolling
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    // Check for auto-scrolling if we have a container reference
    if (containerRef.current) {
      const container = containerRef.current;
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
      setAutoScrollActive(false);
      setAutoScrollDirection(null);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setAutoScrollActive(false);
    setAutoScrollDirection(null);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFilesSelected(droppedFiles);
  };
  
  const handleConvertToPdf = async () => {
    if (images.length === 0) {
      setError("Please select at least one image.");
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      // Prepare rotations object
      const rotations = {};
      images.forEach((image, index) => {
        if (image.rotation !== 0) {
          rotations[index] = image.rotation;
        }
      });
      
      // Create FormData
      const formData = prepareImageToPdfFormData(
        images.map(img => img.file),
        {
          pageOrientation: orientation,
          compressionQuality,
          pageMargins: margin,
          separatePdfs,
          rotations
        }
      );
      
      // Call the API
      const result = await convertImagesToPDF(
        formData,
        (progressValue) => setProgress(progressValue)
      );
      
      setResult(result);
      console.log(result);
      
      
    } catch (error) {
      console.error('Conversion failed:', error);
      setError(error.message || 'Failed to convert images to PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
// Fix for handleDownload function
const handleDownload = (fileId, fileName) => {
  // Log the result for debugging
  console.log("Download result:", result);
  
  // Use file_id from the API response, fallback to passed fileId if not available
  const idToUse = result?.file_id || fileId;
  console.log("Using file ID:", idToUse);
  
  // Check if download_url contains 'download-zip' to determine the file type
  // This is more reliable than checking separate_pdfs
  const isZip = result?.download_url?.includes('download-zip');
  const fileType = isZip ? 'zip' : 'pdf';
  console.log("Determined file type:", fileType);
  
  // Ensure the filename has the correct extension
  const extension = fileType === 'zip' ? '.zip' : '.pdf';
  const finalFileName = fileName.toLowerCase().endsWith(extension) 
    ? fileName 
    : `${fileName}${extension}`;
  console.log("Final filename:", finalFileName);
  
  // Get download URL and download the file
  const downloadUrl = getDownloadUrl(idToUse, fileType, finalFileName);
  console.log("Download URL:", downloadUrl);
  
  downloadFile(downloadUrl, finalFileName);
};

// Fix for handleDownloadZip function
const handleDownloadZip = (zipName) => {
  console.log("handleDownloadZip called with zipName:", zipName);
  
  // Make sure zipName has .zip extension
  const finalZipName = zipName.toLowerCase().endsWith('.zip') ? zipName : `${zipName}.zip`;
  console.log("Final ZIP name:", finalZipName);

  if (result) {
    console.log("Result available:", result);
    
    // Get the file_id from the result
    const fileId = result.file_id;
    
    if (fileId) {
      // Important: explicitly force 'zip' as the file type here
      const url = getDownloadUrl(fileId, 'zip', finalZipName);
      console.log("ZIP download URL:", url);
      downloadFile(url, finalZipName);
    } else {
      console.error("No file_id found in the result");
      console.log("Result object:", result);
    }
  } else {
    console.error("Result is not available");
  }
};
  
  const handleOpenPreview = async () => {
    if (result && !separatePdfs) {
      try {
        setIsProcessing(true);
        
        // Get the download URL
        const downloadUrl = getDownloadUrl(result.file_id, 'pdf');
        
        // Fetch the PDF data
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        // Get the PDF data as a blob
        const pdfBlob = await response.blob();
        
        // Create an object URL from the blob
        const objectUrl = URL.createObjectURL(pdfBlob);
        
        // Open the preview modal with the object URL
        setPreviewModal({
          isOpen: true,
          pdfUrl: objectUrl,
          fileName: 'Converted Images.pdf'
        });
      } catch (error) {
        console.error('Error preparing PDF preview:', error);
        setError('Unable to preview the PDF. Please try downloading instead.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      setError('Preview is not available for ZIP files containing multiple PDFs.');
    }
  };
  
  // Function to close the PDF preview modal
  const handleClosePreview = () => {
    if (previewModal.pdfUrl) {
      URL.revokeObjectURL(previewModal.pdfUrl);
    }
    
    setPreviewModal({
      isOpen: false,
      pdfUrl: null,
      fileName: ''
    });
  };
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full max-w-7xl mx-auto mb-8">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/jpg,image/png"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFilesSelected(Array.from(e.target.files));
            }
            // Reset the input value to allow selecting the same file again
            e.target.value = null;
          }}
          multiple
        />
        
        {/* Modal Loader */}
        <ModalLoader
          isVisible={isProcessing}
          progress={progress}
          estimatedTime={estimatedUploadTime}
          text={"Converting images to PDF..."}
        />
        
        {/* PDF Preview Modal */}
        <PDFPreviewModal
          isOpen={previewModal.isOpen}
          onClose={handleClosePreview}
          pdfUrl={previewModal.pdfUrl}
          fileName={previewModal.fileName}
        />
        
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl mt-4 font-bold mb-2">
            <span className="text-[#DA1F10]">Image </span> to PDF
          </h1>
          <p className="text-gray-600">Convert your images to PDF documents with customizable options</p>
          <p className="text-sm text-gray-500 mt-2">Support for JPG, JPEG, PNG • Max 20 images • 20 MB per image • 100 MB total</p>
        </div>
        
        {/* Content with Sidebar Layout */}
        <div className="flex flex-col justify-center md:flex-row gap-6">
          {/* Main Content Area */}
          <div className="w-full md:w-3/4">
            {/* Upload Area - Only show if no files uploaded yet */}
            {images.length === 0 && !result && (
              <SelectFiles 
                onFilesSelected={handleFilesSelected}
                onError={setError}
                buttonText="Select Images"
                buttonColor="red"
                buttonSize="large"
                multiple={true}
                acceptedFileTypes=".png, .jpeg, .jpg"
                maxSingleFileSize={20 * 1024 * 1024}
                maxTotalFilesSize={100 * 1024 * 1024}
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
            
            {/* Images Preview and Ordering */}
            {images.length > 0 && (
              <div className="w-full">
                {/* Files Header */}
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-lg font-medium">Images ({images.length})</h2>
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
                      Remove All
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
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
                      Add More Images
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
                    Drag and drop more images here or{' '}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      browse
                    </button>
                  </p>
                </div>
                
                {/* Settings Section - MOVED UP and MADE MORE COMPACT */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
                  <h3 className="text-lg font-medium mb-4">PDF Settings</h3>
                  
                  {/* More compact settings layout with flex */}
                  <div className="flex flex-wrap -mx-2">
                    {/* Page Orientation Selection */}
                    <div className="w-full md:w-1/2 px-2 mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page Orientation
                      </label>
                      <div className="flex gap-2">
                        {orientationOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setOrientation(option.value)}
                            className={`
                              flex-1 flex flex-col items-center justify-center cursor-pointer py-2 px-1 border 
                              ${orientation === option.value ? 'border-[#DA1F10] bg-red-50' : 'border-gray-300 bg-white'} 
                              rounded-md shadow-sm text-sm font-medium 
                              ${orientation === option.value ? 'text-[#DA1F10]' : 'text-gray-700'} 
                              hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#DA1F10]
                            `}
                          >
                            {option.icon}
                            <div>{option.label}</div>
                            <div className="text-xs mt-1 text-gray-500">{option.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Compression Quality */}
                    <div className="w-full md:w-1/2 px-2 mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compression Quality
                      </label>
                      <div className="flex gap-2">
                        {compressionOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setCompressionQuality(option.value)}
                            className={`
                              flex-1 flex flex-col items-center justify-center cursor-pointer py-2 px-1 border 
                              ${compressionQuality === option.value ? 'border-[#DA1F10] bg-red-50' : 'border-gray-300 bg-white'} 
                              rounded-md shadow-sm text-sm font-medium 
                              ${compressionQuality === option.value ? 'text-[#DA1F10]' : 'text-gray-700'} 
                              hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#DA1F10]
                            `}
                          >
                            {option.icon}
                            <div>{option.label}</div>
                            <div className="text-xs mt-1 text-gray-500">{option.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Page Margins */}
                    <div className="w-full px-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page Margins
                      </label>
                      <div className="flex gap-2">
                        {marginOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setMargin(option.value)}
                            className={`
                              flex-1 flex flex-col items-center justify-center cursor-pointer py-2 px-3 border 
                              ${margin === option.value ? 'border-[#DA1F10] bg-red-50' : 'border-gray-300 bg-white'} 
                              rounded-md shadow-sm text-sm font-medium 
                              ${margin === option.value ? 'text-[#DA1F10]' : 'text-gray-700'} 
                              hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#DA1F10]
                            `}
                          >
                            {option.icon}
                            <div>{option.label}</div>
                            <div className="text-xs mt-1 text-gray-500">{option.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
               

                {/* Image Preview Grid with Drag and Drop and Auto-Scroll */}
                <div className="mb-8">
                  <div className="bg-blue-50 p-4 mb-4 rounded-lg border border-blue-200">
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div>
                        <p className="text-blue-800 font-medium">Drag & Drop to Reorder</p>
                        <p className="text-sm text-blue-700 mt-1">
                          The order of images determines their position in the PDF. Drag images to rearrange them.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Auto-scrolling container for images */}
                  <div 
                    ref={containerRef}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[600px] pr-2"
                    style={{ scrollBehavior: 'smooth' }}
                    onDragOver={handleDragOver}
                  >
                    {images.map((image, index) => (
                      <DraggableImage 
                        key={`${image.file.name}-${index}`}
                        image={image}
                        index={index}
                        moveImage={moveImage}
                        rotateImage={rotateImage}
                        removeImage={removeImage}
                        orientation={orientation}
                        margin={margin}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Results Section */}
            {result && (
              <div ref={resultSectionRef}>
                <DownloadSection
                  files={[{
                    id: result.job_id,
                    name: separatePdfs 
                      ? 'converted_images.zip' 
                      : 'converted_images.pdf',
                    size: result.output_size
                  }]}
                  downloadHandler={handleDownload}
                  previewHandler={!separatePdfs ? handleOpenPreview : null}
                  zipDownloadHandler={separatePdfs ? handleDownloadZip : null}
                  title={`Download ${separatePdfs ? 'ZIP Archive' : 'PDF'}`}
                  color="red"
                  startOverHandler={handleReset}
                />
              </div>
            )}
          </div>
          
          {/* Sidebar - Only show when files are uploaded and no result yet */}
          {images.length > 0 && (
            <div className="w-full md:w-1/4 md:sticky md:top-24 h-fit">
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
                <h3 className="font-medium text-lg mb-4">Conversion Details</h3>
                
                {/* File Info */}
                <div className="mb-6 border-b border-gray-200 pb-4">
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex justify-between">
                      <span>Images:</span>
                      <span className="font-medium">{images.length}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Total size:</span>
                      <span className="font-medium">{formatFileSize(totalFileSize)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Est. output size:</span>
                      <span className="font-medium">{formatFileSize(outputEstimate.estimatedSize)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Est. reduction:</span>
                      <span className={`font-medium ${outputEstimate.reductionPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {outputEstimate.reductionPercentage > 0 ? '-' : '+'}
                        {Math.abs(outputEstimate.reductionPercentage)}%
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Orientation:</span>
                      <span className="font-medium">
                        {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
                      </span>
                    </li>
                  </ul>
                </div>
                
                {/* Output Format - MOVED TO SIDEBAR */}
                <div className="mb-6 border-b border-gray-200 pb-4">
                  <label className="block text-xl font-medium text-gray-700 mb-2">
                    Output Format
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="separate-pdfs"
                      checked={separatePdfs}
                      onChange={(e) => setSeparatePdfs(e.target.checked)}
                      className="h-8 w-8 cursor-pointer text-[#DA1F10] focus:ring-[#DA1F10] border-gray-300 rounded"
                    />
                    <label htmlFor="separate-pdfs" className="ml-2 block text-md text-gray-700">
                      Create separate PDF for each image (outputs as ZIP file)
                    </label>
                  </div>
                </div>
                
                {/* Convert Button */}
                <button
                  onClick={handleConvertToPdf}
                  className="w-full cursor-pointer py-3 px-4 bg-[#DA1F10] hover:bg-[#C10007] text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DA1F10] mb-4"
                >
                  Convert to PDF
                </button>
                
                {/* Estimated time info */}
                {images.length > 0 && estimatedUploadTime > 0 && (
                  <p className="text-xs text-gray-500 text-center mb-6">
                    Est. processing time: {estimatedUploadTime < 60
                      ? `${estimatedUploadTime} seconds`
                      : `${Math.floor(estimatedUploadTime / 60)} min ${estimatedUploadTime % 60} sec`}
                  </p>
                )}
                
                {/* Tips Section */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Helpful Tips</h4>
                  <ul className="text-sm text-gray-600 space-y-3">
                    <li className="flex">
                      <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span><strong>Drag and drop</strong> to change the image order</span>
                    </li>
                    <li className="flex">
                      <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>Use <strong>rotate button</strong> to fix image orientation</span>
                    </li>
                    <li className="flex">
                      <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>Choose <strong>landscape</strong> for wide images</span>
                    </li>
                    <li className="flex">
                      <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>Lower <strong>compression</strong> for smaller files</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default ImageToPdfConverter;


const SelectFiles = ({ 
  onFilesSelected, 
  maxSingleFileSize = 100 * 1024 * 1024, // 100 MB
  maxTotalFilesSize = 200 * 1024 * 1024, // 200 MB
  acceptedFileTypes = ".jpg, .jpeg, .png",
  multiple = true,
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
 // Validate files before adding them
const validateAndAddFiles = (newFiles) => {
    // Reset error
    onError(null);
  
    // Create a mapping of MIME types to extensions for validation
    const mimeTypeMap = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/jpg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    };
    
    // Get accepted extensions from the acceptedFileTypes string
    const acceptedExtensions = acceptedFileTypes
      .split(',')
      .map(ext => ext.trim().toLowerCase());
  
    // Filter for accepted file types
    const validTypeFiles = newFiles.filter(file => {
      // Get the accepted extensions for this MIME type
      const validExtensionsForType = mimeTypeMap[file.type] || [];
      
      // Check if any of the valid extensions for this MIME type are in our accepted list
      const isValidType = validExtensionsForType.some(ext => 
        acceptedExtensions.includes(ext)
      );
      
      if (!isValidType) {
        onError(`"${file.name}" is not a valid file type. Only ${acceptedFileTypes} files are supported.`);
        return false;
      }
      return true;
    });
  
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
