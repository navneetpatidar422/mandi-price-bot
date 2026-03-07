/**
 * src/messageHandler.js - Main message handling logic for सही Mandi bot
 * Developed by Navneet Patidar
 *
 * Handles the complete conversation flow:
 * Greeting → State → District → Mandi → Crop → Price Display
 */

const config = require('./config');
const sessionManager = require('./sessionManager');
const agmarknet = require('./agmarknet');
const gemini = require('./gemini');
const utils = require('./utils');

/**
 * Main entry point for handling incoming WhatsApp messages
 * @param {object} client - WhatsApp client
 * @param {object} message - Incoming message object
 */
async function handleMessage(client, message) {
  const userId = message.from;
  const text = message.body.trim();

  if (!text) return;

  // Detect if user is writing in Hindi
  const isHindiUser = utils.isHindi(text);

  // Update session with language preference
  const session = sessionManager.getSession(userId);
  if (isHindiUser) {
    sessionManager.updateSession(userId, { isHindi: true });
  }

  // Add user message to history for AI context
  sessionManager.addToHistory(userId, 'user', text);

  // Handle global commands (work from any state)
  if (utils.isMenuRequest(text)) {
    await handleMainMenu(client, message, isHindiUser);
    return;
  }

  if (utils.isHelpRequest(text) && !utils.isMenuRequest(text)) {
    await sendHelpMessage(client, message, isHindiUser);
    return;
  }

  if (utils.isGreeting(text)) {
    await handleGreeting(client, message, isHindiUser);
    return;
  }

  // Route based on current conversation state
  const currentState = session.state;

  switch (currentState) {
    case config.STATES.IDLE:
    case config.STATES.MAIN_MENU:
      await handleMainMenuSelection(client, message, text, isHindiUser);
      break;

    case config.STATES.SELECT_STATE:
      await handleStateSelection(client, message, text, isHindiUser);
      break;

    case config.STATES.SELECT_DISTRICT:
      await handleDistrictSelection(client, message, text, isHindiUser);
      break;

    case config.STATES.SELECT_MANDI:
      await handleMandiSelection(client, message, text, isHindiUser);
      break;

    case config.STATES.SELECT_CROP_ACTION:
      await handleCropActionSelection(client, message, text, isHindiUser);
      break;

    case config.STATES.SELECT_CROP:
      await handleCropSelection(client, message, text, isHindiUser);
      break;

    case config.STATES.SHOW_PRICES:
      await handlePostPriceAction(client, message, text, isHindiUser);
      break;

    default:
      await handleGreeting(client, message, isHindiUser);
  }
}

// ============================================================
// GREETING & MENU HANDLERS
// ============================================================

/**
 * Handle greeting messages - show welcome message
 */
async function handleGreeting(client, message, isHindi) {
  sessionManager.resetSession(message.from);
  sessionManager.updateSession(message.from, {
    state: config.STATES.MAIN_MENU,
    isHindi: isHindi,
  });

  const welcomeMsg = isHindi
    ? `🙏 नमस्ते! मैं हूँ *${config.BOT_NAME}* 🌾\nआपका अपना मंडी प्राइस हेल्पर बोट!\n👨‍💻 Developed by *${config.DEVELOPER_NAME}*\n\nआपको मंडी भाव जानना है? बताओ कैसे मदद करूँ:\n\n1️⃣ मंडी भाव देखें\n2️⃣ मदद / Help\n\n*कोई भी नंबर टाइप करें या सीधे पूछें!*`
    : `🙏 Namaste! Main hoon *${config.BOT_NAME}* 🌾\nAapka apna Mandi Price Helper bot!\n👨‍💻 Developed by *${config.DEVELOPER_NAME}*\n\nAapko mandi bhav jaanna hai? Batao kaise help karun:\n\n1️⃣ Mandi Bhav Dekhein\n2️⃣ Help / Madad\n\n*Koi bhi number type karein ya seedha poochein!*`;

  await sendMessage(client, message.from, welcomeMsg);
}

/**
 * Show main menu
 */
