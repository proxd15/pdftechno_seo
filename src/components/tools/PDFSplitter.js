"use client"

import { useState, useRef, useEffect } from 'react';
import { splitPDF, getDownloadUrl, downloadFile, getPreviewUrl } from '../../api/split_api';
import ModalLoader from '../tools_utility/ModalLoader';
import PDFPreviewModal from '../tools_utility/PDFPreviewModal.';
import SelectFiles from '../tools_utility/SelectFiles';
import DownloadSection from '../tools_utility/DownloadSection';

const PDFSplitter = () => {
  // State for file and UI
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [pageInfo, setPageInfo] = useState(null); // Stores page count
  const [pagePreviews, setPagePreviews] = useState({}); // Stores previews for individual pages
  const [splitMode, setSplitMode] = useState('range'); // 'range' or 'extract'
  const [ranges, setRanges] = useState([{ from: 1, to: 1 }]); // For range mode
  const [selectedPages, setSelectedPages] = useState([]); // For extract mode
  const [mergeAllRanges, setMergeAllRanges] = useState(false); // Whether to merge all ranges into a single PDF
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [splitResult, setSplitResult] = useState(null);
  const fileInputRef = useRef(null);
  const resultSectionRef = useRef(null);
  const [rangeInputError, setRangeInputError] = useState(null);

  // States for encrypted file and password modal
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [decryptedFile, setDecryptedFile] = useState(null);
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    password: '',
    error: ''
  });

  // State for preview modal
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    pdfUrl: null,
    fileName: ''
  });

  // File size limits (in bytes)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

  // Calculate estimated upload time based on file size (rough estimate)
  // Using 400 KB/s as estimation base for average connection
  const estimatedUploadTime = file ? Math.ceil(file.size / (400 * 1024)) : 0;

  // Handle file preview
  const handlePreview = async (fileId, fileName) => {
    try {
      setIsProcessing(true);
      const pdfUrl = await getPreviewUrl(fileId);
      setPreviewModal({
        isOpen: true,
        pdfUrl,
        fileName
      });
    } catch (error) {
      console.error('Error preparing preview:', error);
      setError('Unable to preview the PDF. Please try downloading instead.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file download
// Handle file download
const handleDownload = (fileId, fileName) => {
    console.log("handleDownload called with:", fileId, fileName);
    
    // Determine the file type based on the filename
    const isZipFile = fileName.toLowerCase().endsWith('.zip');
    
    // Use the appropriate file type
    const fileType = isZipFile ? 'zip' : 'pdf';
    
    // Ensure correct extension
    let finalFileName = fileName;
    if (isZipFile && !finalFileName.toLowerCase().endsWith('.zip')) {
      finalFileName = `${finalFileName}.zip`;
    } else if (!isZipFile && !finalFileName.toLowerCase().endsWith('.pdf')) {
      finalFileName = `${finalFileName}.pdf`;
    }
    
    // Call the appropriate download function with the correct file type
    downloadFile(getDownloadUrl(fileId, fileType, finalFileName), finalFileName);
  };


const handleDownloadZip = (zipName) => {
  console.log("handleDownloadZip called with zipName:", zipName);
  
  // Make sure zipName has .zip extension
  const finalZipName = zipName.toLowerCase().endsWith('.zip') ? zipName : `${zipName}.zip`;
  console.log("Final ZIP name:", finalZipName);

  if (splitResult && splitResult.files && Array.isArray(splitResult.files)) {
    console.log("splitResult.files available:", splitResult.files.length);
    
    // Follow the same approach as PDFRotator:
    // Just use the first file as the ZIP file in multi-file case
    const zipFile = splitResult.files[0];
    console.log("zipFile selected:", zipFile);
    
    if (zipFile) {
      // Important: explicitly specify 'zip' as the file type
      const url = getDownloadUrl(zipFile.id, 'zip', finalZipName);
      console.log("ZIP download URL:", url);
      downloadFile(url, finalZipName);
    } else {
      console.error("No files found in the results");
    }
  } else {
    console.error("splitResult or splitResult.files is not available");
    console.log("splitResult:", splitResult);
  }
}
  // Handle selected file
  const handleFileSelected = (selectedFiles) => {
    // Take only the first file since this is for splitting a single PDF
    if (selectedFiles.length > 0) {
      const newFile = selectedFiles[0];
      setFile(newFile);
      // Reset other state when new file is selected
      setSplitResult(null);
      setRanges([{ from: 1, to: 1 }]);
      setSelectedPages([]);
      setError(null);
      setRangeInputError(null);
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

  // Scroll to results section when splitting completes
  useEffect(() => {
    if (splitResult && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [splitResult]);

  // Generate previews and get page count whenever file changes
  useEffect(() => {
    if (!file) return;

    const generatePreview = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();

        // Check if PDF is valid, encrypted, or corrupted
        try {
          // Use window.pdfjsLib which is loaded from CDN
          const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

          // Store page count
          const numPages = pdf.numPages;
          setPageInfo(numPages);

          // Initialize page ranges and selections
          if (numPages > 0) {
            // Set default range to all pages
            setRanges([{ from: 1, to: numPages }]);
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

          setPreview(canvas.toDataURL());

          // Generate previews for individual pages
          const newPagePreviews = {};

          // Load first 10 pages for preview
          const pagesToPreload = Math.min(10, numPages);

          for (let i = 1; i <= pagesToPreload; i++) {
            const pageObj = await pdf.getPage(i);
            const pageViewport = pageObj.getViewport({ scale: 0.3 }); // Smaller scale for thumbnails

            const pageCanvas = document.createElement('canvas');
            const pageContext = pageCanvas.getContext('2d');

            pageCanvas.height = pageViewport.height;
            pageCanvas.width = pageViewport.width;

            await pageObj.render({
              canvasContext: pageContext,
              viewport: pageViewport
            }).promise;

            newPagePreviews[i] = pageCanvas.toDataURL();
          }

          setPagePreviews(newPagePreviews);
          setIsEncrypted(false);

        } catch (error) {
          console.error('Error generating preview:', error);

          // Check for password-protected/encrypted PDF
          if (error.name === 'PasswordException' || error.message.includes('password')) {
            setPreview('encrypted');
            setError(`The PDF is password protected or encrypted. Please decrypt this file.`);
            setIsEncrypted(true);
            setPasswordModal({
              ...passwordModal,
              isOpen: true
            });
          } else {
            // Assume other errors are due to corruption
            setPreview('corrupted');
            setError(`The file is not a valid PDF or is corrupted. Please try another file.`);
          }
        }
      } catch (error) {
        console.error('General error processing file:', error);
        setPreview('invalid');
        setError(`The file is not a valid PDF. Please try another file.`);
      }
    };

    if (window.pdfjsLib && file) {
      generatePreview();
    }
  }, [file]);

  // Load additional page previews for selected ranges
  useEffect(() => {
    if (!file || !pageInfo) return;
    
    const loadRangePagePreviews = async () => {
      try {
        // Collect all page numbers from ranges or selected pages
        const pageNumbersToLoad = new Set();
        
        if (splitMode === 'range') {
          ranges.forEach(range => {
            // Always load the first and last page of each range
            pageNumbersToLoad.add(range.from);
            pageNumbersToLoad.add(range.to);
            
            // Add a few more pages within each range for context
            if (range.to - range.from > 2) {
              // Add middle page
              const middlePage = Math.floor((range.from + range.to) / 2);
              pageNumbersToLoad.add(middlePage);
            }
          });
        } else {
          // For extract mode, load all selected pages
          selectedPages.forEach(page => pageNumbersToLoad.add(page));
        }
        
        // Check which pages need to be loaded
        const pagesToLoad = Array.from(pageNumbersToLoad).filter(
          pageNum => !pagePreviews[pageNum] && pageNum >= 1 && pageNum <= pageInfo
        );
        
        if (pagesToLoad.length === 0) return;
        
        const arrayBuffer = await file.arrayBuffer();

        // Handle password if needed
        const loadingParams = { data: arrayBuffer };
        if (decryptedFile?.password) {
          loadingParams.password = decryptedFile.password;
        }

        const pdf = await window.pdfjsLib.getDocument(loadingParams).promise;
        
        // Create temp variable to avoid too many state updates
        const newPreviews = { ...pagePreviews };

        // Load each required page
        for (const pageNum of pagesToLoad) {
          try {
            const pageObj = await pdf.getPage(pageNum);
            const viewport = pageObj.getViewport({ scale: 0.3 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await pageObj.render({
              canvasContext: context,
              viewport: viewport
            }).promise;

            newPreviews[pageNum] = canvas.toDataURL();
          } catch (err) {
            console.error(`Error rendering page ${pageNum}:`, err);
          }
        }

        // Update state with new previews
        setPagePreviews(newPreviews);
      } catch (error) {
        console.error('Error loading range page previews:', error);
      }
    };

    loadRangePagePreviews();
  }, [file, pageInfo, ranges, selectedPages, splitMode]);

  // Load all page previews when in extract mode
  useEffect(() => {
    if (splitMode === 'extract' && file) {
      loadAllPagePreviews();
    }
  }, [splitMode, file, pageInfo]);

  // Load all page previews
  const loadAllPagePreviews = async () => {
    if (!file || !pageInfo) return;

    try {
      console.log('Loading all page previews...');

      // If we already have previews for all pages, skip
      if (Object.keys(pagePreviews).length >= pageInfo) {
        return;
      }

      const arrayBuffer = await file.arrayBuffer();

      // Handle password if needed
      const loadingParams = { data: arrayBuffer };
      if (decryptedFile?.password) {
        loadingParams.password = decryptedFile.password;
      }

      const pdf = await window.pdfjsLib.getDocument(loadingParams).promise;
      const numPages = pdf.numPages;

      // Create temp variable to avoid too many state updates
      const newPreviews = { ...pagePreviews };

      // Process pages in batches
      const batchSize = 5;
      const totalBatches = Math.ceil(numPages / batchSize);

      for (let batch = 0; batch < totalBatches; batch++) {
        const startPage = batch * batchSize + 1;
        const endPage = Math.min(startPage + batchSize - 1, numPages);

        for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
          // Skip if we already have this page
          if (newPreviews[pageNum]) continue;

          try {
            const pageObj = await pdf.getPage(pageNum);
            const viewport = pageObj.getViewport({ scale: 0.3 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await pageObj.render({
              canvasContext: context,
              viewport: viewport
            }).promise;

            newPreviews[pageNum] = canvas.toDataURL();
          } catch (err) {
            console.error(`Error rendering page ${pageNum}:`, err);
          }
        }

        // Update state after each batch
        setPagePreviews({ ...newPreviews });

        // Small delay to prevent UI freezing
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('Finished loading all page previews');
    } catch (error) {
      console.error('Error loading all page previews:', error);
    }
  };

  // Handle decryption for encrypted file
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

      // Password is correct if we reached here
      setIsEncrypted(false);

      // Store the decrypted file information
      setDecryptedFile({
        file,
        password
      });

      // Store page count
      const numPages = pdf.numPages;
      setPageInfo(numPages);

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
      setPreview(canvas.toDataURL());

      // Set default range to all pages
      setRanges([{ from: 1, to: numPages }]);

      // Load page previews
      const newPagePreviews = {};

      // Load first 10 pages initially
      const pagesToLoad = Math.min(10, numPages);
      for (let i = 1; i <= pagesToLoad; i++) {
        const pageObj = await pdf.getPage(i);
        const pageViewport = pageObj.getViewport({ scale: 0.3 });

        const pageCanvas = document.createElement('canvas');
        const pageContext = pageCanvas.getContext('2d');

        pageCanvas.height = pageViewport.height;
        pageCanvas.width = pageViewport.width;

        await pageObj.render({
          canvasContext: pageContext,
          viewport: pageViewport
        }).promise;

        newPagePreviews[i] = pageCanvas.toDataURL();
      }

      setPagePreviews(newPagePreviews);

      // Close the modal
      setPasswordModal({ isOpen: false, password: '', error: '' });

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

  // Set up document-wide drag and drop
  useEffect(() => {
    // Get the drag overlay element
    const dragOverlay = document.getElementById('drag-overlay');

    // Add dragover event listener to the entire document
    const handleDocumentDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      // Show the drag overlay
      if (dragOverlay) {
        dragOverlay.style.opacity = '1';
      }
    };

    // Add dragleave event listener to the entire document
    const handleDocumentDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Only set isDragging to false if we're leaving the document
      if (!e.relatedTarget || e.relatedTarget.nodeName === 'HTML') {
        setIsDragging(false);

        // Hide the drag overlay
        if (dragOverlay) {
          dragOverlay.style.opacity = '0';
        }
      }
    };

    // Add drop event listener to the entire document
    const handleDocumentDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      // Hide the drag overlay
      if (dragOverlay) {
        dragOverlay.style.opacity = '0';
      }

      // Only add file if the drop didn't happen on a specific drop zone
      const isInsideDropZone = e.target.closest('.drop-zone');
      if (!isInsideDropZone) {
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFileWithValidation(droppedFiles);
      }
    };

    // Register the event listeners
    document.addEventListener('dragover', handleDocumentDragOver);
    document.addEventListener('dragleave', handleDocumentDragLeave);
    document.addEventListener('drop', handleDocumentDrop);

    // Clean up on component unmount
    return () => {
      document.removeEventListener('dragover', handleDocumentDragOver);
      document.removeEventListener('dragleave', handleDocumentDragLeave);
      document.removeEventListener('drop', handleDocumentDrop);
    };
  }, []);

  // Validate file before adding it
  const addFileWithValidation = (newFiles) => {
    // Reset error
    setError(null);

    // Take only the first file
    if (newFiles.length === 0) return;
    
    const newFile = newFiles[0];

    // Check file type
    if (newFile.type !== 'application/pdf') {
      setError(`Only PDF files are supported.`);
      return;
    }

    // Check file size
    if (newFile.size > MAX_FILE_SIZE) {
      setError(`The file exceeds the 100 MB size limit.`);
      return;
    }

    // Set the new file and reset other state
    setFile(newFile);
    setSplitResult(null);
    setRanges([{ from: 1, to: 1 }]);
    setSelectedPages([]);
    setRangeInputError(null);
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
    addFileWithValidation(droppedFiles);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      addFileWithValidation(selectedFiles);
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = null;
  };

  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setPageInfo(null);
    setPagePreviews({});
    setSplitResult(null);
    setRanges([{ from: 1, to: 1 }]);
    setSelectedPages([]);
    setError(null);
    setIsEncrypted(false);
    setDecryptedFile(null);
    setRangeInputError(null);
  };

  // Reset to initial state
  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setPageInfo(null);
    setPagePreviews({});
    setRanges([{ from: 1, to: 1 }]);
    setSelectedPages([]);
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    setSplitResult(null);
    setIsEncrypted(false);
    setDecryptedFile(null);
    setRangeInputError(null);
  };

  // Add a new range in range mode
  const addRange = () => {
    setRanges([...ranges, { from: 1, to: pageInfo || 1 }]);
    setRangeInputError(null);
  };

  // Remove a range in range mode
  const removeRange = (index) => {
    const newRanges = [...ranges];
    newRanges.splice(index, 1);
    setRanges(newRanges);
    setRangeInputError(null);
  };

  // Fix for input deletion issue - handle range input changes properly with validation
  const handleRangeInputChange = (index, field, value) => {
    // Allow empty string for clearing the input field
    if (value === '') {
      const newRanges = [...ranges];
      newRanges[index] = { ...newRanges[index], [field]: '' };
      setRanges(newRanges);
      return;
    }

    // Only allow digits
    if (!/^\d+$/.test(value)) {
      return;
    }

    // Convert to number
    const numValue = parseInt(value, 10);
    
    // Validate the value against page count
    if (pageInfo) {
      if (numValue < 1) {
        setRangeInputError(`Page numbers must be at least 1`);
        return;
      }
      if (numValue > pageInfo) {
        setRangeInputError(`Page numbers cannot exceed ${pageInfo}`);
        return;
      }
    }

    // Update range value
    const newRanges = [...ranges];
    newRanges[index] = { ...newRanges[index], [field]: numValue };
    
    // Ensure 'to' is not less than 'from'
    if (field === 'from' && numValue > newRanges[index].to) {
      newRanges[index].to = numValue;
    }
    
    setRanges(newRanges);
    setRangeInputError(null);
  };

  // Validate range values on blur
  const handleRangeInputBlur = (index, field) => {
    const newRanges = [...ranges];
    const range = newRanges[index];
    
    // If field is empty, default to min or max value
    if (range[field] === '') {
      if (field === 'from') {
        newRanges[index].from = 1;
      } else if (field === 'to') {
        newRanges[index].to = pageInfo || 1;
      }
    } else {
      // Ensure from/to values are valid
      let value = parseInt(range[field], 10);
      
      // Cap at minimum of 1
      if (value < 1) {
        value = 1;
        setRangeInputError(null);
      }
      
      // Cap at maximum of pageInfo
      if (pageInfo && value > pageInfo) {
        value = pageInfo;
        setRangeInputError(null);
      }
      
      // Ensure 'to' is not less than 'from'
      if (field === 'from' && value > range.to) {
        newRanges[index].to = value;
      } else if (field === 'to' && value < range.from) {
        newRanges[index].from = value;
      }
      
      newRanges[index][field] = value;
    }
    
    setRanges(newRanges);
  };

  // Toggle selection of a page in extract mode
  const togglePageSelection = (pageNum) => {
    setSelectedPages(prev => {
      if (prev.includes(pageNum)) {
        // Remove page if already selected
        return prev.filter(p => p !== pageNum);
      } else {
        // Add page if not selected
        return [...prev, pageNum].sort((a, b) => a - b);
      }
    });
  };

  // Format file size in a readable format
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Check if a page is within any range
  const isPageInRanges = (pageNum) => {
    return ranges.some(range => 
      range.from <= pageNum && pageNum <= range.to
    );
  };

  // Handle PDF splitting
  const handleSplitPDF = async () => {
    if (!file) return;

    // Validate inputs based on split mode
    if (splitMode === 'range' && ranges.length === 0) {
      setError('Please add at least one range to split the PDF.');
      return;
    }

    if (splitMode === 'extract' && selectedPages.length === 0) {
      setError('Please select at least one page to extract.');
      return;
    }

    // Check for range input errors
    if (rangeInputError) {
      setError(rangeInputError);
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setSplitResult(null);

    try {
      // Create FormData to send file and split options
      const formData = new FormData();
      formData.append('pdf_file', file);

      // Add split options based on mode
      if (splitMode === 'range') {
        formData.append('ranges', JSON.stringify(ranges));
        formData.append('merge_all_ranges', mergeAllRanges.toString());
      } else {
        // For extract mode, send selected pages as array
        formData.append('ranges', JSON.stringify(selectedPages));
      }

      // Add password if the file is encrypted
      if (decryptedFile?.password) {
        formData.append('password', decryptedFile.password);
      }

      // Call the API to split PDF
      const result = await splitPDF(
        formData,
        (progressValue) => setProgress(progressValue)
      );

      setSplitResult(result);
    } catch (error) {
      console.error('Splitting failed:', error);
      setError(error.message || 'PDF splitting failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if the file has issues (corrupted, encrypted without password)
  const hasFileIssues = preview === 'corrupted' || preview === 'invalid' || 
    (isEncrypted && !decryptedFile);

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
        text={"Processing PDF..."}
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
        <div className="fixed inset-0 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-semibold mb-4">PDF Password Required</h3>
            <p className="text-gray-600 mb-4">
              The PDF is password protected.
              Please enter the password to continue.
            </p>

            {passwordModal.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {passwordModal.error}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div  className="mb-4">
                <label htmlFor="pdf-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="pdf-password"
                  type="password"
                  value={passwordModal.password || ''}
                  onChange={(e) => setPasswordModal(prev => ({ ...prev, password: e.target.value, error: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#DB1E10] focus:border-[#DB1E10]"
                  placeholder="Enter PDF password"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    removeFile();
                    setPasswordModal({ isOpen: false, password: '', error: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-[#DB1E10] rounded-lg hover:bg-[#DB1E10] transition-colors cursor-pointer"
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
          <span className="text-[#DB1E10]">Split</span> PDF
        </h1>
        <p className="text-gray-600 text-lg">Extract specific pages or page ranges from your PDF file</p>
        <p className="text-sm text-gray-500 mt-2">Max file size: 100 MB</p>
      </div>

      {/* Content with Sidebar Layout */}
      <div className="flex flex-col justify-center md:flex-row gap-6">
        {/* Main Content Area */}
        <div className="w-full md:w-3/4">
          {/* Upload Area - Only show if no file uploaded yet */}
          {!file && !splitResult && (
            <SelectFiles
              onFilesSelected={handleFileSelected}
              onError={setError}
              buttonText="Select PDF File"
              buttonColor="red"
              buttonSize="large"
              singleFile={true}
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

          {/* File with Preview */}
          {file && (
            <div className="w-full">
              {/* File Header */}
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Selected File</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={removeFile}
                    className="text-red-600 cursor-pointer hover:text-red-800 font-medium flex items-center text-base"
                  >
                    <svg
                      className="w-5 h-5 mr-1"
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
                    onClick={handleSelectFile}
                    className="text-blue-600 cursor-pointer hover:text-blue-800 font-medium flex items-center text-base"
                  >
                    <svg
                      className="w-5 h-5 mr-1"
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
                    Choose Different File
                  </button>
                </div>
              </div>

              {/* Drop Zone - Always active when showing file */}
              <div
                className={`w-full border-2 border-dashed rounded-lg mb-6 p-4 text-center drop-zone ${
                  isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
                } transition-all duration-200 hover:border-blue-300`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <p className="text-gray-500 text-base">
                  Drag and drop to replace with a different PDF
                </p>
              </div>

              {/* File Preview Card */}
              <div className={`border rounded-xl overflow-hidden ${
                hasFileIssues ? 'border-red-300 bg-red-50' : 'bg-white'
              } shadow-sm mb-6`}>
                <div className="px-4 py-3 bg-gray-50 flex justify-between items-center border-b">
                  <div>
                    <p className={`font-medium text-lg ${hasFileIssues ? 'text-red-600' : ''}`} title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-base text-gray-500">
                      {formatFileSize(file.size)} • {pageInfo || '?'} {pageInfo === 1 ? 'page' : 'pages'}
                    </p>
                  </div>
                </div>

                {/* PDF Preview */}
                <div className="p-6 flex flex-col sm:flex-row gap-6">
                  {/* File Thumbnail */}
                  <div className="flex-shrink-0 flex items-center justify-center w-full sm:w-48 h-64 bg-gray-100 rounded-lg">
                    {hasFileIssues ? (
                      <div className="text-red-500 flex flex-col items-center text-center">
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
                        <span className="font-medium text-base">
                          {isEncrypted ? "Password Protected PDF" : "Invalid or Corrupted PDF"}
                        </span>
                      </div>
                    ) : preview ? (
                      <img
                        src={preview}
                        alt={`Preview of ${file.name}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 animate-pulse">
                        <svg
                          className="w-12 h-12"
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
                      </div>
                    )}
                  </div>

                  {/* Split UI based on mode */}
                  {!hasFileIssues && (
                    <div className="flex-grow">
                      {/* Range-based Splitting UI */}
                      {splitMode === 'range' && (
                        <div>
                          <h3 className="font-semibold text-xl mb-4">Page Ranges to Extract</h3>
                          
                          {/* Range input validation error message */}
                          {rangeInputError && (
                            <div className="p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                              <div className="flex">
                                <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                                {rangeInputError}
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-6 mb-6">
                            {ranges.map((range, index) => (
                              <div key={index} className="flex flex-col space-y-4">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-lg font-medium">
                                    {index + 1}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-gray-600 text-lg font-medium">From</span>
                                    <input
                                      type="text"
                                      value={range.from}
                                      onChange={(e) => handleRangeInputChange(index, 'from', e.target.value)}
                                      onBlur={() => handleRangeInputBlur(index, 'from')}
                                      className="w-20 px-3 py-2 text-lg border border-gray-300 rounded-md shadow-sm focus:ring-[#DB1E10] focus:border-[#DB1E10]"
                                    />
                                    <span className="text-gray-600 text-lg font-medium">to</span>
                                    <input
                                      type="text"
                                      value={range.to}
                                      onChange={(e) => handleRangeInputChange(index, 'to', e.target.value)}
                                      onBlur={() => handleRangeInputBlur(index, 'to')}
                                      className="w-20 px-3 py-2 text-lg border border-gray-300 rounded-md shadow-sm focus:ring-[#DB1E10] focus:border-[#DB1E10]"
                                    />
                                    
                                    {ranges.length > 1 && (
                                      <button
                                        onClick={() => removeRange(index)}
                                        className="p-1.5 text-red-500 hover:text-red-700 ml-2"
                                        title="Remove range"
                                      >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Range Preview - directly below each range input */}
                                <div className="ml-11 flex items-center gap-4">
                                  {/* First page in range */}
                                  {pagePreviews[range.from] && (
                                    <div className="relative border border-gray-200 rounded overflow-hidden">
                                      <div className="h-24 w-20 flex items-center justify-center bg-white">
                                        <img
                                          src={pagePreviews[range.from]}
                                          alt={`Page ${range.from}`}
                                          className="max-h-full max-w-full object-contain"
                                        />
                                      </div>
                                      <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-br">
                                        {range.from}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Show ellipsis if range has more than 2 pages */}
                                  {range.to - range.from > 1 && (
                                    <div className="text-gray-500 text-2xl">...</div>
                                  )}
                                  
                                  {/* Last page in range if different from first */}
                                  {range.from !== range.to && pagePreviews[range.to] && (
                                    <div className="relative border border-gray-200 rounded overflow-hidden">
                                      <div className="h-24 w-20 flex items-center justify-center bg-white">
                                        <img
                                          src={pagePreviews[range.to]}
                                          alt={`Page ${range.to}`}
                                          className="max-h-full max-w-full object-contain"
                                        />
                                      </div>
                                      <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-br">
                                        {range.to}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="text-sm text-gray-500">
                                    {range.from === range.to 
                                      ? '1 page' 
                                      : `${range.to - range.from + 1} pages`}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex flex-wrap gap-5 mb-6">
                            <button
                              onClick={addRange}
                              className="flex items-center px-4 py-2 text-base bg-blue-50 text-blue-700 font-medium rounded-md hover:bg-blue-100"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add Range
                            </button>
                            
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="merge-ranges"
                                checked={mergeAllRanges}
                                onChange={() => setMergeAllRanges(!mergeAllRanges)}
                                className="h-5 w-5 text-[#DB1E10] border-gray-300 rounded focus:ring-[#DB1E10]"
                              />
                              <label htmlFor="merge-ranges" className="ml-2 text-base text-gray-700 font-medium">
                                Merge all ranges into a single PDF
                              </label>
                            </div>
                          </div>
                          
                          {/* Range Preview - Show which pages are included */}
                          <div className="mt-6">
                            <h4 className="text-lg font-medium text-gray-700 mb-3">Pages to be extracted:</h4>
                            <div className="bg-gray-100 rounded-lg p-4 text-base">
                              {ranges.map((range, index) => {
                                const pageCount = range.to - range.from + 1;
                                return (
                                  <span key={index} className="inline-block px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md mr-3 mb-2 text-base">
                                    {range.from === range.to 
                                      ? `Page ${range.from}` 
                                      : `Pages ${range.from}-${range.to} (${pageCount} pages)`}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Extract Pages UI */}
                      {splitMode === 'extract' && (
                        <div>
                          <h3 className="font-semibold text-xl mb-4">Select Individual Pages</h3>
                          <p className="text-base text-gray-600 mb-4">
                            Click on page thumbnails to select or deselect them.
                          </p>
                          
                          {/* Page thumbnails grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-h-80 overflow-y-auto bg-gray-50 p-4 rounded-lg mb-4">
                            {pageInfo && Array.from({ length: pageInfo }, (_, i) => i + 1).map(pageNum => {
                              const isSelected = selectedPages.includes(pageNum);
                              const pagePreview = pagePreviews[pageNum];
                              
                              return (
                                <div 
                                  key={pageNum}
                                  onClick={() => togglePageSelection(pageNum)}
                                  className={`cursor-pointer relative border ${isSelected ? 'border-[#DB1E10] ring-2 ring-[#DB1E10] ring-opacity-50' : 'border-gray-200 hover:border-blue-300'} rounded-md transition-all duration-150 overflow-hidden`}
                                >
                                  {/* Selection indicator */}
                                  {isSelected && (
                                    <div className="absolute top-1 right-1 z-10 bg-[#DB1E10] text-white rounded-full w-6 h-6 flex items-center justify-center">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                  
                                  {/* Page thumbnail */}
                                  <div className="flex items-center justify-center h-28 bg-white overflow-hidden">
                                    {pagePreview ? (
                                      <img 
                                        src={pagePreview} 
                                        alt={`Page ${pageNum}`}
                                        className="max-h-full max-w-full object-contain"
                                      />
                                    ) : (
                                      <div className="flex items-center justify-center w-full h-full text-gray-400">
                                        <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Page number */}
                                  <div className="text-center py-1.5 text-base bg-gray-100 border-t">
                                    Page {pageNum}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Selection summary */}
                          <div className="mt-6">
                            <h4 className="text-lg font-medium text-gray-700 mb-3">Selected pages:</h4>
                            <div className="bg-gray-100 rounded-lg p-4 text-base">
                              {selectedPages.length === 0 ? (
                                <span className="text-gray-500 text-base">No pages selected</span>
                              ) : (
                                <div>
                                  {selectedPages.map((pageNum, index) => (
                                    <span key={index} className="inline-block px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md mr-3 mb-2 text-base">
                                      Page {pageNum}
                                    </span>
                                  ))}
                                  <div className="mt-3 text-base text-gray-600">
                                    {selectedPages.length} {selectedPages.length === 1 ? 'page' : 'pages'} selected
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

         {/* Results Section */}
{/* Results Section */}
{/* Results Section */} 
{/* Results Section */}
{splitResult && !isProcessing && (
  <div ref={resultSectionRef}>
    {/* Debug info display keeps working fine */}
    
    <DownloadSection
      files={splitResult.files}
      downloadHandler={handleDownload}
      previewHandler={handlePreview}
      zipDownloadHandler={(!mergeAllRanges && splitMode === 'range' && ranges.length > 1) ? handleDownloadZip : null}
      title={!mergeAllRanges && ranges.length > 1 ? "Download Split PDFs" : "Download Split PDF"}
      color="red"
      startOverHandler={handleReset}
      defaultZipName={file ? `${file.name.replace('.pdf', '')}_split.zip` : "split_files.zip"}
      // Add this prop to force showing the ZIP download button
      forceShowZipDownload={!mergeAllRanges && splitMode === 'range' && ranges.length > 1}
    />
  </div>
)}
        </div>

        {/* Sidebar */}
        {file && (
          <div className="w-full md:w-1/4 md:sticky md:top-24 h-fit">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-xl mb-4">Split PDF Options</h3>

              {/* Split mode selection */}
              <div className="mb-6">
                <label className="block text-base font-medium text-gray-700 mb-3">
                  Split Mode
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="split-range"
                      name="split-mode"
                      className="h-5 w-5 text-[#DB1E10] border-gray-300 focus:ring-[#DB1E10]"
                      checked={splitMode === 'range'}
                      onChange={() => setSplitMode('range')}
                    />
                    <label htmlFor="split-range" className="ml-3 block text-base text-gray-700">
                      Split by range
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="split-extract"
                      name="split-mode"
                      className="h-5 w-5 text-[#DB1E10] border-gray-300 focus:ring-[#DB1E10]"
                      checked={splitMode === 'extract'}
                      onChange={() => setSplitMode('extract')}
                    />
                    <label htmlFor="split-extract" className="ml-3 block text-base text-gray-700">
                      Extract specific pages
                    </label>
                  </div>
                </div>
              </div>

              {/* Merge option for range mode */}
              {splitMode === 'range' && ranges.length > 1 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="merge-ranges-sidebar"
                      checked={mergeAllRanges}
                      onChange={() => setMergeAllRanges(!mergeAllRanges)}
                      className="h-5 w-5 text-[#DB1E10] border-gray-300 rounded focus:ring-[#DB1E10]"
                    />
                    <label htmlFor="merge-ranges-sidebar" className="ml-3 text-base text-gray-700 font-medium">
                      Merge all ranges into a single PDF
                    </label>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {mergeAllRanges 
                      ? "All selected ranges will be combined into one PDF file." 
                      : "Each range will be saved as a separate PDF file in a ZIP archive."}
                  </p>
                </div>
              )}

              {/* Split Button */}
              <button
                onClick={handleSplitPDF}
                className={`w-full ${hasFileIssues || rangeInputError
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#DB1E10] hover:bg-[#DB1E10]'
                  } text-white font-semibold cursor-pointer py-4 rounded-xl transition-colors duration-200 shadow-md text-lg`}
                disabled={
                  !file || hasFileIssues || rangeInputError || 
                  (splitMode === 'extract' && selectedPages.length === 0)
                }
              >
                Split PDF
                {hasFileIssues && (
                  <span className="text-sm block mt-1">
                    {isEncrypted ? 'Password required' : 'Invalid PDF file'}
                  </span>
                )}
                {rangeInputError && (
                  <span className="text-sm block mt-1">
                    Fix range input errors
                  </span>
                )}
                {!hasFileIssues && !rangeInputError && estimatedUploadTime > 0 && (
                  <span className="text-sm block mt-1">
                    Est. processing time: {estimatedUploadTime < 60
                      ? `${estimatedUploadTime} seconds`
                      : `${Math.floor(estimatedUploadTime / 60)} min ${estimatedUploadTime % 60} sec`}
                  </span>
                )}
              </button>

              {/* PDF Information */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="text-base font-medium text-gray-700 mb-3">File Information</h4>
                <ul className="text-base text-gray-600 space-y-3">
                  <li className="flex justify-between">
                    <span>Filename:</span>
                    <span className="font-medium truncate max-w-[150px]" title={file?.name}>
                      {file?.name}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>File size:</span>
                    <span className="font-medium">{formatFileSize(file?.size)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Pages:</span>
                    <span className="font-medium">{pageInfo || '-'}</span>
                  </li>
                  {isEncrypted && decryptedFile && (
                    <li className="flex justify-between">
                      <span>Status:</span><span className="font-medium text-green-600">Unlocked</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Help text */}
              <div className="mt-6 text-sm text-gray-500">
                {splitMode === 'range' ? (
                  <p>
                    ℹ️ Split by range allows you to extract specific page ranges. 
                    Add multiple ranges and choose whether to merge them into a single PDF.
                  </p>
                ) : (
                  <p>
                    ℹ️ Extract specific pages allows you to click on page thumbnails to select 
                    exactly which pages to include in the output PDF.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFSplitter;