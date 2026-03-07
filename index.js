/**
 * index.js - Main entry point for सही Mandi WhatsApp Bot
 * Developed by Navneet Patidar
 *
 * This file sets up the WhatsApp client, handles QR code display,
 * and connects all the bot components together.
 */

require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./src/messageHandler');
const config = require('./src/config');

// Initialize WhatsApp client with local authentication
// LocalAuth saves the session so you don't need to scan QR code every time
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'sahi-mandi-bot',
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  },
});

// Display QR code in terminal for scanning
client.on('qr', (qr) => {
  console.log('\n========================================');
  console.log('📱 Scan this QR code with WhatsApp:');
  console.log('========================================\n');
  qrcode.generate(qr, { small: true });
  console.log('\nWhatsApp mein jao → Settings → Linked Devices → Link a Device');
  console.log('Phir is QR code ko scan karein\n');
});

// Bot is loading / authenticating
client.on('loading_screen', (percent, message) => {
  console.log(`⏳ Loading: ${percent}% - ${message}`);
});

// Authentication successful
client.on('authenticated', () => {
  console.log('✅ WhatsApp Authentication successful!');
  console.log('🔐 Session saved - next time QR scan ki zaroorat nahi hogi\n');
});

// Authentication failed
client.on('auth_failure', (msg) => {
  console.error('❌ Authentication failed:', msg);
  console.log('💡 Please delete .wwebjs_auth folder and try again');
  process.exit(1);
});

// Bot is ready and connected
client.on('ready', () => {
  console.log('\n========================================');
  console.log(`🌾 ${config.BOT_NAME} Bot is LIVE! 🚀`);
  console.log(`👨‍💻 Developed by ${config.DEVELOPER_NAME}`);
  console.log('========================================');
  console.log('✅ Bot is ready to receive messages!');
  console.log('📱 Ab farmers aapke WhatsApp number pe message kar sakte hain\n');
});

// Handle incoming messages
client.on('message', async (message) => {
  try {
    // Ignore messages from status updates and broadcasts
    if (message.isStatus || message.broadcast) return;

    // Only handle text messages
    if (message.type !== 'chat') return;

    await handleMessage(client, message);
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

// Handle disconnection
client.on('disconnected', (reason) => {
  console.log('⚠️  Bot disconnected:', reason);
  console.log('🔄 Reconnecting...');
  client.initialize();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down सही Mandi bot...');
  await client.destroy();
  process.exit(0);
});

// Start the bot
console.log('\n========================================');
console.log(`🌾 Starting ${config.BOT_NAME} Bot...`);
console.log(`👨‍💻 Developed by ${config.DEVELOPER_NAME}`);
console.log('========================================\n');
console.log('⏳ WhatsApp se connect ho raha hai, please wait...\n');

client.initialize();
