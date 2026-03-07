/**
 * src/config.js - Configuration and constants for सही Mandi bot
 * Developed by Navneet Patidar
 */

module.exports = {
  // Bot identity
  BOT_NAME: process.env.BOT_NAME || 'सही Mandi',
  DEVELOPER_NAME: process.env.DEVELOPER_NAME || 'Navneet Patidar',

  // Google Gemini API
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: 'gemini-1.5-flash',

  // Agmarknet base URL
  AGMARKNET_BASE_URL: 'https://agmarknet.gov.in',

  // Cache settings
  CACHE_DURATION_MS: (parseInt(process.env.CACHE_DURATION_MINUTES) || 30) * 60 * 1000,

  // Request settings
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES) || 3,
  REQUEST_TIMEOUT_MS: 15000,

  // Conversation states
  STATES: {
    IDLE: 'IDLE',                       // No active conversation
    MAIN_MENU: 'MAIN_MENU',             // Showing main menu
    SELECT_STATE: 'SELECT_STATE',       // Asking for state
    SELECT_DISTRICT: 'SELECT_DISTRICT', // Asking for district
    SELECT_MANDI: 'SELECT_MANDI',       // Asking for mandi
    SELECT_CROP_ACTION: 'SELECT_CROP_ACTION', // Asking specific crop or all crops
    SELECT_CROP: 'SELECT_CROP',         // Asking for crop name
    SHOW_PRICES: 'SHOW_PRICES',         // Showing prices
  },

  // Session timeout in milliseconds (30 minutes)
  SESSION_TIMEOUT_MS: 30 * 60 * 1000,

  // Request headers to mimic a real browser
  REQUEST_HEADERS: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
  },
};
