/**
 * PDF Watermark API client
 * Handles communication with the backend API for watermarking PDFs
 * Including client-side processing capabilities
*/
// Update this with your actual API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

import { getAuthToken } from '@/services/authUtils';

// Import pdf-lib for client-side processing
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

console.log("Available StandardFonts:", Object.keys(StandardFonts));


/**
 * Generate a preview PDF with watermark using PDF-lib - Optimized version
 * @param {ArrayBuffer} pdfBytes - Original PDF file data
 * @param {Object} options - Watermark options (text or image)
 * @param {File|Blob|null} watermarkImage - Image file for image watermark (optional)
 * @returns {Promise<Uint8Array>} - Preview PDF data with watermark applied
 */
export const generateWatermarkPreview = (() => {
    // Cache for previously generated previews to avoid regenerating the same content
    const previewCache = new Map();
    
    // Function to generate a cache key from options
    const generateCacheKey = (options, hasImageChanged) => {
      const optionsKey = JSON.stringify(options);
      return `${optionsKey}-${hasImageChanged ? Date.now() : 'cached'}`;
    };
    
    // Maximum cache size
    const MAX_CACHE_SIZE = 5;
    
    return async (pdfBytes, options, watermarkImage = null) => {
      try {
        // Check if image changed (images are harder to compare, so we use a flag)
        const hasImageChanged = options.watermarkType === 'image' && 
          watermarkImage && 
          (!previewCache.has('lastImageName') || 
           previewCache.get('lastImageName') !== watermarkImage.name);
        
        if (hasImageChanged) {
          previewCache.set('lastImageName', watermarkImage.name);
        }
        
        // Generate cache key
        const cacheKey = generateCacheKey(options, hasImageChanged);
        
        // Check cache first
        if (previewCache.has(cacheKey)) {
          return previewCache.get(cacheKey);
        }
        
        // Generate new preview
        let result;
        if (options.watermarkType === 'image' && watermarkImage) {
          result = await applyImageWatermarkInBrowser(pdfBytes, watermarkImage, {
            imageSize: options.imageSize,
            opacity: options.opacity,
            rotation: options.rotation,
            position: options.position,
            fromPage: 1, // Only process the first page for preview
            toPage: 1,
            isMosaic: options.isMosaic
          });
        } else {
          result = await applyTextWatermarkInBrowser(pdfBytes, {
            text: options.text || 'PDF Techno',
            fontSize: options.fontSize,
            color: options.color,
            opacity: options.opacity,
            rotation: options.rotation,
            position: options.position,
            fontStyle: options.fontStyle,
            fromPage: 1, // Only process the first page for preview
            toPage: 1,
            isBold: options.isBold,
            isItalic: options.isItalic,
            isUnderline: options.isUnderline,
            isMosaic: options.isMosaic
          });
        }
        
        // Store in cache
        previewCache.set(cacheKey, result);
        
        // Limit cache size by removing oldest entries
        if (previewCache.size > MAX_CACHE_SIZE) {
          const oldestKey = Array.from(previewCache.keys())
            .filter(key => key !== 'lastImageName')
            .shift();
          if (oldestKey) previewCache.delete(oldestKey);
        }
        
        return result;
      } catch (error) {
        console.error('Error generating watermark preview:', error);
        throw error;
      }
    };
  })(); // Use IIFE to create closure for the cache
/**
 * Add watermark to a PDF file (server-side processing)
 * @param {FormData} formData - FormData containing PDF file and watermark options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with result
 */
