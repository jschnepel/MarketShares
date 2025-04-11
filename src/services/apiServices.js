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
          'Brokerage #1', 
          'Brokerage #2', 
          'Brokerage #3', 
          'Brokerage #4', 
          'Brokerage #5', 
          'Brokerage #6',
          'Brokerage #7',
          'Brokerage #8',
          'Brokerage #9',
          'Brokerage #10',
          'Brokerage #11',
          'Brokerage #12',
          'Brokerage #13',
          'Brokerage #14',
          'Brokerage #15'
        ],
        datasets: [
          {
            data: [
              5, 1, 2, 1, 3, 2, 1, 6, 3, 4, 5, 6, 8, 4, 1
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
        title: "Market Share Analysis",
        description: "Analysis based on columns B (Brand) and M (Market Share)",
        summary: [
          "Realty has 15.6% market share",
          "6.6 percentage points ahead of nearest competitor",
          "Strong position in the market",
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
