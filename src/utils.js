/**
 * src/utils.js - Utility functions for सही Mandi bot
 * Developed by Navneet Patidar
 *
 * Helper functions for:
 * - Detecting if text is in Hindi (Devanagari script)
 * - Formatting prices
 * - Date formatting
 * - Text normalization
 */

/**
 * Check if a string contains Hindi (Devanagari) characters
 * @param {string} text - Input text
 * @returns {boolean} True if text contains Devanagari characters
 */
function isHindi(text) {
  // Devanagari Unicode range: U+0900 to U+097F
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Format price in Indian number format (with commas)
 * @param {number|string} price - Price value
 * @returns {string} Formatted price string
 */
function formatPrice(price) {
  const num = parseInt(price);
  if (isNaN(num)) return 'N/A';
  return num.toLocaleString('en-IN');
}

/**
 * Format a date to DD-MM-YYYY format
 * @param {Date|string} date - Date object or string
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const d = date ? new Date(date) : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Normalize text for comparison (lowercase, trim whitespace)
 * @param {string} text - Input text
 * @returns {string} Normalized text
 */
function normalizeText(text) {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check if a message is a greeting
 * @param {string} text - Message text
 * @returns {boolean}
 */
function isGreeting(text) {
  const normalized = normalizeText(text);
  const greetings = [
    'hi', 'hello', 'namaste', 'namaskar', 'helo', 'hey',
    'नमस्ते', 'नमस्कार', 'हेलो', 'हाय',
    'hy', 'hii', 'hiii', 'helo', 'start', 'shuru',
  ];
  return greetings.some((g) => normalized === g || normalized.startsWith(g + ' '));
}

/**
 * Check if a message is asking for help
 * @param {string} text - Message text
 * @returns {boolean}
 */
function isHelpRequest(text) {
  const normalized = normalizeText(text);
  return ['help', 'madad', 'sahayata', 'मदद', 'सहायता', '?', 'help me'].includes(normalized)
    || normalized.includes('help')
    || normalized.includes('madad');
}

/**
 * Check if a message is asking for the main menu
 * @param {string} text - Message text
 * @returns {boolean}
 */
function isMenuRequest(text) {
  const normalized = normalizeText(text);
  return ['menu', 'main menu', 'back', 'wapas', 'home', 'reset', 'मेनू'].includes(normalized)
    || normalized === '0';
}

/**
 * Try to parse a number selection from user input
 * @param {string} text - User input
 * @param {number} maxIndex - Maximum valid index
 * @returns {number|null} Zero-based index or null if invalid
 */
function parseSelection(text, maxIndex) {
  const normalized = normalizeText(text);
  const num = parseInt(normalized);
  if (!isNaN(num) && num >= 1 && num <= maxIndex) {
    return num - 1; // Convert to zero-based index
  }
  return null;
}

/**
 * Get an emoji for a commodity based on its name
 * @param {string} commodityName - Name of the commodity
 * @returns {string} Emoji string
 */
function getCommodityEmoji(commodityName) {
  const name = normalizeText(commodityName);
  const emojiMap = {
    wheat: '🌾', gehun: '🌾', गेहूं: '🌾',
    rice: '🍚', chawal: '🍚', dhaan: '🌾', चावल: '🍚',
    soybean: '🌱', soya: '🌱', सोयाबीन: '🌱',
    onion: '🧅', pyaz: '🧅', pyaaz: '🧅', प्याज: '🧅',
    potato: '🥔', aloo: '🥔', आलू: '🥔',
    tomato: '🍅', tamatar: '🍅', टमाटर: '🍅',
    chilli: '🌶️', mirch: '🌶️', मिर्च: '🌶️',
    garlic: '🧄', lehsun: '🧄', लहसुन: '🧄',
    maize: '🌽', makka: '🌽', corn: '🌽', मक्का: '🌽',
    cotton: '🌸', kapas: '🌸', रूई: '🌸',
    mustard: '🌻', sarson: '🌻', सरसों: '🌻',
    groundnut: '🥜', moongfali: '🥜', mungfali: '🥜', मूंगफली: '🥜',
    gram: '🫘', chana: '🫘', चना: '🫘',
    lentil: '🫘', masur: '🫘', dal: '🫘', दाल: '🫘',
  };

  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (name.includes(key)) return emoji;
  }
  return '🌿'; // Default emoji
}

/**
 * Truncate long text for display
 * @param {string} text - Input text
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncate(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

module.exports = {
  isHindi,
  formatPrice,
  formatDate,
  normalizeText,
  isGreeting,
  isHelpRequest,
  isMenuRequest,
  parseSelection,
  getCommodityEmoji,
  truncate,
};
