"use client"

import { useState, useRef, useEffect } from 'react';
import { rotatePDFs, getDownloadUrl, downloadFile, getPreviewUrl } from '../../api/rotate_api';
import ModalLoader from '../tools_utility/ModalLoader';
import PDFPreviewModal from '../tools_utility/PDFPreviewModal.';
import SelectFiles from '../tools_utility/SelectFiles';
import DownloadSection from '../tools_utility/DownloadSection';

const PDFRotator = () => {
  // State for files and UI
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState({});
  const [pageInfo, setPageInfo] = useState({}); // Stores page count for each PDF
  const [pagePreviews, setPagePreviews] = useState({}); // Stores previews for individual pages
  const [pageRotations, setPageRotations] = useState({}); // Tracks rotation angles for pages
  const [selectedPagesByFile, setSelectedPagesByFile] = useState({}); // Track selected pages for each file
  const [rotationAngle, setRotationAngle] = useState('90');
  const [rotateAllPages, setRotateAllPages] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [rotationResult, setRotationResult] = useState(null);
  const fileInputRef = useRef(null);
  const resultSectionRef = useRef(null);
  const [expandedFile, setExpandedFile] = useState(null);

  // States for encrypted files and password modal
  const [encryptedFiles, setEncryptedFiles] = useState({});
  const [decryptedFiles, setDecryptedFiles] = useState({});
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    fileIndex: null,
    fileName: '',
    error: ''
  });

  // State for preview modal
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    pdfUrl: null,
    fileName: ''
  });

  // File size limits (in bytes)
  const MAX_SINGLE_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
  const MAX_TOTAL_FILES_SIZE = 200 * 1024 * 1024; // 200 MB

  // Calculate total size of all files
  const totalSize = files.reduce((total, file) => total + file.size, 0);

  // Calculate estimated upload time based on file size (rough estimate)
  // Using 400 KB/s as estimation base for average connection
  const estimatedUploadTime = Math.ceil(totalSize / (400 * 1024));

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
  const handleDownload = (fileId, fileName) => {
    // Add .pdf extension if missing
    const finalFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    downloadFile(getDownloadUrl(fileId, 'pdf', finalFileName), finalFileName);
  };

  // Handle ZIP download for multiple files
  const handleDownloadZip = (zipName) => {
    // Make sure zipName has .zip extension
    const finalZipName = zipName.toLowerCase().endsWith('.zip') ? zipName : `${zipName}.zip`;

    if (rotationResult) {
      // Try to find the ZIP file ID
      if (rotationResult.files && Array.isArray(rotationResult.files) && rotationResult.files.length > 0) {
        // First file should be the ZIP file in multi-file case
        const zipFile = rotationResult.files[0];
        const url = getDownloadUrl(zipFile.id, 'zip', finalZipName);
        downloadFile(url, finalZipName);
      }
    }
  };

  // Handle selected files
  const handleFilesSelected = (selectedFiles) => {
    // Add to existing files
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
  };

  // Close the PDF preview modal
  const handleClosePreview = () => {
    setPreviewModal({
      isOpen: false,
      pdfUrl: null,
      fileName: ''
    });
  };

  // Scroll to results section when rotation completes
  useEffect(() => {
    if (rotationResult && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [rotationResult]);

  // Generate previews and get page counts whenever files change
  useEffect(() => {
    const generatePreviews = async () => {
      const newPreviews = { ...previews };
      const newPageInfo = { ...pageInfo };
      const newPagePreviews = { ...pagePreviews };
      const newPageRotations = { ...pageRotations };

      for (const file of files) {
        if (!previews[file.name]) {
          try {
            const arrayBuffer = await file.arrayBuffer();

            // Check if PDF is valid, encrypted, or corrupted
            try {
              // Use window.pdfjsLib which is loaded from CDN
              const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

              // Store page count
              const numPages = pdf.numPages;
              newPageInfo[file.name] = numPages;

              // Initialize selected pages and page rotations for this file
              if (!selectedPagesByFile[file.name]) {
                setSelectedPagesByFile(prev => ({
                  ...prev,
                  [file.name]: []
                }));
              }

              if (!pageRotations[file.name]) {
                newPageRotations[file.name] = {};
                for (let i = 1; i <= numPages; i++) {
                  newPageRotations[file.name][i] = 0; // Initialize with 0 degrees rotation
                }
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

              newPreviews[file.name] = canvas.toDataURL();

              // Generate previews for individual pages
              newPagePreviews[file.name] = {};

              // Limit initial loading to first 5 pages for performance
              // Other pages will be loaded when file is expanded
              const pagesToPreload = Math.min(5, numPages);

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

                newPagePreviews[file.name][i] = pageCanvas.toDataURL();
              }

            } catch (error) {
              console.error('Error generating preview for:', file.name, error);

              // Check for password-protected/encrypted PDF
              if (error.name === 'PasswordException' || error.message.includes('password')) {
                newPreviews[file.name] = 'encrypted';
                setError(`"${file.name}" is password protected or encrypted. Please decrypt this file.`);
                setEncryptedFiles(prev => ({
                  ...prev,
                  [file.name]: true
                }));
              } else {
                // Assume other errors are due to corruption
                newPreviews[file.name] = 'corrupted';
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
      setPageInfo(newPageInfo);
      setPagePreviews(newPagePreviews);
      setPageRotations(newPageRotations);
    };

    if (window.pdfjsLib && files.length > 0) {
      generatePreviews();
    }
  }, [files]);

  // Load additional page previews when a file is expanded
  // Modify the page loading mechanism
  useEffect(() => {
    const loadAllPagePreviews = async (fileName, file) => {
      try {
        console.log(`Starting to load all pages for: ${fileName}`);

        // If we have already loaded all pages for this file, skip
        if (pagePreviews[fileName] &&
          Object.keys(pagePreviews[fileName]).length >= pageInfo[fileName]) {
          console.log(`All ${pageInfo[fileName]} pages already loaded for ${fileName}`);
          return;
        }

        const arrayBuffer = await file.arrayBuffer();

        // Handle password if needed
        const loadingParams = { data: arrayBuffer };
        if (decryptedFiles[fileName]?.password) {
          loadingParams.password = decryptedFiles[fileName].password;
        }

        const pdf = await window.pdfjsLib.getDocument(loadingParams).promise;
        const numPages = pdf.numPages;

        console.log(`PDF has ${numPages} pages. Currently loaded: ${Object.keys(pagePreviews[fileName] || {}).length}`);

        // Create temp variable to store all new previews to avoid too many state updates
        const newPreviews = { ...pagePreviews };
        if (!newPreviews[fileName]) {
          newPreviews[fileName] = {};
        }

        // Process pages in batches to avoid memory issues
        const batchSize = 3;
        const totalBatches = Math.ceil(numPages / batchSize);

        for (let batch = 0; batch < totalBatches; batch++) {
          const startPage = batch * batchSize + 1;
          const endPage = Math.min(startPage + batchSize - 1, numPages);

          console.log(`Processing batch ${batch + 1}/${totalBatches}: pages ${startPage}-${endPage}`);

          for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
            // Skip if we already have this page
            if (newPreviews[fileName][pageNum]) {
              continue;
            }

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

              newPreviews[fileName][pageNum] = canvas.toDataURL();
              console.log(`Loaded page ${pageNum}`);
            } catch (err) {
              console.error(`Error rendering page ${pageNum}:`, err);
            }
          }

          // Update state after each batch
          setPreviews(prev => ({ ...prev })); // Trigger a re-render without changing data
          setPagePreviews({ ...newPreviews });

          // Small delay to prevent UI freezing
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`Finished loading all pages for ${fileName}`);
      } catch (error) {
        console.error(`Error in loadAllPagePreviews for ${fileName}:`, error);
      }
    };

    // Important: Load pages for all files when in individual pages mode
    if (!rotateAllPages) {
      files.forEach(file => {
        if (pageInfo[file.name]) {
          loadAllPagePreviews(file.name, file);
        }
      });
    }

    // Don't include pagePreviews in dependencies to avoid circular effects
  }, [rotateAllPages, files, pageInfo, decryptedFiles]);

  // Handle decryption for encrypted files
  const handleDecryptFile = (fileIndex) => {
    const file = files[fileIndex];
    setPasswordModal({
      isOpen: true,
      fileIndex,
      fileName: file.name,
      error: ''
    });
  };

  // Handle password submission for encrypted PDFs
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

      // Store page count
      const numPages = pdf.numPages;
      setPageInfo(prev => ({
        ...prev,
        [file.name]: numPages
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

      // Initialize page rotations
      setPageRotations(prev => {
        const newRotations = { ...prev };
        newRotations[file.name] = {};
        for (let i = 1; i <= numPages; i++) {
          newRotations[file.name][i] = 0;
        }
        return newRotations;
      });

      // Load page previews
      const newPagePreviews = { ...pagePreviews };
      newPagePreviews[file.name] = {};

      // Load first 5 pages initially
      const pagesToLoad = Math.min(5, numPages);
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

        newPagePreviews[file.name][i] = pageCanvas.toDataURL();
      }

      setPagePreviews(newPagePreviews);

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

      // Only add files if the drop didn't happen on a specific drop zone
      const isInsideDropZone = e.target.closest('.drop-zone');
      if (!isInsideDropZone) {
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFilesWithValidation(droppedFiles);
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

    // Clean up page info
    if (pageInfo[removedFile.name]) {
      setPageInfo(prev => {
        const updated = { ...prev };
        delete updated[removedFile.name];
        return updated;
      });
    }

    // Clean up page previews
    if (pagePreviews[removedFile.name]) {
      setPagePreviews(prev => {
        const updated = { ...prev };
        delete updated[removedFile.name];
        return updated;
      });
    }

    // Clean up page rotations
    if (pageRotations[removedFile.name]) {
      setPageRotations(prev => {
        const updated = { ...prev };
        delete updated[removedFile.name];
        return updated;
      });
    }

    // Clean up selected pages
    if (selectedPagesByFile[removedFile.name]) {
      setSelectedPagesByFile(prev => {
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
    setPageInfo({});
    setPagePreviews({});
    setPageRotations({});
    setSelectedPagesByFile({});
    setRotationResult(null);
    setError(null);
  };

  // Reset to initial state
  const handleReset = () => {
    setFiles([]);
    setPreviews({});
    setPageInfo({});
    setPagePreviews({});
    setPageRotations({});
    setSelectedPagesByFile({});
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    setRotationResult(null);
  };

  const toggleFileExpansion = (fileName) => {
    // If we're already expanded on this file, collapse it
    if (expandedFile === fileName) {
      setExpandedFile(null);
    }
    // Otherwise expand this file and make sure we're in individual pages mode
    else {
      setExpandedFile(fileName);
      // Always switch to individual pages mode when expanding
      setRotateAllPages(false);
    }
  };



  // Deselect all pages for a file

  // Rotate a whole document preview
  const rotateDocument = (fileName, degrees) => {
    console.log(`ROTATE: Rotating all pages of ${fileName} by ${degrees} degrees`);

    // Update the rotation for all pages
    const numPages = pageInfo[fileName] || 0;

    setPageRotations(prev => {
      // Create deep copy to avoid state mutation issues
      const newRotations = JSON.parse(JSON.stringify(prev));

      if (!newRotations[fileName]) {
        newRotations[fileName] = {};
      }

      // Apply the same rotation to all pages
      for (let i = 1; i <= numPages; i++) {
        const currentRotation = newRotations[fileName][i] || 0;
        const newRotation = (currentRotation + degrees) % 360;
        newRotations[fileName][i] = newRotation;
      }

      return newRotations;
    });
  };
  const resetAllRotations = () => {
    console.log("Resetting all rotations to 0°");

    // Create a new object with all rotations set to 0
    const resetRotations = {};

    // Loop through all files
    files.forEach(file => {
      const numPages = pageInfo[file.name] || 0;

      if (numPages > 0) {
        resetRotations[file.name] = {};

        // Set rotation for each page to 0
        for (let i = 1; i <= numPages; i++) {
          resetRotations[file.name][i] = 0;
        }
      }
    });

    // Update the state with all rotations reset to 0
    setPageRotations(resetRotations);
  };

  // Rotate a specific page
  // In your rotatePage function (around line 616), add this:
  const rotatePage = (fileName, pageNumber, degrees) => {
    console.log(`ROTATE: Attempting to rotate page ${pageNumber} of ${fileName} by ${degrees} degrees`);

    setPageRotations(prev => {
      // Create a deep copy to avoid state mutation issues
      const newRotations = JSON.parse(JSON.stringify(prev));

      // Make sure we have an object for this file
      if (!newRotations[fileName]) {
        newRotations[fileName] = {};
      }

      // Get current rotation, defaulting to 0 if not set
      const currentRotation = newRotations[fileName][pageNumber] || 0;

      // Calculate new rotation by adding the requested degrees
      // Use modulo to keep it between 0 and 359
      const newRotation = (currentRotation + degrees) % 360;

      console.log(`ROTATE: Page ${pageNumber} of ${fileName}: ${currentRotation}° -> ${newRotation}°`);

      // Set the new rotation value
      newRotations[fileName][pageNumber] = newRotation;

      return newRotations;
    });
  };
  // Format file size in a readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Check if any files are problematic (corrupted, encrypted, etc.)
  const hasProblematicFiles = Object.values(previews).some(
    preview => preview === 'corrupted' || preview === 'encrypted' || preview === 'invalid'
  );

  // Check if any encrypted files haven't been decrypted
  const hasUnhandledEncryptedFiles = files.some(
    file => previews[file.name] === 'encrypted' && !decryptedFiles[file.name]
  );

  // Handle PDF rotation
  // Handle PDF rotation
  const handleRotatePDF = async () => {
    if (files.length === 0) return;

    // Check for problematic files before processing
    if (hasUnhandledEncryptedFiles) {
      // Find the first file that needs decryption
      const fileIndex = files.findIndex(
        file => previews[file.name] === 'encrypted' && !decryptedFiles[file.name]
      );

      if (fileIndex !== -1) {
        handleDecryptFile(fileIndex);
        setError("Please provide passwords for all encrypted PDFs before rotation.");
        return;
      }
    }

    // Check for other problematic files
    const hasOtherProblematicFiles = files.some(file => {
      const previewState = previews[file.name];
      return previewState === 'corrupted' || previewState === 'invalid';
    });

    if (hasOtherProblematicFiles) {
      setError("Please remove all corrupted or invalid PDF files before rotation.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setRotationResult(null);

    try {
      // Create FormData to send files and rotation options
      const formData = new FormData();

      // Loop through each file and its page rotations
      for (const fileName in pageRotations) {
        const file = files.find(f => f.name === fileName);
        if (!file) continue;

        // Add all files
        formData.append('pdf_files', file);

        // Add password if needed
        if (decryptedFiles[fileName]?.password) {
          formData.append(`password_${fileName}`, decryptedFiles[fileName].password);
        }

        // Add rotation angles for each page
        formData.append(`rotations_${fileName}`, JSON.stringify(pageRotations[fileName]));
      }

      // Call the API to rotate PDFs
      const result = await rotatePDFs(
        formData,
        (progressValue) => setProgress(progressValue)
      );

      setRotationResult(result);
    } catch (error) {
      console.error('Rotation failed:', error);
      setError(error.message || 'PDF rotation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

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
        text={"Rotating PDFs..."}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#DB1E10] focus:border-[#DB1E10]"
                  placeholder="Enter PDF password"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModal({ isOpen: false, fileIndex: null, fileName: '', password: '', error: '' });
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
          <span className="text-[#DB1E10]">Rotate</span> PDF
        </h1>
        <p className="text-gray-600">Rotate pages in your PDF files to the correct orientation</p>
        <p className="text-sm text-gray-500 mt-2">Max file size: 100 MB per file, 200 MB total</p>
      </div>

      {/* Content with Sidebar Layout */}
      <div className="flex flex-col justify-center md:flex-row gap-6">
        {/* Main Content Area */}
        <div className="w-full md:w-3/4">
          {/* Upload Area - Only show if no files uploaded yet */}
          {files.length === 0 && !rotationResult && (
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

    {/* If in Rotate All Pages mode, show a flat grid of all PDFs */}
    {rotateAllPages ? (
      <div className="border rounded-xl overflow-hidden bg-white shadow-sm mb-6">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h3 className="font-medium">All PDF Files</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {files.filter(f => {
              const fPreview = previews[f.name];
              return fPreview !== 'corrupted' && fPreview !== 'encrypted' && fPreview !== 'invalid';
            }).map((gridFile, gridIndex) => {
              const gridPreviewState = previews[gridFile.name];
              const gridFileRotations = pageRotations[gridFile.name] || {};
              
              return (
                <div key={gridIndex} className="relative border rounded-md overflow-hidden bg-white shadow-sm">
                  {/* Rotate Button */}
                  <button
                    onClick={() => rotateDocument(gridFile.name, 90)}
                    className="absolute top-2 right-2 z-10 p-1 bg-blue-100 text-[#DB1E10] rounded-full hover:bg-[#DB1E10] hover:text-white transition-colors shadow-sm"
                    title="Rotate clockwise"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                  </button>
                  
                  {/* Document Preview */}
                  <div className="flex items-center justify-center p-4 h-40">
                    {gridPreviewState && typeof gridPreviewState === 'string' ? (
                      <img
                        src={gridPreviewState}
                        alt={`Preview of ${gridFile.name}`}
                        style={{ transform: `rotate(${gridFileRotations[1] || 0}deg)` }}
                        className="max-h-full max-w-full object-contain transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center">
                        <svg
                          className="w-8 h-8 mb-1"
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
                        <span className="text-xs">Loading...</span>
                      </div>
                    )}
                  </div>
                  
                  {/* File Name & Rotation */}
                  <div className="p-2 bg-gray-50 border-t text-center">
                    <p className="text-xs font-medium text-gray-700 truncate" title={gridFile.name}>
                      {gridFile.name.length > 15 ? `${gridFile.name.substring(0, 12)}...` : gridFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Rotation: {gridFileRotations[1] || 0}°
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    ) : (
      /* If in Individual Pages mode, show each file in its own container with pages */
      <div className="space-y-6 mb-8">
        {files.map((file, index) => {
          const previewState = previews[file.name];
          const isCorrupted = previewState === 'corrupted';
          const isEncrypted = previewState === 'encrypted';
          const isInvalid = previewState === 'invalid';
          const hasError = isCorrupted || isEncrypted || isInvalid;
          const numPages = pageInfo[file.name] || 0;
          const isExpanded = expandedFile === file.name;
          const selectedPages = selectedPagesByFile[file.name] || [];
          const fileRotations = pageRotations[file.name] || {};

          return (
            <div
              key={index}
              className={`border rounded-xl overflow-hidden ${
                hasError ? 'border-red-300 bg-red-50' : 'bg-white'
              } shadow-sm transition-shadow duration-200`}
            >
              <div className="flex flex-col">
                {/* File Info Header */}
                <div className="px-4 py-3 bg-gray-50 flex justify-between items-center border-b">
                  <div>
                    <p className={`font-medium ${hasError ? 'text-red-600' : ''}`} title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)} • {numPages} {numPages === 1 ? 'page' : 'pages'}
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

                {/* PDF Preview with Rotation Controls */}
                {hasError ? (
                  <div className="p-10 flex justify-center">
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

                      {isEncrypted ? (
                        <div className='flex flex-col'>
                          <span className="font-medium">Password Protected PDF</span>
                          <button
                            onClick={() => handleDecryptFile(index)}
                            className="mt-2 block mx-auto px-4 py-2 bg-[#DB1E10] text-white rounded-lg hover:bg-[#DB1E10] transition-colors cursor-pointer"
                          >
                            {decryptedFiles[file.name] ? "Change Password" : "Enter Password"}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium">
                            {isCorrupted && "Corrupted PDF"}
                            {isInvalid && "Invalid PDF"}
                          </span>
                          <span className="text-sm mt-1 block">Please remove this file</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Individual Pages Preview for "Rotate Specific Pages" Mode */
                  <div>
                    {/* Pages Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 max-h-96 overflow-y-auto">
                      {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => {
                        const pageRotation = fileRotations[pageNum] || 0;
                        const pagePreview = pagePreviews[file.name]?.[pageNum];
                        
                        return (
                          <div 
                            key={pageNum}
                            className="relative border rounded-md border-gray-200 hover:border-blue-300 transition-colors"
                          >
                            {/* Rotate Button */}
                            <button
                              onClick={() => rotatePage(file.name, pageNum, 90)}
                              className="absolute top-1 right-1 z-10 p-1 bg-blue-100 text-[#DB1E10] rounded-full hover:bg-[#DB1E10] hover:text-white transition-colors shadow-sm"
                              title="Rotate clockwise"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                              </svg>
                            </button>
                            
                            {/* Page Thumbnail */}
                            <div className="flex items-center justify-center h-32 bg-white overflow-hidden">
                              {pagePreview ? (
                                <div className="flex items-center justify-center w-full h-full">
                                  <img 
                                    src={pagePreview} 
                                    alt={`Page ${pageNum}`}
                                    style={{ transform: `rotate(${pageRotation}deg)`, transition: 'transform 0.3s ease' }}
                                    className="max-h-full max-w-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center w-full h-full text-gray-400">
                                  <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </div>
                              )}
                            </div>
                            
                            {/* Page Number and Rotation */}
                            <div className="absolute top-1 left-1 bg-gray-800 bg-opacity-70 text-white px-1.5 py-0.5 rounded text-xs">
                              {pageNum} • {pageRotation}°
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Loading Message if Pages are Still Loading */}
                    {Object.keys(pagePreviews[file.name] || {}).length < numPages && numPages > 0 && (
                      <div className="text-center text-sm text-gray-500 py-2">
                        Loading all pages... ({Object.keys(pagePreviews[file.name] || {}).length} of {numPages})
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}

    {/* Results Section */}
    {rotationResult && !isProcessing && (
      <div ref={resultSectionRef}>
        <DownloadSection
          files={rotationResult.files}
          downloadHandler={handleDownload}
          previewHandler={handlePreview}
          zipDownloadHandler={
            rotationResult.file_count > 1 ? handleDownloadZip : null
          }
          title="Download Rotated PDFs"
          color="red"
          startOverHandler={handleReset}
        />
      </div>
    )}
  </div>
)}
        </div>

        {/* Sidebar */}
        {files.length > 0 && (
          <div className="w-full md:w-1/4 md:sticky md:top-24 h-fit">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-medium text-lg mb-4">Rotation Settings</h3>

              {/* Page selection mode */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pages to Rotate
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="rotate-all"
                      name="rotation-mode"
                      className="h-4 w-4 text-[#DB1E10] border-gray-300 focus:ring-[#DB1E10]"
                      checked={rotateAllPages}
                      onChange={() => setRotateAllPages(true)}
                    />
                    <label htmlFor="rotate-all" className="ml-2 block text-sm text-gray-700">
                      Rotate all pages
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="rotate-selected"
                      name="rotation-mode"
                      className="h-4 w-4 text-[#DB1E10] border-gray-300 focus:ring-[#DB1E10]"
                      checked={!rotateAllPages}
                      onChange={() => {
                        setRotateAllPages(false);
                        // Force immediate expansion of the first file to trigger page loading
                        if (files.length > 0) {
                          setExpandedFile(files[0].name);
                        }
                      }}
                    />
                    <label htmlFor="rotate-selected" className="ml-2 block text-sm text-gray-700">
                      Rotate specific pages
                    </label>
                  </div>
                </div>
              </div>

              {/* Rotate Button */}
              <button
                onClick={handleRotatePDF}
                className={`w-full ${hasProblematicFiles
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#DB1E10] hover:bg-[#DB1E10]'
                  } text-white font-medium cursor-pointer py-4 rounded-xl transition-colors duration-200 shadow-md`}
                disabled={files.length === 0 || hasProblematicFiles}
              >
                Apply Rotation{files.length > 1 ? 's' : ''}
                {hasProblematicFiles && (
                  <span className="text-xs block mt-1">
                    Please remove invalid files first
                  </span>
                )}
                {!hasProblematicFiles && estimatedUploadTime > 0 && (
                  <span className="text-xs block mt-1">
                    Est. processing time: {estimatedUploadTime < 60
                      ? `${estimatedUploadTime} seconds`
                      : `${Math.floor(estimatedUploadTime / 60)} min ${estimatedUploadTime % 60} sec`}
                  </span>
                )}
              </button>
              <button
                onClick={resetAllRotations}
                className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-xl transition-colors duration-200 shadow-sm"
                disabled={files.length === 0 || hasProblematicFiles}
              >
                Reset All Rotations
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFRotator;