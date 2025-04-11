import * as XLSX from 'xlsx';

/**
 * Process Excel or CSV file to extract market share data
 * Looks for columns B (Brand) and column with Market Share data
 * Supports multiple formats:
 * - Column M ($ Vol Per Prod Agent)
 * - Column I (Mkt %)
 * 
 * @param {File} file - The uploaded file (Excel or CSV)
 * @returns {Promise<Object>} Processed data and insights
 */
export const processFile = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // More detailed examination of the file's structure
          console.log('Extracted JSON data from file (first 5 rows):', jsonData.slice(0, 5));
          
          // Let's check specific columns if they exist
          if (jsonData.length > 1) {
            // Check header row (usually row 0)
            if (jsonData[0] && jsonData[0].length > 12) {
              console.log('Header row values:', jsonData[0]);
              console.log('Column B (index 1):', jsonData[0][1]);
              console.log('Column M (index 12):', jsonData[0][12]);
              
              // Also check column I (index 8) for Mkt % in newer format
              if (jsonData[0].length > 8) {
                console.log('Column I (index 8):', jsonData[0][8]);
              }
            }
            
            // Check first data row (usually row 1)
            if (jsonData[1] && jsonData[1].length > 12) {
              console.log('First data row values:', jsonData[1]);
              console.log('Brand (column B):', jsonData[1][1]);
              console.log('Market Share # (column M):', jsonData[1][12]);
              
              // Also log the value from column I if it exists
              if (jsonData[1].length > 8) {
                console.log('Market Share % (column I):', jsonData[1][8]);
              }
            }
          }
          
          // Process the extracted data
          const processedData = extractMarketShareData(jsonData);
          console.log('File processor result:', processedData);
          resolve(processedData);
        } catch (error) {
          console.error('Error processing file data:', error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(error);
      };
      
      // Read the file as array buffer
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error in file processing:', error);
      reject(error);
    }
  });
};

/**
 * Extract market share data from JSON data
 * 
 * @param {Array} data - JSON data from Excel/CSV
 * @returns {Object} Processed data for visualization and insights
 */
