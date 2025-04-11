/**
 * Analysis templates for different market visualization scenarios
 * Each template provides specific configuration for different analysis contexts
 */

// Analysis template types
export const TEMPLATE_TYPES = {
    MARKET_SHARE: 'market_share',
    OTHER_INSIGHTS: 'other_insights',
    COMBINED_VIEW: 'combined_view'
  };
  
  // Base colors (Sotheby's blue and grayscale palette)
  const SOTHEBYS_BLUE = '#002349';
  const GRAYSCALE_BASE = 90;
  const GRAYSCALE_STEP = 18;
  const GRAYSCALE_MAX = 210;
  
  /**
   * Generate colors for chart elements based on template type
   * @param {Array} labels - Data labels (brand names)
   * @param {String} templateType - Type of analysis template 
   * @returns {Array} - Array of color codes
   */
  export const generateTemplateColors = (labels, templateType = TEMPLATE_TYPES.MARKET_SHARE) => {
    return labels.map((label, index) => {
      // Sotheby's is always highlighted with brand blue
      if (label.includes("Sotheby's")) {
        return SOTHEBYS_BLUE;
      }
      
      // Apply different color strategies based on template
      switch (templateType) {
        case TEMPLATE_TYPES.OTHER_INSIGHTS:
          // For other insights, use a blue-tinted grayscale for competition
          if (index < 3) {
            // Highlight top competitors with slightly blue tint
            const insightsHighValue = Math.min(GRAYSCALE_BASE + index * GRAYSCALE_STEP, GRAYSCALE_MAX);
            return `rgba(${insightsHighValue}, ${insightsHighValue}, ${insightsHighValue + 20}, 1)`;
          } else {
            // Others with standard grayscale
            const insightsValue = Math.min(GRAYSCALE_BASE + index * GRAYSCALE_STEP, GRAYSCALE_MAX);
            return `rgba(${insightsValue}, ${insightsValue}, ${insightsValue}, 1)`;
          }
          
        case TEMPLATE_TYPES.MARKET_SHARE:
        default:
          // Standard market share grayscale
          const grayValue = Math.min(GRAYSCALE_BASE + index * GRAYSCALE_STEP, GRAYSCALE_MAX);
          return `rgba(${grayValue}, ${grayValue}, ${grayValue}, 1)`;
      }
    });
  };
  
  /**
   * Get chart title and description based on template type
   * @param {String} templateType - Type of analysis template
   * @returns {Object} - Title and description
   */
  export const getTemplateText = (templateType = TEMPLATE_TYPES.MARKET_SHARE) => {
    switch (templateType) {
      case TEMPLATE_TYPES.OTHER_INSIGHTS:
        return {
          title: "Other Market Insights",
          description: "Additional analysis and key metrics",
          chartTitle: "Market Analysis Insights"
        };
        
      case TEMPLATE_TYPES.COMBINED_VIEW:
        return {
          title: "Complete Market Analysis",
          description: "Comprehensive view of market share and key metrics",
          chartTitle: "Top 10 Real Estate Brokerages by Market Share"
        };
        
      case TEMPLATE_TYPES.MARKET_SHARE:
      default:
        return {
          title: "Market Share Analysis",
          description: "Comparative analysis of market position",
          chartTitle: "Top 10 Real Estate Brokerages by Market Share"
        };
    }
  };
  
  /**
   * Get template-specific chart configuration options
   * @param {String} templateType - Type of analysis template
   * @returns {Object} - Template-specific chart options
   */
  export const getTemplateOptions = (templateType = TEMPLATE_TYPES.MARKET_SHARE) => {
    // Add Sotheby's white label overlay to all templates
    const baseOptions = {
      legend: {
        display: true,
        position: 'right',
      },
      animation: {
        duration: 500
      },
      plugins: {
        datalabels: {
          color: function(context) {
            // Always use white text for Sotheby's bar (which has a dark blue background)
            const index = context.dataIndex;
            const label = context.chart.data.labels[index];
            return label.includes("Sotheby's") ? 'white' : 'black';
          },
          backgroundColor: function(context) {
            // No background overlay (transparent for all labels)
            return 'transparent';
          },
          borderRadius: 3,
          padding: {
            top: 3,
            bottom: 3,
            left: 5,
            right: 5
          }
        }
      }
    };
    
    switch (templateType) {
      case TEMPLATE_TYPES.OTHER_INSIGHTS:
        return {
          ...baseOptions,
          // Hide the charts completely for the "Other Insights" tab
          // by returning options that effectively disable rendering
          animation: {
            duration: 0
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: false
            },
            datalabels: {
              display: false
            }
          },
          scales: {
            x: { display: false },
            y: { display: false }
          }
        };
        
      case TEMPLATE_TYPES.MARKET_SHARE:
      default:
        return {
          ...baseOptions
        };
    }
  };
  
  /**
   * Generate insights based on data and template type
   * @param {Array} data - Processed data array with labels and values
   * @param {String} templateType - Type of analysis template
   * @returns {Array} - Array of insight strings
   */
  export const generateTemplateInsights = (data, templateType = TEMPLATE_TYPES.MARKET_SHARE) => {
    // Find Sotheby's position and value
    const sothebysItem = data.find(item => item.label.includes("Sotheby's"));
    const sothebysValue = sothebysItem ? sothebysItem.value : 0;
    
    // Get top competitor (non-Sotheby's with highest value)
    const topCompetitor = data.filter(item => !item.label.includes("Sotheby's"))
      .sort((a, b) => b.value - a.value)[0];
    
    // Calculate various metrics
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    const valueGap = sothebysItem && topCompetitor ? 
      (sothebysValue - topCompetitor.value).toFixed(1) : 0;
    
    // Top 3 combined market share
    const top3Values = [...data]
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .reduce((sum, item) => sum + item.value, 0);
    const top3Percentage = (top3Values / totalValue * 100).toFixed(1);
    
    // Basic insights that apply to all templates
    const baseInsights = [
      `Russ Lyon Sotheby's International Realty has ${sothebysValue.toFixed(1)}% market share`,
      sothebysItem && topCompetitor ? 
        `${valueGap} percentage points ${valueGap > 0 ? 'ahead of' : 'behind'} nearest competitor (${topCompetitor.label} at ${topCompetitor.value.toFixed(1)}%)` : 
        'Competitive position in the real estate market',
      `Top 3 brokerages control ${top3Percentage}% of the market`
    ];
    
    // Template-specific insights
    switch (templateType) {
      case TEMPLATE_TYPES.OTHER_INSIGHTS:
        return [
          ...baseInsights,
          `Luxury market positioning with a focus on higher-value properties`,
          `Efficient sales process with optimized days on market`,
          `Higher-than-average price per square foot indicates premium property portfolio`,
          `Strong sale-to-list price ratio demonstrates effective pricing strategy`,
          `Demonstrated commitment to quality over quantity in transactions`
        ];
        
      case TEMPLATE_TYPES.COMBINED_VIEW:
        return [
          ...baseInsights,
          `Leads market in client satisfaction and premium service delivery`,
          `Expert agents specializing in luxury and high-end real estate`,
          `Consistently achieving optimal results for clients across all metrics`,
          `Strategic presence in key high-value neighborhoods and communities`
        ];
        
      case TEMPLATE_TYPES.MARKET_SHARE:
      default:
        return [
          ...baseInsights,
          `Established dominant position in the competitive luxury real estate market`,
          `Significant lead over nearest competitors in market share percentage`,
          `Trusted brand with decades of expertise in premium properties`
        ];
    }
  };
  
  /**
   * Full template configuration for a given analysis type
   * @param {Object} data - Processed data with labels and datasets
   * @param {String} templateType - Type of analysis template
   * @returns {Object} - Complete template configuration
   */
  export const applyTemplate = (data, templateType = TEMPLATE_TYPES.MARKET_SHARE) => {
    // Extract the data in a normalized format
    if (!data || !data.labels || !data.datasets || !data.datasets[0]) {
      return { 
        processedData: data,
        insights: null,
        templateType
      };
    }
    
    const normalizedData = data.labels.map((label, i) => ({
      label,
      value: data.datasets[0].data[i]
    }));
    
    // Sort data by value (highest to lowest)
    const sortedData = [...normalizedData].sort((a, b) => b.value - a.value);
    
    // Generate colors based on template
    const colors = generateTemplateColors(sortedData.map(item => item.label), templateType);
    
    // Create template-specific text
    const templateText = getTemplateText(templateType);
    
    // Generate insights
    const insightSummary = generateTemplateInsights(sortedData, templateType);
    
    // Prepare the final processed data
    const processedData = {
      labels: sortedData.map(item => item.label),
      datasets: [{
        data: sortedData.map(item => item.value),
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
      }]
    };
    
    // Combine everything into the complete template configuration
    return {
      processedData,
      insights: {
        title: templateText.title,
        description: templateText.description,
        summary: insightSummary,
        chartTitle: templateText.chartTitle
      },
      templateType,
      templateOptions: getTemplateOptions(templateType)
    };
  };
  
  // Create named export object to fix linting warning
  const templateExports = {
    TEMPLATE_TYPES,
    applyTemplate,
    getTemplateText,
    getTemplateOptions,
    generateTemplateColors,
    generateTemplateInsights
  };
  
  export default templateExports;