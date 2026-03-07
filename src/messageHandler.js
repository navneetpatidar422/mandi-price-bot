const { hasSession, createSession, getSession, updateSession, deleteSession } = require('./sessions');

/**
 * The exact phrase (lowercased) that a new user must send to activate the bot.
 * Comparison is case-insensitive and ignores leading/trailing whitespace.
 */
const TRIGGER_PHRASE = 'hi mandi bot';

/**
 * Bot conversation states.
 */
const STATE = {
  SELECT_STATE: 'SELECT_STATE',
  SELECT_DISTRICT: 'SELECT_DISTRICT',
  SELECT_CROP: 'SELECT_CROP',
};

/**
 * Welcome message sent when a user first activates the bot.
 */
const WELCOME_MESSAGE =
  '🌾 *Welcome to Mandi Price Bot!*\n\nI can help you check the latest mandi prices.\n\nPlease enter your *state name* to get started:';

/**
 * Handles an incoming WhatsApp message.
 *
 * - If the user does NOT have an active session and the message does not match
 *   the trigger phrase exactly (case-insensitive, trimmed), the message is
 *   silently ignored.
 * - If the user does NOT have an active session and sends the trigger phrase,
 *   a new session is created and the welcome flow begins.
 * - If the user already has an active session, the ongoing conversation flow
 *   continues.
 *
 * @param {string} userId   - Unique identifier for the user (e.g. WhatsApp number).
 * @param {string} message  - Raw message text received from the user.
 * @param {Function} reply  - Async function used to send a reply to the user.
 */
async function handleMessage(userId, message, reply) {
  if (!hasSession(userId)) {
    if (message.trim().toLowerCase() !== TRIGGER_PHRASE) {
      // Ignore messages that do not match the trigger phrase.
      return;
    }

    // Activation: create a new session and start the bot flow.
    createSession(userId, { step: STATE.SELECT_STATE });
    await reply(WELCOME_MESSAGE);
    return;
  }

  // User already has an active session – continue the conversation.
  const session = getSession(userId);
  await handleConversation(userId, message, session, reply);
}

/**
 * Handles the ongoing conversation flow for users with an active session.
 *
 * @param {string} userId
 * @param {string} message
 * @param {object} session
 * @param {Function} reply
 */
async function handleConversation(userId, message, session, reply) {
  const text = message.trim();

  switch (session.step) {
    case STATE.SELECT_STATE: {
      updateSession(userId, { step: STATE.SELECT_DISTRICT, state: text });
      await reply(`You selected state: *${text}*\n\nPlease enter your *district name*:`);
      break;
    }

    case STATE.SELECT_DISTRICT: {
      updateSession(userId, { step: STATE.SELECT_CROP, district: text });
      await reply(`You selected district: *${text}*\n\nPlease enter the *crop name* you want to check:`);
      break;
    }

    case STATE.SELECT_CROP: {
      const { state, district } = getSession(userId);
      const priceInfo = await fetchPrice(state, district, text);
      await reply(priceInfo);
      deleteSession(userId);
      break;
    }

    default:
      deleteSession(userId);
      await reply('Something went wrong. Please send *Hi Mandi Bot* to start again.');
  }
}

/**
 * Fetches the mandi price for the given state, district, and crop.
 * Returns a formatted string with the price information.
 *
 * @param {string} state
 * @param {string} district
 * @param {string} crop
 * @returns {Promise<string>}
 */
async function fetchPrice(state, district, crop) {
  // Placeholder: real implementation would call the government Agmarknet API.
  return (
    `📊 *Mandi Price Info*\n\n` +
    `State: ${state}\n` +
    `District: ${district}\n` +
    `Crop: ${crop}\n\n` +
    `_Price data not available. Please check https://agmarknet.gov.in for the latest rates._\n\n` +
    `Send *Hi Mandi Bot* to start a new query.`
  );
}

module.exports = { handleMessage, TRIGGER_PHRASE };
