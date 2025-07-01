"use client"

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, Plus, Send, Eye, Download, Edit3, Type, Image as ImageIcon, Users, Mail, Check, Clock, AlertCircle, Trash2, Move, ZoomIn, ZoomOut, Search, Menu,RotateCcw, MousePointer2, RotateCw, Maximize2, Calendar, Timer, ChevronDown } from 'lucide-react';
import { addSignaturesToPDF, prepareSignatureData, getSignedPDFDownloadUrl, downloadSignedPDF, validatePDFFile, validateSignatures } from '../../api/signature_api';
import ModalLoader from '../tools_utility/ModalLoader';
import SelectFiles from '../tools_utility/SelectFiles';
import DownloadSection from '../tools_utility/DownloadSection';
import PDFPreviewModal from '../tools_utility/PDFPreviewModal.';

// Mock auth context for demo
const useAuth = () => ({
  user: { first_name: 'John', last_name: 'Doe' },
  isAuthenticated: true
});

// Page Thumbnail Component
const PageThumbnail = ({ pageNumber, pageData, signatures, onClick, isActive }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '20px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Render thumbnail when visible
  useEffect(() => {
    if (!isVisible || !pageData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Cancel previous render if exists
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    try {
      // Smaller scale for compact thumbnails
      const scale = 0.15;
      const viewport = pageData.getViewport({ scale });
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      context.clearRect(0, 0, canvas.width, canvas.height);

      renderTaskRef.current = pageData.render({
        canvasContext: context,
        viewport: viewport,
        intent: 'display',
        renderInteractiveForms: false,
        textLayers: false,
        annotationMode: 0,
        enableWebGL: false,
        renderTextLayer: false
      });

      renderTaskRef.current.promise
        .then(() => {
          if (canvasRef.current) {
            setIsLoaded(true);
          }
        })
        .catch((error) => {
          if (error.name !== 'RenderingCancelledException') {
            console.error(`Error rendering thumbnail ${pageNumber}:`, error);
            setIsLoaded(true);
          }
        });

    } catch (error) {
      console.error(`Failed to start rendering thumbnail ${pageNumber}:`, error);
      setIsLoaded(true);
    }

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [isVisible, pageData, pageNumber]);

  const handleClick = () => {
    onClick();
  };

  const hasSigs = signatures.length > 0;

  return (
    <div
      ref={containerRef}
      className="mb-3 cursor-pointer group relative"
      onClick={handleClick}
    >
      <div className={`relative border-2 rounded-md p-1 transition-all duration-200 ${
        isActive
          ? 'border-[#DA1F10] shadow-md bg-red-50 scale-105'
          : hasSigs 
            ? 'border-green-300 shadow-sm bg-green-50' 
            : 'border-gray-200 hover:border-[#DA1F10] hover:shadow-sm'
      }`}>
        
        {/* Thumbnail Container */}
        <div className="relative bg-white rounded overflow-hidden" style={{ aspectRatio: '8.5/11', height: '80px' }}>
          
          {/* Canvas for PDF thumbnail */}
          <canvas
            ref={canvasRef}
            className={`w-full h-full object-contain transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          
          {/* Loading state */}
          {!isLoaded && isVisible && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
              <div className="w-3 h-3 border-2 border-red-200 border-t-[#DA1F10] rounded-full animate-spin"></div>
              <span className="text-xs text-gray-400 mt-1">Loading</span>
            </div>
          )}
          
          {/* Signature count badge */}
          {hasSigs && (
            <div className="absolute top-1 right-1 z-10">
              <div className="bg-green-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 font-bold shadow-sm border border-white">
                {signatures.length}
              </div>
            </div>
          )}
        </div>
        
        {/* Page number */}
        <div className="text-center mt-1">
          <span className={`text-xs font-medium transition-colors ${
            isActive ? 'text-[#DA1F10]' : hasSigs ? 'text-green-700' : 'text-gray-600'
          }`}>
            {pageNumber}
          </span>
        </div>
      </div>
    </div>
  );
};

// Signature Creation Modal with High-Quality Rendering
const SignatureModal = ({ isOpen, onClose, onSave, savedSignatures }) => {
  const [signatureType, setSignatureType] = useState('type');
  const [textInput, setTextInput] = useState('');
  const [selectedFont, setSelectedFont] = useState('Dancing Script');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [signature, setSignature] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = useRef(null);
  const [drawnSignature, setDrawnSignature] = useState(null);

  // High-quality signature fonts
  const signatureFonts = [
    { name: 'Dancing Script', value: 'Dancing Script, cursive', preview: 'Alex Appleseed' },
    { name: 'Great Vibes', value: 'Great Vibes, cursive', preview: 'Alex Appleseed' },
    { name: 'Allura', value: 'Allura, cursive', preview: 'Alex Appleseed' },
    { name: 'Alex Brush', value: 'Alex Brush, cursive', preview: 'Alex Appleseed' },
    { name: 'Pacifico', value: 'Pacifico, cursive', preview: 'Alex Appleseed' },
    { name: 'Sacramento', value: 'Sacramento, cursive', preview: 'Alex Appleseed' },
    { name: 'Satisfy', value: 'Satisfy, cursive', preview: 'Alex Appleseed' },
    { name: 'Courgette', value: 'Courgette, cursive', preview: 'Alex Appleseed' }
  ];

  // Color options
  const colorOptions = [
    '#000000', '#1e40af', '#2563eb', '#3b82f6', '#6b7280', '#374151', '#111827'
  ];

  // Load saved signatures when modal opens
  useEffect(() => {
    if (isOpen && savedSignatures) {
      if (savedSignatures.type) {
        setTextInput(savedSignatures.type.text || '');
        setSelectedFont(savedSignatures.type.font || 'Dancing Script');
        setSelectedColor(savedSignatures.type.color || '#000000');
      }
      if (savedSignatures.draw) {
        setDrawnSignature(savedSignatures.draw);
      }
      if (savedSignatures.upload) {
        setSignature(savedSignatures.upload);
      }
    }
  }, [isOpen, savedSignatures]);

  // Auto-generate signature when user types
  useEffect(() => {
    if (signatureType === 'type' && textInput.trim()) {
      generateTextSignature();
    }
  }, [signatureType, textInput, selectedFont, selectedColor]);

  // Drawing functions with higher quality
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(
      (e.clientX - rect.left) * 2, // Scale up for high DPI
      (e.clientY - rect.top) * 2
    );
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 6; // Thicker line for better quality
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = selectedColor;
    ctx.lineTo(
      (e.clientX - rect.left) * 2,
      (e.clientY - rect.top) * 2
    );
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawnSignature(null);
  };

  const saveDrawnSignature = () => {
    const canvas = canvasRef.current;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    let hasContent = false;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        const alpha = data[index + 3];
        
        if (alpha > 0) {
          hasContent = true;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    if (!hasContent) return;
    
    const padding = 20;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width, maxX + padding);
    maxY = Math.min(canvas.height, maxY + padding);
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    tempCanvas.width = width;
    tempCanvas.height = height;
    
    // Keep transparent background
    tempCtx.drawImage(canvas, minX, minY, width, height, 0, 0, width, height);
    
    const dataURL = tempCanvas.toDataURL('image/png', 1.0); // Max quality
    setDrawnSignature(dataURL);
  };

  // Generate high-quality text signature
  const generateTextSignature = () => {
    if (!textInput.trim()) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Use larger font size for better quality
    const fontSize = 96; // Double the size
    const fontFamily = signatureFonts.find(f => f.name === selectedFont)?.value || 'Dancing Script, cursive';
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(textInput);
    const textWidth = metrics.width;
    const textHeight = fontSize * 1.5;
    
    canvas.width = textWidth + 40;
    canvas.height = textHeight + 40;
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw text
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = selectedColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(textInput, 20, canvas.height / 2);
    
    const dataURL = canvas.toDataURL('image/png', 1.0); // Max quality
    setSignature(dataURL);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => setSignature(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    let signatureToSave = null;
    let signatureData = {};

    if (signatureType === 'type' && signature) {
      signatureToSave = signature;
      signatureData = {
        type: {
          image: signature,
          text: textInput,
          font: selectedFont,
          color: selectedColor
        }
      };
    } else if (signatureType === 'draw' && drawnSignature) {
      signatureToSave = drawnSignature;
      signatureData = {
        draw: drawnSignature
      };
    } else if (signatureType === 'upload' && signature) {
      signatureToSave = signature;
      signatureData = {
        upload: signature
      };
    }

    if (signatureToSave) {
      onSave(signatureToSave, signatureData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Load Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Allura&family=Alex+Brush&family=Pacifico&family=Sacramento&family=Satisfy&family=Courgette&display=swap" rel="stylesheet" />
      
      <div className="fixed inset-0 backdrop-filter backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-5xl w-full max-h-[85vh] overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Create Your Signature</h3>
              <button onClick={onClose} className="text-gray-400 cursor-pointer hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Signature Type Tabs */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              {[
                { key: 'type', label: 'Type', icon: Type },
                { key: 'draw', label: 'Draw', icon: Edit3 },
                { key: 'upload', label: 'Upload', icon: Upload }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSignatureType(key)}
                  className={`flex-1 flex items-center justify-center cursor-pointer py-2 px-4 rounded-md transition-colors ${
                    signatureType === key ? 'bg-white text-[#DA1F10] shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              ))}
            </div>

            {/* Type Tab */}
            {signatureType === 'type' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-medium mb-2">Your Name:</label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DA1F10] focus:border-transparent text-lg"
                  />
                </div>

                {/* Color Selection with Use Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-lg font-medium mb-2">Color:</label>
                    <div className="flex gap-2">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-all ${
                            selectedColor === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  {signature && (
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Use This Signature
                    </button>
                  )}
                </div>

                {/* Font Selection */}
                {textInput && (
                  <div>
                    <label className="block text-lg font-medium mb-2">Choose Font Style:</label>
                    <div className="grid grid-cols-2 gap-4 max-h-48 overflow-y-auto border rounded-lg p-4">
                      {signatureFonts.map(font => (
                        <div
                          key={font.name}
                          onClick={() => setSelectedFont(font.name)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedFont === font.name 
                              ? 'border-[#DA1F10] bg-red-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div 
                            className="text-2xl text-center"
                            style={{ 
                              fontFamily: font.value,
                              color: selectedColor
                            }}
                          >
                            {textInput}
                          </div>
                          <p className="text-xs text-gray-500 text-center mt-1">{font.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Draw Tab */}
            {signatureType === 'draw' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-lg font-medium mb-2">Color:</label>
                    <div className="flex gap-2">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-all ${
                            selectedColor === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  {drawnSignature && (
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Use This Signature
                    </button>
                  )}
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-lg text-gray-600 mb-2">Draw your signature below:</p>
                    <canvas
                      ref={canvasRef}
                      width={1000}
                      height={300}
                      style={{ width: '100%', height: '150px' }}
                      className="border-2 border-gray-300 rounded-lg cursor-crosshair bg-white"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={clearCanvas}
                        className="px-4 py-2 border cursor-pointer border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Clear
                      </button>
                      <button
                        onClick={saveDrawnSignature}
                        className="px-4 py-2 bg-[#DA1F10] cursor-pointer text-white rounded-lg hover:bg-red-700"
                      >
                        Save Drawing
                      </button>
                    </div>
                  </div>
                  
                  {/* Preview on the right */}
                  {drawnSignature && (
                    <div className="w-64">
                      <p className="text-lg font-medium mb-2">Preview:</p>
                      <div className="border rounded-lg p-4 bg-gray-50 text-center h-32 flex items-center justify-center">
                        <img src={drawnSignature} alt="Signature" className="max-h-full max-w-full" style={{ objectFit: 'contain' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload Tab */}
            {signatureType === 'upload' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium">Upload Signature Image</h4>
                  {signature && (
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Use This Signature
                    </button>
                  )}
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                {!signature ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#DA1F10]"
                  >
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Click to upload signature image</p>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG supported</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-gray-50 text-center">
                      <img src={signature} alt="Uploaded signature" className="max-h-32 mx-auto" style={{ objectFit: 'contain' }} />
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-2 border border-gray-300 cursor-pointer rounded-lg hover:bg-gray-50"
                    >
                      Choose Different Image
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// PDF Page Component with Accurate Positioning
const PDFPageRenderer = ({ pageData, pageNumber, zoom, onSignaturePlace, signatures, onUpdateSignature, onDeleteSignature, signatureMode, containerWidth }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [renderTask, setRenderTask] = useState(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!pageData || !canvasRef.current) return;

    if (renderTask) {
      renderTask.cancel();
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Calculate scale for fit to screen
    let scale = zoom;
    if (zoom === 'fit' && containerWidth) {
      const pageViewport = pageData.getViewport({ scale: 1 });
      const padding = 80; // Account for margins
      scale = (containerWidth - padding) / pageViewport.width;
    }
    
    // Use device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const viewport = pageData.getViewport({ scale: scale * dpr });
    
    // Set actual size in memory
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Scale down using CSS
    canvas.style.width = `${viewport.width / dpr}px`;
    canvas.style.height = `${viewport.height / dpr}px`;
    
    // Store dimensions for signature positioning
    setPageDimensions({
      width: viewport.width / dpr,
      height: viewport.height / dpr
    });

    const newRenderTask = pageData.render({
      canvasContext: context,
      viewport: viewport,
      intent: 'display'
    });

    setRenderTask(newRenderTask);
    setIsLoaded(false);

    newRenderTask.promise
      .then(() => setIsLoaded(true))
      .catch((error) => {
        if (error.name !== 'RenderingCancelledException') {
          console.error(`Error rendering page ${pageNumber}:`, error);
        }
      });

    return () => {
      if (newRenderTask) {
        newRenderTask.cancel();
      }
    };
  }, [pageData, zoom, pageNumber, containerWidth]);

  const handlePageClick = (e) => {
    if (!signatureMode || !containerRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onSignaturePlace(pageNumber, x, y);
  };

  const pageSignatures = signatures.filter(sig => sig.page === pageNumber);

  return (
    <div className="relative mb-8 mx-auto" style={{ width: 'fit-content' }}>
      <div className="absolute -left-8 top-4 text-lg text-gray-500 font-medium">
        {pageNumber}
      </div>
      
      <div 
        ref={containerRef}
        className={`relative bg-white shadow-lg border ${signatureMode ? 'cursor-crosshair' : 'cursor-default'}`}
        onMouseDown={handlePageClick}
        style={{ width: `${pageDimensions.width}px`, height: `${pageDimensions.height}px` }}
      >
        <canvas ref={canvasRef} className="block" />
        
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-red-200 border-t-[#DA1F10] rounded-full animate-spin mb-2"></div>
              <span className="text-lg text-gray-600">Loading page {pageNumber}...</span>
            </div>
          </div>
        )}
        
        {/* Signature Overlays */}
        {isLoaded && pageSignatures.map((sig) => (
          <SignatureOverlay
            key={sig.id}
            signature={sig}
            onUpdate={onUpdateSignature}
            onDelete={onDeleteSignature}
            pageDimensions={pageDimensions}
          />
        ))}
      </div>
    </div>
  );
};

// Enhanced Signature Overlay Component with Better Positioning
const SignatureOverlay = ({ signature, onUpdate, onDelete, pageDimensions }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialState, setInitialState] = useState({});
  const signatureRef = useRef(null);

  const handleMouseDown = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (action === 'drag') {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialState({ x: signature.x, y: signature.y });
    } else if (action === 'resize') {
      setIsResizing(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialState({ 
        width: signature.width || 60,
        height: signature.height || 30,
        x: signature.x, 
        y: signature.y 
      });
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!signatureRef.current?.parentElement) return;

    const parentRect = signatureRef.current.parentElement.getBoundingClientRect();
    
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const deltaXPercent = (deltaX / parentRect.width) * 100;
      const deltaYPercent = (deltaY / parentRect.height) * 100;
      
      const newX = Math.max(0, Math.min(95, initialState.x + deltaXPercent));
      const newY = Math.max(0, Math.min(95, initialState.y + deltaYPercent));
      
      onUpdate(signature.id, { x: newX, y: newY });
    } else if (isResizing) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // Maintain aspect ratio if signature has one stored
      let newWidth, newHeight;
      if (signature.aspectRatio) {
        // Use X movement to determine size, maintain aspect ratio
        newWidth = Math.max(40, Math.min(200, initialState.width + deltaX));
        newHeight = Math.round(newWidth / signature.aspectRatio);
      } else {
        // Free resize for stamps or signatures without aspect ratio
        newWidth = Math.max(40, Math.min(200, initialState.width + deltaX));
        newHeight = Math.max(20, Math.min(100, initialState.height + deltaY));
      }
      
      onUpdate(signature.id, { 
        width: newWidth,
        height: newHeight
      });
    }
  }, [isDragging, isResizing, dragStart, initialState, signature.id, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const width = signature.width || 60;
  const height = signature.height || 30;

  return (
    <div
      ref={signatureRef}
      className="absolute group select-none"
      style={{
        left: `${signature.x}%`,
        top: `${signature.y}%`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: 10
      }}
    >
      <div
        className="relative w-full h-full border-2 border-[#DA1F10] border-dashed bg-transparent hover:bg-opacity-30 rounded cursor-move transition-all duration-200"
        onMouseDown={(e) => handleMouseDown(e, 'drag')}
      >
        <img 
          src={signature.image} 
          alt="Signature"
          className="w-full h-full object-contain p-1"
          draggable={false}
          style={{ 
            background: 'transparent',
            imageRendering: 'crisp-edges',
            filter: 'contrast(1.1)',
            objectFit: 'contain'
          }}
        />
        
        <div className="absolute -top-8 left-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(signature.id);
            }}
            className="w-6 h-6 bg-red-500 text-white cursor-pointer rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-lg"
            title="Remove signature"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#DA1F10] border border-white rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto hover:bg-red-700"
            onMouseDown={(e) => handleMouseDown(e, 'resize')}
            title="Resize signature"
          >
            <div className="absolute inset-1 border border-white rounded-full"></div>
          </div>
        </div>
        
        <div className="absolute -bottom-6 left-0 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white px-2 py-1 rounded shadow-sm whitespace-nowrap">
          {Math.round(signature.x)}%, {Math.round(signature.y)}% • {width}x{height}px
        </div>
      </div>
    </div>
  );
};

// Main PDF Signer Component
const PDFSigner = () => {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState('upload');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState('fit');
  const [showZoomDropdown, setShowZoomDropdown] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [result, setResult] = useState(null);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Signature states
  const [userSignature, setUserSignature] = useState(null);
  const [savedSignatures, setSavedSignatures] = useState({});
  const [signatures, setSignatures] = useState([]);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureMode, setSignatureMode] = useState(false);

  // Preview modal state
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    pdfUrl: null,
    fileName: ''
  });

  // Refs for scrolling
  const thumbnailContainerRef = useRef(null);
  const mainViewerRef = useRef(null);
  const resultSectionRef = useRef(null);
  const viewerContainerRef = useRef(null);

  // Zoom options
  const zoomOptions = [
    { value: 'fit', label: 'Fit to Screen' },
    { value: 0.5, label: '50%' },
    { value: 0.75, label: '75%' },
    { value: 1.0, label: '100%' },
    { value: 1.25, label: '125%' },
    { value: 1.5, label: '150%' },
    { value: 2.0, label: '200%' }
  ];

  // File size limit (in bytes)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
  
  // Calculate estimated upload time based on file size
  const estimatedUploadTime = pdfFile ? Math.ceil(pdfFile.size / (400 * 1024)) : 0;

  // Update container width for fit to screen
  useEffect(() => {
    const updateWidth = () => {
      if (viewerContainerRef.current) {
        setContainerWidth(viewerContainerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    return () => window.removeEventListener('resize', updateWidth);
  }, [step]);

  // Load PDF.js
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      };
      document.head.appendChild(script);
    }
  }, []);

  // Scroll to results section when operation completes
  useEffect(() => {
    if (result && resultSectionRef.current) {
      setTimeout(() => {
        resultSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [result]);

  // Generate preview whenever file changes
  useEffect(() => {
    const generatePreview = async () => {
      if (!pdfFile || !window.pdfjsLib) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const arrayBuffer = await Promise.race([
          pdfFile.arrayBuffer(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('File reading timed out')), 10000)
          )
        ]);
        
        try {
          // Attempt to load the PDF
          const loadingTask = window.pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
            cMapPacked: true
          });
          
          const pdf = await loadingTask.promise;
          setTotalPages(pdf.numPages);
          setPdfDoc(pdf);
          
          // Load all pages
          const pages = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            pages.push(page);
          }
          setPdfPages(pages);
          
          setIsEncrypted(false);
          setError(null);
          setStep('edit');
          
        } catch (error) {
          console.error('Error generating preview:', error);
          
          // Check if the PDF is password protected
          if (
            error.name === 'PasswordException' || 
            error.message.includes('password') || 
            error.message.includes('Password')
          ) {
            setIsEncrypted(true);
            setError(
              <div>
                <p className="font-medium mb-2">This PDF is password protected</p>
                <p className="text-lg">Please use our <span className="font-medium text-[#DA1F10]">PDF Unlocker</span> tool first to remove the password, then try again with the unlocked PDF.</p>
              </div>
            );
          } else if (error.message.includes('Invalid PDF structure')) {
            setError(
              <div>
                <p className="font-medium mb-2">Invalid PDF file</p>
                <p className="text-lg">The file appears to be corrupted or is not a valid PDF. Please check the file and try again.</p>
              </div>
            );
          } else {
            setError("Unable to process this PDF file. It may be corrupted or use unsupported features.");
          }
          
          // Reset state on error
          setPdfFile(null);
          setStep('upload');
        }
      } catch (error) {
        console.error('General error processing file:', error);
        setError("Failed to read the file. Please make sure it's a valid PDF and try again.");
        setPdfFile(null);
        setStep('upload');
      } finally {
        setLoading(false);
      }
    };
    
    if (pdfFile) {
      generatePreview();
    }
  }, [pdfFile]);

  // Handle files selected
  const handleFilesSelected = (selectedFiles) => {
    if (selectedFiles && selectedFiles.length > 0) {
      const newFile = selectedFiles[0];
      if (validateFile(newFile)) {
        setPdfFile(newFile);
      }
    }
  };

  // Validate files before adding them
  const validateFile = (newFile) => {
    setError(null);
    
    if (newFile.type !== 'application/pdf') {
      setError(`"${newFile.name}" is not a PDF file. Only PDF files are supported.`);
      return false;
    }
    
    if (newFile.size > MAX_FILE_SIZE) {
      setError(`"${newFile.name}" exceeds the 100 MB file size limit.`);
      return false;
    }
    
    return true;
  };

  // Handle page navigation with thumbnail sync
  const handlePageNavigation = (pageNumber) => {
    setCurrentPage(pageNumber);
    
    // Scroll main viewer to page
    const pageElement = document.getElementById(`page-${pageNumber}`);
    if (pageElement && mainViewerRef.current) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Scroll thumbnail to active page
    const thumbnailElement = document.querySelector(`[data-page="${pageNumber}"]`);
    if (thumbnailElement && thumbnailContainerRef.current) {
      const container = thumbnailContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = thumbnailElement.getBoundingClientRect();
      
      if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
        thumbnailElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Handle signature placement with better initial sizing
  const handleSignaturePlace = (pageNumber, x, y) => {
    if (!signatureMode || !userSignature) return;

    // Get the natural aspect ratio of the signature image
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      const baseWidth = 60;
      const baseHeight = Math.round(baseWidth / aspectRatio);

      const newSignature = {
        id: Date.now() + Math.random(),
        page: pageNumber,
        x: Math.max(0, Math.min(95, x - 3)),
        y: Math.max(0, Math.min(95, y - 1.5)),
        width: baseWidth,
        height: baseHeight,
        image: userSignature,
        aspectRatio: aspectRatio
      };

      setSignatures(prev => [...prev, newSignature]);
    };
    img.src = userSignature;
  };

  // Update signature position/size
  const updateSignature = (id, updates) => {
    setSignatures(prev => prev.map(sig => 
      sig.id === id ? { ...sig, ...updates } : sig
    ));
  };

  // Delete signature
  const deleteSignature = (id) => {
    setSignatures(prev => prev.filter(sig => sig.id !== id));
  };

  // Toggle signature mode
  const toggleSignatureMode = () => {
    if (!userSignature) {
      setError('Please create a signature first.');
      return;
    }
    setSignatureMode(!signatureMode);
  };

  // Add date stamp - centered and larger
  const addDateStamp = (pageNumber) => {
    const currentDate = new Date().toLocaleDateString();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Larger size for better visibility
    const fontSize = 48;
    ctx.font = `${fontSize}px Arial, sans-serif`;
    const metrics = ctx.measureText(currentDate);
    canvas.width = metrics.width + 60;
    canvas.height = 80;
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentDate, 30, 40);
    
    const dataURL = canvas.toDataURL('image/png', 1.0);
    
    const newSignature = {
      id: Date.now() + Math.random(),
      page: pageNumber,
      x: 35, // Centered position
      y: 45, // Centered position
      width: 120, // Larger size
      height: 30, // Larger size
      image: dataURL,
      type: 'date'
    };

    setSignatures(prev => [...prev, newSignature]);
  };

  // Add time stamp - centered and larger
  const addTimeStamp = (pageNumber) => {
    const currentTime = new Date().toLocaleTimeString();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Larger size for better visibility
    const fontSize = 48;
    ctx.font = `${fontSize}px Arial, sans-serif`;
    const metrics = ctx.measureText(currentTime);
    canvas.width = metrics.width + 60;
    canvas.height = 80;
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentTime, 30, 40);
    
    const dataURL = canvas.toDataURL('image/png', 1.0);
    
    const newSignature = {
      id: Date.now() + Math.random(),
      page: pageNumber,
      x: 35, // Centered position
      y: 50, // Centered position
      width: 120, // Larger size
      height: 30, // Larger size
      image: dataURL,
      type: 'time'
    };

    setSignatures(prev => [...prev, newSignature]);
  };

  // Handle saved signatures
  const handleSaveSignature = (signature, signatureData) => {
    setUserSignature(signature);
    
    // Merge with existing saved signatures
    setSavedSignatures(prev => ({
      ...prev,
      ...signatureData
    }));
  };

  // Complete signing - Process PDF with backend
  const completeSigning = async () => {
    if (signatures.length === 0) {
      setError('Please add at least one signature before completing.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Validate inputs
      validatePDFFile(pdfFile);
      const processedSignatures = prepareSignatureData(signatures);
      validateSignatures(processedSignatures);

      // Call the API
      const result = await addSignaturesToPDF(
        pdfFile,
        processedSignatures,
        (progressValue) => setProgress(progressValue)
      );

      setResult(result);
      // Don't change step to keep editor visible

    } catch (error) {
      console.error('Signature processing failed:', error);
      setError(error.message || 'Failed to process signatures. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to start
  const reset = () => {
    setPdfFile(null);
    setPdfDoc(null);
    setPdfPages([]);
    setSignatures([]);
    setUserSignature(null);
    setSavedSignatures({});
    setStep('upload');
    setError(null);
    setSignatureMode(false);
    setCurrentPage(1);
    setResult(null);
    setIsEncrypted(false);
    setProgress(0);
    setZoom('fit');
  };

  // Handle download
  const handleDownload = (fileId, fileName) => {
    const finalFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    const downloadUrl = getSignedPDFDownloadUrl(fileId, finalFileName);
    downloadSignedPDF(downloadUrl, finalFileName);
  };

  // Handle preview
  const handleOpenPreview = async () => {
    if (result) {
      try {
        setIsProcessing(true);
        
        const downloadUrl = getSignedPDFDownloadUrl(result.job_id);
        const response = await fetch(downloadUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        const pdfBlob = await response.blob();
        const objectUrl = URL.createObjectURL(pdfBlob);
        
        setPreviewModal({
          isOpen: true,
          pdfUrl: objectUrl,
          fileName: 'Signed Document.pdf'
        });
      } catch (error) {
        console.error('Error preparing PDF preview:', error);
        setError('Unable to preview the PDF. Please try downloading instead.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Close preview modal
  const handleClosePreview = () => {
    setPreviewModal({
      isOpen: false,
      pdfUrl: null,
      fileName: ''
    });
  };

  return (
    <div className="max-w-full">
      {/* Load Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Allura&family=Alex+Brush&family=Pacifico&family=Sacramento&family=Satisfy&family=Courgette&display=swap" rel="stylesheet" />
      
      {/* Modal Loader */}
      <ModalLoader
        isVisible={isProcessing}
        progress={progress}
        estimatedTime={estimatedUploadTime}
        text={"Processing signatures..."}
      />

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={previewModal.isOpen}
        onClose={handleClosePreview}
        pdfUrl={previewModal.pdfUrl}
        fileName={previewModal.fileName}
      />
      
      {/* Upload Step - Show only when no file */}
      {step === 'upload' && !loading && (
        <>
          {/* Title */}
          <div className="text-center mb-8 lg:mb-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl mt-4 font-bold mb-2">
              <span className="text-[#DA1F10]">PDF </span> Signer
            </h1>
            <p className="text-gray-600 text-lg sm:text-base">Add digital signatures to your PDF document</p>
            <p className="text-xs sm:text-lg text-gray-500 mt-2">Max file size: 100 MB</p>
          </div>
          
          <SelectFiles 
            onFilesSelected={handleFilesSelected}
            onError={setError}
            buttonText="Select PDF File"
            buttonColor="red"
            buttonSize="large"
            multiple={false}
          />
        </>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-red-200 border-t-[#DA1F10] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Processing your PDF...</p>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="w-full p-4 sm:p-6 bg-red-50 rounded-xl border border-red-200 mb-6 shadow-sm max-w-2xl mx-auto">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-red-800 mb-1">Error</h3>
              <div className="text-lg text-red-700">{error}</div>
              <button
                onClick={() => setError(null)}
                className="mt-3 text-lg font-medium cursor-pointer text-red-600 hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Step */}
      {step === 'edit' && (
        <div className="flex gap-4 h-[calc(100vh-100px)]">
          {/* Thumbnail Sidebar */}
          <div className="w-40 bg-white rounded-lg shadow-sm border flex flex-col">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 text-lg">Pages</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{totalPages}</span>
              </div>
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  placeholder="Page..."
                  className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#DA1F10]"
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value && value <= totalPages && value > 0) {
                      handlePageNavigation(value);
                    }
                  }}
                />
              </div>
            </div>
            
            <div 
              ref={thumbnailContainerRef}
              className="flex-1 overflow-y-auto p-2"
              style={{ maxHeight: 'calc(100vh - 180px)' }}
            >
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;
                const pageSignatures = signatures.filter(sig => sig.page === pageNumber);
                
                return (
                  <div key={pageNumber} data-page={pageNumber}>
                    <PageThumbnail
                      pageNumber={pageNumber}
                      pageData={pdfPages[index]}
                      signatures={pageSignatures}
                      isActive={currentPage === pageNumber}
                      onClick={() => handlePageNavigation(pageNumber)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 min-w-0" ref={viewerContainerRef}>
            <div className="bg-white rounded-lg shadow-sm border p-4 h-full flex flex-col">
              {/* Toolbar */}
              <div className="flex justify-between items-center mb-4 pb-3 border-b">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">{pdfFile?.name}</h3>
                  <p className="text-lg text-gray-600">Page {currentPage} of {totalPages}</p>
                </div>
                
                <div className="flex items-center gap-3 ml-4">
                  {signatureMode && (
                    <div className="flex items-center px-3 py-1.5 bg-red-100 text-[#DA1F10] rounded-full text-lg font-medium animate-pulse ">
                      <MousePointer2 className="w-4 h-4 mr-1.5" />
                      Click to place signature
                    </div>
                  )}
                  
                  <div>
                    <button
                      onClick={reset}
                      className="px-3 py-1.5 bg-red-700 text-white cursor-pointer rounded-lg hover:bg-red-800 transition-colors"
                      title="Reset"
                    >
                      Choose Another PDF
                    </button>
                  </div>
                  
                  {/* Zoom Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowZoomDropdown(!showZoomDropdown)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span className="text-lg font-medium">
                        {zoom === 'fit' ? 'Fit' : `${Math.round(zoom * 100)}%`}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {showZoomDropdown && (
                      <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-20">
                        {zoomOptions.map(option => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setZoom(option.value);
                              setShowZoomDropdown(false);
                            }}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer ${
                              zoom === option.value ? 'bg-gray-50 font-medium' : ''
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PDF Pages */}
              <div 
                ref={mainViewerRef}
                className="flex-1 overflow-auto bg-gray-50 p-4 rounded"
              >
                {pdfPages.map((pageData, index) => (
                  <div key={index + 1} id={`page-${index + 1}`}>
                    <PDFPageRenderer
                      pageData={pageData}
                      pageNumber={index + 1}
                      zoom={zoom}
                      onSignaturePlace={handleSignaturePlace}
                      signatures={signatures}
                      onUpdateSignature={updateSignature}
                      onDeleteSignature={deleteSignature}
                      signatureMode={signatureMode}
                      containerWidth={containerWidth}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tools Sidebar */}
          <div className="w-80">
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4 h-full flex flex-col overflow-scroll">
              <h3 className="font-semibold text-lg">Signature Tools</h3>

              {/* Current Signature */}
              {userSignature && (
                <div className="p-4 border rounded-lg bg-red-50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-lg">Your Signature</span>
                    <button
                      onClick={() => {
                        setUserSignature(null);
                        setSignatures([]);
                        setSignatureMode(false);
                      }}
                      className="text-red-500 hover:text-red-700 cursor-pointer transition-colors"
                      title="Remove signature"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="bg-white p-3 rounded mb-3 text-center border">
                    <img src={userSignature} alt="Signature" className="max-h-12 mx-auto" />
                  </div>
                  <button
                    onClick={toggleSignatureMode}
                    className={`w-full py-2.5 px-3 cursor-pointer rounded-lg font-medium transition-all duration-200 text-lg ${
                      signatureMode 
                        ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md'
                        : 'bg-[#DA1F10] text-white hover:bg-red-700 shadow-md'
                    }`}
                  >
                    {signatureMode ? '🖱️ Stop Placing' : '✍️ Start Placing'}
                  </button>
                  {signatureMode && (
                    <p className="text-xs text-gray-600 mt-2 text-center">
                      Click anywhere on the PDF to place your signature
                    </p>
                  )}
                </div>
              )}

              {/* Create/Edit Signature - with blinking animation when no signature */}
              <button
                onClick={() => setShowSignatureModal(true)}
                className={`w-full flex items-center cursor-pointer justify-center py-3 px-4 bg-red-700 text-white rounded-lg hover:bg-red-900 shadow-md text-lg font-medium ${
                  !userSignature && step === 'edit' ? 'animate-pulse duration-[100]' : ''
                }`}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {userSignature ? 'Change Signature' : 'Create Signature'}
              </button>

              {/* Quick Stamps */}
              <div className="space-y-2">
                <h4 className="font-medium text-lg text-gray-700">Quick Stamps</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addDateStamp(currentPage)}
                    className="flex items-center cursor-pointer justify-center py-2.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-lg transition-colors"
                    title="Add today's date"
                  >
                    <Calendar className="w-4 h-4 mr-1.5" />
                    Date
                  </button>
                  <button
                    onClick={() => addTimeStamp(currentPage)}
                    className="flex items-center cursor-pointer justify-center py-2.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-lg transition-colors"
                    title="Add current time"
                  >
                    <Timer className="w-4 h-4 mr-1.5" />
                    Time
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t">
                <button
                  onClick={completeSigning}
                  disabled={signatures.length === 0}
                  className={`w-full py-3 px-4 rounded-lg cursor-pointer font-medium transition-colors shadow-md text-lg ${
                    signatures.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {signatures.length === 0 ? 'Add Signatures First' : `Sign PDF (${signatures.length})`}
                </button>
                
                <button
                  onClick={reset}
                  className="w-full py-2.5 px-4 cursor-pointer text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-lg font-medium"
                >
                  Start Over
                </button>
              </div>

              {/* Placed Signatures List */}
              {signatures.length > 0 && (
                <div className="flex-1 min-h-0 border-t pt-4">
                  <div className="h-full flex flex-col">
                    <h4 className="font-medium mb-3 text-lg flex items-center justify-between">
                      <span>Placed Signatures ({signatures.length})</span>
                      <button
                        onClick={() => setSignatures([])}
                        className="text-xs text-red-600 cursor-pointer hover:text-red-700"
                      >
                        Clear All
                      </button>
                    </h4>
                    <div 
                      className="flex-1 space-y-2 pr-2 overflow-y-auto"
                      style={{ maxHeight: '200px' }}
                    >
                      {signatures.map((sig, index) => (
                        <div key={sig.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <span className="text-xs font-semibold text-gray-700">#{index + 1}</span>
                            <div className="w-12 h-6 bg-white rounded border border-gray-200 p-0.5 flex items-center justify-center">
                              <img 
                                src={sig.image} 
                                alt="Signature preview" 
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <span className="text-xs text-gray-600">Page {sig.page}</span>
                            {sig.type && (
                              <span className="text-xs text-gray-500 capitalize">({sig.type})</span>
                            )}
                          </div>
                          <button
                            onClick={() => deleteSignature(sig.id)}
                            className="text-red-500 cursor-pointer hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                            title="Remove signature"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Section - Always visible when complete */}
      {result && (
        <div ref={resultSectionRef} className="mt-8">
          <DownloadSection
            files={[{
              id: result.job_id,
              name: pdfFile ? pdfFile.name.replace('.pdf', '_signed.pdf') : 'Signed Document.pdf',
              size: result.output_size
            }]}
            downloadHandler={handleDownload}
            previewHandler={handleOpenPreview}
            title="Download Signed PDF"
            color="red"
            startOverHandler={reset}
          />
        </div>
      )}

      {/* Signature Modal - with saved signatures support */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSave={handleSaveSignature}
        savedSignatures={savedSignatures}
      />
    </div>
  );
};

export default PDFSigner;