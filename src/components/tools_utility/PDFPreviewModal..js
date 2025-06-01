"use client"

import { useState, useEffect, useRef } from 'react';

const PDFPreviewModal = ({ isOpen, onClose, pdfUrl, fileName }) => {
  const [loading, setLoading] = useState(true);
  
  // Cleanup object URL when modal closes
  useEffect(() => {
    if (!isOpen && pdfUrl && pdfUrl.startsWith('blob:')) {
      return () => {
        URL.revokeObjectURL(pdfUrl);
      };
    }
  }, [isOpen, pdfUrl]);
  
  // Handle iframe load event
  const handleIframeLoad = () => {
    setLoading(false);
  };
  
  // Reset loading when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-opacity-50 flex items-center justify-center">
      {/* Increased size by making the modal take up more of the screen */}
      <div className="bg-white rounded-xl w-[95vw] h-[95vh] flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 ">
          <h3 className="text-xl font-semibold text-gray-800 truncate">
            {fileName || 'PDF Preview'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {/* PDF Viewer - increased the height by making it flex-grow */}
        <div className="flex-1 bg-gray-800 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#DA1F10]"></div>
              <p className="mt-4 text-white">Loading PDF...</p>
            </div>
          )}
          
          <iframe 
            src={pdfUrl}
            className="w-full h-full border-none"
            onLoad={handleIframeLoad}
            title="PDF Preview"
          />
        </div>
        
        {/* Footer - reduced padding to give more space to the viewer */}
        <div className="flex justify-end items-center px-6 py-2 border-t border-gray-200 ">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#DA1F10] hover:bg-[#C10007] text-white rounded-lg transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;