async function handleMainMenu(client, message, isHindi) {
  sessionManager.resetSession(message.from);
  sessionManager.updateSession(message.from, {
    state: config.STATES.MAIN_MENU,
    isHindi: isHindi,
  });

  const menuMsg = isHindi
    ? `🏠 *मुख्य मेनू* - ${config.BOT_NAME}\n\n1️⃣ मंडी भाव देखें\n2️⃣ मदद / Help\n\n*नंबर टाइप करें या सीधे पूछें:*`
    : `🏠 *Main Menu* - ${config.BOT_NAME}\n\n1️⃣ Mandi Bhav Dekhein\n2️⃣ Help / Madad\n\n*Number type karein ya seedha poochein:*`;

  await sendMessage(client, message.from, menuMsg);
}

/**
 * Handle main menu selection (1 or 2)
 */
async function handleMainMenuSelection(client, message, text, isHindi) {
  const normalized = utils.normalizeText(text);

  // Check for "1" or mandi-related keywords
  const isMandiBhavRequest = normalized === '1'
    || normalized.includes('mandi')
    || normalized.includes('bhav')
    || normalized.includes('price')
    || normalized.includes('rate')
    || normalized.includes('भाव')
    || normalized.includes('दाम')
    || normalized.includes('मंडी');

  if (isMandiBhavRequest) {
    await askForState(client, message, isHindi);
    return;
  }

  // Check for "2" or help keywords
  if (normalized === '2' || normalized.includes('help') || normalized.includes('madad')) {
    await sendHelpMessage(client, message, isHindi);
    return;
  }

  // Unknown input - show menu again
  await handleGreeting(client, message, isHindi);
}

// ============================================================
// STEP 1: STATE SELECTION
// ============================================================

/**
 * Ask user to select a state
 */
async function askForState(client, message, isHindi) {
  const states = agmarknet.getStates();

  sessionManager.updateSession(message.from, {
    state: config.STATES.SELECT_STATE,
    stateList: states,
  });

  // Build state list message (show first 10 states)
  const stateListText = states.slice(0, 10).map((s, i) =>
    `${i + 1}. ${s.name}`
  ).join('\n');

  const msg = isHindi
    ? `🗺️ कौनसे *State* की मंडी देखनी है?\n\nApne state ka naam type karein ya number choose karein:\n${stateListText}\n... (aur bhi hain)\n\n*Ya direct state ka naam likh dein!*\n_(Menu ke liye "0" type karein)_`
    : `🗺️ Konse *State* ki mandi dekhni hai?\n\nApne state ka naam type karein ya number choose karein:\n${stateListText}\n... (aur bhi hain)\n\n*Ya direct state ka naam likh dein!*\n_(Menu ke liye "0" type karein)_`;

  await sendMessage(client, message.from, msg);
}

/**
 * Handle state selection from user
 */
async function handleStateSelection(client, message, text, isHindi) {
  const session = sessionManager.getSession(message.from);
  const states = session.stateList;

  let selectedState = null;

  // Check if user entered a number
  const numIndex = utils.parseSelection(text, states.length);
  if (numIndex !== null) {
    selectedState = states[numIndex];
  } else {
    // Try to find state by name
    selectedState = agmarknet.findState(text);
    if (!selectedState && states.length > 0) {
      // Try fuzzy match in shown list
      const normalized = utils.normalizeText(text);
      selectedState = states.find((s) =>
        utils.normalizeText(s.name).includes(normalized)
        || utils.normalizeText(s.shortCode) === normalized
      );
    }
  }

  if (!selectedState) {
    const errorMsg = isHindi
      ? `❌ "${text}" state nahi mila.\n\n🗺️ Please list se number choose karein ya state ka naam type karein:\n${states.slice(0, 10).map((s, i) => `${i + 1}. ${s.name}`).join('\n')}`
      : `❌ "${text}" state nahi mila.\n\n🗺️ Please list se number choose karein ya state ka naam type karein:\n${states.slice(0, 10).map((s, i) => `${i + 1}. ${s.name}`).join('\n')}`;
    await sendMessage(client, message.from, errorMsg);
    return;
  }

  sessionManager.updateSession(message.from, {
    selectedState: selectedState.name,
    selectedStateCode: selectedState.code,
  });

  await askForDistrict(client, message, selectedState, isHindi);
}

// ============================================================
// STEP 2: DISTRICT SELECTION
// ============================================================

/**
 * Ask user to select a district
 */
