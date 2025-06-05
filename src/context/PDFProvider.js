import React, { createContext, useContext, useState, useEffect } from 'react';

const PDFContext = createContext();

export const usePDFJS = () => {
  const context = useContext(PDFContext);
  if (!context) {
    throw new Error('usePDFJS must be used within a PDFProvider');
  }
  return context;
};

export const PDFProvider = ({ children }) => {
  const [isPdfJsLoaded, setIsPdfJsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if PDF.js is already loaded
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      setIsPdfJsLoaded(true);
      setIsLoading(false);
      return;
    }

    // Function to load PDF.js
    const loadPdfJs = () => {
      return new Promise((resolve, reject) => {
        // Check if already loading
        if (document.querySelector('script[src*="pdf.min.js"]')) {
          // Script is already in DOM, wait for it
          const checkLoaded = setInterval(() => {
            if (window.pdfjsLib) {
              clearInterval(checkLoaded);
              resolve();
            }
          }, 100);
          return;
        }

        // Create and load the script
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js';
        script.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
            resolve();
          } else {
            reject(new Error('PDF.js library not found after loading'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load PDF.js'));
        document.head.appendChild(script);
      });
    };

    loadPdfJs()
      .then(() => {
        console.log('PDF.js loaded successfully via context');
        setIsPdfJsLoaded(true);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load PDF.js:', err);
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  return (
    <PDFContext.Provider value={{ isPdfJsLoaded, isLoading, error }}>
      {children}
    </PDFContext.Provider>
  );
};