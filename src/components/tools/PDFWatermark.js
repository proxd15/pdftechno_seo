"use client"

import { useState, useRef, useEffect } from 'react';
import { 
    addTextWatermark, 
    addImageWatermark, 
    getWatermarkDownloadUrl, 
    downloadWatermarkedFile, 
    isValidPDF, 
    isValidImage,
    // Add these new imports for client-side processing
    addTextWatermarkClientSide,
    addImageWatermarkClientSide
  } from '../../api/watermark_api';
import ModalLoader from '../tools_utility/ModalLoader';
import PDFPreviewModal from '../tools_utility/PDFPreviewModal.';
import SelectFiles from '../tools_utility/SelectFiles';
import DownloadSection from '../tools_utility/DownloadSection';
import PDFPreviewWithWatermark from '../tools_utility/PDFPreviewWithWatermark';

const positionOptions = [
  { value: 'top-left', label: 'Top Left', icon: '↖️' },
  { value: 'top-center', label: 'Top Center', icon: '⬆️' },
  { value: 'top-right', label: 'Top Right', icon: '↗️' },
  { value: 'mid-left', label: 'Middle Left', icon: '⬅️' },
  { value: 'mid-center', label: 'Center', icon: '⏺️' },
  { value: 'mid-right', label: 'Middle Right', icon: '➡️' },
  { value: 'bottom-left', label: 'Bottom Left', icon: '↙️' },
  { value: 'bottom-center', label: 'Bottom Center', icon: '⬇️' },
  { value: 'bottom-right', label: 'Bottom Right', icon: '↘️' },
];

const fontOptions = [
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times-Roman', label: 'Times Roman' },
  { value: 'Courier', label: 'Courier' },
];