export const addWatermark = async (formData, onProgress) => {
  try {
    // Track upload progress using XMLHttpRequest
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let hasReceivedResponse = false;
      
      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && typeof onProgress === 'function') {
          // Calculate upload progress (0-85%)
          const uploadProgress = Math.round((event.loaded / event.total) * 85);
          onProgress(uploadProgress);
        }
      };
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3) {
          // Headers received, server is processing
          if (!hasReceivedResponse && typeof onProgress === 'function') {
            hasReceivedResponse = true;
            onProgress(90); // Jump to 90% when server starts processing
          }
        }
        else if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            // First go to 95% to show we're processing the response
            if (typeof onProgress === 'function') {
              onProgress(95);
            }
            
            // Simulate the final processing steps
            setTimeout(() => {
              // Set progress to 100% when complete
              if (typeof onProgress === 'function') {
                onProgress(100);
              }
              resolve(JSON.parse(xhr.responseText));
            }, 800); // Small delay to show 95% progress
          } else {
            // Handle error
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || 'Operation failed'));
            } catch (e) {
              reject(new Error(`Server error: ${xhr.status}`));
            }
          }
        }
      };
      
      // Set a timeout for server-side processing if the upload completes
      xhr.upload.onload = () => {
        // Upload is complete, but processing might still be happening
        if (typeof onProgress === 'function') {
          onProgress(85);
        }
      };
      
      // Open and send the request
      xhr.open('POST', `${API_BASE_URL}/api/pdf/watermark/`, true);
       const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        console.log(token);
        
      }
      xhr.send(formData);
    });
  } catch (error) {
    throw new Error(`Adding watermark failed: ${error.message}`);
  }
};

/**
 * Add text watermark to a PDF file (server-side processing)
 * Helper function that sets up FormData with text watermark options
 * @param {File} pdfFile - The PDF file to watermark
 * @param {Object} options - Text watermark options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with result
 */
export const addTextWatermark = async (pdfFile, options, onProgress) => {
  const formData = new FormData();
  
  // Add PDF file
  formData.append('pdf_file', pdfFile);
  
  // Set watermark type
  formData.append('watermark_type', 'text');
  
  // Add text watermark options
  formData.append('watermark_text', options.text || 'Watermark');
  formData.append('font_size', options.fontSize || 40);
  formData.append('font_style', options.fontStyle || 'Helvetica');
  formData.append('color', options.color || '#000000');
  formData.append('opacity', options.opacity || 0.5);
  formData.append('rotation', options.rotation || 0);
  formData.append('position', options.position || 'mid-center');
  
  // Add page range if specified
  if (options.fromPage) formData.append('from_page', options.fromPage);
  if (options.toPage) formData.append('to_page', options.toPage);
  
  // Add style options
  formData.append('is_bold', options.isBold ? 'true' : 'false');
  formData.append('is_italic', options.isItalic ? 'true' : 'false');
  formData.append('is_underline', options.isUnderline ? 'true' : 'false');
  formData.append('is_mosaic', options.isMosaic ? 'true' : 'false');
  
  // Add password if provided
  if (options.password) {
    formData.append('password', options.password);
  }
  
  return addWatermark(formData, onProgress);
};

/**
 * Add image watermark to a PDF file (server-side processing)
 * Helper function that sets up FormData with image watermark options
 * @param {File} pdfFile - The PDF file to watermark
 * @param {File} imageFile - The image file to use as watermark
 * @param {Object} options - Image watermark options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with result
 */
export const addImageWatermark = async (pdfFile, imageFile, options, onProgress) => {
  const formData = new FormData();
  
  // Add PDF file
  formData.append('pdf_file', pdfFile);
  
  // Set watermark type
  formData.append('watermark_type', 'image');
  
  // Add image file
  formData.append('watermark_image', imageFile);
  
  // Add image watermark options
  formData.append('image_size', options.imageSize || 30);
  formData.append('opacity', options.opacity || 0.5);
  formData.append('rotation', options.rotation || 0);
  formData.append('position', options.position || 'mid-center');
  
  // Add page range if specified
  if (options.fromPage) formData.append('from_page', options.fromPage);
  if (options.toPage) formData.append('to_page', options.toPage);
  
  // Add mosaic option
  formData.append('is_mosaic', options.isMosaic ? 'true' : 'false');
  
  // Add password if provided
  if (options.password) {
    formData.append('password', options.password);
  }
  
  return addWatermark(formData, onProgress);
};

