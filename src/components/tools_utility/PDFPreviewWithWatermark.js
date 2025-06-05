import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { generateWatermarkPreview } from '../../api/watermark_api';

/**
 * PDFPreviewWithWatermark - Optimized version with better performance
 */


const PDFPreviewWithWatermark = ({ 
  file, 
  watermarkType, 
  watermarkOptions, 
  watermarkImage,
  pdfDocument,
  isPasswordProtected,
  isDecrypted
}) => {
  const canvasRef = useRef(null);
  const [previewError, setPreviewError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewScale, setPreviewScale] = useState(1.0);
  const [previewPdfBytes, setPreviewPdfBytes] = useState(null);
  const [previewPdfDocument, setPreviewPdfDocument] = useState(null);
  const [originalPdfArrayBuffer, setOriginalPdfArrayBuffer] = useState(null);
  const [lastRenderTimestamp, setLastRenderTimestamp] = useState(0);
  const [useFallbackPreview, setUseFallbackPreview] = useState(false);

  
  // Track whether we need a full regeneration or not
  const needsFullRegeneration = useRef(false);
  
  // Timer ref for the debounce
  const debounceTimerRef = useRef(null);
  
  // Store the original PDF data when the file changes
  useEffect(() => {
    const loadOriginalPdf = async () => {
      if (!file) return;
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        setOriginalPdfArrayBuffer(arrayBuffer);
        needsFullRegeneration.current = true;
      } catch (error) {
        console.error('Error loading original PDF:', error);
        setPreviewError('Failed to load PDF file');
      }
    };
    
    loadOriginalPdf();
  }, [file]);
  
  // Memoize the options object to avoid unnecessary regenerations
  const memoizedOptions = useMemo(() => ({
    watermarkType,
    text: watermarkOptions.text,
    fontSize: watermarkOptions.fontSize,
    color: watermarkOptions.fontColor || watermarkOptions.color,
    opacity: watermarkOptions.opacity,
    rotation: watermarkOptions.rotation,
    position: watermarkOptions.position,
    // Make sure to pass these styling options correctly
    isBold: !!watermarkOptions.isBold,  // Force boolean value
    isItalic: !!watermarkOptions.isItalic,  // Force boolean value
    isUnderline: !!watermarkOptions.isUnderline,  // Force boolean value
    fontStyle: watermarkOptions.fontStyle, // Add font style explicitly
    isMosaic: watermarkOptions.isMosaic,
    imageSize: watermarkOptions.imageSize,
   
  }), [
    watermarkType,
    watermarkOptions.text,
    watermarkOptions.fontSize,
    watermarkOptions.fontColor, 
    watermarkOptions.color,
    watermarkOptions.opacity,
    watermarkOptions.rotation,
    watermarkOptions.position,
    watermarkOptions.isBold,
    watermarkOptions.isItalic,
    watermarkOptions.isUnderline,
    watermarkOptions.fontStyle, // Add to dependency array
    watermarkOptions.isMosaic,
    watermarkOptions.imageSize,
    console.log("fontStyle received in PDFPreviewWithWatermark:", watermarkOptions.fontStyle)
  ]);
  
  // Optimization: Check if we need to regenerate the preview
  const hasOptionsChanged = useRef(false);
  
  // Track the watermark image - important for clearing it
  const previousWatermarkImage = useRef(watermarkImage);
  
 useEffect(() => {
  hasOptionsChanged.current = true;
  
  // Check if image has been cleared or type has changed
  if (watermarkType === 'image' && previousWatermarkImage.current && !watermarkImage) {
    console.log("Image was cleared, forcing full regeneration");
    needsFullRegeneration.current = true;
    // Also clear any cached preview
    if (typeof previewCache !== 'undefined' && previewCache.clear) {
      previewCache.clear();
    }
  }
  
  // Update previous image reference
  previousWatermarkImage.current = watermarkImage;
  
}, [memoizedOptions, watermarkImage, watermarkType]);