async function askForDistrict(client, message, state, isHindi) {
  const districts = agmarknet.getDistricts(state.code);

  if (!districts || districts.length === 0) {
    const msg = isHindi
      ? `⚠️ ${state.name} ke districts load nahi ho sake. Please dobara try karein.`
      : `⚠️ ${state.name} ke districts load nahi ho sake. Please dobara try karein.`;
    await sendMessage(client, message.from, msg);
    return;
  }

  sessionManager.updateSession(message.from, {
    state: config.STATES.SELECT_DISTRICT,
    districtList: districts,
  });

  const districtListText = districts.slice(0, 12).map((d, i) =>
    `${i + 1}. ${d.name}`
  ).join('\n');

  const msg = isHindi
    ? `📍 *${state.name}* ke konse district ki mandi?\n\nApne district ka naam type karein ya choose karein:\n${districtListText}\n\n*Ya direct district ka naam likh dein!*\n_(Menu ke liye "0" type karein)_`
    : `📍 *${state.name}* ke konse district ki mandi?\n\nApne district ka naam type karein ya choose karein:\n${districtListText}\n\n*Ya direct district ka naam likh dein!*\n_(Menu ke liye "0" type karein)_`;

  await sendMessage(client, message.from, msg);
}

/**
 * Handle district selection from user
 */
async function handleDistrictSelection(client, message, text, isHindi) {
  const session = sessionManager.getSession(message.from);
  const districts = session.districtList;

  let selectedDistrict = null;

  // Check if user entered a number
  const numIndex = utils.parseSelection(text, districts.length);
  if (numIndex !== null) {
    selectedDistrict = districts[numIndex];
  } else {
    // Find by name
    const normalized = utils.normalizeText(text);
    selectedDistrict = agmarknet.findDistrict(session.selectedStateCode, text)
      || districts.find((d) => utils.normalizeText(d.name).includes(normalized));
  }

  if (!selectedDistrict) {
    const errorMsg = isHindi
      ? `❌ "${text}" district nahi mila.\n\nPlease list se number choose karein ya district ka naam type karein:\n${districts.slice(0, 12).map((d, i) => `${i + 1}. ${d.name}`).join('\n')}`
      : `❌ "${text}" district nahi mila.\n\nPlease list se number choose karein ya district ka naam type karein:\n${districts.slice(0, 12).map((d, i) => `${i + 1}. ${d.name}`).join('\n')}`;
    await sendMessage(client, message.from, errorMsg);
    return;
  }

  sessionManager.updateSession(message.from, {
    selectedDistrict: selectedDistrict.name,
    selectedDistrictCode: selectedDistrict.code,
  });

  await askForMandi(client, message, selectedDistrict, isHindi);
}

// ============================================================
// STEP 3: MANDI SELECTION
// ============================================================

/**
 * Ask user to select a mandi - fetches from Agmarknet
 */
async function askForMandi(client, message, district, isHindi) {
  const session = sessionManager.getSession(message.from);

  // Show loading message
  await sendMessage(client, message.from, isHindi
    ? `⏳ ${district.name} ki mandi list load ho rahi hai...`
    : `⏳ ${district.name} ki mandi list load ho rahi hai...`
  );

  try {
    const mandis = await agmarknet.getMandis(session.selectedStateCode, district.code);

    if (!mandis || mandis.length === 0) {
      // If no mandis found, use district as mandi
      sessionManager.updateSession(message.from, {
        state: config.STATES.SELECT_CROP_ACTION,
        selectedMandi: district.name,
        selectedMandiCode: district.code,
        mandiList: [{ name: district.name, code: district.code }],
      });
      await askForCropAction(client, message, district.name, isHindi);
      return;
    }

    sessionManager.updateSession(message.from, {
      state: config.STATES.SELECT_MANDI,
      mandiList: mandis,
    });

    const mandiListText = mandis.slice(0, 12).map((m, i) =>
      `${i + 1}. ${m.name}`
    ).join('\n');

    const msg = isHindi
      ? `🏪 *${district.name} District* ki konsi mandi?\n\n${mandiListText}\n\n*Ya mandi ka naam type karein!*\n_(Menu ke liye "0" type karein)_`
      : `🏪 *${district.name} District* ki konsi mandi?\n\n${mandiListText}\n\n*Ya mandi ka naam type karein!*\n_(Menu ke liye "0" type karein)_`;

    await sendMessage(client, message.from, msg);
  } catch (error) {
    console.error('Error fetching mandis:', error);
    await sendMessage(client, message.from, isHindi
      ? '⚠️ Mandis load nahi ho saki. Please dobara try karein ya "menu" type karein.'
      : '⚠️ Mandis load nahi ho saki. Please dobara try karein ya "menu" type karein.'
    );
  }
}