/**
 * Apply text watermark to PDF in browser (client-side processing)
 * @param {ArrayBuffer} pdfBytes - Original PDF file data
 * @param {Object} options - Watermark options
 * @returns {ArrayBuffer} - Processed PDF with watermark
 */
/**
 * Fixed version of applyTextWatermarkInBrowser with proper rotation handling
 * Fixes: 1) Rotation around central axis 2) Underline rotation 3) Position calculations
 */

export const applyTextWatermarkInBrowser = async (pdfBytes, options) => {
  try {
    // Load the PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Set up watermark parameters
    const {
      text = 'PDF Techno',
      fontSize = 40, 
      fontStyle = 'Helvetica',
      color = '#FF0000',
      opacity = 0.5,
      rotation = 45,
      position = 'mid-center',
      fromPage = 1,
      toPage = pdfDoc.getPageCount(),
      isBold = false,
      isItalic = false,
      isUnderline = false,
      isMosaic = false
    } = options;
    
    console.log("Using MANUAL ROTATION approach");
    console.log("Rotation angle:", rotation);
    
    // Adjust font size for better consistency
    const adjustedFontSize = fontSize * 0.75;
    
    // Convert pages to 1-based to 0-based indexing
    const startPageIndex = Math.max(0, fromPage - 1);
    const endPageIndex = Math.min(pdfDoc.getPageCount() - 1, toPage - 1);
    
    // Map font style to PDF-lib's StandardFonts
    let fontName;
    if (fontStyle === 'Helvetica') {
      if (isBold && isItalic) fontName = StandardFonts.HelveticaBoldOblique;
      else if (isBold) fontName = StandardFonts.HelveticaBold;
      else if (isItalic) fontName = StandardFonts.HelveticaOblique;
      else fontName = StandardFonts.Helvetica;
    } 
    else if (fontStyle === 'Times-Roman') {
      if (isBold && isItalic) fontName = StandardFonts.TimesRomanBoldItalic;
      else if (isBold) fontName = StandardFonts.TimesRomanBold;
      else if (isItalic) fontName = StandardFonts.TimesRomanItalic;
      else fontName = StandardFonts.TimesRoman;
    } 
    else if (fontStyle === 'Courier') {
      if (isBold && isItalic) fontName = StandardFonts.CourierBoldOblique;
      else if (isBold) fontName = StandardFonts.CourierBold;
      else if (isItalic) fontName = StandardFonts.CourierOblique;
      else fontName = StandardFonts.Courier;
    }
    else {
      fontName = StandardFonts.Helvetica;
    }
    
    // Load the selected font
    const font = await pdfDoc.embedFont(fontName);
    
    // Convert hex color to RGB
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return { r, g, b };
    };
    
    const { r, g, b } = hexToRgb(color);
    
    // Process each page in the range
    for (let i = startPageIndex; i <= endPageIndex; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      
      // Calculate text dimensions
      const textWidth = font.widthOfTextAtSize(text, adjustedFontSize);
      const textHeight = font.heightAtSize(adjustedFontSize);
      
      console.log(`Page ${i + 1}: ${width}x${height}, Text: ${textWidth}x${textHeight}`);
      
      // Define the CENTER POINTS where we want the text to be positioned
      const centerPositions = {
        'top-left': { x: 100, y: height - 100 },
        'top-center': { x: width / 2, y: height - 100 },
        'top-right': { x: width - 100, y: height - 100 },
        'mid-left': { x: 100, y: height / 2 },
        'mid-center': { x: width / 2, y: height / 2 },
        'mid-right': { x: width - 100, y: height / 2 },
        'bottom-left': { x: 100, y: 100 },
        'bottom-center': { x: width / 2, y: 100 },
        'bottom-right': { x: width - 100, y: 100 }
      };
      
      // Function to rotate a point around another point
      const rotatePoint = (pointX, pointY, centerX, centerY, angleDegrees) => {
        const angleRad = (angleDegrees * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        
        // Translate point to origin
        const translatedX = pointX - centerX;
        const translatedY = pointY - centerY;
        
        // Rotate
        const rotatedX = translatedX * cos - translatedY * sin;
        const rotatedY = translatedX * sin + translatedY * cos;
        
        // Translate back
        return {
          x: rotatedX + centerX,
          y: rotatedY + centerY
        };
      };
      
      // Function to draw watermark using MANUAL rotation
      const drawWatermark = (centerX, centerY) => {
        console.log(`Target center: (${centerX}, ${centerY}), rotation: ${rotation}°`);
        
        // METHOD 1: Draw each character individually with manual positioning
        if (rotation !== 0) {
          // Split text into characters for individual positioning
          const chars = text.split('');
          let currentX = centerX - textWidth / 2; // Start from left edge
          
          chars.forEach((char, index) => {
            const charWidth = font.widthOfTextAtSize(char, adjustedFontSize);
            
            // Calculate this character's center position (unrotated)
            const charCenterX = currentX + charWidth / 2;
            const charCenterY = centerY;
            
            // Rotate this character's position around the text center
            const rotatedPos = rotatePoint(charCenterX, charCenterY, centerX, centerY, rotation);
            
            // Draw the character at its rotated position WITH individual rotation
            page.drawText(char, {
              x: rotatedPos.x - charWidth / 2,
              y: rotatedPos.y - textHeight / 2,
              size: adjustedFontSize,
              font,
              color: rgb(r, g, b),
              opacity,
              rotate: degrees(rotation) // Each character also rotated
            });
            
            console.log(`Char '${char}' at rotated pos: (${rotatedPos.x}, ${rotatedPos.y})`);
            
            currentX += charWidth;
          });
        } else {
          // No rotation - simple center positioning
          page.drawText(text, {
            x: centerX - textWidth / 2,
            y: centerY - textHeight / 2,
            size: adjustedFontSize,
            font,
            color: rgb(r, g, b),
            opacity
          });
        }
        
        // Draw underline if needed
        if (isUnderline && rotation !== 0) {
          const underlineY = centerY - textHeight / 2 - (adjustedFontSize * 0.15);
          const underlineStartX = centerX - textWidth / 2;
          const underlineEndX = centerX + textWidth / 2;
          
          // Rotate underline endpoints around center
          const startRotated = rotatePoint(underlineStartX, underlineY, centerX, centerY, rotation);
          const endRotated = rotatePoint(underlineEndX, underlineY, centerX, centerY, rotation);
          
          page.drawLine({
            start: { x: startRotated.x, y: startRotated.y },
            end: { x: endRotated.x, y: endRotated.y },
            thickness: Math.max(1, adjustedFontSize * 0.05),
            color: rgb(r, g, b),
            opacity: opacity
          });
          
          console.log(`Underline: (${startRotated.x}, ${startRotated.y}) to (${endRotated.x}, ${endRotated.y})`);
        } else if (isUnderline) {
          // Simple underline for non-rotated text
          const underlineY = centerY - textHeight / 2 - (adjustedFontSize * 0.15);
          page.drawLine({
            start: { x: centerX - textWidth / 2, y: underlineY },
            end: { x: centerX + textWidth / 2, y: underlineY },
            thickness: Math.max(1, adjustedFontSize * 0.05),
            color: rgb(r, g, b),
            opacity: opacity
          });
        }
      };
      
      // Apply watermark based on position or mosaic pattern
      if (isMosaic) {
        Object.values(centerPositions).forEach(pos => {
          drawWatermark(pos.x, pos.y);
        });
      } else {
        const pos = centerPositions[position];
        drawWatermark(pos.x, pos.y);
      }
    }
    
    const modifiedPdfBytes = await pdfDoc.save();
    return modifiedPdfBytes;
  } catch (error) {
    console.error('Error applying watermark in browser:', error);
    throw error;
  }
};
/**
 * Fixed version for the preview component's text watermark rendering
 * This should be used in PDFPreviewWithWatermark.jsx
 */
