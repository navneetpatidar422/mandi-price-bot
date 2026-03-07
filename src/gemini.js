/**
 * src/gemini.js - Google Gemini AI integration
 * Developed by Navneet Patidar
 *
 * Uses Google Gemini API for:
 * - Natural language understanding
 * - Commodity name extraction and mapping
 * - Human-like conversational responses
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');
const commoditiesData = require('./data/commodities.json');

// Initialize Gemini client
let genAI = null;
let isGeminiAvailable = false;

if (config.GEMINI_API_KEY && config.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    isGeminiAvailable = true;
    console.log('✅ Gemini AI initialized successfully');
  } catch (error) {
    console.warn('⚠️  Gemini AI initialization failed:', error.message);
    isGeminiAvailable = false;
  }
} else {
  console.warn('⚠️  GEMINI_API_KEY not set. AI features disabled. Bot will work with basic responses.');
}

// System prompt defining bot personality and behavior
const SYSTEM_PROMPT = `You are "सही Mandi" (Sahi Mandi), a helpful WhatsApp bot assistant for Indian farmers.
Your personality:
- Friendly, warm, and helpful like a knowledgeable neighbor
- You speak in Hinglish (Hindi words in English script) by default
- If user writes in Hindi (Devanagari), you reply in Hindi
- You understand both Hindi and English commodity/crop names
- You are patient and explain things simply for farmers who may not be tech-savvy
- You were developed by Navneet Patidar

Your main job:
- Help farmers check mandi (agricultural market) prices from Agmarknet
- Guide them step by step: State → District → Mandi → Commodity prices
- Make the experience feel like talking to a helpful friend, not a machine

Remember:
- Be concise in WhatsApp messages (no long essays)
- Use emojis to make messages friendly
- Always be encouraging and positive`;

/**
 * Extract commodity name from a natural language query
 * @param {string} userQuery - User's message
 * @param {boolean} useHindi - Whether to use Hindi context
 * @returns {Promise<string|null>} Commodity name or null
 */
async function extractCommodityFromQuery(userQuery, useHindi = false) {
  // First try local matching (faster, no API needed)
  const localMatch = findCommodityLocally(userQuery);
  if (localMatch) return localMatch;

  // Fall back to Gemini if available
  if (!isGeminiAvailable) return null;

  try {
    const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });

    const commodityList = commoditiesData.map((c) =>
      `${c.english} (${c.hindi}, ${c.hinglish})`
    ).join(', ');

    const prompt = `Extract the crop/commodity name from this farmer's message: "${userQuery}"

Available commodities: ${commodityList}

Rules:
1. Return ONLY the English commodity name from the list above
2. If no commodity is mentioned, return "NONE"
3. Match Hindi names too (e.g., "गेहूं" = "Wheat", "प्याज" = "Onion")
4. Match Hinglish names (e.g., "gehun" = "Wheat", "pyaaz" = "Onion")

Reply with just the commodity name or NONE.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    if (response === 'NONE' || !response) return null;
    return response;
  } catch (error) {
    console.error('Gemini commodity extraction error:', error.message);
    return null;
  }
}

/**
 * Try to find commodity from query using local data (no API)
 * @param {string} query - User query
 * @returns {string|null} Commodity name or null
 */
function findCommodityLocally(query) {
  const normalized = query.toLowerCase().trim();

  for (const commodity of commoditiesData) {
    // Check all aliases
    for (const alias of commodity.aliases) {
      if (normalized.includes(alias.toLowerCase())) {
        return commodity.english;
      }
    }
    // Check english and hinglish names
    if (normalized.includes(commodity.english.toLowerCase())
      || normalized.includes(commodity.hinglish.toLowerCase())) {
      return commodity.english;
    }
  }
  return null;
}

/**
 * Generate a conversational response using Gemini
 * @param {string} prompt - The prompt for Gemini
 * @param {Array} history - Conversation history
 * @param {boolean} useHindi - Whether to respond in Hindi
 * @returns {Promise<string>} AI-generated response
 */
async function generateResponse(prompt, history = [], useHindi = false) {
  if (!isGeminiAvailable) {
    return null; // Fall back to template responses
  }

  try {
    const model = genAI.getGenerativeModel({
      model: config.GEMINI_MODEL,
      systemInstruction: SYSTEM_PROMPT + (useHindi ? '\n\nIMPORTANT: User is writing in Hindi. Reply in Hindi (Devanagari script).' : ''),
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini response generation error:', error.message);
    return null;
  }
}

/**
 * Understand a natural language mandi query
 * e.g., "bhai pyaaz ka kya haal hai indore mein" → { commodity: 'Onion', location: 'Indore' }
 * @param {string} query - User's natural language query
 * @returns {Promise<object>} Parsed query with commodity and location
 */
async function parseMandiQuery(query) {
  // Try local parsing first
  const commodity = findCommodityLocally(query);
  const result = { commodity, location: null, intent: 'price_check' };

  if (!isGeminiAvailable) return result;

  try {
    const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });

    const prompt = `Parse this farmer's query about mandi prices: "${query}"

Extract:
1. commodity: crop/vegetable name in English (or null)
2. location: city/mandi/district name (or null)
3. intent: "price_check" or "other"

Reply in JSON format only:
{"commodity": "...", "location": "...", "intent": "..."}`;

    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();

    // Parse JSON response
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        commodity: parsed.commodity || commodity,
        location: parsed.location || null,
        intent: parsed.intent || 'price_check',
      };
    }
  } catch (error) {
    console.error('Gemini query parsing error:', error.message);
  }

  return result;
}

/**
 * Get commodity info from our local data
 * @param {string} name - Commodity name (English/Hindi/Hinglish)
 * @returns {object|null} Commodity info or null
 */
function getCommodityInfo(name) {
  if (!name) return null;
  const normalized = name.toLowerCase();

  return commoditiesData.find((c) => {
    return c.aliases.some((alias) => alias.toLowerCase() === normalized)
      || c.english.toLowerCase() === normalized
      || c.hinglish.toLowerCase() === normalized;
  }) || null;
}

module.exports = {
  extractCommodityFromQuery,
  generateResponse,
  parseMandiQuery,
  getCommodityInfo,
  isGeminiAvailable: () => isGeminiAvailable,
};
