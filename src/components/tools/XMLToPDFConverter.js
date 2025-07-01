"use client"

import { useState, useRef, useEffect } from 'react';
import { 
  convertXMLToPDF, 
  analyzeXMLStructure,
  getConversionOptions,
  getDownloadUrl, 
  downloadFile,
  validateXMLFile,
  formatFileSize,
  getComplexityColor,
  getRecommendedFormat
} from '../../api/xml_to_pdf_api';
import ModalLoader from '../tools_utility/ModalLoader';
import DownloadSection from '../tools_utility/DownloadSection';
import PDFPreviewModal from '../tools_utility/PDFPreviewModal.';

const XMLToPDFConverter = () => {
  // File management state
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  
  // Conversion settings
  const [conversionSettings, setConversionSettings] = useState({
    output_format: 'hybrid',
    page_size: 'A4',
    font_scaling: 'auto',
    include_statistics: true,
    max_content_length: 200,
    output_filename: ''
  });

    const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    pdfUrl: null,
    fileName: ''
  });
  
  // Analysis and results
  const [analysisResults, setAnalysisResults] = useState({});
  const [conversionResult, setConversionResult] = useState(null);
  const [conversionOptions, setConversionOptions] = useState(null);
  
  // UI state
  const resultSectionRef = useRef(null);

  // File size limits
  const MAX_SINGLE_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
  const MAX_TOTAL_FILES_SIZE = 100 * 1024 * 1024; // 100 MB total
  const totalSize = files.reduce((total, file) => total + file.size, 0);
  const estimatedUploadTime = Math.ceil(totalSize / (500 * 1024)); // Estimate based on 500KB/s

  // Load conversion options on component mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await getConversionOptions();
        setConversionOptions(options);
      } catch (error) {
        console.error('Failed to load conversion options:', error);
      }
    };
    loadOptions();
  }, []);

  // Auto-analyze files when they're added
  useEffect(() => {
    const analyzeFiles = async () => {
      for (const file of files) {
        if (!analysisResults[file.name]) {
          try {
            const analysis = await analyzeXMLStructure(file, () => {});
            setAnalysisResults(prev => ({
              ...prev,
              [file.name]: analysis
            }));
            
            // Auto-recommend format based on complexity
            if (files.length === 1) {
              const recommendedFormat = getRecommendedFormat(analysis.complexity_level);
              setConversionSettings(prev => ({
                ...prev,
                output_format: recommendedFormat
              }));
            }
          } catch (error) {
            console.error(`Failed to analyze ${file.name}:`, error);
            setAnalysisResults(prev => ({
              ...prev,
              [file.name]: { error: error.message }
            }));
          }
        }
      }
    };

    if (files.length > 0) {
      analyzeFiles();
    }
  }, [files]);

  // File validation and addition
  const addFilesWithValidation = (newFiles) => {
    setError(null);

    const xmlFiles = newFiles.filter(file => {
      const validation = validateXMLFile(file);
      if (!validation.isValid) {
        setError(validation.error);
        return false;
      }
      return true;
    });

    if (xmlFiles.length === 0) return;

    const newTotalSize = totalSize + xmlFiles.reduce((sum, file) => sum + file.size, 0);
    if (newTotalSize > MAX_TOTAL_FILES_SIZE) {
      setError(`Total file size exceeds the 100 MB limit. Please remove some files.`);
      return;
    }

    setFiles(prevFiles => [...prevFiles, ...xmlFiles]);
  };

  // File management handlers
  const handleFilesSelected = (selectedFiles) => {
    addFilesWithValidation(selectedFiles);
  };

  const removeFile = (index) => {
    const updatedFiles = [...files];
    const removedFile = updatedFiles[index];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);

    // Clean up analysis results
    if (analysisResults[removedFile.name]) {
      setAnalysisResults(prev => {
        const updated = { ...prev };
        delete updated[removedFile.name];
        return updated;
      });
    }

    if (updatedFiles.length === 0) {
      setError(null);
      setConversionResult(null);
    }
  };

  const removeAllFiles = () => {
    setFiles([]);
    setAnalysisResults({});
    setConversionResult(null);
    setError(null);
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFilesWithValidation(droppedFiles);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      addFilesWithValidation(selectedFiles);
    }
    e.target.value = null;
  };

  const handleSelectFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Conversion handler
  const handleConvertToPDF = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();

      // Add files
      files.forEach(file => {
        formData.append('xml_files', file);
      });

      // Add conversion settings
      Object.entries(conversionSettings).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      const result = await convertXMLToPDF(
        formData,
        (progressValue) => setProgress(progressValue)
      );

      setConversionResult(result);
      
      // Scroll to results
      setTimeout(() => {
        if (resultSectionRef.current) {
          resultSectionRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 300);
      
    } catch (error) {
      console.error('Conversion failed:', error);
      setError(error.message || 'XML to PDF conversion failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (fileId, fileName) => {
      console.log("handleDownload called with:", fileId, fileName);
      
      // Determine the file type based on the filename
      const isZipFile = fileName.toLowerCase().endsWith('.zip');
      
      // Use the appropriate file type
      const fileType = isZipFile ? 'zip' : 'pdf';
      
      // Ensure correct extension
      let finalFileName = fileName;
      if (isZipFile && !finalFileName.toLowerCase().endsWith('.zip')) {
        finalFileName = `${finalFileName}.zip`;
      } else if (!isZipFile && !finalFileName.toLowerCase().endsWith('.pdf')) {
        finalFileName = `${finalFileName}.pdf`;
      }
      
      // Call the appropriate download function with the correct file type
      downloadFile(getDownloadUrl(fileId, fileType, finalFileName), finalFileName);
    };


   const handleOpenPreview = async () => {
    if (conversionResult) {
      try {
        setIsProcessing(true);
        
        const downloadUrl = getDownloadUrl(conversionResult.job_id);
        const response = await fetch(downloadUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        const pdfBlob = await response.blob();
        const objectUrl = URL.createObjectURL(pdfBlob);
        
        setPreviewModal({
          isOpen: true,
          pdfUrl: objectUrl,
          fileName: 'PDF Document.pdf'
        });
      } catch (error) {
        console.error('Error preparing PDF preview:', error);
        setError('Unable to preview the PDF. Please try downloading instead.');
      } finally {
        setIsProcessing(false);
      }
    }
  };
  // Reset handler
  const handleReset = () => {
    setFiles([]);
    setAnalysisResults({});
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    setConversionResult(null);
    setConversionSettings({
      output_format: 'hybrid',
      page_size: 'A4',
      font_scaling: 'auto',
      include_statistics: true,
      max_content_length: 200,
      output_filename: ''
    });
  };

    const handleClosePreview = () => {
    setPreviewModal({
      isOpen: false,
      pdfUrl: null,
      fileName: ''
    });
  };
  // Settings change handler
  const handleSettingChange = (key, value) => {
    setConversionSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".xml,.xsd,.xsl,.xslt,application/xml,text/xml"
        multiple
        onChange={handleFileChange}
      />
      

            <PDFPreviewModal
        isOpen={previewModal.isOpen}
        onClose={handleClosePreview}
        pdfUrl={previewModal.pdfUrl}
        fileName={previewModal.fileName}
      />
      {/* Modal Loader */}
      <ModalLoader
        isVisible={isProcessing}
        progress={progress}
        estimatedTime={estimatedUploadTime}
        text="Converting XML to PDF..."
      />

      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl mt-4 font-bold mb-2">
          <span className="text-[#DA1F10]">XML to PDF</span> Converter
        </h1>
        <p className="text-gray-600">Convert XML files to professional PDF documents</p>
        <p className="text-sm text-gray-500 mt-2">
          Max file size: 20 MB per file | Supported: XML, XSD, XSL, XSLT
        </p>
      </div>

      {/* Content with Sidebar Layout */}
      <div className="flex flex-col justify-center md:flex-row gap-6">
        {/* Main Content Area */}
        <div className="w-full md:w-3/4">
          {/* Upload Area - Only show if no files uploaded yet */}
          {files.length === 0 && !conversionResult && (
            <SelectFiles 
              onFilesSelected={handleFilesSelected}
              onError={setError}
              buttonText="Select XML Files"
              buttonColor="red"
              buttonSize="large"
              acceptedFileTypes=".xml,.xsd,.xsl,.xslt"
            />
          )}

          {/* Error State */}
          {error && (
            <div className="w-full p-6 bg-red-50 rounded-xl border border-red-200 mb-6 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
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

          {/* File List */}
          {files.length > 0 && (
            <div className="w-full">
              {/* File Management Header */}
              <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-lg font-medium">Selected Files ({files.length})</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={removeAllFiles}
                    className="text-red-600 hover:text-red-800 font-medium flex items-center text-sm px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove All
                  </button>
                  <button
                    onClick={handleSelectFiles}
                    className="text-blue-700 hover:text-blue-800 font-medium flex items-center text-sm px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add More Files
                  </button>
                </div>
              </div>

              {/* Drop Zone */}
              <div
                className={`w-full border-2 border-dashed rounded-lg mb-6 p-4 text-center transition-all duration-200 ${
                  isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
                } hover:border-blue-300`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <p className="text-gray-500 text-sm">
                  Drag and drop more XML files here
                </p>
              </div>

              {/* File List with Analysis */}
              <div className="space-y-4 mb-8">
                {files.map((file, index) => {
                  const analysis = analysisResults[file.name];
                  return (
                    <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                            <h3 className="font-medium text-gray-900 truncate" title={file.name}>
                              {file.name}
                            </h3>
                          </div>
                          
                          <p className="text-sm text-gray-500 mb-3">
                            Size: {formatFileSize(file.size)}
                          </p>

                          {/* Analysis Results */}
                          {analysis && !analysis.error && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-gray-500">Elements:</span>
                                <span className="ml-1 font-medium">{analysis.total_elements}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Depth:</span>
                                <span className="ml-1 font-medium">{analysis.max_nesting_depth}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Tags:</span>
                                <span className="ml-1 font-medium">{analysis.unique_tags}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Complexity:</span>
                                <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(analysis.complexity_level)}`}>
                                  {analysis.complexity_level}
                                </span>
                              </div>
                            </div>
                          )}

                          {analysis && analysis.error && (
                            <div className="text-sm text-red-600">
                              Analysis failed: {analysis.error}
                            </div>
                          )}

                          {!analysis && (
                            <div className="text-sm text-gray-500">
                              Analyzing structure...
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors ml-4"
                          title="Remove file"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results Section */}
          {conversionResult && (
            <div ref={resultSectionRef}>
              <DownloadSection
                files={[{
                  id: conversionResult.job_id,
                  name: conversionResult.file_count > 1 ? 'XML_to_PDF_Conversion.zip' : 'Converted_Document.pdf',
                  size: conversionResult.output_size
                }]}
                downloadHandler={handleDownload}
                previewHandler={handleOpenPreview}
                title="Download Converted PDF"
                color="red"
                startOverHandler={handleReset}
                showPreview={false} // XML PDFs don't need preview
              />
              
              {/* Conversion Stats */}
              {conversionResult.document_stats && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-2">Conversion Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-green-600">Processing Time:</span>
                      <span className="ml-1 font-medium">{conversionResult.processing_time?.toFixed(2)}s</span>
                    </div>
                    <div>
                      <span className="text-green-600">Files Processed:</span>
                      <span className="ml-1 font-medium">{conversionResult.file_count}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Original Size:</span>
                      <span className="ml-1 font-medium">{formatFileSize(conversionResult.original_size)}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Output Size:</span>
                      <span className="ml-1 font-medium">{formatFileSize(conversionResult.output_size)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Conversion Settings */}
        {files.length > 0 && (
          <div className="w-full md:w-1/4 md:sticky md:top-24 h-fit">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-medium text-lg mb-4">Conversion Settings</h3>

              {/* Output Format */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Format
                </label>
                <select
                  value={conversionSettings.output_format}
                  onChange={(e) => handleSettingChange('output_format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="structured">Structured View</option>
                  <option value="table">Table View</option>
                  <option value="hybrid">Hybrid View (Recommended)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {conversionSettings.output_format === 'structured' && 'Hierarchical display preserving XML structure'}
                  {conversionSettings.output_format === 'table' && 'Tabular format with organized columns'}
                  {conversionSettings.output_format === 'hybrid' && 'Complete analysis with both views'}
                </p>
              </div>

              {/* Page Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Size
                </label>
                <select
                  value={conversionSettings.page_size}
                  onChange={(e) => handleSettingChange('page_size', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="A4">A4 (210 × 297 mm)</option>
                  <option value="letter">Letter (8.5 × 11 inches)</option>
                </select>
              </div>

              {/* Font Scaling */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Scaling
                </label>
                <select
                  value={conversionSettings.font_scaling}
                  onChange={(e) => handleSettingChange('font_scaling', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="auto">Auto (Recommended)</option>
                  <option value="small">Small Fonts</option>
                  <option value="medium">Medium Fonts</option>
                  <option value="large">Large Fonts</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Auto adjusts based on XML complexity
                </p>
              </div>

              {/* Include Statistics */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={conversionSettings.include_statistics}
                    onChange={(e) => handleSettingChange('include_statistics', e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Include Document Statistics
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Add analysis summary to the PDF
                </p>
              </div>

              {/* Custom Filename */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Filename (Optional)
                </label>
                <input
                  type="text"
                  value={conversionSettings.output_filename}
                  onChange={(e) => handleSettingChange('output_filename', e.target.value)}
                  placeholder="Enter filename..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for auto-generated name
                </p>
              </div>

              {/* Convert Button */}
              <button
                onClick={handleConvertToPDF}
                className="w-full bg-[#DA1F10] hover:bg-[#C10007] text-white font-medium py-4 rounded-xl transition-colors duration-200 shadow-md"
                disabled={files.length === 0}
              >
                Convert to PDF
                {files.length > 0 && estimatedUploadTime > 0 && (
                  <span className="text-xs block mt-1">
                    Est. time: {estimatedUploadTime < 60
                      ? `${estimatedUploadTime} seconds`
                      : `${Math.floor(estimatedUploadTime / 60)} min ${estimatedUploadTime % 60} sec`}
                  </span>
                )}
              </button>

              {/* File Stats */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">File Information</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex justify-between">
                    <span>Number of files:</span>
                    <span className="font-medium">{files.length}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Total size:</span>
                    <span className="font-medium">{formatFileSize(totalSize)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Size limit:</span>
                    <span className="font-medium">100 MB</span>
                  </li>
                  {files.length > 0 && (
                    <li className="flex justify-between">
                      <span>Est. PDF pages:</span>
                      <span className="font-medium">
                        {Object.values(analysisResults).reduce((total, analysis) => 
                          total + (analysis.estimated_pdf_pages || 1), 0
                        )}
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Complexity Overview */}
              {Object.keys(analysisResults).length > 0 && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Complexity Overview</h4>
                  <div className="space-y-2">
                    {Object.entries(analysisResults).map(([fileName, analysis]) => (
                      analysis && !analysis.error && (
                        <div key={fileName} className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 truncate max-w-[120px]" title={fileName}>
                            {fileName}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(analysis.complexity_level)}`}>
                            {analysis.complexity_level}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {files.length === 1 && Object.values(analysisResults)[0] && !Object.values(analysisResults)[0].error && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendation</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      {Object.values(analysisResults)[0].processing_recommendation}
                    </p>
                  </div>
                </div>
              )}

              {/* Start Over Button */}
              {conversionResult && (
                <button
                  onClick={handleReset}
                  className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition-colors duration-200"
                >
                  Start Over with New Files
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default XMLToPDFConverter;


const SelectFiles = ({ 
  onFilesSelected, 
  maxFiles = Infinity, // Add this new prop
  currentFileCount = 0, // Add this new prop
  maxSingleFileSize = 20 * 1024 * 1024, // 20 MB for XML files
  maxTotalFilesSize = 100 * 1024 * 1024, // 100 MB total for XML files
  acceptedFileTypes = ".xml,.xsd,.xsl,.xslt,application/xml,text/xml", // XML file types
  buttonText = "Select Files",
  buttonSize = "large", // "large" or "small"
  buttonColor = "red", // "red" or "blue"
  showHelperText = true,
  fullWidth = false,
  onError = () => {}
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Color class mapping
  const colorClasses = {
    red: "bg-red-600 hover:bg-red-700",
    blue: "bg-blue-600 hover:bg-blue-700"
  };

  // Size class mapping
  const sizeClasses = {
    large: "w-[350px] px-8 py-3 h-[60px] text-xl shadow-lg",
    small: "px-4 py-2 text-sm"
  };

  // XML file validation function
  const isValidXMLFile = (file) => {
    // Check MIME type
    const validMimeTypes = [
      'application/xml',
      'text/xml',
      'application/xsl+xml',
      'application/xslt+xml'
    ];
    
    // Check file extension
    const validExtensions = ['.xml', '.xsd', '.xsl', '.xslt'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    // Accept if MIME type matches or extension matches
    return validMimeTypes.includes(file.type) || 
           validExtensions.includes(fileExtension) ||
           file.type.includes('xml');
  };

  // Set up page-wide drag and drop
  useEffect(() => {
    // Add dragover event listener to the entire document
    const handleDocumentDragOver = (e) => {
      // Only intercept file drops, not drag operations on DOM elements
      if (e.dataTransfer && e.dataTransfer.types && 
          Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }
    };

    // Add dragleave event listener to the entire document
    const handleDocumentDragLeave = (e) => {
      // Only respond to file drag operations
      if (e.dataTransfer && e.dataTransfer.types && 
          Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        
        // Only set isDragging to false if we're leaving the document
        if (!e.relatedTarget || e.relatedTarget.nodeName === 'HTML') {
          setIsDragging(false);
        }
      }
    };

    // Add drop event listener to the entire document
    const handleDocumentDrop = (e) => {
      // Only handle file drops
      if (e.dataTransfer && e.dataTransfer.types && 
          Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        
        setIsDragging(false);

        // Only add files if the drop didn't happen on a specific drop zone
        const isInsideDropZone = e.target.closest('.drop-zone');
        if (!isInsideDropZone) {
          const droppedFiles = Array.from(e.dataTransfer.files);
          validateAndAddFiles(droppedFiles);
        }
      }
    };

    // Register the event listeners
    document.addEventListener('dragover', handleDocumentDragOver, { passive: false });
    document.addEventListener('dragleave', handleDocumentDragLeave, { passive: false });
    document.addEventListener('drop', handleDocumentDrop, { passive: false });

    return () => {
      document.removeEventListener('dragover', handleDocumentDragOver);
      document.removeEventListener('dragleave', handleDocumentDragLeave);
      document.removeEventListener('drop', handleDocumentDrop);
    };
  }, []);

  // Validate files before adding them
  const validateAndAddFiles = (newFiles) => {
    // Reset error
    onError(null);

    // Check max files limit
    if (currentFileCount + newFiles.length > maxFiles) {
      onError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    // Filter for accepted file types (XML files)
    const validTypeFiles = newFiles.filter(file => {
      if (!isValidXMLFile(file)) {
        onError(`"${file.name}" is not a valid XML file. Supported formats: XML, XSD, XSL, XSLT`);
        return false;
      }
      return true;
    });

    if (validTypeFiles.length === 0) return;

    // Check individual file size
    const validSizeFiles = validTypeFiles.filter(file => {
      if (file.size > maxSingleFileSize) {
        onError(`"${file.name}" exceeds the ${formatFileSize(maxSingleFileSize)} file size limit.`);
        return false;
      }
      return true;
    });

    if (validSizeFiles.length === 0) return;

    // Calculate current total size if needed for total size check
    if (onFilesSelected && typeof onFilesSelected === 'function') {
      onFilesSelected(validSizeFiles);
    }
  };

  // Local drag event handlers for visual feedback
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndAddFiles(droppedFiles);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      validateAndAddFiles(selectedFiles);
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = null;
  };

  const handleSelectFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error("File input reference is not available");

      // As a fallback, try to find the input element and click it directly
      const fileInput = document.querySelector(`input[type="file"][accept="${acceptedFileTypes}"]`);
      if (fileInput) {
        fileInput.click();
      }
    }
  };

  // Format file size in a readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Get file type description for helper text
  const getFileTypeDescription = () => {
    if (acceptedFileTypes.includes('xml')) {
      return "XML files (XML, XSD, XSL, XSLT)";
    } else if (acceptedFileTypes === "application/pdf") {
      return "PDF files";
    } else {
      return `${acceptedFileTypes} files`;
    }
  };

  return (
    <>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={acceptedFileTypes}
        multiple
        onChange={handleFileChange}
      />

      {/* File Drop Area */}
      <div
        className={`${fullWidth ? 'w-full' : ''} border-2 border-dashed rounded-xl drop-zone 
          ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'} 
          transition-colors duration-200 hover:border-blue-300`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Select Files Button */}
        <div className="flex flex-col items-center py-12">
          {/* XML File Icon */}

          <button
            onClick={handleSelectFiles}
            className={`${colorClasses[buttonColor]} cursor-pointer text-white font-medium 
              ${sizeClasses[buttonSize]} ${fullWidth ? 'w-full' : ''} rounded-full flex justify-center 
              items-center mb-4 transition-colors duration-200`}
          >
            <svg
              className="w-5 h-5 mr-2"
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
            {buttonText}
          </button>

          {/* Helper Text */}
          {showHelperText && (
            <>
              <p className="text-gray-500 text-sm">
                or drop XML files here
              </p>
              <p className="text-gray-500 text-xs mt-4 text-center max-w-sm">
                Supported: {getFileTypeDescription()}
                <br />
                Max size: {formatFileSize(maxSingleFileSize)} per file
                {maxFiles !== Infinity && (
                  <><br />Max files: {maxFiles}</>
                )}
              </p>
              
            </>
          )}
        </div>
      </div>
    </>
  );
};