const extractMarketShareData = (data) => {
  // Find header row to determine column indices
  let brandColIndex = 1; // Default to column B
  let marketShareColIndex = 12; // Default to column M
  let totalSalesColIndex = 6; // Default to column G (Total #)
  let avgPriceColIndex = 10; // Default to column K (Avg Price)
  let domColIndex = 9; // Default to column J (DOM)
  let pricePerSqftColIndex = -1; // Initialize to -1 (not found)
  let closedListRatioColIndex = -1; // Initialize to -1 (not found)
  let totalOfficesColIndex = 19; // # Offices
  let contributingAgentsColIndex = 19; // Contributing Agents
  
  // Look for header row to identify columns
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (!row) continue;
    
    // Check specifically for Column I (index 8) for "Mkt %" - this is the format in newer files
    if (row.length > 8 && row[8] && typeof row[8] === 'string') {
      const cellText = row[8].toLowerCase();
      if (cellText === 'mkt %' || (cellText.includes('market') && cellText.includes('%'))) {
        marketShareColIndex = 8; // This is column I
        console.log(`Using column I (index 8) for Market Share: "${row[8]}"`);
      }
    }
    
    // Also check for column M (index 12) for "$ Vol Per Prod Agent" - this is the format in older files
    if (marketShareColIndex !== 8 && row.length > 12 && row[12] && typeof row[12] === 'string') {
      const cellText = row[12].toLowerCase();
      if (cellText.includes('$ vol per prod agent') || cellText.includes('vol per prod') || cellText.includes('per agent')) {
        marketShareColIndex = 12; // This is column M
        console.log(`Using column M (index 12) for Market Share: "${row[12]}"`);
      }
    }
    
    // Regular column scanning for all other columns
    for (let j = 0; j < row.length; j++) {
      const cell = row[j];
      if (cell && typeof cell === 'string') {
        const cellText = cell.toLowerCase();
        
        // Look for brand/company/brokerage column
        if (cellText.includes('brand') || 
            cellText.includes('company') || 
            cellText.includes('brokerage') ||
            cellText.includes('firm') ||
            cellText === 'name') {
          brandColIndex = j;
          console.log(`Found brand column at index ${j} with header "${cell}"`);
        }
        
        // Look for Total Sales column
        if (cellText === 'total #' || (cellText.includes('total') && cellText.includes('#'))) {
          totalSalesColIndex = j;
          console.log(`Found Total Sales column at index ${j} with header "${cell}"`);
        }
        
        // Look for Average Price column
        if (cellText === 'avg price' || 
            (cellText.includes('avg') && cellText.includes('price')) ||
            (cellText.includes('average') && cellText.includes('sales'))) {
          avgPriceColIndex = j;
          console.log(`Found Average Price column at index ${j} with header "${cell}"`);
        }
        
        // Look for Days on Market column
        if (cellText === 'dom' || 
            cellText.includes('days on market') || 
            (cellText.includes('days') && cellText.includes('market'))) {
          domColIndex = j;
          console.log(`Found Days on Market column at index ${j} with header "${cell}"`);
        }
        
        // Look for Price per Square Foot column
        if (cellText === 'price/sqft' || 
            cellText.includes('price per sq') || 
            cellText.includes('price/sq') ||
            cellText.includes('price per foot') ||
            (cellText.includes('price') && cellText.includes('sqft'))) {
          pricePerSqftColIndex = j;
          console.log(`Found Price Per Sqft column at index ${j} with header "${cell}"`);
        }
        
        // Look for Closed/List Price column
        if (cellText === 'closed/list price' || 
            (cellText.includes('closed') && cellText.includes('list')) ||
            (cellText.includes('sale') && cellText.includes('list'))) {
          closedListRatioColIndex = j;
          console.log(`Found Closed/List Price column at index ${j} with header "${cell}"`);
        }
        
        // Look for Total Offices column
        if (cellText === '# offices' || 
            cellText === 'total offices' || 
            (cellText.includes('office') && (cellText.includes('total') || cellText.includes('#')))) {
          totalOfficesColIndex = j;
          console.log(`Found Total Offices column at index ${j} with header "${cell}"`);
        }
        
        // Look for Contributing Agents column
        if (cellText === 'contributing agents' || 
            (cellText.includes('contributing') && cellText.includes('agent'))) {
          contributingAgentsColIndex = j;
          console.log(`Found Contributing Agents column at index ${j} with header "${cell}"`);
        }
        
        // Only consider other market share columns if we haven't already found one of our expected ones
        if (marketShareColIndex !== 8 && marketShareColIndex !== 12) {
          // Look for market share column - prioritize exact matches over partial matches
          if (cellText === 'market share (#)' || cellText === 'market share (%)') {
            marketShareColIndex = j;
            console.log(`Found exact Market Share column at index ${j} with header "${cell}"`);
          } else if (cellText.includes('market share') || cellText.includes('mkt share')) {
            marketShareColIndex = j;
            console.log(`Found Market Share column at index ${j} with header "${cell}"`);
          } else if (cellText.includes('share') || 
                    cellText.includes('percentage') || 
                    cellText.includes('%')) {
            marketShareColIndex = j;
            console.log(`Found market share column at index ${j} with header "${cell}"`);
          }
        }
      }
    }
  }
  
  console.log(`Using Brand column index: ${brandColIndex}, Market Share column index: ${marketShareColIndex}, Total Sales column index: ${totalSalesColIndex}, Average Price column index: ${avgPriceColIndex}, DOM column index: ${domColIndex}`);
  
  // Extract brand and market share data
  const brokerages = [];
  
  // Additional metrics from Sotheby's row (will be populated later)
  let totalSales = 0;
  let avgPrice = 0;
  let daysOnMarket = 0;
  let pricePerSqft = 0;
  let closedListRatio = 0;
  let totalOffices = 0;
  let contributingAgents = 0;
  
  // Skip header row(s)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length <= Math.max(brandColIndex, marketShareColIndex)) continue;
    
    const brand = row[brandColIndex];
    let marketShare = row[marketShareColIndex];
    
    // Skip rows without valid data
    if (!brand || brand === '') continue;
    
    // Handle different formats of market share data
    if (typeof marketShare === 'string') {
      // Remove % sign if present and convert to number
      marketShare = parseFloat(marketShare.replace(/[%$,]/g, ''));
    } else if (typeof marketShare === 'number') {
      // If already a number, check if it's a decimal or percentage
      if (marketShare < 1) {
        marketShare = marketShare * 100; // Convert decimal to percentage
      }
    }
    
    // Additional validation for market share
    if (!isNaN(marketShare)) {
      // Ensure market share is within reasonable range (0-100%)
      if (marketShare > 100) {
        console.warn(`Unusually high market share detected: ${marketShare}%. Might be a data issue.`);
        // If it's extremely high, it might be raw value rather than percentage
        if (marketShare > 1000) {
          marketShare = (marketShare / 1000).toFixed(1);
          console.log(`Adjusted extremely high value to: ${marketShare}%`);
        }
      }
    }
    
    // Extract additional metrics if this is Sotheby's row
    const brandLower = brand.toString().toLowerCase();
    if (brandLower.includes('sotheby') && row.length > Math.max(totalSalesColIndex, avgPriceColIndex, domColIndex)) {
      // Extract total sales
      if (row[totalSalesColIndex] !== undefined && row[totalSalesColIndex] !== null) {
        let value = row[totalSalesColIndex];
        if (typeof value === 'string') {
          value = parseFloat(value.replace(/[,$]/g, ''));
        }
        if (!isNaN(value)) totalSales = value;
      }
      
      // Extract average price
      if (row[avgPriceColIndex] !== undefined && row[avgPriceColIndex] !== null) {
        let value = row[avgPriceColIndex];
        if (typeof value === 'string') {
          value = parseFloat(value.replace(/[,$]/g, ''));
        }
        if (!isNaN(value)) avgPrice = value;
      }
      
      // Extract days on market
      if (row[domColIndex] !== undefined && row[domColIndex] !== null) {
        let value = row[domColIndex];
        if (typeof value === 'string') {
          value = parseFloat(value.replace(/[,$]/g, ''));
        }
        if (!isNaN(value)) daysOnMarket = value;
      }
      
      // Extract price per square foot
      if (row[pricePerSqftColIndex] !== undefined && row[pricePerSqftColIndex] !== null) {
        let value = row[pricePerSqftColIndex];
        if (typeof value === 'string') {
          value = parseFloat(value.replace(/[,$]/g, ''));
        }
        if (!isNaN(value)) pricePerSqft = value;
      }
      
      // Extract closed/list price ratio
      if (row[closedListRatioColIndex] !== undefined && row[closedListRatioColIndex] !== null) {
        let value = row[closedListRatioColIndex];
        if (typeof value === 'string') {
          value = parseFloat(value.replace(/[%$,]/g, ''));
        }
        if (!isNaN(value)) {
          // Convert to percentage if it's a decimal
          closedListRatio = value < 1 ? value * 100 : value;
        }
      }
      
      // Extract total offices
      if (row[totalOfficesColIndex] !== undefined && row[totalOfficesColIndex] !== null) {
        let value = row[totalOfficesColIndex];
        if (typeof value === 'string') {
          value = parseInt(value.replace(/[,$]/g, ''), 10);
        }
        if (!isNaN(value)) totalOffices = value;
      }
      
      // Extract contributing agents
      if (row[contributingAgentsColIndex] !== undefined && row[contributingAgentsColIndex] !== null) {
        let value = row[contributingAgentsColIndex];
        if (typeof value === 'string') {
          value = parseInt(value.replace(/[,$]/g, ''), 10);
        }
        if (!isNaN(value)) contributingAgents = value;
      }
      
      console.log(`Extracted metrics for Sotheby's: Total Sales = ${totalSales}, Avg Price = ${avgPrice}, DOM = ${daysOnMarket}, Price/Sqft = ${pricePerSqft}, Closed/List = ${closedListRatio}%, Offices = ${totalOffices}, Contributing Agents = ${contributingAgents}`);
    }
    
    // Only add rows with valid brand and market share
    if (!isNaN(marketShare)) {
      brokerages.push({
        brand: brand.toString().trim(),
        marketShare: parseFloat(marketShare.toFixed(1))
      });
    }
  }
  
  // Log the brokerages before sorting
  console.log('Brokerages before sorting:', JSON.stringify(brokerages));
  
  // Sort by market share (descending)
  brokerages.sort((a, b) => b.marketShare - a.marketShare);
  console.log('Brokerages after sorting by market share:', JSON.stringify(brokerages.slice(0, 10)));
  
  // Update brand names for consistency but preserve actual market share values
  for (let i = 0; i < brokerages.length; i++) {
    const brandLower = brokerages[i].brand.toLowerCase();
    
    // Just normalize the name format, don't override the actual market share values
    if (brandLower.includes('sotheby')) {
      brokerages[i].brand = "Russ Lyon Sotheby's International Realty";
      // Keep the actual value from the spreadsheet, don't override
      console.log(`Found Sotheby's with market share: ${brokerages[i].marketShare}%`);
    }
    
    if (brandLower.includes('homesmart') || brandLower.includes('home smart')) {
      brokerages[i].brand = "HomeSmart";
      // Keep the actual value from the spreadsheet, don't override
      console.log(`Found HomeSmart with market share: ${brokerages[i].marketShare}%`);
    }
  }
  
  // Sort by market share (descending) - this ensures highest market share is first
  brokerages.sort((a, b) => b.marketShare - a.marketShare);
  
  // Log the top 10 companies after proper sorting
  console.log('Final sorted brokerages (Top 10):', JSON.stringify(brokerages.slice(0, 10)));
  
  // Format the data for visualization
  const labels = brokerages.slice(0, 10).map(b => b.brand);
  const dataValues = brokerages.slice(0, 10).map(b => b.marketShare);
  
  // Generate color array - Sotheby's blue for Sotheby's, grayscale for others
  const sothebysBlue = '#002349';
  const colors = labels.map((label, index) => {
    // Use Sotheby's blue for Russ Lyon Sotheby's
    if (label.includes("Sotheby's")) {
      return sothebysBlue;
    }
    // Create a grayscale gradient that gets lighter but remains readable
    // Start darker and gradually get lighter, but maintain minimum darkness
    const baseGray = 90; // Start with a darker base
    const step = 18; // Smaller steps for more gradual fading
    
    // Calculate the gray value (ensuring it doesn't get too light)
    const grayValue = Math.min(baseGray + index * step, 210); // Cap at 210 for readability
    
    return `rgba(${grayValue}, ${grayValue}, ${grayValue}, 1)`;
  });
  
  // Get the actual Sotheby's market share from data (if available)
  const sothebysIndex = labels.findIndex(label => label.includes("Sotheby's"));
  const sothebysShare = sothebysIndex >= 0 ? dataValues[sothebysIndex] : 0;
  
  // Get the actual HomeSmart market share from data (if available)
  const homeSmartIndex = labels.findIndex(label => label === "HomeSmart");
  const homeSmartShare = homeSmartIndex >= 0 ? dataValues[homeSmartIndex] : 0;
  
  // Calculate the difference between Sotheby's and HomeSmart
  const sharePointDiff = (sothebysShare - homeSmartShare).toFixed(1);
  
  // Generate insights using actual data
  const insights = {
    title: "Russ Lyon Sotheby's International Realty Market Share Analysis",
    description: "Analysis based on brand and market share data from your spreadsheet",
    summary: [
      `Russ Lyon Sotheby's International Realty has ${sothebysShare.toFixed(1)}% market share`,
      homeSmartShare > 0 ? `${sharePointDiff} percentage points ${sharePointDiff > 0 ? 'ahead of' : 'behind'} nearest competitor (HomeSmart at ${homeSmartShare.toFixed(1)}%)` : `Leading position in the market`,
      "Position in the Arizona luxury real estate market",
      `Top 3 brokerages control ${(brokerages.slice(0, 3).reduce((sum, b) => sum + b.marketShare, 0)).toFixed(1)}% of the market`
    ]
  };
  
  // Format the additional metrics for display
  const formattedAvgPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(avgPrice);
  
  // Create additional metrics object with new metrics
  const additionalMetrics = {
    totalSales: totalSales,
    averagePrice: formattedAvgPrice,
    daysOnMarket: Number(daysOnMarket.toFixed(1)),
    totalOffices: totalOffices,
    contributingAgents: contributingAgents
  };
  
  // Only add price per square foot if it actually exists in the data
  if (pricePerSqft > 0) {
    additionalMetrics.pricePerSqft = `$${pricePerSqft.toFixed(0)}`;
  }
  
  // Only add closed/list price ratio if it actually exists in the data
  if (closedListRatio > 0) {
    additionalMetrics.closedListRatio = `${closedListRatio.toFixed(1)}%`;
  }
  
  return {
    processedData: {
      labels,
      datasets: [{
        data: dataValues,
        backgroundColor: colors
      }]
    },
    insights,
    additionalMetrics
  };
};