/**
 * Handle mandi selection from user
 */
async function handleMandiSelection(client, message, text, isHindi) {
  const session = sessionManager.getSession(message.from);
  const mandis = session.mandiList;

  let selectedMandi = null;

  // Check if user entered a number
  const numIndex = utils.parseSelection(text, mandis.length);
  if (numIndex !== null) {
    selectedMandi = mandis[numIndex];
  } else {
    // Find by name
    const normalized = utils.normalizeText(text);
    selectedMandi = mandis.find((m) =>
      utils.normalizeText(m.name).includes(normalized)
      || normalized.includes(utils.normalizeText(m.name))
    );
  }

  if (!selectedMandi) {
    const errorMsg = isHindi
      ? `❌ "${text}" mandi nahi mili.\n\nPlease list se number choose karein:\n${mandis.slice(0, 12).map((m, i) => `${i + 1}. ${m.name}`).join('\n')}`
      : `❌ "${text}" mandi nahi mili.\n\nPlease list se number choose karein:\n${mandis.slice(0, 12).map((m, i) => `${i + 1}. ${m.name}`).join('\n')}`;
    await sendMessage(client, message.from, errorMsg);
    return;
  }

  sessionManager.updateSession(message.from, {
    selectedMandi: selectedMandi.name,
    selectedMandiCode: selectedMandi.code,
  });

  await askForCropAction(client, message, selectedMandi.name, isHindi);
}

// ============================================================
// STEP 4: CROP ACTION SELECTION
// ============================================================

/**
 * Ask user if they want specific crop or all crops
 */
async function askForCropAction(client, message, mandiName, isHindi) {
  sessionManager.updateSession(message.from, {
    state: config.STATES.SELECT_CROP_ACTION,
  });

  const msg = isHindi
    ? `🌾 *${mandiName}* mein aaj ke bhav dekhne hain!\n\nKya dekhna hai?\n1️⃣ Specific crop ka bhav (crop ka naam batao)\n2️⃣ Sabhi crops ke bhav (All commodities)\n\n_(Menu ke liye "0" type karein)_`
    : `🌾 *${mandiName}* mein aaj ke bhav dekhne hain!\n\nKya dekhna hai?\n1️⃣ Specific crop ka bhav (crop ka naam batao)\n2️⃣ Sabhi crops ke bhav (All commodities)\n\n_(Menu ke liye "0" type karein)_`;

  await sendMessage(client, message.from, msg);
}

/**
 * Handle crop action selection
 */
async function handleCropActionSelection(client, message, text, isHindi) {
  const normalized = utils.normalizeText(text);
  const session = sessionManager.getSession(message.from);

  // Check if user said "all" or "2"
  const wantsAll = normalized === '2'
    || normalized.includes('all')
    || normalized.includes('sabhi')
    || normalized.includes('sab')
    || normalized.includes('सभी')
    || normalized.includes('सब');

  if (wantsAll) {
    await fetchAndShowAllPrices(client, message, session, isHindi);
    return;
  }

  // Check if user said "1" or specific crop
  if (normalized === '1') {
    sessionManager.updateSession(message.from, { state: config.STATES.SELECT_CROP });
    const msg = isHindi
      ? `🌱 Konse crop/fasal ka bhav chahiye?\n\nExamples: Wheat, Soybean, Onion, Potato\nYa Hindi mein: गेहूं, सोयाबीन, प्याज, आलू\n\n*Crop ka naam type karein:*`
      : `🌱 Konse crop/fasal ka bhav chahiye?\n\nExamples: Wheat, Soybean, Onion, Potato\nYa Hindi mein: गेहूं, सोयाबीन, प्याज, आलू\n\n*Crop ka naam type karein:*`;
    await sendMessage(client, message.from, msg);
    return;
  }

  // Check if user directly typed a commodity name
  const commodity = await gemini.extractCommodityFromQuery(text, isHindi);
  if (commodity) {
    sessionManager.updateSession(message.from, {
      state: config.STATES.SELECT_CROP,
    });
    await fetchAndShowCropPrice(client, message, session, commodity, isHindi);
    return;
  }

  // Unknown input
  const msg = isHindi
    ? `Please 1 ya 2 type karein:\n1️⃣ Specific crop ka bhav\n2️⃣ Sabhi crops ke bhav`
    : `Please 1 ya 2 type karein:\n1️⃣ Specific crop ka bhav\n2️⃣ Sabhi crops ke bhav`;
  await sendMessage(client, message.from, msg);
}

