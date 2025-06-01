"use client"

import { useState, useEffect } from 'react';

const ModalLoader = ({ isVisible, progress, estimatedTime , text }) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  
  // Simulate more realistic progress update
  useEffect(() => {
    if (!isVisible) {
      setDisplayProgress(0);
      return;
    }
    
    setDisplayProgress(progress);
    
    // If we're at "server processing" stage (90%-99%), simulate incremental progress
    if (progress >= 90 && progress < 100) {
      // Start a timer that incrementally increases the progress
      const startValue = progress;
      let currentIncrement = startValue;
      
      const interval = setInterval(() => {
        // Slowly increment progress during server processing
        // The closer we get to 99%, the slower it gets
        const remaining = 99 - currentIncrement;
        const step = Math.max(0.1, remaining * 0.05);
        
        currentIncrement += step;
        
        if (currentIncrement >= 99) {
          currentIncrement = 99;
          clearInterval(interval);
        }
        
        setDisplayProgress(parseFloat(currentIncrement.toFixed(1)));
      }, 700); // Update every 700ms
      
      return () => clearInterval(interval);
    }
  }, [isVisible, progress]);
  
  if (!isVisible) return null;
  
  const getProgressText = () => {
    if (displayProgress < 90) {
      return `Uploading ${Math.round(displayProgress)}%`;
    } else if (displayProgress < 95) {
      return "Processing ...";
    } else if (displayProgress < 99) {
      return "Compressing documents...";
    } else {
      return "Finalizing compression...";
    }
  };
  
  const getProgressMessage = () => {
    if (displayProgress < 90) {
      return 'Uploading Files...';
    } else if (displayProgress < 95) {
      return 'Analyzing PDFs...';
    } else if (displayProgress < 99) {
      return text;
    } else {
      return 'Almost done...';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 mx-4">
        <div className="flex flex-col items-center">
          {/* Modern spinner with gradient */}
          <div className="relative w-20 h-20 mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-600 animate-spin"
              style={{ animationDuration: '1.5s' }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{Math.round(displayProgress)}%</span>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            {getProgressMessage()}
          </h3>
          
          {/* Progress bar with gradient */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-3">
            <div
              className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${displayProgress}%` }}
            ></div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {getProgressText()}
          </p>
          
          {estimatedTime > 0 && displayProgress < 50 && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
              Estimated time: {estimatedTime < 60
                ? `${estimatedTime} seconds`
                : `${Math.floor(estimatedTime / 60)} min ${estimatedTime % 60} sec`}
            </p>
          )}
          
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Please do not close this window
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModalLoader;