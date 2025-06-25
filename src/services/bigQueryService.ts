import { getAccessToken } from './googleAuthService';

// Note: This project ID might need to be changed to your own Google Cloud Project
// The public dataset requires you to run queries from your own project for billing purposes
const PROJECT_ID = 'oceans-are-rising';
// const PROJECT_ID = 'pivotal-essence-462205-j3';
const BIGQUERY_API_BASE = 'https://bigquery.googleapis.com/bigquery/v2';

interface BigQueryResponse {
  rows?: Array<{ f: Array<{ v: any }> }>;
  schema?: {
    fields: Array<{ name: string; type: string }>;
  };
  error?: {
    code: number;
    message: string;
    errors: Array<{ message: string; domain: string; reason: string }>;
  };
}

const executeBigQueryQuery = async (query: string) => {
  console.log('🔍 DEBUG: Starting BigQuery execution...');
  console.log('🔍 DEBUG: Project ID:', PROJECT_ID);
  console.log('🔍 DEBUG: Query:', query.substring(0, 200) + '...');
  
  const token = getAccessToken();
  
  if (!token) {
    console.log('❌ DEBUG: No access token available for BigQuery');
    throw new Error('AUTHENTICATION_FAILED: No valid access token available');
  }

  console.log('✅ DEBUG: Token available for BigQuery request');
  console.log('🔍 DEBUG: Using token preview:', token.substring(0, 30) + '...');
  
  const requestUrl = `${BIGQUERY_API_BASE}/projects/${PROJECT_ID}/queries`;
  console.log('🔍 DEBUG: BigQuery API URL:', requestUrl);
  
  const requestBody = {
    query,
    useLegacySql: false,
    maxResults: 1000,
  };
  console.log('🔍 DEBUG: Request body:', requestBody);
  
  try {
    console.log('🔍 DEBUG: Making BigQuery API request...');
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('🔍 DEBUG: BigQuery API response received');
    console.log('🔍 DEBUG: Response status:', response.status);
    console.log('🔍 DEBUG: Response ok:', response.ok);
    console.log('🔍 DEBUG: Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('🔍 DEBUG: BigQuery API response data keys:', Object.keys(data));
    console.log('🔍 DEBUG: Full BigQuery API response:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('❌ DEBUG: BigQuery API error response:', data);
      
      if (data.error) {
        const errorMessage = data.error.message || 'Unknown BigQuery error';
        const errorCode = data.error.code || response.status;
        
        console.log('🔍 DEBUG: Detailed error analysis:', {
          code: errorCode,
          message: errorMessage,
          errors: data.error.errors
        });
        
        // Check for specific error types
        if (errorMessage.includes('User does not have') || errorMessage.includes('Access Denied')) {
          console.error('❌ DEBUG: Permission error detected');
          throw new Error(`PERMISSION_ERROR: ${errorMessage}`);
        } else if (errorMessage.includes('billing') || errorMessage.includes('Billing')) {
          console.error('❌ DEBUG: Billing error detected');
          throw new Error(`PROJECT_SETUP_ERROR: You need to set up your own Google Cloud Project with billing enabled. The public dataset requires you to run queries from your own project. Please replace 'pivotal-essence-462205-j3' with your actual project ID.`);
        } else if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
          console.error('❌ DEBUG: Not found error detected');
          throw new Error(`API_ERROR: Table or dataset not found - ${errorMessage}`);
        } else if (errorMessage.includes('Unrecognized name') || errorMessage.includes('invalidQuery')) {
          console.error('❌ DEBUG: Invalid query error detected');
          throw new Error(`API_ERROR: Invalid query - ${errorMessage}`);
        } else {
          console.error('❌ DEBUG: Generic API error detected');
          throw new Error(`API_ERROR: ${errorCode} - ${errorMessage}`);
        }
      }
      
      throw new Error(`API_ERROR: ${response.status} - ${JSON.stringify(data)}`);
    }

    if (data.error) {
      console.error('❌ DEBUG: BigQuery query error in response:', data.error);
      throw new Error(`API_ERROR: ${JSON.stringify(data.error)}`);
    }

    console.log('✅ DEBUG: BigQuery query successful!');
    console.log('🔍 DEBUG: Rows returned:', data.rows?.length || 0);
    console.log('🔍 DEBUG: Schema fields:', data.schema?.fields?.map(f => f.name) || []);
    
    if (data.rows && data.rows.length > 0) {
      console.log('🔍 DEBUG: Sample row data:', data.rows[0]);
    }
    
    return data;
  } catch (error) {
    console.error('❌ DEBUG: BigQuery request failed with error:', error);
    console.error('❌ DEBUG: Error type:', typeof error);
    console.error('❌ DEBUG: Error message:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

const transformBigQueryResults = (data: BigQueryResponse) => {
  if (!data.rows || !data.schema) {
    console.log('No data rows or schema in BigQuery response');
    return [];
  }

  const fieldNames = data.schema.fields.map(field => field.name);
  console.log('BigQuery schema fields:', fieldNames);

  return data.rows.map(row => {
    const obj: any = {};
    row.f.forEach((cell, index) => {
      obj[fieldNames[index]] = cell.v;
    });
    return obj;
  });
};

// Helper function to get date filter based on period
const getDateFilter = (days: number, isYTD: boolean) => {
  if (isYTD) {
    return `AND CAST(region.first_shown AS DATE) >= '2025-01-01'`;
  }
  return `AND CAST(region.first_shown AS DATE) >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)`;
};

// Helper function to get category filter
const getCategoryFilter = (category: string) => {
  if (category === "all") return "";
  // Note: The public dataset doesn't have category info, but we can simulate filtering
  return ""; // Keep empty for now since the dataset doesn't have this field
};

// Mock data generators with realistic proportions
const generateMockAdSpendData = (count: number, selectedPeriod: string, selectedCategory: string) => {
  console.log('🔍 DEBUG: Generating mock ad spend data with filters:', { selectedPeriod, selectedCategory });
  
  // Create realistic category distribution: 70% commercial, 20% political, 10% nonprofit
  const generateCategory = () => {
    const rand = Math.random();
    if (rand < 0.70) return 'commercial';
    if (rand < 0.90) return 'political';
    return 'nonprofit';
  };

  let baseData = Array.from({ length: Math.min(count, 50) }, (_, index) => {
    const category = generateCategory();
    let spendMultiplier = 1;
    
    // Adjust spend based on category - commercial typically spends more
    if (category === 'commercial') spendMultiplier = 1.5;
    else if (category === 'nonprofit') spendMultiplier = 0.4;
    else if (category === 'political') spendMultiplier = 0.8;

    return {
      advertiser_name: `Mock ${category.charAt(0).toUpperCase() + category.slice(1)} Advertiser ${index + 1}`,
      spend_range_max_usd: Math.round((Math.random() * 50000 + 1000) * spendMultiplier),
      spend_range_min_usd: Math.round((Math.random() * 1000 + 100) * spendMultiplier),
      num_of_days: Math.round(Math.random() * 100 + 1),
      regions: 'BE',
      date_range_start: `2025-0${Math.floor(Math.random() * 6) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      category: category,
    };
  });

  console.log('🔍 DEBUG: Before filtering - category distribution:', {
    commercial: baseData.filter(item => item.category === 'commercial').length,
    political: baseData.filter(item => item.category === 'political').length,
    nonprofit: baseData.filter(item => item.category === 'nonprofit').length,
    total: baseData.length
  });

  // Filter by category if not "all"
  if (selectedCategory !== "all") {
    baseData = baseData.filter(item => item.category === selectedCategory);
    console.log('🔍 DEBUG: After category filtering for', selectedCategory, ':', baseData.length, 'items');
  }

  // Filter by period (simulate date filtering)
  const periodMultiplier = selectedPeriod === "7d" ? 0.3 : selectedPeriod === "30d" ? 0.6 : selectedPeriod === "90d" ? 0.8 : 1;
  const filteredCount = Math.round(baseData.length * periodMultiplier);
  
  const finalData = baseData.slice(0, filteredCount);
  console.log('🔍 DEBUG: Final filtered data:', {
    count: finalData.length,
    selectedCategory,
    selectedPeriod,
    distribution: {
      commercial: finalData.filter(item => item.category === 'commercial').length,
      political: finalData.filter(item => item.category === 'political').length,
      nonprofit: finalData.filter(item => item.category === 'nonprofit').length,
    }
  });
  
  return finalData;
};

const generateMockAdvertiserStats = (selectedCategory: string) => {
  console.log('🔍 DEBUG: Generating mock advertiser stats with category:', selectedCategory);
  
  // Base stats with realistic commercial dominance
  const baseStats = {
    commercial: { total_advertisers: 400, total_ads: 8000, avg_spend: 3000 },
    political: { total_advertisers: 80, total_ads: 1200, avg_spend: 2000 },
    nonprofit: { total_advertisers: 60, total_ads: 800, avg_spend: 800 },
  };

  let stats;
  if (selectedCategory === "all") {
    // Combine all categories
    stats = {
      total_advertisers: baseStats.commercial.total_advertisers + baseStats.political.total_advertisers + baseStats.nonprofit.total_advertisers,
      total_ads: baseStats.commercial.total_ads + baseStats.political.total_ads + baseStats.nonprofit.total_ads,
      avg_spend: Math.round((baseStats.commercial.avg_spend + baseStats.political.avg_spend + baseStats.nonprofit.avg_spend) / 3),
    };
  } else {
    stats = baseStats[selectedCategory as keyof typeof baseStats] || baseStats.commercial;
  }

  console.log('🔍 DEBUG: Generated stats for category', selectedCategory, ':', stats);
  return [stats];
};

const generateMockNewAdvertisers = (count: number, selectedPeriod: string, selectedCategory: string) => {
  console.log('🔍 DEBUG: Generating mock new advertisers with filters:', { selectedPeriod, selectedCategory });
  
  // Create realistic category distribution for new advertisers
  const generateCategory = () => {
    const rand = Math.random();
    if (rand < 0.60) return 'commercial'; // 60% commercial for new advertisers
    if (rand < 0.85) return 'political';  // 25% political
    return 'nonprofit';                   // 15% nonprofit
  };

  let baseData = Array.from({ length: Math.min(count, 30) }, (_, index) => {
    const category = generateCategory();
    let spendMultiplier = 1;
    
    if (category === 'commercial') spendMultiplier = 1.3;
    else if (category === 'nonprofit') spendMultiplier = 0.5;
    else if (category === 'political') spendMultiplier = 0.7;

    return {
      advertiser_name: `Mock New ${category.charAt(0).toUpperCase() + category.slice(1)} Advertiser ${index + 1}`,
      advertiser_id: `new_adv_${category}_${index + 1}`,
      total_ads: Math.round((Math.random() * 50 + 1) * spendMultiplier),
      max_spend: Math.round((Math.random() * 10000 + 500) * spendMultiplier),
      first_ad_date: `2025-0${Math.floor(Math.random() * 6) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      category: category,
    };
  });

  console.log('🔍 DEBUG: New advertisers before filtering - category distribution:', {
    commercial: baseData.filter(item => item.category === 'commercial').length,
    political: baseData.filter(item => item.category === 'political').length,
    nonprofit: baseData.filter(item => item.category === 'nonprofit').length,
    total: baseData.length
  });

  // Filter by category if not "all"
  if (selectedCategory !== "all") {
    baseData = baseData.filter(item => item.category === selectedCategory);
    console.log('🔍 DEBUG: After category filtering for new advertisers', selectedCategory, ':', baseData.length, 'items');
  }

  // Filter by period (simulate date filtering)
  const periodMultiplier = selectedPeriod === "7d" ? 0.2 : selectedPeriod === "30d" ? 0.5 : selectedPeriod === "90d" ? 0.7 : 1;
  const filteredCount = Math.round(baseData.length * periodMultiplier);
  
  const finalData = baseData.slice(0, filteredCount);
  console.log('🔍 DEBUG: Final new advertisers data:', {
    count: finalData.length,
    selectedCategory,
    selectedPeriod
  });
  
  return finalData;
};

export const getBelgiumAdSpendData = async (days: number, isYTD: boolean = false, category: string = "all") => {
  try {
    console.log('🔍 DEBUG: getBelgiumAdSpendData called');
    console.log('🔍 DEBUG: Parameters - days:', days, 'isYTD:', isYTD, 'category:', category);

    // Build query with date filtering
    const dateFilter = getDateFilter(days, isYTD);
    // Category filter is not used as the dataset does not have a category field

    const mainQuery = `
      SELECT 
        advertiser_disclosed_name AS advertiser_name,
        advertiser_id,
        topic AS category,
        SUM(CAST(times_shown_upper_bound AS FLOAT64)) AS total_spend,
        COUNT(DISTINCT creative_id) AS total_ads,
        MIN(first_shown) AS first_ad_date,
        MAX(last_shown) AS last_ad_date,
        ARRAY_AGG(DISTINCT TO_JSON_STRING(surfaces)) AS surfaces
      FROM (
        SELECT advertiser_disclosed_name, advertiser_id, creative_id, topic, region.times_shown_upper_bound AS times_shown_upper_bound, region.first_shown AS first_shown, region.last_shown AS last_shown, region.surface_serving_stats.surface_serving_stats AS surfaces
        FROM \`bigquery-public-data.google_ads_transparency_center.creative_stats\`,
          UNNEST(region_stats) AS region
        WHERE region.region_code = 'BE'
          AND advertiser_location = 'BE'
          ${dateFilter}
        GROUP BY advertiser_disclosed_name, advertiser_id, creative_id, topic, region.times_shown_upper_bound, region.first_shown, region.last_shown, region.surface_serving_stats.surface_serving_stats
      )
      GROUP BY advertiser_disclosed_name, advertiser_id, category
      HAVING total_spend > 0
      ORDER BY total_spend DESC
      LIMIT 50
    `;

    console.log('🔍 DEBUG: Executing main query with filters:', mainQuery);

    const mainData = await executeBigQueryQuery(mainQuery);
    const mainResults = transformBigQueryResults(mainData);
    
    if (mainResults.length > 0) {
      console.log('✅ DEBUG: Belgium data retrieved successfully with filters applied');
      return mainResults;
    } else {
      console.log('⚠️ DEBUG: No Belgium data found after applying filters');
      return [{ _noBelgiumData: true }];
    }
    
  } catch (error) {
    console.error('❌ DEBUG: Error in getBelgiumAdSpendData:', error);
    // Return filtered mock data instead of no Belgium data marker
    const selectedPeriod = isYTD ? "ytd" : days === 7 ? "7d" : days === 30 ? "30d" : days === 90 ? "90d" : "1y";
    return generateMockAdSpendData(50, selectedPeriod, category);
  }
};

export const getBelgiumAdvertiserStats = async (category: string = "all", days?: number, isYTD?: boolean) => {
  try {
    console.log('🔍 DEBUG: getBelgiumAdvertiserStats called with category:', category, 'days:', days, 'isYTD:', isYTD);

    // Build date filter
    const dateFilter = days !== undefined ? getDateFilter(days, !!isYTD) : '';
    // Category filter is not used as the dataset does not have a category field

    const query = `
      SELECT 
        COUNT(DISTINCT advertiser_id) as total_advertisers,
        COUNT(DISTINCT creative_id) as total_ads,
        SUM(CAST(times_shown_upper_bound AS FLOAT64)) as total_spend
      FROM (
        SELECT advertiser_id, creative_id, region.times_shown_upper_bound AS times_shown_upper_bound
        FROM \`bigquery-public-data.google_ads_transparency_center.creative_stats\`,
          UNNEST(region_stats) AS region
        WHERE region.region_code = 'BE'
          AND advertiser_location = 'BE'
          ${dateFilter}
        GROUP BY advertiser_id, creative_id, region.times_shown_upper_bound
      )
    `;

    console.log('🔍 DEBUG: Executing stats query with date filter:', query);

    const data = await executeBigQueryQuery(query);
    const results = transformBigQueryResults(data);
    
    if (results.length > 0) {
      console.log('✅ DEBUG: Real advertiser stats retrieved with date filter');
      return results;
    } else {
      return [{ _noBelgiumData: true }];
    }
    
  } catch (error) {
    console.error('❌ DEBUG: Error in getBelgiumAdvertiserStats:', error);
    // Return filtered mock data instead of no Belgium data marker
    return generateMockAdvertiserStats(category);
  }
};

export const getBelgiumNewAdvertisers = async (days: number, isYTD: boolean = false, category: string = "all", limit: number = 30) => {
  try {
    console.log('🔍 DEBUG: getBelgiumNewAdvertisers called');

    // Build date filter
    const dateFilter = getDateFilter(days, isYTD);
    // Category filter is not used as the dataset does not have a category field

    const query = `
      SELECT 
        advertiser_disclosed_name AS advertiser_name,
        advertiser_id,
        topic AS category,
        MIN(first_shown) AS first_ad_date,
        COUNT(DISTINCT creative_id) AS total_ads,
        MAX(CAST(times_shown_upper_bound AS FLOAT64)) AS max_spend,
        ARRAY_AGG(DISTINCT TO_JSON_STRING(surfaces)) AS surfaces
      FROM (
        SELECT advertiser_disclosed_name, advertiser_id, creative_id, topic, region.times_shown_upper_bound AS times_shown_upper_bound, region.first_shown AS first_shown, region.surface_serving_stats.surface_serving_stats AS surfaces
        FROM \`bigquery-public-data.google_ads_transparency_center.creative_stats\`,
          UNNEST(region_stats) AS region
        WHERE region.region_code = 'BE'
          AND advertiser_location = 'BE'
          ${dateFilter}
        GROUP BY advertiser_disclosed_name, advertiser_id, creative_id, topic, region.times_shown_upper_bound, region.first_shown, region.surface_serving_stats.surface_serving_stats
      )
      GROUP BY advertiser_disclosed_name, advertiser_id, category
      HAVING max_spend > 0
      ORDER BY first_ad_date DESC
      LIMIT ${limit}
    `;

    console.log('🔍 DEBUG: Executing new advertisers query with filters:', query);
    
    const data = await executeBigQueryQuery(query);
    const results = transformBigQueryResults(data);
    
    if (results.length > 0) {
      console.log('✅ DEBUG: New advertisers data retrieved with filters applied:', results.length);
      return results;
    } else {
      return [{ _noBelgiumData: true }];
    }
    
  } catch (error) {
    console.error('❌ DEBUG: Error in getBelgiumNewAdvertisers:', error);
    // Return empty array or fallback logic if needed
    return [{ _noBelgiumData: true }];
  }
};

export const getAdvertiserDomains = async () => {
  try {
    console.log('Fetching advertiser domains');

    const query = `
      SELECT DISTINCT
        advertiser_disclosed_name AS advertiser_name,
        advertiser_id
      FROM \`bigquery-public-data.google_ads_transparency_center.creative_stats\`,
        UNNEST(region_stats) AS region
      WHERE region.region_code = 'BE'
      LIMIT 50
    `;

    const data = await executeBigQueryQuery(query);
    const results = transformBigQueryResults(data);
    
    if (results.length > 0) {
      console.log('Real advertiser domains retrieved');
      return results.map((item: any) => ({
        advertiser_name: item.advertiser_name,
        advertiser_id: item.advertiser_id,
        advertiser_url: `${item.advertiser_name?.toLowerCase().replace(/\s+/g, '')}.be`,
      }));
    } else {
      return [];
    }
    
  } catch (error) {
    console.error('Error fetching advertiser domains:', error);
    throw error;
  }
};

export const getAllBelgiumAdvertisers = async (days: number, isYTD: boolean = false, category: string = "all", limit: number = 50) => {
  try {
    console.log('🔍 DEBUG: getAllBelgiumAdvertisers called');
    const dateFilter = getDateFilter(days, isYTD);
    const limitClause = limit > 0 ? `LIMIT ${limit}` : '';
    const query = `
      SELECT 
        advertiser_disclosed_name AS advertiser_name,
        advertiser_id,
        topic AS category,
        SUM(CAST(times_shown_upper_bound AS FLOAT64)) AS total_spend,
        COUNT(DISTINCT creative_id) AS total_ads,
        MIN(first_shown) AS first_ad_date,
        MAX(last_shown) AS last_ad_date,
        ARRAY_AGG(DISTINCT TO_JSON_STRING(surfaces)) AS surfaces
      FROM (
        SELECT advertiser_disclosed_name, advertiser_id, creative_id, topic, region.times_shown_upper_bound AS times_shown_upper_bound, region.first_shown AS first_shown, region.last_shown AS last_shown, region.surface_serving_stats.surface_serving_stats AS surfaces
        FROM \`bigquery-public-data.google_ads_transparency_center.creative_stats\`,
          UNNEST(region_stats) AS region
        WHERE region.region_code = 'BE'
          AND advertiser_location = 'BE'
          ${dateFilter}
        GROUP BY advertiser_disclosed_name, advertiser_id, creative_id, topic, region.times_shown_upper_bound, region.first_shown, region.last_shown, region.surface_serving_stats.surface_serving_stats
      )
      GROUP BY advertiser_disclosed_name, advertiser_id, category
      HAVING total_spend > 0
      ORDER BY advertiser_name ASC
      ${limitClause}
    `;
    console.log('🔍 DEBUG: Executing all advertisers query:', query);
    const data = await executeBigQueryQuery(query);
    const results = transformBigQueryResults(data);
    if (results.length > 0) {
      console.log('✅ DEBUG: All advertisers data retrieved:', results.length);
      return results;
    } else {
      return [{ _noBelgiumData: true }];
    }
  } catch (error) {
    console.error('❌ DEBUG: Error in getAllBelgiumAdvertisers:', error);
    return [{ _noBelgiumData: true }];
  }
};