// ============================================================
// STEP 5: CROP SELECTION & PRICE DISPLAY
// ============================================================

/**
 * Handle specific crop name input
 */
async function handleCropSelection(client, message, text, isHindi) {
  const session = sessionManager.getSession(message.from);

  const commodity = await gemini.extractCommodityFromQuery(text, isHindi);

  if (!commodity) {
    const msg = isHindi
      ? `❌ "${text}" samajh nahi aaya.\n\nPlease crop ka naam type karein:\nExamples: Wheat, Soybean, Onion, Potato\nYa: गेहूं, सोयाबीन, प्याज, आलू`
      : `❌ "${text}" samajh nahi aaya.\n\nPlease crop ka naam type karein:\nExamples: Wheat, Soybean, Onion, Potato\nYa: गेहूं, सोयाबीन, प्याज, आलू`;
    await sendMessage(client, message.from, msg);
    return;
  }

  await fetchAndShowCropPrice(client, message, session, commodity, isHindi);
}

/**
 * Handle post-price display actions (show more, different mandi, main menu)
 */
async function handlePostPriceAction(client, message, text, isHindi) {
  const normalized = utils.normalizeText(text);
  const session = sessionManager.getSession(message.from);

  if (normalized === '1' || normalized.includes('aur') || normalized.includes('more')) {
    // Show more crops in same mandi
    sessionManager.updateSession(message.from, { state: config.STATES.SELECT_CROP });
    const msg = isHindi
      ? `🌱 Konsa aur crop dekhna hai?\nCrop ka naam type karein:`
      : `🌱 Konsa aur crop dekhna hai?\nCrop ka naam type karein:`;
    await sendMessage(client, message.from, msg);
    return;
  }

  if (normalized === '2' || normalized.includes('doosri') || normalized.includes('other mandi')) {
    // Select different mandi - go back to state selection
    await askForState(client, message, isHindi);
    return;
  }

  if (normalized === '3' || normalized.includes('main') || normalized.includes('menu')) {
    await handleMainMenu(client, message, isHindi);
    return;
  }

  // Check if it's a crop query
  const commodity = await gemini.extractCommodityFromQuery(text, isHindi);
  if (commodity) {
    await fetchAndShowCropPrice(client, message, session, commodity, isHindi);
    return;
  }

  // Show options again
  const msg = isHindi
    ? `Please choose karein:\n1️⃣ Isi mandi mein aur crop dekhein\n2️⃣ Doosri mandi dekhein\n3️⃣ Main menu`
    : `Please choose karein:\n1️⃣ Isi mandi mein aur crop dekhein\n2️⃣ Doosri mandi dekhein\n3️⃣ Main menu`;
  await sendMessage(client, message.from, msg);
}

// ============================================================
// PRICE FETCHING & DISPLAY
// ============================================================

/**
 * Fetch and display price for a specific crop
 */
