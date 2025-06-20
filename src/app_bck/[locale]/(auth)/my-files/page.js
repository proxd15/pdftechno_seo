"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserFiles } from '@/api/user_api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const FileHistory = () => {
  const { isAuthenticated } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute to accurately show expiry status
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserFiles();
    }
  }, [isAuthenticated]);

  const loadUserFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const userFiles = await getUserFiles();
      
      // Filter out files older than 3 days (72 hours)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const filteredFiles = userFiles.filter(file => {
        const fileDate = new Date(file.created_at);
        return fileDate > threeDaysAgo;
      });
      
      setFiles(filteredFiles);
    } catch (err) {
      console.error('Error loading user files:', err);
      setError('Could not load your files. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to create download URL from file ID
  const getDownloadUrl = (fileId, filename) => {
    const encodedFilename = encodeURIComponent(filename);
    return `${API_BASE_URL}/download-pdf/?file_id=${fileId}&filename=${encodedFilename}`;
  };

  // Function to check if a file is expired - MODIFIED to use 2 hour limit
  const isFileExpired = (createdAt) => {
    const created = new Date(createdAt);
    const twoHoursLater = new Date(created.getTime() + (2 * 60 * 60 * 1000)); // 2 hours after creation
    return twoHoursLater <= currentTime;
  };

  // Function to calculate time remaining until expiry - MODIFIED to use 2 hour limit
  const getTimeRemaining = (createdAt) => {
    const created = new Date(createdAt);
    const twoHoursLater = new Date(created.getTime() + (2 * 60 * 60 * 1000)); // 2 hours after creation
    const diffMs = twoHoursLater - currentTime;
    
    if (diffMs <= 0) {
      return 'Expired';
    }
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} left`;
    }
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''} left`;
  };

  // Function to calculate how long ago a file was created
  const getCreatedTimeAgo = (createdDate) => {
    const created = new Date(createdDate);
    const diffMs = currentTime - created;
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    }
    
    const hours = Math.floor(diffMins / 60);
    
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  if (!isAuthenticated) {
    return (
      <div className="py-8 px-4 text-center">
        <p className="text-gray-600">
          Please log in to view your file history.
        </p>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
            <div className='h-8'></div>
      <h2 className="text-2xl font-bold mb-6">Your Files</h2>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div className="text-gray-600">
          <p>Files are automatically deleted after 2 hours from creation.</p>
          <p className="text-sm text-gray-500 mt-1">Files older than 3 days are not shown.</p>
        </div>
        <button 
          onClick={loadUserFiles} 
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex-shrink-0"
        >
          Refresh Files
        </button>
      </div>
      
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your files...</p>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
          {error}
        </div>
      )}
      
      {!loading && files.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">
            You haven't processed any files in the last 3 days.
          </p>
        </div>
      )}
      
      {!loading && files.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map(file => {
            const expired = isFileExpired(file.created_at);  // Changed to use created_at
            const timeRemaining = getTimeRemaining(file.created_at);  // Changed to use created_at
            const createdAgo = getCreatedTimeAgo(file.created_at);
            
            return (
              <div 
                key={file.id} 
                className={`border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${
                  expired ? 'opacity-60 bg-gray-50' : ''
                }`}
              >
                <div className="font-medium mb-2 truncate" title={file.original_filename}>
                  {file.original_filename}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  <div className="flex justify-between items-center">
                    <p>Type: {file.file_type.toUpperCase()}</p>
                    <p>{formatFileSize(file.file_size)}</p>
                  </div>
                  
                  <p className="mt-1 text-gray-500">Created: {createdAgo}</p>
                  
                  <div className={`mt-2 font-medium ${
                    expired ? 'text-red-500' : 
                    timeRemaining.includes('minute') ? 'text-orange-500' : 'text-green-600'
                  }`}>
                    {expired ? (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Expired
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        {timeRemaining}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-2">
                  {expired ? (
                    <span className="inline-block px-3 py-1 bg-gray-200 text-gray-500 rounded-md text-sm">
                      File Expired
                    </span>
                  ) : (
                    <a 
                      href={getDownloadUrl(file.id, file.original_filename)}
                      className="inline-block px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                      download
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default FileHistory;