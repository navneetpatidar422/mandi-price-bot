/**
 * In-memory session store for active bot conversations.
 * Each entry maps a user identifier to their current session state.
 */
const sessions = new Map();

/**
 * Returns true if the user has an active session.
 * @param {string} userId
 * @returns {boolean}
 */
function hasSession(userId) {
  return sessions.has(userId);
}

/**
 * Creates a new session for the user with the given initial state.
 * @param {string} userId
 * @param {object} state
 */
function createSession(userId, state = {}) {
  sessions.set(userId, state);
}

/**
 * Returns the session state for the user, or undefined if none exists.
 * @param {string} userId
 * @returns {object|undefined}
 */
function getSession(userId) {
  return sessions.get(userId);
}

/**
 * Updates an existing session's state.
 * @param {string} userId
 * @param {object} updates
 */
function updateSession(userId, updates) {
  const current = sessions.get(userId) || {};
  sessions.set(userId, { ...current, ...updates });
}

/**
 * Removes a user's session (ends the conversation).
 * @param {string} userId
 */
function deleteSession(userId) {
  sessions.delete(userId);
}

module.exports = { hasSession, createSession, getSession, updateSession, deleteSession };