async function fetchAndShowCropPrice(client, message, session, commodityName, isHindi) {
  if (!session.selectedMandiCode) {
    await askForState(client, message, isHindi);
    return;
  }

  // Show loading
  await sendMessage(client, message.from, isHindi
    ? `⏳ ${commodityName} ka bhav dhundh raha hoon...`
    : `⏳ ${commodityName} ka bhav dhundh raha hoon...`
  );

  try {
    const prices = await agmarknet.getPrices(
      session.selectedStateCode,
      session.selectedDistrictCode,
      session.selectedMandiCode,
      commodityName
    );

    const commodityInfo = gemini.getCommodityInfo(commodityName);
    const displayName = commodityInfo
      ? (isHindi ? commodityInfo.hindi : `${commodityInfo.hinglish} (${commodityInfo.english})`)
      : commodityName;
    const emoji = commodityInfo ? commodityInfo.emoji : utils.getCommodityEmoji(commodityName);

    if (!prices || prices.length === 0) {
      const msg = isHindi
        ? `😔 ${emoji} *${displayName}* ka bhav aaj *${session.selectedMandi}* mandi mein available nahi hai.\n\nPossible reasons:\n• Aaj is mandi mein ${displayName} nahi aaya\n• Agmarknet update nahi hua\n• Spelling check karein\n\n1️⃣ Aur crop try karein\n2️⃣ Doosri mandi try karein\n3️⃣ Main menu`
        : `😔 ${emoji} *${displayName}* ka bhav aaj *${session.selectedMandi}* mandi mein available nahi hai.\n\nPossible reasons:\n• Aaj is mandi mein ${displayName} nahi aaya\n• Agmarknet update nahi hua\n• Spelling check karein\n\n1️⃣ Aur crop try karein\n2️⃣ Doosri mandi try karein\n3️⃣ Main menu`;

      sessionManager.updateSession(message.from, { state: config.STATES.SHOW_PRICES });
      await sendMessage(client, message.from, msg);
      return;
    }

    // Format and send price message
    const priceMsg = formatPriceMessage(prices[0], displayName, emoji, session.selectedMandi, isHindi);
    sessionManager.updateSession(message.from, { state: config.STATES.SHOW_PRICES });
    await sendMessage(client, message.from, priceMsg);
  } catch (error) {
    console.error('Error fetching crop price:', error);
    await sendMessage(client, message.from, isHindi
      ? '⚠️ Price fetch karne mein error aaya. Agmarknet temporarily down ho sakta hai. Please thodi der baad try karein.'
      : '⚠️ Price fetch karne mein error aaya. Agmarknet temporarily down ho sakta hai. Please thodi der baad try karein.'
    );
  }
}

/**
 * Fetch and display all prices for a mandi
 */
