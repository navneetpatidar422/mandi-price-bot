/**
 * src/agmarknet.js - Agmarknet data fetching and caching
 * Developed by Navneet Patidar
 *
 * Fetches mandi price data from Agmarknet (agmarknet.gov.in)
 * with in-memory caching to avoid excessive requests.
 *
 * Agmarknet API endpoints used:
 * - State/District/Market lists from their price report pages
 * - Daily arrival and price data
 */

const axios = require('axios');
const cheerio = require('cheerio');
const config = require('./config');
const { formatDate } = require('./utils');
const statesData = require('./data/states.json');

// In-memory cache: { cacheKey: { data, timestamp } }
const cache = new Map();

/**
 * Get data from cache if still valid
 * @param {string} key - Cache key
 * @returns {*|null} Cached data or null if expired/missing
 */
function getFromCache(key) {
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (Date.now() - timestamp < config.CACHE_DURATION_MS) {
      return data;
    }
    // Remove expired entry
    cache.delete(key);
  }
  return null;
}

/**
 * Store data in cache
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 */
function setInCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Make an HTTP request with retry logic
 * @param {string} url - URL to fetch
 * @param {object} params - Query parameters
 * @returns {Promise<object>} Axios response
 */
async function fetchWithRetry(url, params = {}) {
  let lastError;
  for (let attempt = 1; attempt <= config.MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(url, {
        params,
        headers: config.REQUEST_HEADERS,
        timeout: config.REQUEST_TIMEOUT_MS,
      });
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < config.MAX_RETRIES) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  throw lastError;
}

/**
 * Get list of states from our local data
 * @returns {Array} Array of state objects { name, code, shortCode }
 */
function getStates() {
  return statesData.map((s) => ({
    name: s.name,
    code: s.code,
    shortCode: s.shortCode,
  }));
}

/**
 * Get districts for a given state from our local data
 * @param {string} stateCode - State code
 * @returns {Array} Array of district objects { name, code }
 */
function getDistricts(stateCode) {
  const state = statesData.find((s) => s.code === stateCode);
  if (!state) return [];
  return state.districts;
}

/**
 * Fetch mandi/market list for a given state and district from Agmarknet
 * @param {string} stateCode - State code
 * @param {string} districtCode - District code
 * @returns {Promise<Array>} Array of mandi objects { name, code }
 */
async function getMandis(stateCode, districtCode) {
  const cacheKey = `mandis_${stateCode}_${districtCode}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    // Agmarknet market list endpoint
    const url = `${config.AGMARKNET_BASE_URL}/PriceAndArrivals/MarketList.aspx`;
    const response = await fetchWithRetry(url, {
      StateCode: stateCode,
      DistrictCode: districtCode,
    });

    const $ = cheerio.load(response.data);
    const mandis = [];

    // Parse market options from the dropdown
    $('select[name="MarketCode"] option, select[id*="Market"] option, #ddlMarket option').each((i, el) => {
      const value = $(el).attr('value');
      const text = $(el).text().trim();
      if (value && value !== '0' && value !== '-1' && text) {
        mandis.push({ name: text, code: value });
      }
    });

    // If scraping didn't work, return district-based defaults
    if (mandis.length === 0) {
      return getDefaultMandis(stateCode, districtCode);
    }

    setInCache(cacheKey, mandis);
    return mandis;
  } catch (error) {
    console.error('Error fetching mandis from Agmarknet:', error.message);
    return getDefaultMandis(stateCode, districtCode);
  }
}

/**
 * Get default mandis based on district name (fallback)
 * @param {string} stateCode - State code
 * @param {string} districtCode - District code
 * @returns {Array} Array of default mandi objects
 */
function getDefaultMandis(stateCode, districtCode) {
  const state = statesData.find((s) => s.code === stateCode);
  if (!state) return [];
  const district = state.districts.find((d) => d.code === districtCode);
  if (!district) return [];

  // Return the district name as the main mandi
  return [
    { name: district.name, code: districtCode },
  ];
}

/**
 * Fetch commodity prices from Agmarknet for a given mandi
 * @param {string} stateCode - State code
 * @param {string} districtCode - District code
 * @param {string} mandiCode - Market/Mandi code
 * @param {string|null} commodityName - Specific commodity (null = all)
 * @returns {Promise<Array>} Array of price objects
 */
async function getPrices(stateCode, districtCode, mandiCode, commodityName = null) {
  const today = formatDate(new Date());
  const cacheKey = `prices_${stateCode}_${districtCode}_${mandiCode}_${today}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    // Filter by commodity if specified
    if (commodityName) {
      return filterByCommodity(cached, commodityName);
    }
    return cached;
  }

  try {
    // Try Agmarknet price report page
    const prices = await fetchPricesFromAgmarknet(stateCode, districtCode, mandiCode);

    if (prices && prices.length > 0) {
      setInCache(cacheKey, prices);
      if (commodityName) {
        return filterByCommodity(prices, commodityName);
      }
      return prices;
    }

    // If no data today, try yesterday's data
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    const oldPrices = await fetchPricesFromAgmarknet(stateCode, districtCode, mandiCode, yesterdayStr);
    if (oldPrices && oldPrices.length > 0) {
      setInCache(cacheKey, oldPrices);
      if (commodityName) {
        return filterByCommodity(oldPrices, commodityName);
      }
      return oldPrices;
    }

    return [];
  } catch (error) {
    console.error('Error fetching prices from Agmarknet:', error.message);
    return [];
  }
}