// And make sure this is in the code:
useEffect(() => {
  console.log("Watermark type changed, forcing regeneration");
  needsFullRegeneration.current = true;
}, [watermarkType]);
  
  // Generate watermarked PDF preview based on changes
  const generatePdfPreview = useCallback(async () => {
    if (!originalPdfArrayBuffer || !pdfDocument || (isPasswordProtected && !isDecrypted)) return;
    
    // Skip if we don't need to regenerate
    if (!hasOptionsChanged.current && !needsFullRegeneration.current) return;
    
    // Reset flags
    hasOptionsChanged.current = false;
    needsFullRegeneration.current = false;
    
    setIsGenerating(true);
    setPreviewError(null);
    
    try {
      // Use cached original PDF data
      const previewBytes = await generateWatermarkPreview(
        originalPdfArrayBuffer, 
        memoizedOptions, 
        watermarkImage
      );
      
      setPreviewPdfBytes(previewBytes);
      
      // Only reload the PDF document if necessary
      if (window.pdfjsLib) {
        const loadingTask = window.pdfjsLib.getDocument({
          data: previewBytes,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
          cMapPacked: true
        });
        
        const previewPdf = await loadingTask.promise;
        setPreviewPdfDocument(previewPdf);
      }
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      setPreviewError('Failed to generate preview with watermark');
    } finally {
      setIsGenerating(false);
    }
  }, [originalPdfArrayBuffer, pdfDocument, memoizedOptions, watermarkImage, isPasswordProtected, isDecrypted]);
  
  // Apply debouncing to prevent too many regenerations
  useEffect(() => {
    // Clear any pending timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new timer for debounced execution
    debounceTimerRef.current = setTimeout(() => {
      generatePdfPreview();
    }, 400); // Reduced from 500ms to 300ms for better responsiveness
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [generatePdfPreview]);
  
  // Render the preview PDF - implement more optimizations here
 const renderPreviewPage = useCallback(async () => {
  if (!previewPdfDocument || !canvasRef.current) return;
  
  const now = Date.now();
  if (now - lastRenderTimestamp < 100) return;
  
  setLastRenderTimestamp(now);
  
  try {
    const page = await previewPdfDocument.getPage(1);
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Clear canvas first
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    const containerWidth = canvas.parentNode.clientWidth || 400;
    const containerHeight = 350;
    
    const originalViewport = page.getViewport({ scale: 1 });
    const scaleX = containerWidth / originalViewport.width;
    const scaleY = containerHeight / originalViewport.height;
    const scale = Math.min(scaleX, scaleY, 2.0);
    
    setPreviewScale(scale);
    
    const viewport = page.getViewport({ scale });
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport
    }).promise;
    
    // Clear any previous errors on successful render
    setPreviewError(null);
    setUseFallbackPreview(false);
    
  } catch (error) {
    console.error('Error rendering preview:', error);
    
    // Try fallback to original document
    if (!useFallbackPreview && pdfDocument) {
      console.log("Attempting fallback to original document");
      setUseFallbackPreview(true);
      setPreviewPdfDocument(pdfDocument);
    } else {
      setPreviewError('Preview temporarily unavailable');
    }
  }
}, [previewPdfDocument, lastRenderTimestamp, useFallbackPreview, pdfDocument]);
  
  // Render the PDF when the document changes
  useEffect(() => {
    if (previewPdfDocument) {
      renderPreviewPage();
    }
  }, [previewPdfDocument, renderPreviewPage]);
  
  // Handle window resize events for responsive preview
  useEffect(() => {
    const handleResize = () => {
      if (previewPdfDocument) {
        renderPreviewPage();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [previewPdfDocument, renderPreviewPage]);
  
  // Force a regeneration when watermark type changes
  useEffect(() => {
    needsFullRegeneration.current = true;
  }, [watermarkType]);
  
  return (
    <div className="h-full w-full relative flex flex-col">
      <h3 className="text-lg font-medium mb-4">PDF Preview with Watermark</h3>
      
      {/* Preview Canvas Container */}
      <div className="flex-grow relative rounded-lg overflow-hidden shadow-md border border-gray-200 bg-white">
        {/* Header */}
        <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm">Page 1 Preview</span>
            <span className="text-xs text-gray-500">
              Scale: {Math.round(previewScale * 100)}%
            </span>
          </div>
        </div>
        
        {/* Rendering Indicator - Only show for initial load, not for every update */}
        {isGenerating && !previewPdfDocument && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <div className="text-gray-500 flex flex-col items-center">
              <svg className="animate-spin h-8 w-8 text-[#DA1F10] mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating preview...</span>
            </div>
          </div>
        )}
        
        {/* Subtle indicator for updates - less intrusive */}
        {isGenerating && previewPdfDocument && (
          <div className="absolute top-2 right-2 z-10 bg-white bg-opacity-90 rounded-full p-1">
            <svg className="animate-spin h-4 w-4 text-[#DA1F10]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        
        {/* Error Message */}
        {previewError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50">
            <div className="text-red-600 flex flex-col items-center p-4 text-center">
              <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="font-medium">Preview Error</span>
              <p className="text-sm mt-1">{previewError}</p>
            </div>
          </div>
        )}
        
        {/* No Document Message */}
        {!file && (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50">
            <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span className="text-gray-500">No PDF uploaded</span>
          </div>
        )}
        
        {/* Password Protection Message */}
        {file && isPasswordProtected && !isDecrypted && (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50">
            <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            <span className="text-gray-500">PDF is password protected. Please unlock it to view.</span>
          </div>
        )}
        
        {/* Canvas for rendering */}
        <div className="h-[350px] flex items-center justify-center p-4 overflow-auto">
          <canvas 
            ref={canvasRef} 
            className="max-w-full" 
            style={{ 
              // Only fade the canvas when we're updating an existing preview
              opacity: isGenerating && previewPdfDocument ? 0.7 : 1,
              transition: 'opacity 0.2s ease-in-out'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewWithWatermark;