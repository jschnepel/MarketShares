import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

/**
 * FileUploader component for handling file uploads via drag-and-drop
 * 
 * @param {Object} props Component props
 * @param {Function} props.onFilesUploaded Callback function when files are processed
 * @param {Boolean} props.isLoading Loading state to display during processing
 */
const FileUploader = ({ onFilesUploaded, isLoading }) => {
  // State for tracking uploaded files
  const [files, setFiles] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [fileProgress, setFileProgress] = useState(0);

  // dropzone configuration and callbacks
  const onDrop = useCallback((acceptedFiles) => {
    // Reset any previous errors and progress
    setUploadError(null);
    setFileProgress(0);
    
    // Validate files
    const validFiles = acceptedFiles.filter(file => {
      // Check file extension (more reliable than type)
      const fileName = file.name.toLowerCase();
      const isValidType = fileName.endsWith('.csv') || 
                         fileName.endsWith('.xls') ||
                         fileName.endsWith('.xlsx');
      
      if (!isValidType) {
        setUploadError('Only CSV and Excel files are accepted.');
        return false;
      }
      
      // Optional: check file size
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setUploadError('File size exceeds 10MB limit.');
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length > 0) {
      setFiles(validFiles);
      setFileProgress(100); // File is selected and ready
      // Reset error message when valid file is selected
      setUploadError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false // Only allow one file at a time for simplicity
  });

  // Handle upload button click
  const handleUpload = () => {
    if (files.length > 0) {
      setFileProgress(0); // Reset for upload animation
      const progressInterval = setInterval(() => {
        setFileProgress(prevProgress => {
          const newProgress = prevProgress + 10;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            // Call the onFilesUploaded callback after showing some progress
            setTimeout(() => onFilesUploaded(files), 300);
            return 100;
          }
          return newProgress;
        });
      }, 100);
    } else {
      setUploadError('Please select at least one file to upload.');
    }
  };

  // Handle reset function only, sample data removed

  // Reset everything
  const handleReset = () => {
    setFiles([]);
    setUploadError(null);
    setFileProgress(0);
  };

  return (
    <div className="upload-section">
      <h2>Upload Data Files</h2>
      <p>Drag and drop CSV or Excel files containing market data to generate visualizations.</p>
      
      <div 
        {...getRootProps({ 
          className: `dropzone ${isDragActive ? 'active' : ''} ${isLoading ? 'disabled' : ''}` 
        })}
        style={{
          border: isDragActive ? '2px dashed #002349' : '2px dashed #ccc',
          borderRadius: '4px',
          padding: '20px',
          textAlign: 'center',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          backgroundColor: isDragActive ? 'rgba(0, 35, 73, 0.05)' : 'transparent',
          opacity: isLoading ? 0.6 : 1,
          transition: 'all 0.2s ease'
        }}
      >
        <input {...getInputProps()} disabled={isLoading} />
        {isDragActive ? (
          <p style={{ color: '#002349', fontWeight: 'bold' }}>Drop the files here...</p>
        ) : (
          <div>
            <p>Drag and drop files here, or click to select files</p>
            <p style={{ fontSize: '0.8rem', color: '#777' }}>
              Accepted formats: CSV, XLS, XLSX
            </p>
            {!isLoading && (
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                backgroundColor: '#f8f8f8', 
                display: 'inline-block',
                borderRadius: '4px'
              }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Format requirements:</p>
                <p style={{ margin: '0', fontSize: '0.8rem', textAlign: 'left' }}>
                  • Column B should contain brokerage names<br />
                  • Market share data should be in either:<br />
                  &nbsp;&nbsp;- Column I (Mkt %) <b>or</b><br />
                  &nbsp;&nbsp;- Column M (Market Share (#))<br />
                  • First row should be headers
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {fileProgress > 0 && fileProgress < 100 && (
        <div style={{ marginTop: '15px' }}>
          <div style={{ 
            width: '100%', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '4px', 
            height: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${fileProgress}%`,
              backgroundColor: '#002349',
              height: '100%',
              borderRadius: '4px',
              transition: 'width 0.2s ease-in-out'
            }} />
          </div>
          <p style={{ fontSize: '0.8rem', textAlign: 'center', margin: '5px 0 0 0' }}>
            {isLoading ? 'Processing data...' : 'Ready to process'}
          </p>
        </div>
      )}
      
      {files.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '5px' }}>Selected File:</h3>
          <ul style={{ 
            listStyle: 'none', 
            padding: '10px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '4px',
            margin: '0'
          }}>
            {files.map((file, index) => (
              <li key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{file.name}</span>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {uploadError && (
        <div style={{ 
          color: '#d32f2f', 
          backgroundColor: '#ffebee', 
          padding: '10px 15px', 
          borderRadius: '4px', 
          marginTop: '15px',
          border: '1px solid #ffcdd2'
        }}>
          <strong>Error:</strong> {uploadError}
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginTop: '20px',
        justifyContent: 'center'
      }}>
        <button 
          className="btn" 
          onClick={handleUpload} 
          disabled={files.length === 0 || isLoading}
          style={{ 
            backgroundColor: '#002349',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: files.length === 0 || isLoading ? 'not-allowed' : 'pointer',
            opacity: files.length === 0 || isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? 'Processing...' : 'Generate Visualization'}
        </button>
        
        {files.length > 0 && !isLoading && (
          <button 
            onClick={handleReset}
            style={{ 
              backgroundColor: '#f0f0f0',
              color: '#333',
              padding: '10px 20px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default FileUploader;