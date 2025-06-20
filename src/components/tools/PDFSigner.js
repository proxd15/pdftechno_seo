"use client"

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, Plus, Send, Eye, Download, Edit3, Type, Image, Users, Mail, Check, Clock, AlertCircle, Trash2, Move, ZoomIn, ZoomOut, Search, Menu, MousePointer2, RotateCw, Maximize2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// File Upload Component
const FileUpload = ({ onFileSelect, error, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    onError(null);
    const file = files[0];
    
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      onError('Please select a PDF file only.');
      return;
    }
    
    if (file.size > 100 * 1024 * 1024) {
      onError('File size must be less than 100MB.');
      return;
    }
    
    onFileSelect(file);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(Array.from(e.target.files))}
        accept="application/pdf"
        className="hidden"
      />
      
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <Upload className="w-16 h-16 mx-auto mb-4 text-blue-500" />
        <h3 className="text-xl font-semibold mb-2">Upload PDF Document</h3>
        <p className="text-gray-600 mb-6">Drag and drop or click to browse</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Choose File
        </button>
        <p className="text-sm text-gray-500 mt-4">Maximum file size: 100MB</p>
      </div>
    </div>
  );
};

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
      const scale = 0.12;
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
      className="mb-2 cursor-pointer group relative"
      onClick={handleClick}
    >
      <div className={` relative border-2 rounded-md p-1.5 transition-all duration-200 ${
        isActive
          ? 'border-blue-500 shadow-md bg-blue-50 scale-105'
          : hasSigs 
            ? 'border-green-300 shadow-sm bg-green-50' 
            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
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
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-xs text-gray-400 mt-1">Loading</span>
            </div>
          )}
          
          {/* Placeholder before loading */}
          {!isVisible && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs text-gray-300 font-medium">{pageNumber}</span>
            </div>
          )}
          
          {/* Signature count badge */}
          {hasSigs && (
            <div className="absolute top-0.5 right-0.5 z-10">
              <div className="bg-green-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 font-bold shadow-sm border border-white">
                {signatures.length}
              </div>
            </div>
          )}
        </div>
        
        {/* Page number */}
        <div className="text-center mt-1">
          <span className={`text-xs font-medium transition-colors ${
            isActive ? 'text-blue-700' : hasSigs ? 'text-green-700' : 'text-gray-600'
          }`}>
            {pageNumber}
          </span>
        </div>
      </div>
    </div>
  );
};

// Signature Creation Modal
const SignatureModal = ({ isOpen, onClose, onSave, userFullName }) => {
  const [signatureType, setSignatureType] = useState('type'); // Default to type
  const [textInput, setTextInput] = useState(userFullName || '');
  const [selectedFont, setSelectedFont] = useState('cursive');
  const [signature, setSignature] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = useRef(null);

  // Set user name when modal opens
  useEffect(() => {
    if (isOpen && userFullName && !textInput) {
      setTextInput(userFullName);
    }
  }, [isOpen, userFullName]);

  // Auto-generate signature when user name is available
  useEffect(() => {
    if (signatureType === 'type' && textInput.trim() && !signature) {
      generateTextSignature();
    }
  }, [signatureType, textInput]);

  // Drawing functions
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
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
    
    const padding = 10;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width, maxX + padding);
    maxY = Math.min(canvas.height, maxY + padding);
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    tempCanvas.width = width;
    tempCanvas.height = height;
    
    tempCtx.drawImage(canvas, minX, minY, width, height, 0, 0, width, height);
    
    const dataURL = tempCanvas.toDataURL('image/png');
    setSignature(dataURL);
  };

  const generateTextSignature = () => {
    if (!textInput.trim()) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    ctx.font = `48px ${selectedFont}`;
    const metrics = ctx.measureText(textInput);
    const textWidth = metrics.width;
    const textHeight = 60;
    
    canvas.width = textWidth + 20;
    canvas.height = textHeight + 20;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = `48px ${selectedFont}`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(textInput, 10, canvas.height / 2);
    
    const dataURL = canvas.toDataURL('image/png');
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
    if (signature) {
      onSave(signature);
      onClose();
      setSignature(null);
      setTextInput(userFullName || '');
      if (canvasRef.current) {
        clearCanvas();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Create Your Signature</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
                className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition-colors ${
                  signatureType === key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
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
                <label className="block text-sm font-medium mb-2">Your Name:</label>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Font Style:</label>
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cursive">Cursive</option>
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans Serif</option>
                  <option value="monospace">Monospace</option>
                </select>
              </div>
              {textInput && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <div 
                    className="text-4xl text-center py-4 bg-transparent rounded"
                    style={{ fontFamily: selectedFont }}
                  >
                    {textInput}
                  </div>
                </div>
              )}
              <button
                onClick={generateTextSignature}
                disabled={!textInput.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                Generate Signature
              </button>
            </div>
          )}

          {/* Draw Tab */}
          {signatureType === 'draw' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Draw your signature below:</p>
              <div className="border rounded-lg p-4">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={150}
                  className="border border-gray-200 w-full cursor-crosshair bg-transparent"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={clearCanvas}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear
                </button>
                <button
                  onClick={saveDrawnSignature}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Drawing
                </button>
              </div>
            </div>
          )}

          {/* Upload Tab */}
          {signatureType === 'upload' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400"
              >
                <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Click to upload signature image</p>
                <p className="text-xs text-gray-500 mt-2">PNG, JPG supported</p>
              </div>
            </div>
          )}

          {/* Signature Preview */}
          {signature && (
            <div className="mt-6 border-t pt-6">
              <p className="text-sm font-medium mb-2">Signature Preview:</p>
              <div className="border rounded-lg p-4 bg-gray-50 text-center">
                <img src={signature} alt="Signature" className="max-h-20 mx-auto" />
              </div>
              <button
                onClick={handleSave}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Use This Signature
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// PDF Page Component
const PDFPageRenderer = ({ pageData, pageNumber, zoom, onSignaturePlace, signatures, onUpdateSignature, onDeleteSignature, signatureMode }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [renderTask, setRenderTask] = useState(null);

  useEffect(() => {
    if (!pageData || !canvasRef.current) return;

    if (renderTask) {
      renderTask.cancel();
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const viewport = pageData.getViewport({ scale: zoom });
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const newRenderTask = pageData.render({
      canvasContext: context,
      viewport: viewport
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
  }, [pageData, zoom, pageNumber]);

  const handlePageClick = (e) => {
    if (!signatureMode) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onSignaturePlace(pageNumber, x, y);
  };

  const pageSignatures = signatures.filter(sig => sig.page === pageNumber);

  return (
    <div className="relative mb-8 mx-auto" style={{ width: 'fit-content' }}>
      <div className="absolute -left-12 top-4 text-sm text-gray-500 font-medium">
        {pageNumber}
      </div>
      
      <div 
        ref={containerRef}
        className={`relative bg-white shadow-lg border ${signatureMode ? 'cursor-crosshair' : 'cursor-default'}`}
        onClick={handlePageClick}
      >
        <canvas ref={canvasRef} className="block" />
        
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
              <span className="text-sm text-gray-600">Loading page {pageNumber}...</span>
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
          />
        ))}
      </div>
    </div>
  );
};

// Enhanced Signature Overlay Component
const SignatureOverlay = ({ signature, onUpdate, onDelete }) => {
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
        width: signature.width || 120,
        height: signature.height || 60,
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
      
      const newX = Math.max(0, Math.min(90, initialState.x + deltaXPercent));
      const newY = Math.max(0, Math.min(90, initialState.y + deltaYPercent));
      
      onUpdate(signature.id, { x: newX, y: newY });
    } else if (isResizing) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const newWidth = Math.max(60, Math.min(300, initialState.width + deltaX));
      const newHeight = Math.max(30, Math.min(150, initialState.height + deltaY));
      
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

  const width = signature.width || 120;
  const height = signature.height || 60;

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
        className="relative w-full h-full border-2 border-blue-500 border-dashed bg-blue-50 bg-opacity-20 rounded cursor-move hover:bg-opacity-30 transition-all duration-200"
        onMouseDown={(e) => handleMouseDown(e, 'drag')}
      >
        <img 
          src={signature.image} 
          alt="Signature"
          className="w-full h-full object-contain p-1"
          draggable={false}
        />
        
        <div className="absolute -top-8 left-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(signature.id);
            }}
            className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-lg"
            title="Remove signature"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border border-white rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto hover:bg-blue-600"
            onMouseDown={(e) => handleMouseDown(e, 'resize')}
            title="Resize signature"
          >
            <div className="absolute inset-1 border border-white rounded-full"></div>
          </div>
          
          <div
            className="absolute top-1/2 -right-1 w-3 h-6 bg-blue-500 rounded-r cursor-e-resize opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto transform -translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 'resize')}
            title="Resize width"
          ></div>
          
          <div
            className="absolute -bottom-1 left-1/2 w-6 h-3 bg-blue-500 rounded-b cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto transform -translate-x-1/2"
            onMouseDown={(e) => handleMouseDown(e, 'resize')}
            title="Resize height"
          ></div>
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
  const [zoom, setZoom] = useState(1.2);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Signature states
  const [userSignature, setUserSignature] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureMode, setSignatureMode] = useState(false);

  // Refs for scrolling
  const thumbnailContainerRef = useRef(null);
  const mainViewerRef = useRef(null);

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

  // Auto-generate signature when user is logged in
  useEffect(() => {
    if (isAuthenticated && user && !userSignature) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      if (fullName) {
        generateAutoSignature(fullName);
      }
    }
  }, [isAuthenticated, user]);

  // Generate automatic signature for logged-in user
  const generateAutoSignature = (fullName) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    ctx.font = '48px cursive';
    const metrics = ctx.measureText(fullName);
    const textWidth = metrics.width;
    const textHeight = 60;
    
    canvas.width = textWidth + 20;
    canvas.height = textHeight + 20;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '48px cursive';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(fullName, 10, canvas.height / 2);
    
    const dataURL = canvas.toDataURL('image/png');
    setUserSignature(dataURL);
  };

  // Load PDF and auto-open signature modal
  const loadPDF = async (file) => {
    setLoading(true);
    setError(null);

    try {
      if (!window.pdfjsLib) {
        throw new Error('PDF.js not loaded');
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        pages.push(page);
      }
      
      setPdfPages(pages);
      setPdfFile(file);
      setStep('edit');
      
      // Auto-open signature modal if no signature exists
      if (!userSignature) {
        setTimeout(() => {
          setShowSignatureModal(true);
        }, 500);
      }
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF. Please try a different file.');
    } finally {
      setLoading(false);
    }
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

  // Handle signature placement
  const handleSignaturePlace = (pageNumber, x, y) => {
    if (!signatureMode || !userSignature) return;

    const newSignature = {
      id: Date.now() + Math.random(),
      page: pageNumber,
      x: Math.max(0, Math.min(85, x - 8)),
      y: Math.max(0, Math.min(85, y - 4)),
      width: 120,
      height: 60,
      image: userSignature
    };

    setSignatures(prev => [...prev, newSignature]);
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

  // Complete signing
  const completeSigning = () => {
    if (signatures.length === 0) {
      setError('Please add at least one signature before completing.');
      return;
    }
    setStep('complete');
  };

  // Reset to start
  const reset = () => {
    setPdfFile(null);
    setPdfDoc(null);
    setPdfPages([]);
    setSignatures([]);
    setUserSignature(null);
    setStep('upload');
    setError(null);
    setSignatureMode(false);
    setCurrentPage(1);
  };

  // Get user's full name for signature
  const getUserFullName = () => {
    if (isAuthenticated && user) {
      return `${user.name || user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                PDF <span className="text-blue-600">Signer</span>
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                {step === 'upload' && 'Upload your PDF document to get started'}
                {step === 'edit' && 'Add your signatures to the document'}
                {step === 'complete' && 'Your document has been signed successfully'}
              </p>
            </div>
            {isAuthenticated && user && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Signed in as</p>
                <p className="font-medium text-gray-900">{getUserFullName()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading PDF...</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mx-auto px-2 py-4 max-w-6xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-800 mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto px-2 py-4">
        {/* Upload Step */}
        {step === 'upload' && (
          <div className="max-w-4xl mx-auto">
            <FileUpload 
              onFileSelect={loadPDF}
              error={error}
              onError={setError}
            />
          </div>
        )}

        {/* Edit Step */}
        {step === 'edit' && (
          <div className="flex gap-2 h-[calc(100vh-140px)]">
            {/* Thumbnail Sidebar */}
            <div className="w-56 bg-white rounded-lg shadow-sm border flex flex-col">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">Pages</h3>
                  <span className="text-xs text-gray-500">{totalPages} pages</span>
                </div>
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Go to page..."
                    className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && !isNaN(value) && parseInt(value) <= totalPages && parseInt(value) > 0) {
                        handlePageNavigation(parseInt(value));
                      }
                    }}
                  />
                </div>
              </div>
              
              <div 
                ref={thumbnailContainerRef}
                className="flex-1 overflow-y-auto p-1"
                style={{ maxHeight: 'calc(100vh - 200px)' }}
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
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-lg shadow-sm border p-4 h-full flex flex-col">
                {/* Toolbar */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg truncate">{pdfFile?.name}</h3>
                    <p className="text-sm text-gray-600">{totalPages} pages • Page {currentPage}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-4">
                    {signatureMode && (
                      <div className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs animate-pulse">
                        <MousePointer2 className="w-3 h-3 mr-1" />
                        Click anywhere to place signature
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-sm w-10 text-center">{Math.round(zoom * 100)}%</span>
                      <button
                        onClick={() => setZoom(Math.min(2, zoom + 0.2))}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* PDF Pages */}
                <div 
                  ref={mainViewerRef}
                  className="flex-1 overflow-auto bg-gray-100 p-3 rounded"
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
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tools Sidebar */}
            <div className="w-64">
              <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4 h-full flex flex-col">
                <h3 className="font-semibold text-base">Signature Tools</h3>

                {/* Current Signature */}
                {userSignature && (
                  <div className="p-3 border rounded-lg bg-blue-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">Your Signature</span>
                      <button
                        onClick={() => {
                          setUserSignature(null);
                          setSignatures([]);
                          setSignatureMode(false);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Remove signature"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="bg-white p-2 rounded mb-2 text-center border">
                      <img src={userSignature} alt="Signature" className="max-h-10 mx-auto" />
                    </div>
                    <button
                      onClick={toggleSignatureMode}
                      className={`w-full py-2 px-2 rounded font-medium transition-all duration-200 text-sm ${
                        signatureMode 
                          ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                      }`}
                    >
                      {signatureMode ? 'Stop Placing' : 'Start Placing'}
                    </button>
                    {signatureMode && (
                      <p className="text-xs text-gray-600 mt-1 text-center">
                        Click anywhere on any page to place signatures
                      </p>
                    )}
                  </div>
                )}

                {/* Create Signature */}
                <button
                  onClick={() => setShowSignatureModal(true)}
                  className="w-full flex items-center justify-center py-2.5 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md text-sm"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  {userSignature ? 'Edit Signature' : 'Create Signature'}
                </button>

                {/* Signature Status */}
                {signatures.length > 0 && (
                  <div className="p-3 border rounded-lg flex-1 min-h-0">
                    <h4 className="font-medium mb-2 text-sm">Placed Signatures ({signatures.length})</h4>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {signatures.map((sig, index) => (
                        <div key={sig.id} className="flex justify-between items-center text-xs bg-gray-50 p-1.5 rounded">
                          <span>#{index + 1} - Page {sig.page}</span>
                          <button
                            onClick={() => deleteSignature(sig.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Delete this signature"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setSignatures([])}
                      className="w-full mt-2 py-1 px-2 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                    >
                      Clear All Signatures
                    </button>
                  </div>
                )}

                {/* Instructions */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-xs mb-1.5">How to use:</h4>
                  <ol className="text-xs text-gray-600 space-y-0.5">
                    <li>1. Create your signature</li>
                    <li>2. Click "Start Placing"</li>
                    <li>3. Click anywhere on pages</li>
                    <li>4. Drag to move, resize with handles</li>
                    <li>5. Complete when done</li>
                  </ol>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-3 border-t mt-auto">
                  <button
                    onClick={completeSigning}
                    disabled={signatures.length === 0}
                    className={`w-full py-2.5 px-3 rounded-lg font-medium transition-colors shadow-md text-sm ${
                      signatures.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    Complete ({signatures.length})
                  </button>
                  
                  <button
                    onClick={reset}
                    className="w-full py-2 px-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Document Signed Successfully!
              </h2>
              <p className="text-gray-600 mb-8">
                Your PDF has been digitally signed with {signatures.length} signature{signatures.length !== 1 ? 's' : ''} and is ready for download.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">1</p>
                  <p className="text-sm text-gray-600">Document Signed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{signatures.length}</p>
                  <p className="text-sm text-gray-600">Signatures Applied</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{totalPages}</p>
                  <p className="text-sm text-gray-600">Total Pages</p>
                </div>
              </div>

              {/* Signature Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium mb-2">Signature Summary:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {signatures.reduce((acc, sig) => {
                    acc[sig.page] = (acc[sig.page] || 0) + 1;
                    return acc;
                  }, {}) && Object.entries(signatures.reduce((acc, sig) => {
                    acc[sig.page] = (acc[sig.page] || 0) + 1;
                    return acc;
                  }, {})).map(([page, count]) => (
                    <div key={page} className="flex justify-between">
                      <span>Page {page}:</span>
                      <span>{count} signature{count !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Signed_{pdfFile?.name}</p>
                      <p className="text-sm text-gray-600">Digitally signed PDF</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </button>
                    <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={reset}
                className="w-full py-3 px-6 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
              >
                Sign Another Document
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSave={setUserSignature}
        userFullName={getUserFullName()}
      />
    </div>
  );
};

export default PDFSigner;