async function fetchAndShowAllPrices(client, message, session, isHindi) {
  if (!session.selectedMandiCode) {
    await askForState(client, message, isHindi);
    return;
  }

  // Show loading
  await sendMessage(client, message.from, isHindi
    ? `⏳ ${session.selectedMandi} ke sabhi bhav load ho rahe hain... (thoda time lag sakta hai)`
    : `⏳ ${session.selectedMandi} ke sabhi bhav load ho rahe hain... (thoda time lag sakta hai)`
  );

  try {
    const prices = await agmarknet.getPrices(
      session.selectedStateCode,
      session.selectedDistrictCode,
      session.selectedMandiCode,
      null
    );

    if (!prices || prices.length === 0) {
      const msg = isHindi
        ? `😔 *${session.selectedMandi}* mandi ke aaj ke bhav available nahi hain.\n\nPossible reasons:\n• Agmarknet update nahi hua\n• Is mandi mein aaj koi arrival nahi\n\n2️⃣ Doosri mandi try karein\n3️⃣ Main menu`
        : `😔 *${session.selectedMandi}* mandi ke aaj ke bhav available nahi hain.\n\nPossible reasons:\n• Agmarknet update nahi hua\n• Is mandi mein aaj koi arrival nahi\n\n2️⃣ Doosri mandi try karein\n3️⃣ Main menu`;

      sessionManager.updateSession(message.from, { state: config.STATES.SHOW_PRICES });
      await sendMessage(client, message.from, msg);
      return;
    }

    const today = utils.formatDate(new Date());
    const header = isHindi
      ? `📊 *${session.selectedMandi}* - Aaj ke sabhi bhav (${today}):\n\n`
      : `📊 *${session.selectedMandi}* - Aaj ke sabhi bhav (${today}):\n\n`;

    // Build price list (WhatsApp has a 4096 char limit)
    let priceList = '';
    const maxItems = 20;

    for (let i = 0; i < Math.min(prices.length, maxItems); i++) {
      const p = prices[i];
      const emoji = utils.getCommodityEmoji(p.commodity);
      priceList += `${emoji} *${p.commodity}*: ₹${utils.formatPrice(p.minPrice)} - ₹${utils.formatPrice(p.maxPrice)} (Modal: ₹${utils.formatPrice(p.modalPrice)})\n`;
    }

    if (prices.length > maxItems) {
      priceList += `\n... aur ${prices.length - maxItems} aur crops hain\n`;
    }

    const footer = isHindi
      ? `\n📈 Kisi specific crop ke baare mein aur jaanna hai?\n\n1️⃣ Isi mandi mein specific crop dekhein\n2️⃣ Doosri mandi dekhein\n3️⃣ Main menu`
      : `\n📈 Kisi specific crop ke baare mein aur jaanna hai?\n\n1️⃣ Isi mandi mein specific crop dekhein\n2️⃣ Doosri mandi dekhein\n3️⃣ Main menu`;

    sessionManager.updateSession(message.from, { state: config.STATES.SHOW_PRICES });

    // Split into multiple messages if too long
    const fullMsg = header + priceList + footer;
    if (fullMsg.length > 4000) {
      await sendMessage(client, message.from, header + priceList.substring(0, 3500) + '\n... (list trimmed)');
      await sendMessage(client, message.from, footer);
    } else {
      await sendMessage(client, message.from, fullMsg);
    }
  } catch (error) {
    console.error('Error fetching all prices:', error);
    await sendMessage(client, message.from, isHindi
      ? '⚠️ Prices fetch karne mein error aaya. Please thodi der baad try karein.'
      : '⚠️ Prices fetch karne mein error aaya. Please thodi der baad try karein.'
    );
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Format a single price entry into a nice message
 */
function formatPriceMessage(priceData, displayName, emoji, mandiName, isHindi) {
  const today = utils.formatDate(new Date());

  return isHindi
    ? `${emoji} *${displayName}* - ${mandiName}\n📅 Date: ${priceData.date || today}\n\n💰 Min Price: ₹${utils.formatPrice(priceData.minPrice)}/quintal\n💰 Max Price: ₹${utils.formatPrice(priceData.maxPrice)}/quintal\n💰 Modal Price: ₹${utils.formatPrice(priceData.modalPrice)}/quintal\n\n📈 Kya aur kisi crop ya mandi ka bhav chahiye?\n\n1️⃣ Isi mandi mein aur crop dekhein\n2️⃣ Doosri mandi dekhein\n3️⃣ Main menu`
    : `${emoji} *${displayName}* - ${mandiName}\n📅 Date: ${priceData.date || today}\n\n💰 Min Price: ₹${utils.formatPrice(priceData.minPrice)}/quintal\n💰 Max Price: ₹${utils.formatPrice(priceData.maxPrice)}/quintal\n💰 Modal Price: ₹${utils.formatPrice(priceData.modalPrice)}/quintal\n\n📈 Kya aur kisi crop ya mandi ka bhav chahiye?\n\n1️⃣ Isi mandi mein aur crop dekhein\n2️⃣ Doosri mandi dekhein\n3️⃣ Main menu`;
}

/**
 * Send help message
 */
async function sendHelpMessage(client, message, isHindi) {
  const helpMsg = isHindi
    ? `ℹ️ *${config.BOT_NAME} - Help*\n👨‍💻 Developed by ${config.DEVELOPER_NAME}\n\n*Available Commands:*\n\n🔢 *1* - Mandi Bhav Dekhein\n❓ *help* - Yeh message dekhein\n🏠 *menu* ya *0* - Main menu par jaayein\n\n*Conversation Flow:*\n1. State chunein (MP, UP, etc.)\n2. District chunein\n3. Mandi chunein\n4. Crop ka bhav dekhein\n\n*Tips:*\n• Direct crop ka naam type kar sakte hain\n• Hindi ya Hinglish dono chalte hain\n• "Soybean" ya "सोयाबीन" dono samajh mein aata hai\n\n📱 Data source: Agmarknet (agmarknet.gov.in)`
    : `ℹ️ *${config.BOT_NAME} - Help*\n👨‍💻 Developed by ${config.DEVELOPER_NAME}\n\n*Available Commands:*\n\n🔢 *1* - Mandi Bhav Dekhein\n❓ *help* - Yeh message dekhein\n🏠 *menu* ya *0* - Main menu par jaayein\n\n*Conversation Flow:*\n1. State chunein (MP, UP, etc.)\n2. District chunein\n3. Mandi chunein\n4. Crop ka bhav dekhein\n\n*Tips:*\n• Direct crop ka naam type kar sakte hain\n• Hindi ya Hinglish dono chalte hain\n• "Soybean" ya "सोयाबीन" dono samajh mein aata hai\n\n📱 Data source: Agmarknet (agmarknet.gov.in)`;

  await sendMessage(client, message.from, helpMsg);
}

/**
 * Send a WhatsApp message
 * @param {object} client - WhatsApp client
 * @param {string} to - Recipient ID
 * @param {string} text - Message text
 */
async function sendMessage(client, to, text) {
  try {
    await client.sendMessage(to, text);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

module.exports = { handleMessage };