const renderTextWatermarkPreview = () => {
  const positions = {
    'top-left': { top: 20, left: 20 },
    'top-center': { top: 20, left: '50%', transform: 'translateX(-50%)' },
    'top-right': { top: 20, right: 20 },
    'mid-left': { top: '50%', left: 20, transform: 'translateY(-50%)' },
    'mid-center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    'mid-right': { top: '50%', right: 20, transform: 'translateY(-50%)' },
    'bottom-left': { bottom: 20, left: 20 },
    'bottom-center': { bottom: 20, left: '50%', transform: 'translateX(-50%)' },
    'bottom-right': { bottom: 20, right: 20 }
  };
  
  const posStyles = positions[position];
  
  // Apply rotation with proper transform origin
  let transform = posStyles.transform || '';
  if (rotation !== 0) {
    // Add rotation to existing transform, with transform-origin at center
    transform = transform ? `${transform} rotate(${rotation}deg)` : `rotate(${rotation}deg)`;
  }
  
  // Determine font weight and style based on user selections
  let fontWeight = isBold ? 'bold' : 'normal';
  let fontStyleValue = isItalic ? 'italic' : 'normal';
  
  return (
    <div 
      style={{
        position: 'absolute',
        ...posStyles,
        transform,
        transformOrigin: 'center', // This ensures rotation happens around center
        fontSize: `${fontSize}px`,
        color: fontColor,
        fontFamily: fontStyle === 'Times-Roman' ? 'Times New Roman, serif' : 
                   fontStyle === 'Courier' ? 'Courier, monospace' : 
                   'Helvetica, Arial, sans-serif',
        fontWeight,
        fontStyle: fontStyleValue,
        textDecoration: isUnderline ? 'underline' : 'none',
        textDecorationColor: fontColor, // Ensure underline has same color
        opacity: opacity,
        textAlign: 'center',
        maxWidth: '80%',
        wordBreak: 'break-word',
        pointerEvents: 'none',
        whiteSpace: 'nowrap' // Prevent text wrapping during rotation
      }}
    >
      {watermarkText}
    </div>
  );
};

