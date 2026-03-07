const { handleMessage, TRIGGER_PHRASE } = require('../src/messageHandler');

// Re-require sessions so we can reset state between tests.
const sessions = require('../src/sessions');

beforeEach(() => {
  // Clear all active sessions before each test to ensure isolation.
  ['test-user', 'active-user'].forEach((id) => sessions.deleteSession(id));
});

describe('TRIGGER_PHRASE constant', () => {
  test('is defined and equals "hi mandi bot"', () => {
    expect(TRIGGER_PHRASE).toBe('hi mandi bot');
  });
});

describe('Bot activation – trigger phrase matching', () => {
  const activationCases = [
    ['Hi Mandi Bot', 'exact match'],
    ['hi mandi bot', 'all lowercase'],
    ['HI MANDI BOT', 'all uppercase'],
    ['   Hi Mandi Bot  ', 'leading and trailing spaces'],
    ['  hi mandi bot  ', 'lowercase with spaces'],
  ];

  test.each(activationCases)('"%s" (%s) → activates bot', async (message) => {
    const reply = jest.fn().mockResolvedValue(undefined);
    await handleMessage('test-user', message, reply);
    expect(reply).toHaveBeenCalledTimes(1);
    expect(reply.mock.calls[0][0]).toMatch(/Welcome to Mandi Price Bot/i);
  });

  const ignoredCases = [
    ['Hi', 'greeting only'],
    ['mandi bot hi', 'wrong order'],
    ['Hi Mandi Bot, please...', 'extra text after phrase'],
    ['Hello', 'different greeting'],
    ['hi mandi', 'incomplete phrase'],
    ['', 'empty string'],
    ['hi mandi bot!', 'trailing punctuation'],
  ];

  test.each(ignoredCases)('"%s" (%s) → ignored (no reply)', async (message) => {
    const reply = jest.fn().mockResolvedValue(undefined);
    await handleMessage('test-user', message, reply);
    expect(reply).not.toHaveBeenCalled();
  });
});

describe('Existing session – conversation flow continues regardless of trigger phrase', () => {
  test('user with active session can send any message and receive a reply', async () => {
    // Activate the bot first.
    const reply = jest.fn().mockResolvedValue(undefined);
    await handleMessage('active-user', 'Hi Mandi Bot', reply);
    expect(reply).toHaveBeenCalledTimes(1);

    // Follow-up message (not the trigger phrase) should still be handled.
    reply.mockClear();
    await handleMessage('active-user', 'Maharashtra', reply);
    expect(reply).toHaveBeenCalledTimes(1);
  });

  test('user with active session progresses through state → district → crop → price flow', async () => {
    const reply = jest.fn().mockResolvedValue(undefined);

    // Step 1: activate
    await handleMessage('active-user', 'Hi Mandi Bot', reply);
    expect(reply).toHaveBeenCalledTimes(1);

    // Step 2: select state
    reply.mockClear();
    await handleMessage('active-user', 'Maharashtra', reply);
    expect(reply).toHaveBeenCalledTimes(1);
    expect(reply.mock.calls[0][0]).toMatch(/district/i);

    // Step 3: select district
    reply.mockClear();
    await handleMessage('active-user', 'Pune', reply);
    expect(reply).toHaveBeenCalledTimes(1);
    expect(reply.mock.calls[0][0]).toMatch(/crop/i);

    // Step 4: select crop → price info returned
    reply.mockClear();
    await handleMessage('active-user', 'Wheat', reply);
    expect(reply).toHaveBeenCalledTimes(1);
    expect(reply.mock.calls[0][0]).toMatch(/Mandi Price Info/i);
  });

  test('session is deleted after price information is delivered', async () => {
    const reply = jest.fn().mockResolvedValue(undefined);

    await handleMessage('active-user', 'Hi Mandi Bot', reply);
    await handleMessage('active-user', 'Maharashtra', reply);
    await handleMessage('active-user', 'Pune', reply);
    await handleMessage('active-user', 'Wheat', reply);

    // Session should be gone; a new non-trigger message should be ignored.
    reply.mockClear();
    await handleMessage('active-user', 'Hello again', reply);
    expect(reply).not.toHaveBeenCalled();
  });
});
