"use client"

const DragOverlay = () => {
  return (
    <div 
      id="drag-overlay"
      className="fixed inset-0 bg-[rgb(255,0,0,0.3)] bg-opacity-10 z-50 pointer-events-none flex items-center justify-center opacity-0 transition-opacity duration-300"
    >
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-6 text-blue-600">
          <svg 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-700">Drop PDF Files Here</h2>
        <p className="text-gray-500 mt-2">Release to add files</p>
      </div>
    </div>
  );
};

export default DragOverlay;