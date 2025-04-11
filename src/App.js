import React, { useState } from "react";
import FileUploader from "./components/FileUploader";
import Visualization from "./components/Visualization";
import { processFile } from "./utils/fileProcessor";
import "./styles/index.css";

function App() {
  // State for tracking data loading and processed results
  const [isLoading, setIsLoading] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [additionalMetrics, setAdditionalMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");

  /**
   * Extract location or main identifier from file name
   * @param {string} filename - Original file name with extension
   * @returns {string} Cleaned filename for export
   */
  const getCleanFileName = (filename) => {
    if (!filename) return "";

    // Remove extension
    let cleanName = filename.replace(/\.(xlsx|xls|csv)$/i, "");

    // Remove special characters, replace with spaces
    cleanName = cleanName.replace(/[_-]/g, " ");

    // Title case the name
    cleanName = cleanName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    // If it's too long, truncate it
    if (cleanName.length > 30) {
      cleanName = cleanName.substring(0, 30) + "...";
    }

    return cleanName.trim();
  };

  /**
   * Handle file upload and process data for visualization
   * Uses direct file processing in the browser
   * @param {File[]} files - Array of uploaded files
   */
  const handleFilesUploaded = async (files) => {
    setIsLoading(true);
    setError(null);

    try {
      // File processing flow
      if (!files || files.length === 0) {
        throw new Error("No files uploaded");
      }

      // Process the first file (we'll enhance this later for multiple files)
      const file = files[0];
      console.log("Processing file:", file.name);

      // Store the filename for export naming
      const cleanFileName = getCleanFileName(file.name);
      setFileName(cleanFileName);

      // Process the file directly in the browser
      const result = await processFile(file);

      console.log("File processing result:", result);
      console.log("Processed data:", result.processedData);
      console.log("Data labels:", result.processedData.labels);
      console.log("Data values:", result.processedData.datasets[0].data);

      // Update state with processed data
      setProcessedData(result.processedData);
      setInsights(result.insights);
      setAdditionalMetrics(result.additionalMetrics);
    } catch (err) {
      console.error("Error processing files:", err);
      setError(
        "Failed to process file. Please ensure the file contains brokerage names in column B and market share data in either column I (Mkt %) or column M ($ Vol Per Prod Agent).",
      );
      setProcessedData(null);
      setInsights(null);
      setFileName("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <h1>Russ Lyon Sotheby's International Realty Market Intelligence</h1>
        </div>
      </header>

      <main className="container">
        <FileUploader
          onFilesUploaded={handleFilesUploaded}
          isLoading={isLoading}
        />

        {error && (
          <div
            className="error-message"
            style={{ color: "red", marginBottom: "20px" }}
          >
            {error}
          </div>
        )}

        {processedData && !error && (
          <Visualization
            data={processedData}
            insights={insights}
            additionalMetrics={additionalMetrics}
            fileName={fileName}
          />
        )}
      </main>

      <footer
        className="footer"
        style={{
          textAlign: "center",
          padding: "20px",
          marginTop: "50px",
          borderTop: "1px solid #eee",
        }}
      >
        <p>© 2025 Russ Lyon Sotheby's International Realty Market Intelligence Platform</p>
      </footer>
    </div>
  );
}

export default App;
