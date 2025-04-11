import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  Title,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { TEMPLATE_TYPES, applyTemplate } from '../templates/analysisTemplates';

// Register required Chart.js components and plugins
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  Title,
  CategoryScale,
  LinearScale,
  BarElement,
  ChartDataLabels // Register the datalabels plugin
);

/**
 * Visualization component for displaying the market share data
 * 
 * @param {Object} props Component props
 * @param {Object} props.data The processed data for visualization
 * @param {Object} props.insights Additional insights about the data
 * @param {String} props.fileName Clean file name for export naming
 */
const Visualization = ({ data, insights, fileName = '', additionalMetrics }) => {
  // State for customization options
  const [chartWidth, setChartWidth] = useState(1000);
  const [chartHeight, setChartHeight] = useState(750);
  const [exportFormat, setExportFormat] = useState('png');
  const [isExporting, setIsExporting] = useState(false);
  const [activeChart, setActiveChart] = useState('bar'); // 'pie' or 'bar'
  const [sortedData, setSortedData] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATE_TYPES.MARKET_SHARE);

  // Create refs for the chart and container
  const chartRef = useRef(null);
  const chartContainerRef = useRef(null);
  
  // Process data through the selected template
  const processedTemplateData = useMemo(() => {
    if (!data || !data.labels || !data.datasets) {
      return { processedData: null, insights: null, templateOptions: {} };
    }
    return applyTemplate(data, activeTemplate);
  }, [data, activeTemplate]);
  
  // Get the correct data and insights based on template
  const displayData = processedTemplateData.processedData || data;
  const displayInsights = processedTemplateData.insights || insights;
  
  // Set up sorted data whenever the source data changes
  useEffect(() => {
    if (data && data.labels && data.datasets && data.datasets[0] && data.datasets[0].data) {
      // Combine labels, values, and colors
      const combined = data.labels.map((label, i) => ({
        label,
        value: data.datasets[0].data[i],
        color: label.includes("Sotheby's") ? '#002349' : `rgba(${71 + i * 20}, ${71 + i * 20}, ${71 + i * 20}, 1)`
      }));
      
      // Sort by value (highest to lowest)
      const sorted = [...combined].sort((a, b) => b.value - a.value);
      setSortedData(sorted);
    }
  }, [data]);
  
  // Don't render if no data is available
  if (!data || !data.labels || !data.datasets) {
    return null;
  }
  
  // Configure pie chart options with proper formatting
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 4, // Higher pixel ratio for sharper rendering
    backgroundColor: 'transparent', // Transparent background for the chart
    // Special settings to improve PNG exports with transparency
    options: {
      alpha: true // Ensure alpha channel is preserved
    },
    plugins: {
      legend: {
        position: 'right',
        labels: {
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const backgroundColor = dataset.backgroundColor[i];
                
                // Format the percentage correctly (keep decimal places)
                const formattedValue = `${value.toFixed(1)}%`;
                
                return {
                  text: `${label}: ${formattedValue}`,
                  fillStyle: backgroundColor,
                  strokeStyle: backgroundColor,
                  lineWidth: 0,
                  index: i,
                  font: {
                    family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    weight: '500'
                  }
                };
              });
            }
            return [];
          },
          font: {
            size: 13,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
          },
          padding: 15,
          usePointStyle: true,
          boxWidth: 10
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.formattedValue;
            return `${label}: ${value}%`;
          }
        },
        titleFont: {
          weight: 'bold',
          size: 14,
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
        },
        bodyFont: {
          size: 13,
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
        },
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 10,
        cornerRadius: 4
      },
      title: {
        display: true,
        text: displayInsights && displayInsights.chartTitle ? displayInsights.chartTitle : 'Top 5 Real Estate Brokerages Market Share',
        font: {
          size: 18,
          weight: 'bold',
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
        },
        padding: {
          top: 10,
          bottom: 20
        }
      }
    },
    // Ensure Sotheby's slice starts at the top (270 degrees in radians)
    rotation: -0.5 * Math.PI,
    layout: {
      padding: {
        top: 10, 
        right: 10,
        bottom: 10,
        left: 10
      }
    },
    elements: {
      arc: {
        borderWidth: 1
      }
    },
    animation: {
      duration: 500
    }
  };
  
  // We'll apply the template options later after defining the base options
  
  // Prepare data for pie chart - top 5 plus "All Others"
  const preparePieChartData = () => {
    if (!sortedData || sortedData.length === 0) {
      return displayData; // Fallback to original data if no sorted data
    }
    
    // Take the top 5 brokerages
    const top5 = sortedData.slice(0, 5);
    
    // Calculate sum of all others (if there are more than 5)
    let othersValue = 0;
    if (sortedData.length > 5) {
      othersValue = sortedData.slice(5).reduce((sum, item) => sum + item.value, 0);
    }
    
    // Create labels, data, and colors arrays
    const labels = top5.map(item => item.label);
    const data = top5.map(item => item.value);
    
    // Add "All Others" if needed
    if (othersValue > 0) {
      labels.push("All Others");
      data.push(parseFloat(othersValue.toFixed(1))); // Format to 1 decimal place
    }
    
    // Generate colors - Sotheby's blue for Sotheby's, grayscale for others
    const colors = labels.map((label, index) => {
      // Use Sotheby's blue for Russ Lyon Sotheby's International Realty
      if (label.includes("Sotheby's")) {
        return '#002349';
      }
      
      // Special darker gray for "All Others"
      if (label === "All Others") {
        return 'rgba(80, 80, 80, 1)';
      }
      
      // Create a grayscale gradient for the remaining top brokerages
      const baseGray = 90; // Start with a darker base
      const step = 25; // Larger steps for more contrast in the pie
      
      // Calculate the gray value (ensuring it doesn't get too light)
      const grayValue = Math.min(baseGray + index * step, 210);
      
      return `rgba(${grayValue}, ${grayValue}, ${grayValue}, 1)`;
    });
    
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
      }]
    };
  };
  
  // Prepare data for Chart.js horizontal bar chart
  const prepareBarChartData = () => {
    // Get the colors with Sotheby's being blue and others in grayscale
    const finalColors = sortedData.map((item, index) => {
      // Use Sotheby's blue for Russ Lyon Sotheby's International Realty
      if (item.label.includes("Sotheby's")) {
        return '#002349';
      }
      // Create a grayscale gradient that gets lighter but remains readable
      // Start darker and gradually get lighter, but maintain minimum darkness
      const baseGray = 90; // Start with a darker base
      const step = 18; // Smaller steps for more gradual fading
      
      // Calculate the gray value (ensuring it doesn't get too light)
      const grayValue = Math.min(baseGray + index * step, 210); // Cap at 210 for readability
      
      return `rgba(${grayValue}, ${grayValue}, ${grayValue}, 1)`;
    });
    
    return {
      labels: sortedData.map(item => item.label),
      datasets: [{
        data: sortedData.map(item => item.value),
        backgroundColor: finalColors,
        borderColor: finalColors,
        borderWidth: 1,
      }]
    };
  };
  
  // Configure bar chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // Horizontal bar chart
    devicePixelRatio: 4, // Higher pixel ratio for sharper rendering
    backgroundColor: 'transparent', // Transparent background for the chart
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Market Share (%)',
          font: {
            size: 14,
            weight: 'bold',
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
          }
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          },
          font: {
            weight: '500'
          },
          precision: 1
        },
        grid: {
          lineWidth: 1,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        // Don't reverse the order since we've already pre-sorted the data
        reverse: false,
        ticks: {
          font: {
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            weight: '500'
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false // No need for legend in bar chart
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.formattedValue;
            return `Market Share: ${value}%`;
          }
        },
        titleFont: {
          weight: 'bold',
          size: 14
        },
        bodyFont: {
          size: 13
        },
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 10,
        cornerRadius: 4
      },
      title: {
        display: true,
        text: displayInsights && displayInsights.chartTitle ? displayInsights.chartTitle : 'Top Real Estate Brokerages by Market Share',
        font: {
          size: 18,
          weight: 'bold',
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      // Add data labels plugin
      datalabels: {
        align: 'end',
        anchor: 'end',
        formatter: function(value) {
          return value.toFixed(1) + '%';
        },
        color: function(context) {
          // Always use white text for Sotheby's bar (which has a dark blue background)
          const index = context.dataIndex;
          const label = context.chart.data.labels[index];
          return label.includes("Sotheby's") ? 'white' : 'black';
        },
        backgroundColor: function(context) {
          // Add white background overlay for Sotheby's label to make it more visible
          const index = context.dataIndex;
          const label = context.chart.data.labels[index];
          return label.includes("Sotheby's") ? 'rgba(255, 255, 255, 0.3)' : 'transparent';
        },
        borderRadius: 3,
        padding: {
          top: 3,
          bottom: 3,
          left: 5,
          right: 5
        },
        font: {
          weight: 'bold',
          size: 12,
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
        }
      }
    },
    animation: {
      duration: 500
    },
    layout: {
      padding: {
        top: 10, 
        right: 30, // Right padding for data labels
        bottom: 10,
        left: 10
      }
    },
    elements: {
      bar: {
        borderWidth: 1,
        borderRadius: 2
      }
    }
  };
  
  // Handle export function for downloading the visualization
  const handleExport = async () => {
    if (!chartContainerRef.current) return;
    
    setIsExporting(true);
    
    try {
      if (exportFormat === 'png' || exportFormat === 'jpg') {
        // For PNG/JPG, use html2canvas with high quality settings
        const canvas = await html2canvas(chartContainerRef.current, {
          scale: 4, // Higher scale for better resolution (was 2)
          useCORS: true, // Allow cross-origin images
          allowTaint: true,
          backgroundColor: exportFormat === 'png' ? null : '#ffffff', // Transparent for PNG, white for JPG
          logging: false,
          letterRendering: true, // Improve text rendering
          imageTimeout: 0, // No timeout
          removeContainer: true, // Clean up after export
          alpha: exportFormat === 'png' // Enable alpha channel for PNG transparency
        });
        
        // Use maximum quality for image export with appropriate format
        // For PNG, we need to explicitly use PNG format with alpha channel for transparency
        const imageUrl = exportFormat === 'png' 
          ? canvas.toDataURL('image/png')  // Use default quality for PNG to preserve transparency
          : canvas.toDataURL(`image/${exportFormat}`, 1.0); // 1.0 is max quality for JPG
        
        // Create and trigger download with dynamic file name
        const link = document.createElement('a');
        link.href = imageUrl;
        
        // Use different prefixes based on the active template
        let filePrefix;
        if (activeTemplate === TEMPLATE_TYPES.MARKET_SHARE) {
          filePrefix = 'marketShares_';
        } else if (activeTemplate === TEMPLATE_TYPES.OTHER_INSIGHTS) {
          filePrefix = 'oI_';
        } else if (activeTemplate === TEMPLATE_TYPES.COMBINED_VIEW) {
          filePrefix = 'combined_';
        } else {
          filePrefix = 'report_'; // Default fallback
        }
        
        let downloadName;
        if (fileName) {
          // Use derived filename from uploaded file with the appropriate prefix
          downloadName = `${filePrefix}${fileName.replace(/\s+/g, '_').toLowerCase()}.${exportFormat}`;
        } else {
          // Fallback to default filename
          downloadName = `${filePrefix}russ_lyon_sothebys.${exportFormat}`;
        }
          
        link.download = downloadName;
        link.click();
      } else if (exportFormat === 'pdf') {
        // For PDF, use jsPDF with html2canvas at high quality
        const canvas = await html2canvas(chartContainerRef.current, {
          scale: 4, // Higher scale for better resolution (was 2)
          useCORS: true, // Allow cross-origin images
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          letterRendering: true, // Improve text rendering
          imageTimeout: 0, // No timeout
          removeContainer: false, // Keep container styles
          ignoreElements: (element) => false, // Don't ignore any elements
          onclone: (documentClone, element) => {
            // Ensure all styled elements are properly captured
            const clonedElement = documentClone.getElementById(element.id);
            if (clonedElement) {
              // Force render any box-shadow or similar styles
              clonedElement.style.boxShadow = element.style.boxShadow;
              clonedElement.style.borderRadius = element.style.borderRadius;
            }
          }
        });
        
        // Get high-quality PNG data
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Create PDF with appropriate dimensions
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [chartWidth, chartHeight],
          compress: false // Better quality without compression
        });
        
        // Add image to PDF with proper dimensions
        pdf.addImage(imgData, 'PNG', 0, 0, chartWidth, chartHeight, '', 'FAST');
        
        // Use different prefixes based on the active template for PDF as well
        let filePrefix;
        if (activeTemplate === TEMPLATE_TYPES.MARKET_SHARE) {
          filePrefix = 'marketShares_';
        } else if (activeTemplate === TEMPLATE_TYPES.OTHER_INSIGHTS) {
          filePrefix = 'oI_';
        } else if (activeTemplate === TEMPLATE_TYPES.COMBINED_VIEW) {
          filePrefix = 'combined_';
        } else {
          filePrefix = 'report_'; // Default fallback
        }
        
        let pdfFileName;
        if (fileName) {
          // Use derived filename from uploaded file with the appropriate prefix
          pdfFileName = `${filePrefix}${fileName.replace(/\s+/g, '_').toLowerCase()}.pdf`;
        } else {
          // Fallback to default filename
          pdfFileName = `${filePrefix}russ_lyon_sothebys.pdf`;
        }
          
        pdf.save(pdfFileName);
      }
    } catch (error) {
      console.error('Error exporting chart:', error);
      alert('Failed to export chart. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  // Now apply template-specific chart options after both chart options are defined
  const templateOptions = processedTemplateData.templateOptions || {};
  const finalPieOptions = { ...pieChartOptions, ...templateOptions };
  
  // For bar chart, ensure legend is always disabled regardless of template settings
  const finalBarOptions = { 
    ...barChartOptions, 
    ...templateOptions,
    plugins: {
      ...barChartOptions.plugins,
      ...templateOptions.plugins,
      legend: { 
        display: false // Always disable legend for bar chart
      }
    }
  };

  return (
    <div className="visualization-section">
      <h2>{displayInsights ? displayInsights.title : "Market Share Analysis"}</h2>
      
      {displayInsights && displayInsights.description && (
        <p>{displayInsights.description}</p>
      )}
      
      {displayInsights && displayInsights.summary && (
        <div className="insights-summary">
          <h3>Key Insights:</h3>
          <ul>
            {displayInsights.summary.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="analysis-selector" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '10px' }}>Analysis Type:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={() => setActiveTemplate(TEMPLATE_TYPES.MARKET_SHARE)}
            className={`btn ${activeTemplate === TEMPLATE_TYPES.MARKET_SHARE ? '' : 'secondary'}`}
            style={{ 
              backgroundColor: activeTemplate === TEMPLATE_TYPES.MARKET_SHARE ? '#002349' : '#f0f0f0',
              color: activeTemplate === TEMPLATE_TYPES.MARKET_SHARE ? 'white' : '#333'
            }}
          >
            Market Share
          </button>
          <button 
            onClick={() => setActiveTemplate(TEMPLATE_TYPES.OTHER_INSIGHTS)}
            className={`btn ${activeTemplate === TEMPLATE_TYPES.OTHER_INSIGHTS ? '' : 'secondary'}`}
            style={{ 
              backgroundColor: activeTemplate === TEMPLATE_TYPES.OTHER_INSIGHTS ? '#002349' : '#f0f0f0',
              color: activeTemplate === TEMPLATE_TYPES.OTHER_INSIGHTS ? 'white' : '#333'
            }}
          >
            Other Insights
          </button>
          <button 
            onClick={() => setActiveTemplate(TEMPLATE_TYPES.COMBINED_VIEW)}
            className={`btn ${activeTemplate === TEMPLATE_TYPES.COMBINED_VIEW ? '' : 'secondary'}`}
            style={{ 
              backgroundColor: activeTemplate === TEMPLATE_TYPES.COMBINED_VIEW ? '#002349' : '#f0f0f0',
              color: activeTemplate === TEMPLATE_TYPES.COMBINED_VIEW ? 'white' : '#333'
            }}
          >
            Combined View
          </button>
        </div>
      </div>
      
      {/* Only show chart type selector for Market Share template */}
      {activeTemplate === TEMPLATE_TYPES.MARKET_SHARE && (
        <div className="chart-type-selector" style={{ marginBottom: '20px', textAlign: 'center' }}>
          <button 
            onClick={() => setActiveChart('pie')}
            className={`btn ${activeChart === 'pie' ? '' : 'secondary'}`}
            style={{ 
              marginRight: '10px', 
              backgroundColor: activeChart === 'pie' ? '#002349' : '#f0f0f0',
              color: activeChart === 'pie' ? 'white' : '#333'
            }}
          >
            Pie Chart
          </button>
          <button 
            onClick={() => setActiveChart('bar')}
            className={`btn ${activeChart === 'bar' ? '' : 'secondary'}`}
            style={{ 
              backgroundColor: activeChart === 'bar' ? '#002349' : '#f0f0f0',
              color: activeChart === 'bar' ? 'white' : '#333'
            }}
          >
            Bar Chart
          </button>
        </div>
      )}
      
      {activeTemplate === TEMPLATE_TYPES.MARKET_SHARE ? (
        <div 
          ref={chartContainerRef} 
          className="chart-container" 
          style={{ 
            width: `${chartWidth}px`, 
            height: `${chartHeight}px`, 
            margin: '0 auto',
            border: '1px solid #eee', // Keep border for all exports
            padding: '15px',
            boxSizing: 'border-box',
            backgroundColor: exportFormat === 'png' ? 'transparent' : '#ffffff', // Transparent background only for PNG
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)', // Keep shadow for all exports
            borderRadius: '4px', // Keep rounded corners for all exports
            imageRendering: 'high-quality'
          }}
        >
          {activeChart === 'pie' ? (
            <Pie 
              ref={chartRef}
              data={preparePieChartData()}
              options={finalPieOptions}
            />
          ) : (
            <Bar 
              ref={chartRef}
              data={prepareBarChartData()} 
              options={finalBarOptions}
            />
          )}
        </div>
      ) : activeTemplate === TEMPLATE_TYPES.COMBINED_VIEW ? (
        <div 
          ref={chartContainerRef}
          className="combined-view-container" 
          style={{ 
            width: `${chartWidth}px`, 
            minHeight: `${chartHeight}px`, 
            margin: '0 auto',
            border: '1px solid #eee',
            padding: '15px 20px',
            boxSizing: 'border-box',
            backgroundColor: exportFormat === 'png' ? 'transparent' : '#ffffff', // Transparent background only for PNG
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)', // Keep shadow for all exports
            borderRadius: '4px', // Keep rounded corners for all exports
            position: 'relative'
          }}
        >
          <h3 style={{ 
            color: '#002349', 
            marginBottom: '20px', 
            textAlign: 'center', 
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            Russ Lyon Sotheby's International Realty
          </h3>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            flexWrap: 'nowrap', 
            gap: '20px',
            alignItems: 'flex-start',
            justifyContent: 'space-between' 
          }}>
            {/* Chart section */}
            <div style={{ 
              flex: '5', 
              minWidth: '75%'
            }}>
              <div style={{
                backgroundColor: '#fff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.07)',
                borderRadius: '4px',
                padding: '30px 0px 0px 0px',
                marginBottom: '0'
              }}>

                <div style={{ 
                  height: `${chartHeight * 0.9}px`,
                  width: '100%',
                  margin: '0 auto'
                }}>
                  <Bar 
                    data={prepareBarChartData()} 
                    options={{
                      ...finalBarOptions,
                      maintainAspectRatio: false,
                      plugins: {
                        ...finalBarOptions.plugins,
                        legend: { display: false }
                      },
                      scales: {
                        ...finalBarOptions.scales,
                        x: {
                          ...finalBarOptions.scales?.x,
                          grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                          }
                        },
                        y: {
                          ...finalBarOptions.scales?.y,
                          grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                          },
                          ticks: {
                            font: {
                              size: 13
                            },
                            padding: 8
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Right side - Metrics section */}
            <div style={{ 
              flex: '1', 
              minWidth: '200px',
              maxWidth: '250px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginTop: '45px'
            }}>
              {/* Total Sales Card */}
              <div style={{
                backgroundColor: '#ffffff',
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.18)',
                borderRadius: '4px',
                padding: '15px 20px',
                textAlign: 'center',
                borderLeft: '4px solid #002349',
                border: '1px solid #d0d5dd'
              }}>
                <h4 style={{ 
                  color: '#333', 
                  fontSize: '15px', 
                  margin: '0 0 8px 0',
                  fontWeight: 'normal'
                }}>
                  Total Number of Sales
                </h4>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: '#002349',
                  margin: '0' 
                }}>
                  {additionalMetrics?.totalSales || 0}
                </div>

              </div>

              {/* Average Price Card */}
              <div style={{
                backgroundColor: '#ffffff',
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.18)',
                borderRadius: '4px',
                padding: '15px 20px',
                textAlign: 'center',
                borderLeft: '4px solid #002349',
                border: '1px solid #d0d5dd'
              }}>
                <h4 style={{ 
                  color: '#333', 
                  fontSize: '15px', 
                  margin: '0 0 8px 0',
                  fontWeight: 'normal'
                }}>
                  Average Sales Price
                </h4>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: '#002349',
                  margin: '0' 
                }}>
                  {additionalMetrics?.averagePrice || '$0'}
                </div>

              </div>

              {/* Days on Market Card */}
              <div style={{
                backgroundColor: '#ffffff',
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.18)',
                borderRadius: '4px',
                padding: '15px 20px',
                textAlign: 'center',
                borderLeft: '4px solid #002349',
                border: '1px solid #d0d5dd'
              }}>
                <h4 style={{ 
                  color: '#333', 
                  fontSize: '15px', 
                  margin: '0 0 8px 0',
                  fontWeight: 'normal'
                }}>
                  Average Days On Market
                </h4>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: '#002349',
                  margin: '0' 
                }}>
                  {additionalMetrics?.daysOnMarket || 0}
                </div>
              </div>

              {/* Price Per Sqft Card - Only show if data exists */}
              {additionalMetrics?.pricePerSqft && additionalMetrics.pricePerSqft !== '$0' && (
                <div style={{
                  backgroundColor: '#ffffff',
                  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.18)',
                  borderRadius: '4px',
                  padding: '15px 20px',
                  textAlign: 'center',
                  borderLeft: '4px solid #002349',
                  border: '1px solid #d0d5dd'
                }}>
                  <h4 style={{ 
                    color: '#333', 
                    fontSize: '15px', 
                    margin: '0 0 8px 0',
                    fontWeight: 'normal'
                  }}>
                    Price Per Sq. Ft.
                  </h4>
                  <div style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    color: '#002349',
                    margin: '0' 
                  }}>
                    {additionalMetrics.pricePerSqft}
                  </div>
                </div>
              )}

              {/* Sale-to-List Ratio Card - Only show if data exists */}
              {additionalMetrics?.closedListRatio && additionalMetrics.closedListRatio !== '0%' && (
                <div style={{
                  backgroundColor: '#ffffff',
                  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.18)',
                  borderRadius: '4px',
                  padding: '15px 20px',
                  textAlign: 'center',
                  borderLeft: '4px solid #002349',
                  border: '1px solid #d0d5dd'
                }}>
                  <h4 style={{ 
                    color: '#333', 
                    fontSize: '15px', 
                    margin: '0 0 8px 0',
                    fontWeight: 'normal'
                  }}>
                    Sale-to-List Ratio
                  </h4>
                  <div style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    color: '#002349',
                    margin: '0' 
                  }}>
                    {additionalMetrics.closedListRatio}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Key findings box */}
          <div className="key-findings-box" style={{ 
            marginTop: '25px',
            backgroundColor: '#f0f7ff',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.15)',
            borderRadius: '8px',
            padding: '22px 25px',
            borderLeft: '4px solid #002349',
            border: '1px solid #c0d5ee',
            maxWidth: '85%',
            margin: '25px auto 0'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              margin: '0 0 15px 0',
              fontWeight: 'bold',
              color: '#002349',
              borderBottom: '1px solid rgba(0, 35, 73, 0.2)',
              paddingBottom: '10px'
            }}>
              Key Market Findings
            </h3>
            
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 100%', minWidth: '280px' }}>
                <h4 style={{ 
                  fontSize: '15px', 
                  margin: '0 0 10px 0',
                  fontWeight: '500',
                  color: '#444'
                }}>
                  <span style={{ 
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#002349',
                    marginRight: '8px',
                    verticalAlign: 'middle'
                  }}></span>
                  Market Position
                </h4>
                <ul style={{ 
                  listStyleType: 'none', 
                  padding: '0 0 0 20px', 
                  margin: '0 0 15px 0',
                  lineHeight: '1.6'
                }}>
                  {displayInsights && displayInsights.summary && displayInsights.summary.slice(0, 3).map((item, index) => (
                    <li key={index} style={{ 
                      margin: '6px 0',
                      fontSize: '14px',
                      paddingLeft: '22px',
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: '0',
                        top: '6px',
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#002349',
                        borderRadius: '50%'
                      }}></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div style={{ flex: '1 1 100%', minWidth: '280px' }}>
                <h4 style={{ 
                  fontSize: '15px', 
                  margin: '0 0 10px 0',
                  fontWeight: '500',
                  color: '#444'
                }}>
                  <span style={{ 
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#002349',
                    marginRight: '8px',
                    verticalAlign: 'middle'
                  }}></span>
                  Competitive Advantages
                </h4>
                <ul style={{ 
                  listStyleType: 'none', 
                  padding: '0 0 0 20px', 
                  margin: '0',
                  lineHeight: '1.6'
                }}>
                  {displayInsights && displayInsights.summary && displayInsights.summary.slice(3).map((item, index) => (
                    <li key={index} style={{ 
                      margin: '6px 0',
                      fontSize: '14px',
                      paddingLeft: '22px',
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: '0',
                        top: '6px',
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#002349',
                        borderRadius: '50%'
                      }}></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Logo at bottom - shown for all exports */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <img 
              src="https://www.russlyon.com/wp-content/uploads/2023/06/rus-header-logo-22.png" 
              alt="Russ Lyon Sotheby's Logo" 
              style={{ 
                width: '150px', 
                margin: '0 auto',
                display: 'block',
                opacity: 0.85
              }} 
            />
          </div>
        </div>
      ) : (
        <div 
          ref={chartContainerRef}
          className="other-insights-container" 
          style={{ 
            width: `${chartWidth}px`, 
            minHeight: `${chartHeight/2}px`, 
            margin: '0 auto',
            border: '1px solid rgba(0, 35, 73, 0.1)',
            padding: '25px',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
          }}
        >
          <h2 style={{ 
            color: '#002349', 
            marginBottom: '25px', 
            textAlign: 'center',
            fontSize: '22px',
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(0, 35, 73, 0.1)',
            paddingBottom: '15px'
          }}>
            Russ Lyon Sotheby's International Realty
          </h2>
          
          <h3 style={{
            fontSize: '16px',
            margin: '0 0 20px 0',
            color: '#555',
            textAlign: 'center',
            fontWeight: 'normal'
          }}>
            Performance Metrics Dashboard
          </h3>
          
          {/* Metrics Cards Section */}
          <div className="metric-cards" style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '20px', 
            justifyContent: 'center',
            marginBottom: '30px' 
          }}>
            {/* Total Sales Card */}
            <div className="metric-card" style={{
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              borderRadius: '8px',
              padding: '20px',
              width: 'calc(33% - 15px)',
              minWidth: '180px',
              textAlign: 'center',
              borderTop: '4px solid #002349'
            }}>
              <h4 style={{ 
                color: '#444', 
                fontSize: '15px', 
                marginBottom: '10px',
                fontWeight: '500'
              }}>
                Total Number of Sales
              </h4>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: '#002349',
                margin: '10px 0' 
              }}>
                {additionalMetrics?.totalSales || 0}
              </div>
              <p style={{ 
                fontSize: '13px', 
                color: '#666',
                margin: '5px 0 0 0'
              }}>
                Properties sold
              </p>
            </div>

            {/* Average Price Card */}
            <div className="metric-card" style={{
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              borderRadius: '8px',
              padding: '20px',
              width: 'calc(33% - 15px)',
              minWidth: '180px',
              textAlign: 'center',
              borderTop: '4px solid #002349'
            }}>
              <h4 style={{ 
                color: '#444', 
                fontSize: '15px', 
                marginBottom: '10px',
                fontWeight: '500'
              }}>
                Average Sales Price
              </h4>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: '#002349',
                margin: '10px 0' 
              }}>
                {additionalMetrics?.averagePrice || '$0'}
              </div>
              <p style={{ 
                fontSize: '13px', 
                color: '#666',
                margin: '5px 0 0 0'
              }}>
                Per property
              </p>
            </div>

            {/* Days on Market Card */}
            <div className="metric-card" style={{
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              borderRadius: '8px',
              padding: '20px',
              width: 'calc(33% - 15px)',
              minWidth: '180px',
              textAlign: 'center',
              borderTop: '4px solid #002349'
            }}>
              <h4 style={{ 
                color: '#444', 
                fontSize: '15px', 
                marginBottom: '10px',
                fontWeight: '500'
              }}>
                Average Days On Market
              </h4>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: '#002349',
                margin: '10px 0' 
              }}>
                {additionalMetrics?.daysOnMarket || 0}
              </div>
              <p style={{ 
                fontSize: '13px', 
                color: '#666',
                margin: '5px 0 0 0'
              }}>
                Time to sell
              </p>
            </div>
            
            {/* Price Per Sq. Ft. Card - Only show if data exists */}
            {additionalMetrics?.pricePerSqft && additionalMetrics.pricePerSqft !== '$0' && (
              <div className="metric-card" style={{
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                borderRadius: '8px',
                padding: '20px',
                width: 'calc(33% - 15px)',
                minWidth: '180px',
                textAlign: 'center',
                borderTop: '4px solid #002349'
              }}>
                <h4 style={{ 
                  color: '#444', 
                  fontSize: '15px', 
                  marginBottom: '10px',
                  fontWeight: '500'
                }}>
                  Price Per Sq. Ft.
                </h4>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: '#002349',
                  margin: '10px 0' 
                }}>
                  {additionalMetrics.pricePerSqft}
                </div>
                <p style={{ 
                  fontSize: '13px', 
                  color: '#666',
                  margin: '5px 0 0 0'
                }}>
                  Average price/sq.ft
                </p>
              </div>
            )}
            
            {/* Sale-to-List Ratio Card - Only show if data exists */}
            {additionalMetrics?.closedListRatio && additionalMetrics.closedListRatio !== '0%' && (
              <div className="metric-card" style={{
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                borderRadius: '8px',
                padding: '20px',
                width: 'calc(33% - 15px)',
                minWidth: '180px',
                textAlign: 'center',
                borderTop: '4px solid #002349'
              }}>
                <h4 style={{ 
                  color: '#444', 
                  fontSize: '15px', 
                  marginBottom: '10px',
                  fontWeight: '500'
                }}>
                  Sale-to-List Ratio
                </h4>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: '#002349',
                  margin: '10px 0' 
                }}>
                  {additionalMetrics.closedListRatio}
                </div>
                <p style={{ 
                  fontSize: '13px', 
                  color: '#666',
                  margin: '5px 0 0 0'
                }}>
                  Selling vs asking
                </p>
              </div>
            )}
          </div>

          <div className="insights-details key-findings-box" style={{ 
            marginBottom: '25px',
            backgroundColor: '#f0f7ff',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.15)',
            borderRadius: '8px',
            padding: '22px 25px',
            borderLeft: '4px solid #002349',
            border: '1px solid #c0d5ee',
            maxWidth: '85%',
            margin: '0 auto 25px'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              margin: '0 0 15px 0',
              fontWeight: 'bold',
              color: '#002349',
              borderBottom: '1px solid rgba(0, 35, 73, 0.2)',
              paddingBottom: '10px'
            }}>
              Key Market Findings
            </h3>
            
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 100%', minWidth: '280px' }}>
                <h4 style={{ 
                  fontSize: '15px', 
                  margin: '0 0 10px 0',
                  fontWeight: '500',
                  color: '#444'
                }}>
                  <span style={{ 
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#002349',
                    marginRight: '8px',
                    verticalAlign: 'middle'
                  }}></span>
                  Market Position
                </h4>
                <ul style={{ 
                  listStyleType: 'none', 
                  padding: '0 0 0 20px', 
                  margin: '0 0 15px 0',
                  lineHeight: '1.6'
                }}>
                  {displayInsights && displayInsights.summary && displayInsights.summary.slice(0, 3).map((item, index) => (
                    <li key={index} style={{ 
                      margin: '6px 0',
                      fontSize: '14px',
                      paddingLeft: '22px',
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: '0',
                        top: '6px',
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#002349',
                        borderRadius: '50%'
                      }}></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div style={{ flex: '1 1 100%', minWidth: '280px' }}>
                <h4 style={{ 
                  fontSize: '15px', 
                  margin: '0 0 10px 0',
                  fontWeight: '500',
                  color: '#444'
                }}>
                  <span style={{ 
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#002349',
                    marginRight: '8px',
                    verticalAlign: 'middle'
                  }}></span>
                  Competitive Advantages
                </h4>
                <ul style={{ 
                  listStyleType: 'none', 
                  padding: '0 0 0 20px', 
                  margin: '0',
                  lineHeight: '1.6'
                }}>
                  {displayInsights && displayInsights.summary && displayInsights.summary.slice(3).map((item, index) => (
                    <li key={index} style={{ 
                      margin: '6px 0',
                      fontSize: '14px',
                      paddingLeft: '22px',
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: '0',
                        top: '6px',
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#002349',
                        borderRadius: '50%'
                      }}></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '25px' }}>
            <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
              Contact our team for detailed market analysis and personalized insights
            </p>
            <img 
              src="https://www.russlyon.com/wp-content/uploads/2023/06/rus-header-logo-22.png" 
              alt="Russ Lyon Sotheby's Logo" 
              style={{ 
                width: '180px', 
                margin: '15px auto',
                display: 'block',
                opacity: 0.85
              }} 
            />
          </div>
        </div>
      )}
      
      <div className="export-options" style={{ marginTop: '20px' }}>
        <h3>Customize & Export</h3>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
          <div className="input-group">
            <label htmlFor="width">Width (px)</label>
            <input
              id="width"
              type="number"
              min="400"
              max="2000"
              value={chartWidth}
              onChange={(e) => setChartWidth(Number(e.target.value))}
              style={{ width: '80px' }}
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="height">Height (px)</label>
            <input
              id="height"
              type="number"
              min="400"
              max="2000"
              value={chartHeight}
              onChange={(e) => setChartHeight(Number(e.target.value))}
              style={{ width: '80px' }}
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="format">Export Format</label>
            <select
              id="format"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              style={{ width: '80px' }}
            >
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          
          <div style={{ flexBasis: '100%', marginTop: '10px' }}>
            <p style={{ fontSize: '12px', margin: '5px 0 0 0', color: '#666' }}>
              Files will be exported with prefix: 
              {activeTemplate === TEMPLATE_TYPES.MARKET_SHARE && " \"marketShares_\""}
              {activeTemplate === TEMPLATE_TYPES.OTHER_INSIGHTS && " \"oI_\""}
              {activeTemplate === TEMPLATE_TYPES.COMBINED_VIEW && " \"combined_\""}
            </p>
          </div>
        </div>
        
        <div>
          <button 
            className="btn" 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
          </button>
          
          {exportFormat === 'png' && (
            <div style={{ fontSize: '12px', marginTop: '5px', color: '#555' }}>
              PNG exports maintain styling with transparent background
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Visualization;