/**
 * Additional fixes for image watermark rotation
 */
export const applyImageWatermarkInBrowser = async (pdfBytes, imageBlob, options) => {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Embed image
    const imageBytes = await imageBlob.arrayBuffer();
    let image;
    if (imageBlob.type === 'image/png') {
      image = await pdfDoc.embedPng(imageBytes);
    } else if (imageBlob.type === 'image/jpeg' || imageBlob.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(imageBytes);
    } else {
      // Convert to PNG
      const canvas = document.createElement('canvas');
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = URL.createObjectURL(imageBlob);
      });
      
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      const pngData = canvas.toDataURL('image/png').split(',')[1];
      const pngBytes = Uint8Array.from(atob(pngData), c => c.charCodeAt(0));
      image = await pdfDoc.embedPng(pngBytes);
      
      URL.revokeObjectURL(img.src);
    }
    
    const {
      imageSize = 30,
      opacity = 0.5,
      rotation = 0,
      position = 'mid-center',
      fromPage = 1,
      toPage = pdfDoc.getPageCount(),
      isMosaic = false
    } = options;
    
    const startPageIndex = Math.max(0, fromPage - 1);
    const endPageIndex = Math.min(pdfDoc.getPageCount() - 1, toPage - 1);
    
    for (let i = startPageIndex; i <= endPageIndex; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      
      const imgWidth = (width * imageSize) / 100;
      const imgHeight = (imgWidth / image.width) * image.height;
      
      // Center positions
      const centerPositions = {
        'top-left': { x: 100, y: height - 100 },
        'top-center': { x: width / 2, y: height - 100 },
        'top-right': { x: width - 100, y: height - 100 },
        'mid-left': { x: 100, y: height / 2 },
        'mid-center': { x: width / 2, y: height / 2 },
        'mid-right': { x: width - 100, y: height / 2 },
        'bottom-left': { x: 100, y: 100 },
        'bottom-center': { x: width / 2, y: 100 },
        'bottom-right': { x: width - 100, y: 100 }
      };
      
      const drawImageWatermark = (centerX, centerY) => {
        console.log(`Drawing image at center: (${centerX}, ${centerY}), rotation: ${rotation}°`);
        
        // Calculate bottom-left position
        const imgX = centerX - imgWidth / 2;
        const imgY = centerY - imgHeight / 2;
        
        if (rotation !== 0) {
          // Use transformation matrix approach for images too
          const angleRad = (rotation * Math.PI) / 180;
          const cos = Math.cos(angleRad);
          const sin = Math.sin(angleRad);
          
          const a = cos;
          const b = sin;
          const c = -sin;
          const d = cos;
          const e = centerX - centerX * cos + centerY * sin;
          const f = centerY - centerX * sin - centerY * cos;
          
          page.pushOperators(
            `q`,
            `${a} ${b} ${c} ${d} ${e} ${f} cm`
          );
          
          page.drawImage(image, {
            x: imgX,
            y: imgY,
            width: imgWidth,
            height: imgHeight,
            opacity
          });
          
          page.pushOperators(`Q`);
        } else {
          page.drawImage(image, {
            x: imgX,
            y: imgY,
            width: imgWidth,
            height: imgHeight,
            opacity
          });
        }
      };
      
      if (isMosaic) {
        Object.values(centerPositions).forEach(pos => {
          drawImageWatermark(pos.x, pos.y);
        });
      } else {
        const pos = centerPositions[position];
        drawImageWatermark(pos.x, pos.y);
      }
    }
    
    const modifiedPdfBytes = await pdfDoc.save();
    return modifiedPdfBytes;
  } catch (error) {
    console.error('Error applying image watermark:', error);
    throw error;
  }
};
/**
 * Apply image watermark to PDF in browser (client-side processing)
 * @param {ArrayBuffer} pdfBytes - Original PDF file data
 * @param {Blob} imageBlob - Image file to use as watermark
 * @param {Object} options - Watermark options
 * @returns {ArrayBuffer} - Processed PDF with watermark
 */

