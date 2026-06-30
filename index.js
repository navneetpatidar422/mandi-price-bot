/**
 * index.js - Main entry point for सही Mandi WhatsApp Bot
 * Developed by Navneet Patidar
 */
require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');
const { handleMessage } = require('./src/messageHandler');
const config = require('./src/config');

let latestQR = null; // stores the latest QR string

// --- Simple web server to view QR code in browser ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  if (!latestQR) {
    return res.send('<h2>No QR code yet. Bot might already be connected, or still starting up. Refresh in a few seconds.</h2>');
  }
  QRCode.toDataURL(latestQR, (err, url) => {
    if (err) return res.send('Error generating QR image');
    res.send(`
      <html>
        <body style="text-align:center; font-family:sans-serif;">
          <h2>📱 Scan this QR with WhatsApp</h2>
          <img src="${url}" style="width:300px;height:300px;" />
          <p>WhatsApp → Settings → Linked Devices → Link a Device</p>
        </body>
      </html>
    `);
  });
});

app.listen(PORT, () => {
  console.log(`🌐 QR web viewer running on port ${PORT}`);
});

// --- WhatsApp client setup ---
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

client.on('qr', (qr) => {
  latestQR = qr;
  console.log('\n========================================');
  console.log('📱 QR code ready! Open your Render URL in a browser to scan it:');
  console.log(`   https://mandi-price-bot-docker.onrender.com`);
  console.log('========================================\n');
  qrcodeTerminal.generate(qr, { small: true }); // still shown as backup
});

client.on('loading_screen', (percent, message) => {
  console.log(`⏳ Loading: ${percent}% - ${message}`);
});

client.on('authenticated', () => {
  latestQR = null;
  console.log('✅ WhatsApp Authentication successful!');
  console.log('🔐 Session saved - next time QR scan ki zaroorat nahi hogi\n');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Authentication failed:', msg);
  console.log('💡 Please delete .wwebjs_auth folder and try again');
  process.exit(1);
});

client.on('ready', () => {
  console.log('\n========================================');
  console.log(`🌾 ${config.BOT_NAME} Bot is LIVE! 🚀`);
  console.log(`👨‍💻 Developed by ${config.DEVELOPER_NAME}`);
  console.log('========================================');
  console.log('✅ Bot is ready to receive messages!');
});

client.on('message', async (message) => {
  try {
    if (message.isStatus || message.broadcast) return;
    if (message.type !== 'chat') return;
    await handleMessage(client, message);
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

client.on('disconnected', (reason) => {
  console.log('⚠️  Bot disconnected:', reason);
  console.log('🔄 Reconnecting...');
  client.initialize();
});

process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down सही Mandi bot...');
  await client.destroy();
  process.exit(0);
});

console.log('\n========================================');
console.log(`🌾 Starting ${config.BOT_NAME} Bot...`);
console.log(`👨‍💻 Developed by ${config.DEVELOPER_NAME}`);
console.log('========================================\n');
client.initialize();