/**
 * Fetch prices from Agmarknet website
 * @param {string} stateCode - State code
 * @param {string} districtCode - District code
 * @param {string} mandiCode - Market code
 * @param {string} dateStr - Date in DD-MM-YYYY format (optional)
 * @returns {Promise<Array>} Array of price objects
 */
async function fetchPricesFromAgmarknet(stateCode, districtCode, mandiCode, dateStr = null) {
  try {
    const date = dateStr || formatDate(new Date());

    // Agmarknet price report URL
    const url = `${config.AGMARKNET_BASE_URL}/PriceAndArrivals/CommodityWiseDailyReport.aspx`;
    const response = await fetchWithRetry(url, {
      StateCode: stateCode,
      DistrictCode: districtCode,
      MarketCode: mandiCode,
      CommodityCode: '0',
      DateFrom: date,
      DateTo: date,
      ActualDateFrom: date,
    });

    const $ = cheerio.load(response.data);
    const prices = [];

    // Parse price table - Agmarknet typically has a table with commodity prices
    // Look for the main data table
    $('table.tableagmark_new tr, table[id*="grid"] tr, .table-responsive table tr').each((i, row) => {
      if (i === 0) return; // Skip header row

      const cells = $(row).find('td');
      if (cells.length >= 5) {
        const commodity = $(cells[0]).text().trim() || $(cells[1]).text().trim();
        const variety = $(cells[1]).text().trim() || '';
        const minPrice = parseFloat($(cells[cells.length - 3]).text().replace(/[^0-9.]/g, ''));
        const maxPrice = parseFloat($(cells[cells.length - 2]).text().replace(/[^0-9.]/g, ''));
        const modalPrice = parseFloat($(cells[cells.length - 1]).text().replace(/[^0-9.]/g, ''));

        if (commodity && !isNaN(minPrice) && minPrice > 0) {
          prices.push({
            commodity: commodity,
            variety: variety,
            minPrice: minPrice,
            maxPrice: maxPrice,
            modalPrice: modalPrice,
            date: date,
            unit: 'Quintal',
          });
        }
      }
    });

    // Also try alternative table format
    if (prices.length === 0) {
      $('tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 4) {
          const texts = cells.map((j, cell) => $(cell).text().trim()).get();
          // Look for rows with price-like numbers
          const pricePattern = /^\d{2,6}(\.\d{1,2})?$/;
          const priceIndices = texts.reduce((acc, t, idx) => {
            if (pricePattern.test(t)) acc.push(idx);
            return acc;
          }, []);

          if (priceIndices.length >= 2) {
            const commodity = texts[0];
            if (commodity && commodity.length > 2 && !/^\d+$/.test(commodity)) {
              const prices_vals = priceIndices.map((idx) => parseFloat(texts[idx]));
              prices.push({
                commodity: commodity,
                variety: texts[1] || '',
                minPrice: Math.min(...prices_vals),
                maxPrice: Math.max(...prices_vals),
                modalPrice: prices_vals[Math.floor(prices_vals.length / 2)],
                date: date,
                unit: 'Quintal',
              });
            }
          }
        }
      });
    }

    return prices;
  } catch (error) {
    console.error('Error in fetchPricesFromAgmarknet:', error.message);
    return [];
  }
}

/**
 * Filter prices array by commodity name
 * @param {Array} prices - All prices
 * @param {string} commodityName - Commodity to filter by
 * @returns {Array} Filtered prices
 */
function filterByCommodity(prices, commodityName) {
  if (!commodityName) return prices;
  const searchTerm = commodityName.toLowerCase();
  return prices.filter((p) =>
    p.commodity.toLowerCase().includes(searchTerm)
    || (p.variety && p.variety.toLowerCase().includes(searchTerm))
  );
}

/**
 * Search for a state by name or short code
 * @param {string} query - State name or code
 * @returns {object|null} State object or null
 */
function findState(query) {
  if (!query) return null;
  const normalized = query.toLowerCase().trim();

  return statesData.find((s) =>
    s.name.toLowerCase() === normalized
    || s.shortCode.toLowerCase() === normalized
    || s.name.toLowerCase().includes(normalized)
  ) || null;
}

/**
 * Search for a district by name within a state
 * @param {string} stateCode - State code
 * @param {string} query - District name
 * @returns {object|null} District object or null
 */
function findDistrict(stateCode, query) {
  if (!query) return null;
  const state = statesData.find((s) => s.code === stateCode);
  if (!state) return null;

  const normalized = query.toLowerCase().trim();
  return state.districts.find((d) =>
    d.name.toLowerCase() === normalized
    || d.name.toLowerCase().includes(normalized)
  ) || null;
}

module.exports = {
  getStates,
  getDistricts,
  getMandis,
  getPrices,
  findState,
  findDistrict,
};