/**
 * Send pre-watermarked PDF to backend for storage/tracking
 * @param {ArrayBuffer} modifiedPdfBytes - PDF data with watermark already applied
 * @param {Object} metadata - Information about the watermarking operation
 * @returns {Promise} - Promise that resolves with result from backend
 */
export const sendPreprocessedPdfToBackend = async (modifiedPdfBytes, metadata) => {
    try {
      // Create a Blob from the ArrayBuffer
      const pdfBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      
      // Create FormData to send the file and metadata
      const formData = new FormData();
      formData.append('processed_pdf', pdfBlob, 'watermarked.pdf');
      formData.append('original_filename', metadata.originalFilename);
      formData.append('watermark_type', metadata.watermarkType);
      
      // Convert options to a JSON string instead of an object
      if (metadata.options) {
        formData.append('metadata', JSON.stringify(metadata.options));
      }
      
      // Add flag to indicate frontend processing
      formData.append('is_frontend_processed', 'true');

      // Get authentication token
      const token = getAuthToken();
      
      // Prepare headers
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('Sending auth token with watermark request:', token);
      } else {
        console.log('No auth token available for watermark request');
      }
      
      // Send to backend endpoint
      const response = await fetch(`${API_BASE_URL}/api/pdf/store-watermarked/`, {
        method: 'POST',
        headers: headers,
        body: formData,

      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Backend response:', result); // Log the response to see what IDs are returned
      
      return result;
    } catch (error) {
      console.error('Error sending preprocessed PDF to backend:', error);
      throw error;
    }
  };
/**
 * Add text watermark to a PDF file (client-side processing)
 * @param {File} pdfFile - The PDF file to watermark
 * @param {Object} options - Text watermark options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with result
 */
export const addTextWatermarkClientSide = async (pdfFile, options, onProgress) => {
    try {
      if (onProgress) onProgress(10);
      
      // Convert File to ArrayBuffer
      const pdfBytes = await pdfFile.arrayBuffer();
      if (onProgress) onProgress(30);
      
      // Apply watermark in browser
      const modifiedPdfBytes = await applyTextWatermarkInBrowser(pdfBytes, options);
      if (onProgress) onProgress(70);
      
      // Send to backend for storage only
      const result = await sendPreprocessedPdfToBackend(modifiedPdfBytes, {
        originalFilename: pdfFile.name,
        watermarkType: 'text',
        options
      });
      
      if (onProgress) onProgress(100);
      
      // Log the exact result for debugging
      console.log("Backend response for client-side watermarking:", result);
      
      // Store the result in sessionStorage to ensure we use the same ID consistently
      if (result.file_id) {
        try {
          sessionStorage.setItem('last_watermark_file_id', result.file_id);
        } catch (e) {
          console.warn("Could not store file_id in sessionStorage:", e);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Client-side text watermarking failed:', error);
      throw new Error(`Watermarking failed: ${error.message}`);
    }
  };
  
  // Updated handleDownload function for the component
  
  
/**
 * Add image watermark to a PDF file (client-side processing)
 * @param {File} pdfFile - The PDF file to watermark
 * @param {File} imageFile - The image file to use as watermark
 * @param {Object} options - Image watermark options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise that resolves with result
 */
export const addImageWatermarkClientSide = async (pdfFile, imageFile, options, onProgress) => {
  try {
    if (onProgress) onProgress(10);
    
    // Convert File to ArrayBuffer
    const pdfBytes = await pdfFile.arrayBuffer();
    if (onProgress) onProgress(30);
    
    // Apply watermark in browser
    const modifiedPdfBytes = await applyImageWatermarkInBrowser(pdfBytes, imageFile, options);
    if (onProgress) onProgress(70);
    
    // Send to backend for storage only
    const result = await sendPreprocessedPdfToBackend(modifiedPdfBytes, {
      originalFilename: pdfFile.name,
      watermarkType: 'image',
      options
    });
    
    if (onProgress) onProgress(100);
    return result;
  } catch (error) {
    console.error('Client-side image watermarking failed:', error);
    throw new Error(`Watermarking failed: ${error.message}`);
  }
};

/**
 * Get download URL for a watermarked PDF file
 * @param {string} fileId - ID of the file to download
 * @param {string} customFilename - Optional custom filename for the download
 * @returns {string} - Full download URL
 */
export const getWatermarkDownloadUrl = (fileId, customFilename = null) => {
    let url = `${API_BASE_URL}/download-pdf/?file_id=${fileId}`;
    
    // Add custom filename as a query parameter if provided
    if (customFilename) {
      url += `&filename=${encodeURIComponent(customFilename)}`;
    }
    
    return url;
  };
  
  /**
   * Download a watermarked PDF file programmatically
   * @param {string} fileId - ID of the file to download
   * @param {string} filename - Name to save the file as
   */
  export const downloadWatermarkedFile = (fileId, filename) => {
    const url = getWatermarkDownloadUrl(fileId, filename);
    console.log(`Downloading watermarked PDF from: ${url}`);
    
    const link = document.createElement('a');
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

/**
 * Check if uploaded file is valid PDF
 * @param {File} file - File to check
 * @returns {boolean} - True if file is a valid PDF
 */
export const isValidPDF = (file) => {
  if (!file) return false;
  
  // Check file extension
  const extension = file.name.split('.').pop().toLowerCase();
  if (extension !== 'pdf') return false;
  
  // Check file type
  if (file.type !== 'application/pdf') return false;
  
  return true;
};

/**
 * Check if uploaded file is valid image for watermarking
 * @param {File} file - File to check
 * @returns {boolean} - True if file is a valid image
 */
export const isValidImage = (file) => {
  if (!file) return false;
  
  // Check file type
  const validImageTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/webp'
  ];
  
  return validImageTypes.includes(file.type);
};