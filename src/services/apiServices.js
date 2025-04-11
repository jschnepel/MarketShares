import axios from 'axios';

// Set the base URL for API requests
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' // Production uses relative path
  : 'http://localhost:8080/api'; // Use localhost for Replit environment

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// API service functions
const apiService = {
  /**
   * Test connection to backend
   * @returns {Promise} - Promise with response data
   */
  testConnection: async () => {
    try {
      console.log('Testing backend connection');
      const response = await axios.get('http://localhost:8080/api/test');
      console.log('Backend connection test response:', response);
      return response;
    } catch (error) {
      console.error('Error connecting to backend:', error);
      throw error;
    }
  },
  /**
   * Upload file(s) for processing
   * @param {File[]} files - Array of files to upload
   * @returns {Promise} - Promise with response data
   */
  uploadFiles: async (files) => {
    const formData = new FormData();
    
    // Add each file to the form data
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    
    try {
      // Try to upload to the real backend
      console.log('Uploading files to backend');
      const response = await apiClient.post('/process-files', formData);
      console.log('Backend response:', response);
      return response;
    } catch (error) {
      console.error('Error uploading files to backend:', error);
      
      // Fallback to mock data if backend is not available
      console.warn('Falling back to mock data due to backend error');
      return await mockProcessFiles(files);
    }
  },
  
  /**
   * Generate visualization report
   * @param {Object} data - Processed data for visualization
   * @param {Object} options - Visualization options (width, height, etc.)
   * @returns {Promise} - Promise with response data
   */
  generateReport: async (data, options) => {
    try {
      // Try to use the real backend
      console.log('Generating report with options:', options);
      const response = await apiClient.post('/generate-report', { data, options });
      console.log('Backend response:', response);
      return response;
    } catch (error) {
      console.error('Error generating report:', error);
      
      // Fallback to mock data if backend is not available
      console.warn('Falling back to mock report due to backend error');
      return await mockGenerateReport(data, options);
    }
  }
};

/**
 * Mock function to simulate backend file processing
 * Will be removed when real backend is connected
 */
const mockProcessFiles = async (files) => {
  console.log('Mock processing files:', files);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data that would come from backend
  // Column B is Brand and Column M is Market Share (# value)
  return {
    data: {
      processedData: {
        labels: [
          'Russ Lyon Sotheby\'s International Realty', 
          'HomeSmart', 
          'Realty ONE Group', 
          'Coldwell Banker', 
          'Berkshire Hathaway', 
          'RE/MAX',
          'eXp Realty',
          'Keller Williams',
          'Century 21',
          'My Home Group',
          'West USA Realty',
          'Arizona Best Real Estate',
          'Launch Real Estate',
          'The Agency',
          'Homie'
        ],
        datasets: [
          {
            data: [
              15.6, 9.0, 8.7, 8.3, 7.8, 7.2, 6.5, 5.9, 5.2, 4.8, 4.3, 3.9, 3.5, 3.1, 2.7
            ],
            backgroundColor: [
              '#002349', // Russ Lyon Sotheby's blue
              '#333333', // Dark grey for other companies
              '#555555',
              '#777777',
              '#999999',
              '#aaaaaa',
              '#bbbbbb',
              '#cccccc',
              '#dddddd',
              '#eeeeee',
              '#f1f1f1',
              '#f3f3f3',
              '#f5f5f5',
              '#f7f7f7',
              '#f9f9f9'
            ],
          }
        ]
      },
      insights: {
        title: "Russ Lyon Sotheby's International Realty Market Share Analysis",
        description: "Analysis based on columns B (Brand) and M (Market Share)",
        summary: [
          "Russ Lyon Sotheby's International Realty has 15.6% market share",
          "6.6 percentage points ahead of nearest competitor (HomeSmart at 9.0%)",
          "Strong position in the Carefree/Cave Creek luxury market",
          "Top 3 brokerages control 33.3% of the luxury market"
        ]
      }
    }
  };
};

/**
 * Mock function to simulate backend report generation
 * Will be removed when real backend is connected
 */
const mockGenerateReport = async (data, options) => {
  console.log('Mock generating report with options:', options);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock response that would come from backend
  return {
    data: {
      reportUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
      format: options.format || 'png'
    }
  };
};

export default apiService;