const PDFWatermark = () => {
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  
  // State variables
  const [file, setFile] = useState(null);
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [watermarkImagePreview, setWatermarkImagePreview] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pageImages, setPageImages] = useState([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const resultSectionRef = useRef(null);
  
  // State for watermark type
  const [watermarkType, setWatermarkType] = useState('text');
  
  // State for common options
  const [position, setPosition] = useState('mid-center');
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(0);
  const [fromPage, setFromPage] = useState(1);
  const [toPage, setToPage] = useState('');
  const [isMosaic, setIsMosaic] = useState(false);
  
  // State for text watermark options
  const [watermarkText, setWatermarkText] = useState('PDF Techno');
  const [fontSize, setFontSize] = useState(40);
  const [fontStyle, setFontStyle] = useState('Helvetica');
  const [fontColor, setFontColor] = useState('#FF0000');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  
  // State for image watermark options
  const [imageSize, setImageSize] = useState(30);
  
  // State for password
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    error: '',
    password: ''
  });
  
  // State for preview modal
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    pdfUrl: null,
    fileName: ''
  });
  
  // File size limit (in bytes)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
  
  // Calculate estimated upload time based on file size (rough estimate)
  // Using 400 KB/s as estimation base for average connection
  const estimatedUploadTime = file ? Math.ceil(file.size / (400 * 1024)) : 0;
  
  // Scroll to results section when operation completes
  useEffect(() => {
    if (result && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);
  
  // Validate inputs when they change
  useEffect(() => {
    // Validate start page
    if (pageCount > 0 && fromPage) {
      const startPageNum = parseInt(fromPage, 10);
      if (startPageNum < 1) {
        setFromPage(1);
      } else if (startPageNum > pageCount) {
        setFromPage(pageCount);
      }
    }
    
    // Validate end page
    if (pageCount > 0 && toPage) {
      const endPageNum = parseInt(toPage, 10);
      if (endPageNum < 1) {
        setToPage(1);
      } else if (endPageNum > pageCount) {
        setToPage(pageCount);
      }
    }
    
    // Validate opacity
    if (opacity < 0.1) setOpacity(0.1);
    if (opacity > 1) setOpacity(1);
    
    // Validate rotation
    if (rotation < 0) setRotation(0);
    if (rotation > 359) setRotation(359);
    
    // Validate image size
    if (imageSize < 1) setImageSize(1);
    if (imageSize > 100) setImageSize(100);
  }, [fromPage, toPage, opacity, rotation, imageSize, pageCount]);
  
  // Handle image preview when watermark image changes
  useEffect(() => {
    if (watermarkImage) {
      const objectUrl = URL.createObjectURL(watermarkImage);
      setWatermarkImagePreview(objectUrl);
      
      // Clean up the URL when the component unmounts
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [watermarkImage]);
  
  // Render all PDF pages for preview
  const renderAllPDFPages = async (pdf, password = null) => {
    setIsLoadingPages(true);
    const totalPages = pdf.numPages;
    const pageArray = [];
    
    try {
      // Only render the first page as requested
      const page = await pdf.getPage(1);
      
      // Use fixed dimensions for preview
      const maxWidth = 400;
      const maxHeight = 600;
      
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
      
      // Store the page image
      pageArray.push({
        index: 1,
        image: canvas.toDataURL('image/jpeg', 0.85),
        width: canvas.width,
        height: canvas.height
      });
      
      setPageImages(pageArray);
    } catch (error) {
      console.error('Error rendering PDF pages:', error);
      setError("Failed to render PDF page. The file may be corrupted.");
    } finally {
      setIsLoadingPages(false);
    }
  };
  
  // Generate preview whenever file changes
  useEffect(() => {
    const generatePreview = async () => {
      if (!file || !window.pdfjsLib) return;
      
      try {
        // Use a promise with timeout to prevent hanging on problematic files
        const arrayBuffer = await Promise.race([
          file.arrayBuffer(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Preview generation timed out')), 8000)
          )
        ]);
        
        try {
          // Attempt to load the PDF (will fail if password protected)
          const loadingTask = window.pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
            cMapPacked: true
          });
          
          const pdf = await loadingTask.promise;
          setPageCount(pdf.numPages);
          setToPage(pdf.numPages.toString());
          setPdfDocument(pdf);
          
          // Render first page for preview
          await renderAllPDFPages(pdf);
          
          setIsEncrypted(false);
          setError(null);
          
        } catch (error) {
          console.error('Error generating preview:', error);
          
          // Check if the PDF is password protected
          if (
            error.name === 'PasswordException' || 
            error.message.includes('password') || 
            error.message.includes('Password')
          ) {
            setIsEncrypted(true);
            setError("The PDF is password protected. Please enter the password to continue.");
            
            // Show password modal immediately
            setPasswordModal({
              isOpen: true,
              error: '',
              password: ''
            });
          } else {
            setPageImages([]);
            setError("The PDF file is corrupted or invalid. Please try a different file.");
          }
        }
      } catch (error) {
        console.error('General error processing file:', error);
        setPageImages([]);
        setError("This is not a valid PDF file. Please try a different file.");
      }
    };
    
    if (file) {
      generatePreview();
    }
  }, [file]);
  
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
    
    try {
      setIsProcessing(true);
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Attempt to load the PDF with the password
      const loadingTask = window.pdfjsLib.getDocument({
        data: arrayBuffer,
        password: password
      });
      
      const pdf = await loadingTask.promise;
      setPageCount(pdf.numPages);
      setToPage(pdf.numPages.toString());
      setPdfDocument(pdf);
      
      // Render first page for preview
      await renderAllPDFPages(pdf, password);
      
      // Store the password and set state
      setIsEncrypted(true);
      setIsDecrypted(true);
      
      // Close the modal
      setPasswordModal({
        isOpen: false,
        error: '',
        password: ''
      });
      
      // Clear error
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
  
  const handleFilesSelected = (selectedFiles) => {
    if (selectedFiles && selectedFiles.length > 0) {
      // Take only the first file
      const newFile = selectedFiles[0];
      if (validateFile(newFile)) {
        setFile(newFile);
      }
    }
  };
  
  const handleImageSelected = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedImage = e.target.files[0];
      if (validateImage(selectedImage)) {
        setWatermarkImage(selectedImage);
      }
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = null;
  };
  
  // Reset to initial state
  const handleReset = () => {
    setFile(null);
    setWatermarkImage(null);
    setWatermarkImagePreview(null);
    setPdfDocument(null);
    setPageImages([]);
    setIsLoadingPages(false);
    setPageCount(0);
    setIsEncrypted(false);
    setIsDecrypted(false);
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    setResult(null);
    
    // Reset to default values
    setWatermarkType('text');
    setPosition('mid-center');
    setOpacity(0.5);
    setRotation(0);
    setFromPage(1);
    setToPage('');
    setIsMosaic(false);
    
    setWatermarkText('PDF Techno');
    setFontSize(40);
    setFontStyle('Helvetica');
    setFontColor('#FF0000');
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    
    setImageSize(30);
  };
  
  // Validate files before adding them
  const validateFile = (newFile) => {
    // Reset error
    setError(null);
    
    if (!isValidPDF(newFile)) {
      setError(`"${newFile.name}" is not a valid PDF file. Only PDF files are supported.`);
      return false;
    }
    
    // Check file size
    if (newFile.size > MAX_FILE_SIZE) {
      setError(`"${newFile.name}" exceeds the 100 MB file size limit.`);
      return false;
    }
    
    return true;
  };
  
  // Validate watermark image
  const validateImage = (imageFile) => {
    // Reset error
    setError(null);
    
    if (!isValidImage(imageFile)) {
      setError(`"${imageFile.name}" is not a valid image file. Supported formats: JPEG, PNG, GIF, SVG, WebP.`);
      return false;
    }
    
    // Check file size (limit to 10MB for images)
    if (imageFile.size > 10 * 1024 * 1024) {
      setError(`"${imageFile.name}" exceeds the 10 MB image size limit.`);
      return false;
    }
    
    return true;
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
    if (droppedFiles.length > 0 && validateFile(droppedFiles[0])) {
      setFile(droppedFiles[0]);
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = null;
  };
  
  // Replace the existing handleApplyWatermark function in PDFWatermark.jsx with this implementation

const handleApplyWatermark = async () => {
    if (!file) return;
    
    // Validate input
    const endPageNum = parseInt(toPage || pageCount, 10);
    const startPageNum = parseInt(fromPage, 10) || 1;
    
    if (startPageNum < 1) {
      setError("Start page must be a positive number.");
      return;
    }
    
    if (endPageNum < startPageNum) {
      setError("End page must be greater than or equal to start page.");
      return;
    }
    
    if (startPageNum > pageCount) {
      setError(`Start page cannot be greater than the total page count (${pageCount}).`);
      return;
    }
    
    if (endPageNum > pageCount) {
      setError(`End page cannot be greater than the total page count (${pageCount}).`);
      return;
    }
    
    if (isEncrypted && !isDecrypted) {
      setError("Please unlock the PDF with a password first.");
      setPasswordModal({
        isOpen: true,
        error: '',
        password: ''
      });
      return;
    }
    
    // Validate watermark type specific requirements
    if (watermarkType === 'text' && !watermarkText.trim()) {
      setError("Watermark text cannot be empty.");
      return;
    }
    
    if (watermarkType === 'image' && !watermarkImage) {
      setError("Please select an image for the watermark.");
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      let result;
      
      if (watermarkType === 'text') {
        // Set up options for text watermark
        const options = {
          text: watermarkText,
          fontSize: fontSize,
          fontStyle: fontStyle,
          color: fontColor,
          opacity: opacity,
          rotation: rotation,
          position: position,
          fromPage: startPageNum,
          toPage: endPageNum,
          isBold: isBold,
          isItalic: isItalic,
          isUnderline: isUnderline,
          isMosaic: isMosaic
        };
        
        // Add password if the PDF is encrypted
        if (isEncrypted && isDecrypted) {
          options.password = passwordModal.password;
        }
        
        // Use client-side watermarking if available and enabled
        if (typeof addTextWatermarkClientSide === 'function' && !options.password) {
          // Client-side processing doesn't handle password-protected PDFs well
          result = await addTextWatermarkClientSide(file, options, (progressValue) => setProgress(progressValue));
        } else {
          // Fall back to server-side processing
          result = await addTextWatermark(file, options, (progressValue) => setProgress(progressValue));
        }
      } else {
        // Image watermark
        const options = {
          imageSize: imageSize,
          opacity: opacity,
          rotation: rotation,
          position: position,
          fromPage: startPageNum,
          toPage: endPageNum,
          isMosaic: isMosaic
        };
        
        // Add password if the PDF is encrypted
        if (isEncrypted && isDecrypted) {
          options.password = passwordModal.password;
        }
        
        // Use client-side watermarking if available and enabled
        if (typeof addImageWatermarkClientSide === 'function' && !options.password) {
          // Client-side processing doesn't handle password-protected PDFs well
          result = await addImageWatermarkClientSide(file, watermarkImage, options, (progressValue) => setProgress(progressValue));
        } else {
          // Fall back to server-side processing
          result = await addImageWatermark(file, watermarkImage, options, (progressValue) => setProgress(progressValue));
        }
      }
      
      setResult(result);
      
    } catch (error) {
      console.error('Watermarking failed:', error);
      setError(error.message || 'Failed to add watermark. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handlePositionClick = (newPosition) => {
    setPosition(newPosition);
  };
  
  const handleNumberChange = (e, setter, min = null, max = null) => {
    const value = e.target.value;
    const numberValue = parseInt(value, 10);
    
    if (value === '') {
      setter('');
    } else if (isNaN(numberValue)) {
      // Don't update if not a number
      return;
    } else {
      // Check bounds if provided
      if (min !== null && numberValue < min) {
        setter(min);
      } else if (max !== null && numberValue > max) {
        setter(max);
      } else {
        setter(numberValue);
      }
    }
  };
  console.log("Font style being passed:", fontStyle);
  const handleFloatChange = (e, setter, min = null, max = null) => {
    const value = e.target.value;
    const floatValue = parseFloat(value);
    
    if (value === '') {
      setter('');
    } else if (isNaN(floatValue)) {
      // Don't update if not a number
      return;
    } else {
      // Check bounds if provided
      if (min !== null && floatValue < min) {
        setter(min);
      } else if (max !== null && floatValue > max) {
        setter(max);
      } else {
        setter(floatValue);
      }
    }
  };
  
 // Replace the existing handleDownload function in PDFWatermark.jsx with this version
  
 const handleDownload = (fileId, fileName) => {
    // Ensure the filename has .pdf extension
    const finalFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    
    // In PDFWatermark.jsx, we should use the file_id for download
    // This is important: use the file_id from the result when it's available
    const idToUse = result?.file_id || fileId;
    
    // Use the downloadWatermarkedFile function directly
    downloadWatermarkedFile(idToUse, finalFileName);
  };

  const handleOpenPreview = async () => {
    if (result) {
      try {
        setIsProcessing(true);
        
        // Get the download URL
        const downloadUrl = getWatermarkDownloadUrl(result.file_id);
        
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
          fileName: 'Watermarked Document.pdf'
        });
      } catch (error) {
        console.error('Error preparing PDF preview:', error);
        setError('Unable to preview the PDF. Please try downloading instead.');
      } finally {
        setIsProcessing(false);
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
  
  // Format file size in a readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  // Generate a preview of what the text watermark will look like
const renderTextWatermarkPreview = () => {
  // Get the preview container dimensions (you may need to adjust these)
  const previewWidth = 400; // Adjust based on your preview container
  const previewHeight = 350; // Adjust based on your preview container
  
  // Define CENTER coordinates in pixels where rotation will occur
  const absoluteCenterPositions = {
    'top-left': { x: 80, y: 80 },
    'top-center': { x: previewWidth / 2, y: 80 },
    'top-right': { x: previewWidth - 80, y: 80 },
    'mid-left': { x: 80, y: previewHeight / 2 },
    'mid-center': { x: previewWidth / 2, y: previewHeight / 2 },
    'mid-right': { x: previewWidth - 80, y: previewHeight / 2 },
    'bottom-left': { x: 80, y: previewHeight - 80 },
    'bottom-center': { x: previewWidth / 2, y: previewHeight - 80 },
    'bottom-right': { x: previewWidth - 80, y: previewHeight - 80 }
  };
  
  const centerPos = absoluteCenterPositions[position];
  
  console.log(`Text preview: Absolute center at (${centerPos.x}, ${centerPos.y}), rotation: ${rotation}°`);
  
  // Determine font styling
  let fontWeight = isBold ? 'bold' : 'normal';
  let fontStyleValue = isItalic ? 'italic' : 'normal';
  
  return (
    <div 
      style={{
        position: 'absolute',
        // Position the element's CENTER at the target coordinates
        left: `${centerPos.x}px`,
        top: `${centerPos.y}px`,
        // Transform: first center the element, then rotate it
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        fontSize: `${fontSize}px`,
        color: fontColor,
        fontFamily: fontStyle === 'Times-Roman' ? 'Times New Roman, serif' : 
                   fontStyle === 'Courier' ? 'Courier, monospace' : 
                   'Helvetica, Arial, sans-serif',
        fontWeight,
        fontStyle: fontStyleValue,
        textDecoration: isUnderline ? `underline ${fontColor}` : 'none',
        textDecorationThickness: `${Math.max(1, fontSize * 0.05)}px`,
        textUnderlineOffset: `${fontSize * 0.1}px`,
        opacity: opacity,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        // Debug border (remove in production)
        // border: '2px solid red',
        // backgroundColor: 'rgba(255, 255, 0, 0.2)',
        zIndex: 10
      }}
    >
      {watermarkText}
    </div>
  );
};
  
  // Generate a preview of what the image watermark will look like
const renderImageWatermarkPreview = () => {
  if (!watermarkImagePreview) return null;
  
  // Get the preview container dimensions
  const previewWidth = 400;
  const previewHeight = 350;
  
  // Define CENTER coordinates in pixels where rotation will occur
  const absoluteCenterPositions = {
    'top-left': { x: 80, y: 80 },
    'top-center': { x: previewWidth / 2, y: 80 },
    'top-right': { x: previewWidth - 80, y: 80 },
    'mid-left': { x: 80, y: previewHeight / 2 },
    'mid-center': { x: previewWidth / 2, y: previewHeight / 2 },
    'mid-right': { x: previewWidth - 80, y: previewHeight / 2 },
    'bottom-left': { x: 80, y: previewHeight - 80 },
    'bottom-center': { x: previewWidth / 2, y: previewHeight - 80 },
    'bottom-right': { x: previewWidth - 80, y: previewHeight - 80 }
  };
  
  const centerPos = absoluteCenterPositions[position];
  
  console.log(`Image preview: Absolute center at (${centerPos.x}, ${centerPos.y}), rotation: ${rotation}°`);
  
  // For mosaic pattern
  if (isMosaic) {
    return (
      <>
        {Object.entries(absoluteCenterPositions).map(([posKey, pos], index) => (
          <img
            key={index}
            src={watermarkImagePreview}
            alt={`Watermark ${posKey}`}
            style={{
              position: 'absolute',
              // Position the image's CENTER at the target coordinates
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              // Transform: first center the image, then rotate it
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              maxWidth: `${imageSize}%`,
              maxHeight: `${imageSize}%`,
              opacity: opacity,
              pointerEvents: 'none',
              display: 'block',
              // Debug border (remove in production)
              // border: '2px solid blue',
              // backgroundColor: 'rgba(0, 255, 255, 0.2)',
              zIndex: 10
            }}
          />
        ))}
      </>
    );
  }
  
  // Single watermark
  return (
    <img
      src={watermarkImagePreview}
      alt="Watermark"
      style={{
        position: 'absolute',
        // Position the image's CENTER at the target coordinates
        left: `${centerPos.x}px`,
        top: `${centerPos.y}px`,
        // Transform: first center the image, then rotate it
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        maxWidth: `${imageSize}%`,
        maxHeight: `${imageSize}%`,
        opacity: opacity,
        pointerEvents: 'none',
        display: 'block',
        // Debug border (remove in production)
        // border: '2px solid blue',
        // backgroundColor: 'rgba(0, 255, 255, 0.2)',
        zIndex: 10
      }}
    />
  );
};
  
  // Display page range information
  const renderPageRangeInfo = () => {
    if (!file || pageCount === 0) return null;
    
    const startPageNum = parseInt(fromPage, 10) || 1;
    const endPageNum = parseInt(toPage, 10) || pageCount;
    
    return (
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <p className="font-medium text-blue-800">Selected Page Range:</p>
            <p className="text-blue-700 mt-1">
              Pages {startPageNum} to {endPageNum} will be watermarked.
            </p>
            <p className="text-blue-700 mt-1">
              Total: {endPageNum - startPageNum + 1} pages will be watermarked.
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="application/pdf"
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={imageInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageSelected}
      />
      
      {/* Modal Loader */}
      <ModalLoader
        isVisible={isProcessing}
        progress={progress}
        estimatedTime={estimatedUploadTime}
        text={"Adding watermark..."}
      />
      
      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={previewModal.isOpen}
        onClose={handleClosePreview}
        pdfUrl={previewModal.pdfUrl}
        fileName={previewModal.fileName}
      />
      
      {/* Password Modal */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-semibold mb-4">PDF Password Required</h3>
            <p className="text-gray-600 mb-4">
              {file?.name} is password protected.
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
                      error: '',
                      password: ''
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
          <span className="text-[#DA1F10]">Add </span> Watermark to PDF
        </h1>
        <p className="text-gray-600">Add text or image watermarks to your PDF documents</p>
        <p className="text-sm text-gray-500 mt-2">Max file size: 100 MB</p>
      </div>
      
      {/* Content with Sidebar Layout */}
      <div className="flex flex-col justify-center md:flex-row gap-6">
        {/* Main Content Area */}
        <div className="w-full md:w-3/4">
          {/* Upload Area - Only show if no file uploaded yet */}
          {!file && !result && (
            <SelectFiles 
              onFilesSelected={handleFilesSelected}
              onError={setError}
              buttonText="Select PDF File"
              buttonColor="red"
              buttonSize="large"
              multiple={false}
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
          
          {/* File Preview and Options */}
          {file && (
            <div className="w-full">
              {/* File Header */}
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-lg font-medium">PDF File: {file.name}</h2>
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
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Change File
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
                  Drag and drop a different PDF here
                </p>
              </div>

              <div className='flex gap-4'>
                {/* PDF Preview with Watermark */}
                

{/* PDF Preview with Watermark - Sticky when scrolling */}
<div className="mb-8 w-1/3 sticky top-6" style={{ height: 'fit-content', maxHeight: '90vh', overflowY: 'auto' }}>
<PDFPreviewWithWatermark
    file={file}
    
    watermarkType={watermarkType}
    watermarkOptions={{
      text: watermarkText,
      fontSize: fontSize,
      fontColor: fontColor,
      fontStyle: fontStyle,
      opacity: opacity,
      rotation: rotation,
      position: position,
      isBold: isBold,
      isItalic: isItalic,
      isUnderline: isUnderline,
      isMosaic: isMosaic,
      imageSize: imageSize
    }}
    watermarkImage={watermarkImage}
    pdfDocument={pdfDocument}
    isPasswordProtected={isEncrypted}
    isDecrypted={isDecrypted}
  />
  
  {/* Page Range Information */}

  {renderPageRangeInfo()}
</div>
                
                {/* Settings Section */}
                <div className="w-2/3">
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
                    <h3 className="text-lg font-medium mb-4">Watermark Settings</h3>
                    
                    {/* Watermark Type Toggle */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Watermark Type
                      </label>
                      <div className="flex space-x-4">
                        <button 
                          type="button"
                          onClick={() => setWatermarkType('text')}
                          className={`flex-1 py-2 px-4 rounded-md text-center font-medium ${
                            watermarkType === 'text' 
                              ? 'bg-[#DA1F10] text-white' 
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Text Watermark
                        </button>
                        <button 
                          type="button"
                          onClick={() => setWatermarkType('image')}
                          className={`flex-1 py-2 px-4 rounded-md text-center font-medium ${
                            watermarkType === 'image' 
                              ? 'bg-[#DA1F10] text-white' 
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Image Watermark
                        </button>
                      </div>
                    </div>
                    
                    {/* Text Watermark Settings */}
                    {watermarkType === 'text' && (
                      <>
                        {/* Watermark Text */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Watermark Text
                          </label>
                          <input
                            type="text"
                            value={watermarkText}
                            onChange={(e) => setWatermarkText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#DA1F10] focus:border-[#DA1F10]"
                            placeholder="Enter watermark text"
                          />
                        </div>
                        
                        {/* Font and Size Settings */}
                        <div className="flex space-x-4 mb-6">
                          <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Font
                            </label>
                            <select
                              value={fontStyle}
                              onChange={(e) => setFontStyle(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#DA1F10] focus:border-[#DA1F10]"
                            >
                              {fontOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Font Size
                            </label>
                            <input
                              type="number"
                              value={fontSize}
                              onChange={(e) => handleNumberChange(e, setFontSize, 6, 144)}
                              min="6"
                              max="144"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#DA1F10] focus:border-[#DA1F10]"
                            />
                          </div>
                        </div>
                        
                        {/* Font Style Settings */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Font Style
                          </label>
                          <div className="flex space-x-4">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="font-bold"
                                checked={isBold}
                                onChange={() => setIsBold(!isBold)}
                                className="h-4 w-4 text-[#DA1F10] focus:ring-[#DA1F10] border-gray-300 rounded"
                              />
                              <label htmlFor="font-bold" className="ml-2 block text-sm text-gray-700">
                                Bold
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="font-italic"
                                checked={isItalic}
                                onChange={() => setIsItalic(!isItalic)}
                                className="h-4 w-4 text-[#DA1F10] focus:ring-[#DA1F10] border-gray-300 rounded"
                              />
                              <label htmlFor="font-italic" className="ml-2 block text-sm text-gray-700">
                                Italic
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="font-underline"
                                checked={isUnderline}
                                onChange={() => setIsUnderline(!isUnderline)}
                                className="h-4 w-4 text-[#DA1F10] focus:ring-[#DA1F10] border-gray-300 rounded"
                              />
                              <label htmlFor="font-underline" className="ml-2 block text-sm text-gray-700">
                                Underline
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        {/* Font Color */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Font Color
                          </label>
                          <div className="flex items-center">
                            <input
                              type="color"
                              value={fontColor}
                              onChange={(e) => setFontColor(e.target.value)}
                              className="h-10 w-10 mr-2 border-0 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={fontColor}
                              onChange={(e) => setFontColor(e.target.value)}
                              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#DA1F10] focus:border-[#DA1F10]"
                            />
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Image Watermark Settings */}
                    {watermarkType === 'image' && (
                      <>
                        {/* Image Upload */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Watermark Image
                          </label>
                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() => imageInputRef.current?.click()}
                              className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DA1F10]"
                            >
                              {watermarkImage ? 'Change Image' : 'Select Image'}
                            </button>
                            {watermarkImage && (
                              <span className="ml-3 text-sm text-gray-600">
                                {watermarkImage.name} ({formatFileSize(watermarkImage.size)})
                              </span>
                            )}
                          </div>
                          {watermarkImagePreview && (
                            <div className="mt-3 flex items-center">
                              <div className="h-16 w-16 rounded border border-gray-200 overflow-hidden mr-3">
                                <img 
                                  src={watermarkImagePreview} 
                                  alt="Watermark preview" 
                                  className="h-full w-full object-contain"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setWatermarkImage(null);
                                  setWatermarkImagePreview(null);
                                }}
                                className="text-sm text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Image Size */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Image Size (% of page width)
                          </label>
                          <div className="flex items-center">
                            <input
                              type="range"
                              min="1"
                              max="100"
                              value={imageSize}
                              onChange={(e) => setImageSize(parseInt(e.target.value, 10))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="ml-3 w-12 text-center text-sm font-medium text-gray-700">
                              {imageSize}%
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Common Settings for Both Types */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <h4 className="font-medium text-md mb-4">General Settings</h4>
                      
                      {/* Position Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Position
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {positionOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handlePositionClick(option.value)}
                              className={`
                                flex items-center cursor-pointer py-2 px-4 border ${position === option.value ? 'border-[#DA1F10] bg-red-50' : 'border-gray-300 bg-white'} 
                                rounded-md shadow-sm text-sm font-medium 
                                ${position === option.value ? 'text-[#DA1F10]' : 'text-gray-700'} 
                                hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DA1F10]
                              `}
                            >
                              <span className="mr-2 text-xl">{option.icon}</span>
                              <span className="hidden md:inline">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Opacity and Rotation */}
                      <div className="flex space-x-4 mb-6">
                        <div className="w-1/2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Opacity
                          </label>
                          <div className="flex items-center">
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.1"
                              value={opacity}
                              onChange={(e) => setOpacity(parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="ml-3 w-12 text-center text-sm font-medium text-gray-700">
                              {Math.round(opacity * 100)}%
                            </span>
                          </div>
                        </div>
                      <div className="w-1/2">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Rotation
  </label>
  <div className="grid grid-cols-4 gap-2">
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
      <button
        key={angle}
        type="button"
        onClick={() => setRotation(angle)}
        className={`
          px-3 py-2 text-sm font-medium rounded-md border transition-colors
          ${rotation === angle 
            ? 'bg-[#DA1F10] text-white border-[#DA1F10]' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }
        `}
      >
        {angle}°
      </button>
    ))}
  </div>
  <div className="mt-2 text-center">
    <span className="text-sm text-gray-600">Current: {rotation}°</span>
  </div>
</div>
                      </div>
                      
                      {/* Page Range */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Page Range
                        </label>
                        <div className="flex space-x-4">
                          <div className="w-1/2">
                            <label className="block text-xs text-gray-500 mb-1">
                              Start Page (min: 1)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={pageCount}
                              value={fromPage}
                              onChange={(e) => handleNumberChange(e, setFromPage, 1, pageCount)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#DA1F10] focus:border-[#DA1F10]"
                            />
                          </div>
                          <div className="w-1/2">
                            <label className="block text-xs text-gray-500 mb-1">
                              End Page (max: {pageCount})
                            </label>
                            <input
                              type="number"
                              min={fromPage || 1}
                              max={pageCount}
                              value={toPage}
                              onChange={(e) => handleNumberChange(e, setToPage, fromPage || 1, pageCount)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#DA1F10] focus:border-[#DA1F10]"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Mosaic Pattern Option */}
                      <div className="mb-6">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="mosaic-pattern"
                            checked={isMosaic}
                            onChange={() => setIsMosaic(!isMosaic)}
                            className="h-4 w-4 text-[#DA1F10] focus:ring-[#DA1F10] border-gray-300 rounded"
                          />
                          <label htmlFor="mosaic-pattern" className="ml-2 block text-sm text-gray-700">
                            Apply watermark in a mosaic pattern (repeated across the page)
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Results Section */}
          {result && (
   <div ref={resultSectionRef}>
   <DownloadSection
     files={[{
       id: result.file_id || result.job_id, // Prefer file_id if available, fall back to job_id
       name: file ? file.name.replace('.pdf', '_watermarked.pdf') : 'Watermarked Document.pdf',
       size: result.watermarked_size || result.output_size || 0
     }]}
     downloadHandler={handleDownload}
     previewHandler={handleOpenPreview}
     title="Download Watermarked PDF"
     color="red"
     startOverHandler={handleReset}
   />
 </div>
)}
        </div>
        
        {/* Sidebar - Only show when file is uploaded and no result yet */}
        {file && (
          <div className="w-full md:w-1/4 md:sticky md:top-24 h-fit">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
              <h3 className="font-medium text-lg mb-4">Document Details</h3>
              
              {/* File Info */}
              <div className="mb-6 border-b border-gray-200 pb-4">
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex justify-between">
                    <span>File name:</span>
                    <span className="font-medium truncate max-w-[130px]" title={file?.name}>{file?.name}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>File size:</span>
                    <span className="font-medium">{formatFileSize(file?.size || 0)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Page count:</span>
                    <span className="font-medium">{pageCount}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium">
                      {isEncrypted ? 
                        (isDecrypted ? "Unlocked" : "Password Protected") : 
                        "Ready"}
                    </span>
                  </li>
                </ul>
              </div>
              
              {
                /* Apply Watermark Button */}
              <button
                onClick={handleApplyWatermark}
                disabled={isEncrypted && !isDecrypted || (watermarkType === 'image' && !watermarkImage)}
                className={`w-full cursor-pointer py-3 px-4 ${
                  (isEncrypted && !isDecrypted) || (watermarkType === 'image' && !watermarkImage)
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#DA1F10] hover:bg-[#C10007]'
                  } text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DA1F10] mb-4`}
              >
                Apply Watermark
                {isEncrypted && !isDecrypted && (
                  <span className="block text-xs mt-1">
                    Please unlock the PDF first
                  </span>
                )}
                {watermarkType === 'image' && !watermarkImage && (
                  <span className="block text-xs mt-1">
                    Please select an image
                  </span>
                )}
              </button>
              
              {/* Estimated time info */}
              {file && estimatedUploadTime > 0 && (
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
                  {watermarkType === 'text' ? (
                    <>
                      <li className="flex">
                        <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Use <strong>diagonal rotation</strong> for better document security</span>
                      </li>
                      <li className="flex">
                        <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Adjust <strong>opacity</strong> to ensure text remains readable</span>
                      </li>
                      <li className="flex">
                        <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Try <strong>mosaic pattern</strong> for comprehensive coverage</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex">
                        <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Use <strong>PNG images</strong> with transparency for best results</span>
                      </li>
                      <li className="flex">
                        <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Set image size to <strong>20-30%</strong> for optimal visibility</span>
                      </li>
                      <li className="flex">
                        <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Lower <strong>opacity</strong> for logos to avoid obscuring content</span>
                      </li>
                    </>
                  )}
                  <li className="flex">
                    <svg className="w-5 h-5 text-[#DA1F10] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Use <strong>Page Range</strong> to skip cover pages or appendices</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFWatermark;