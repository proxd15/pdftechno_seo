import { useState, useRef, useEffect } from 'react';

const DraggableGrid = () => {
  const [files, setFiles] = useState(Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    size: Math.floor(Math.random() * 10 + 1) * 1024 * 1024 // Random size between 1-10MB
  })));
  
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [compressionLevel, setCompressionLevel] = useState('recommended');
  const [grayScale, setGrayScale] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [infoTooltip, setInfoTooltip] = useState('');
  const [autoScrollActive, setAutoScrollActive] = useState(false);
  const [autoScrollDirection, setAutoScrollDirection] = useState(null);
  const containerRef = useRef(null);
  const autoScrollInterval = useRef(null);
  
  // For auto-scrolling when dragging near edges
  const AUTO_SCROLL_THRESHOLD = 100; // px from edge
  const AUTO_SCROLL_SPEED = 10; // px per interval
  
  // Total size of all items
  const totalSize = files.reduce((total, file) => total + file.size, 0);
  
  // Format file size in a readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  // Handle drag start
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    // Make the drag image transparent
    const dragImg = document.createElement('img');
    dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(dragImg, 0, 0);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Check for auto-scrolling
    if (containerRef.current) {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // Check if we're near the top or bottom edge
      if (e.clientY - containerRect.top < AUTO_SCROLL_THRESHOLD) {
        // Near top edge, scroll up
        setAutoScrollDirection('up');
        setAutoScrollActive(true);
      } else if (containerRect.bottom - e.clientY < AUTO_SCROLL_THRESHOLD) {
        // Near bottom edge, scroll down
        setAutoScrollDirection('down');
        setAutoScrollActive(true);
      } else {
        // Not near edges, stop auto-scrolling
        setAutoScrollActive(false);
        setAutoScrollDirection(null);
      }
    }
    
    if (draggedItem === null) return;
    
    // Don't do anything if item is dragged over itself
    if (draggedItem === index) return;
    
    // Reorder files
    const updatedFiles = [...files];
    const draggedItemContent = updatedFiles[draggedItem];
    updatedFiles.splice(draggedItem, 1);
    updatedFiles.splice(index, 0, draggedItemContent);
    
    setDraggedItem(index);
    setFiles(updatedFiles);
  };
  
  // Handle drag end
  const handleDragEnd = () => {
    setDraggedItem(null);
    setAutoScrollActive(false);
    setAutoScrollDirection(null);
  };
  
  // Handle auto-scrolling
  useEffect(() => {
    if (autoScrollActive && autoScrollDirection && containerRef.current) {
      if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
      
      autoScrollInterval.current = setInterval(() => {
        if (containerRef.current) {
          if (autoScrollDirection === 'up') {
            containerRef.current.scrollTop -= AUTO_SCROLL_SPEED;
          } else if (autoScrollDirection === 'down') {
            containerRef.current.scrollTop += AUTO_SCROLL_SPEED;
          }
        }
      }, 16); // ~60fps
    } else {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
        autoScrollInterval.current = null;
      }
    }
    
    return () => {
      if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
    };
  }, [autoScrollActive, autoScrollDirection]);
  
  // Handle compress action
  const handleCompress = () => {
    setIsProcessing(true);
    setProgress(0);
    
    // Simulate compression process
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 10;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsProcessing(false);
          }, 500);
          return 100;
        }
        return next;
      });
    }, 200);
  };
  
  // Reset all items
  const handleReset = () => {
    setFiles(Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      size: Math.floor(Math.random() * 10 + 1) * 1024 * 1024
    })));
  };
  
  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      {/* Modal Loader */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-semibold mb-4">Processing Items...</h3>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div 
                className="bg-red-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-gray-600 text-center">{Math.round(progress)}%</p>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl mt-4 font-bold mb-2">
          <span className="text-red-600">Draggable</span> Grid
        </h1>
        <p className="text-gray-600">Drag and reorder the numbered rectangles</p>
        <p className="text-sm text-gray-500 mt-2">All items are draggable and auto-scroll enabled</p>
      </div>

      {/* Content with Sidebar Layout */}
      <div className="flex flex-col justify-center md:flex-row gap-6">
        {/* Main Content Area */}
        <div className="w-full md:w-3/4">
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

          {/* File List with Draggable Rectangles */}
          <div className="w-full">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-lg font-medium">Draggable Items ({files.length})</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleReset}
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Reset Order
                </button>
              </div>
            </div>

            {/* Draggable Rectangles Container with Auto-Scroll */}
            <div 
              ref={containerRef}
              className="max-h-96 overflow-y-auto p-4 border-2 border-dashed border-gray-200 rounded-lg mb-6"
            >
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                onDragOver={(e) => e.preventDefault()}
              >
                {files.map((file, index) => (
                  <div
                    key={file.id}
                    className={`
                      border-2 rounded-xl overflow-hidden bg-white shadow-sm 
                      h-40 flex items-center justify-center select-none
                      ${draggedItem === index ? 'opacity-50 border-blue-500' : 'border-gray-200'} 
                      transition-all duration-150 cursor-move
                    `}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-700 mb-2">{file.id}</div>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-1/4 md:sticky md:top-24 h-fit">
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-medium text-lg mb-4">Settings</h3>

            {/* Compression Level Options with tooltips */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compression Level
              </label>
              <div className="flex flex-col gap-2">
                <div
                  className="relative"
                  onMouseEnter={() => setInfoTooltip('high')}
                  onMouseLeave={() => setInfoTooltip('')}
                >
                  <button
                    type="button"
                    onClick={() => setCompressionLevel('high')}
                    className={`text-sm cursor-pointer py-3 px-4 rounded-lg border w-full flex justify-between items-center ${
                      compressionLevel === 'high'
                        ? 'bg-red-600 text-white border-transparent'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    High Compression
                    {compressionLevel === 'high' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </button>
                  {infoTooltip === 'high' && (
                    <div className="absolute -top-12 left-0 right-0 bg-gray-800 text-white text-xs rounded py-1 px-2 z-10">
                      Smaller file size, lower quality
                    </div>
                  )}
                </div>

                <div
                  className="relative"
                  onMouseEnter={() => setInfoTooltip('recommended')}
                  onMouseLeave={() => setInfoTooltip('')}
                >
                  <button
                    type="button"
                    onClick={() => setCompressionLevel('recommended')}
                    className={`cursor-pointer text-sm py-3 px-4 rounded-lg border w-full flex justify-between items-center ${
                      compressionLevel === 'recommended'
                        ? 'bg-red-600 text-white border-transparent'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Recommended
                    {compressionLevel === 'recommended' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </button>
                  {infoTooltip === 'recommended' && (
                    <div className="absolute -top-12 left-0 right-0 bg-gray-800 text-white text-xs rounded py-1 px-2 z-10">
                      Balanced size/quality
                    </div>
                  )}
                </div>

                <div
                  className="relative"
                  onMouseEnter={() => setInfoTooltip('low')}
                  onMouseLeave={() => setInfoTooltip('')}
                >
                  <button
                    type="button"
                    onClick={() => setCompressionLevel('low')}
                    className={`text-sm cursor-pointer py-3 px-4 rounded-lg border w-full flex justify-between items-center ${
                      compressionLevel === 'low'
                        ? 'bg-red-600 text-white border-transparent'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Low Compression
                    {compressionLevel === 'low' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </button>
                  {infoTooltip === 'low' && (
                    <div className="absolute -top-12 left-0 right-0 bg-gray-800 text-white text-xs rounded py-1 px-2 z-10">
                      Larger file size, better quality
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Grayscale Option */}
            <div className="flex items-center mb-6">
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="grayscale"
                  checked={grayScale}
                  onChange={(e) => setGrayScale(e.target.checked)}
                  className="sr-only"
                />
                <label
                  htmlFor="grayscale"
                  className={`block overflow-hidden h-4 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${
                    grayScale ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                      grayScale ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
              <label htmlFor="grayscale" className="text-sm text-gray-700 cursor-pointer">
                Convert to grayscale
              </label>
            </div>

            {/* Process Button */}
            <button
              onClick={handleCompress}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium cursor-pointer py-4 rounded-xl transition-colors duration-200 shadow-md"
            >
              Process Items
            </button>

            {/* Item Stats */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Items Information</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex justify-between">
                  <span>Number of items:</span>
                  <span className="font-medium">{files.length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Total size:</span>
                  <span className="font-medium">{formatFileSize(totalSize)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Drag Instructions:</span>
                  <span className="font-medium">Drag to reorder</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraggableGrid;