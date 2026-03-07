/**
 * src/sessionManager.js - Manages conversation state for each user
 * Developed by Navneet Patidar
 *
 * Tracks which step of the conversation each user is on,
 * and stores their selections (state, district, mandi).
 */

const config = require('./config');

// In-memory session store: { phoneNumber: sessionObject }
const sessions = new Map();

/**
 * Get or create a session for a user
 * @param {string} userId - WhatsApp user ID (phone number)
 * @returns {object} User session object
 */
function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, createNewSession());
  }

  const session = sessions.get(userId);

  // Check if session has timed out
  if (Date.now() - session.lastActivity > config.SESSION_TIMEOUT_MS) {
    sessions.set(userId, createNewSession());
    return sessions.get(userId);
  }

  // Update last activity timestamp
  session.lastActivity = Date.now();
  return session;
}

/**
 * Create a fresh session object
 * @returns {object} New session object
 */
function createNewSession() {
  return {
    state: config.STATES.IDLE,
    selectedState: null,       // e.g., "Madhya Pradesh"
    selectedStateCode: null,   // e.g., "23" (Agmarknet code)
    selectedDistrict: null,    // e.g., "Indore"
    selectedDistrictCode: null,
    selectedMandi: null,       // e.g., "Indore (Malwa)"
    selectedMandiCode: null,
    stateList: [],             // List of states shown to user
    districtList: [],          // List of districts shown to user
    mandiList: [],             // List of mandis shown to user
    isHindi: false,            // Whether user is communicating in Hindi
    lastActivity: Date.now(),
    messageHistory: [],        // For Gemini conversation context
  };
}

/**
 * Update session with new data
 * @param {string} userId - WhatsApp user ID
 * @param {object} updates - Key-value pairs to update
 */
function updateSession(userId, updates) {
  const session = getSession(userId);
  Object.assign(session, updates);
  session.lastActivity = Date.now();
}

/**
 * Reset a user's session (start fresh)
 * @param {string} userId - WhatsApp user ID
 */
function resetSession(userId) {
  sessions.set(userId, createNewSession());
}

/**
 * Add a message to session history (for AI context)
 * @param {string} userId - WhatsApp user ID
 * @param {string} role - 'user' or 'model'
 * @param {string} text - Message text
 */
function addToHistory(userId, role, text) {
  const session = getSession(userId);
  session.messageHistory.push({ role, parts: [{ text }] });

  // Keep only last 10 messages to avoid token limits
  if (session.messageHistory.length > 10) {
    session.messageHistory = session.messageHistory.slice(-10);
  }
}

/**
 * Get session history for Gemini
 * @param {string} userId - WhatsApp user ID
 * @returns {Array} Message history array
 */
function getHistory(userId) {
  return getSession(userId).messageHistory;
}

/**
 * Clean up expired sessions (call periodically)
 */
function cleanupSessions() {
  const now = Date.now();
  for (const [userId, session] of sessions.entries()) {
    if (now - session.lastActivity > config.SESSION_TIMEOUT_MS * 2) {
      sessions.delete(userId);
    }
  }
}

// Clean up expired sessions every hour
setInterval(cleanupSessions, 60 * 60 * 1000);

module.exports = {
  getSession,
  updateSession,
  resetSession,
  addToHistory,
  getHistory,
};
