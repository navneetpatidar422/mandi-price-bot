# सही Mandi - WhatsApp Mandi Price Bot 🌾

 copilot/fix-bot-activation-logic
A WhatsApp bot that fetches the latest mandi (agricultural market) prices for crops across India.

## 🚀 Getting Started

To activate the bot, send the following message on WhatsApp:

> **Hi Mandi Bot**

The bot will only respond to this exact phrase (case-insensitive, extra spaces are ignored). Any other message sent before the activation phrase will be silently ignored.

### Activation Examples

| Message | Result |
|---|---|
| `Hi Mandi Bot` | ✅ Activates bot |
| `hi mandi bot` | ✅ Activates bot |
| `HI MANDI BOT` | ✅ Activates bot |
| `   Hi Mandi Bot  ` | ✅ Activates bot |
| `Hi` | ❌ Ignored |
| `mandi bot hi` | ❌ Ignored |
| `Hi Mandi Bot, please...` | ❌ Ignored |

## 📋 Bot Flow

Once activated, the bot guides you through:

1. **State** – Enter the name of your state.
2. **District** – Enter the name of your district.
3. **Crop** – Enter the name of the crop you want to check.
4. **Price** – The bot returns the latest mandi price information.

## 🛠 Setup

```bash
npm install
npm test
```

## 📜 License

MIT

> **Developed by Navneet Patidar**
>
> A free WhatsApp bot for Indian farmers to check real-time mandi (agricultural market) prices from [Agmarknet](https://agmarknet.gov.in).

---

## 🌟 Features

- 🤖 **Interactive WhatsApp Bot** — Talk to it just like chatting with a friend
- 🗺️ **All Major States** — MP, Rajasthan, Maharashtra, UP, Gujarat, Punjab, Haryana, and more
- 💰 **Real-time Prices** — Min, Max, and Modal prices for every commodity
- 🧅 **All Commodities** — Wheat, Soybean, Onion, Potato, Cotton, Mustard, and 28+ more crops
- 🇮🇳 **Hinglish + Hindi Support** — Type in Hinglish or Devanagari, bot understands both
- 🤖 **AI-powered** — Google Gemini AI understands natural language queries
- ⚡ **Smart Caching** — Prices cached for 30 minutes to be fast and respectful to Agmarknet
- 📱 **Free to Use** — Built entirely on free tools and APIs

---

## 💬 Example Conversation

```
You:  Hi
Bot:  🙏 Namaste! Main hoon सही Mandi 🌾
      Aapka apna Mandi Price Helper bot!
      Developed by Navneet Patidar

      1️⃣ Mandi Bhav Dekhein
      2️⃣ Help / Madad

You:  1
Bot:  🗺️ Konse State ki mandi dekhni hai?
      1. Madhya Pradesh
      2. Rajasthan
      3. Maharashtra
      ...

You:  Madhya Pradesh
Bot:  📍 Madhya Pradesh ke konse district ki mandi?
      1. Indore
      2. Bhopal
      3. Ujjain
      ...

You:  Indore
Bot:  🏪 Indore District ki konsi mandi?
      1. Indore
      ...

You:  1
Bot:  🌾 Indore mandi mein aaj ke bhav dekhne hain!
      1️⃣ Specific crop ka bhav
      2️⃣ Sabhi crops ke bhav

You:  Soybean
Bot:  🌱 Soybean - Indore Mandi
      📅 Date: 07-03-2026

      💰 Min Price: ₹4,200/quintal
      💰 Max Price: ₹4,600/quintal
      💰 Modal Price: ₹4,400/quintal

      1️⃣ Isi mandi mein aur crop dekhein
      2️⃣ Doosri mandi dekhein
      3️⃣ Main menu
```

---

## 🛠️ Setup Guide (Step by Step for Beginners)

> **Don't worry if you've never coded before!** Follow these steps carefully and you'll have the bot running in 30 minutes.

### Step 1: Install Node.js

Node.js is the software that runs this bot.

1. Go to **https://nodejs.org**
2. Download the **LTS (Recommended)** version
3. Install it (just keep clicking "Next")
4. To verify, open **Command Prompt** (Windows) or **Terminal** (Mac/Linux) and type:
   ```
   node --version
   ```
   You should see something like `v18.20.0`

---

### Step 2: Download This Bot

**Option A: Using Git (Recommended)**
```bash
git clone https://github.com/navneetpatidar422/mandi-price-bot.git
cd mandi-price-bot
```

**Option B: Download ZIP**
1. Click the green "Code" button on this page
2. Click "Download ZIP"
3. Extract the ZIP file
4. Open Command Prompt/Terminal in that folder

---

### Step 3: Install Dependencies

In the bot folder, run:
```bash
npm install
```

This downloads all required packages. Wait for it to finish (may take 2-5 minutes).

---

### Step 4: Get Google Gemini API Key (FREE)

1. Go to **https://aistudio.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (looks like: `AIzaSy...`)

> 💡 The free tier gives you 60 requests per minute — more than enough!

---

### Step 5: Create Environment File

1. In the bot folder, find the file called `.env.example`
2. Copy it and rename the copy to `.env`
3. Open `.env` in any text editor (Notepad on Windows)
4. Replace `your_gemini_api_key_here` with your actual Gemini API key:

```
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXX
BOT_NAME=सही Mandi
DEVELOPER_NAME=Navneet Patidar
```

5. Save the file

> ⚠️ **IMPORTANT**: Never share your `.env` file! It contains your secret API key.

---

### Step 6: Run the Bot

```bash
npm start
```

You should see:
```
========================================
🌾 Starting सही Mandi Bot...
========================================

⏳ WhatsApp se connect ho raha hai, please wait...
```

Then a **QR code** will appear in the terminal!

---

### Step 7: Scan QR Code with WhatsApp

1. Open **WhatsApp** on your phone
2. Go to **Settings** → **Linked Devices** → **Link a Device**
3. Scan the QR code shown in your terminal
4. Wait a few seconds...

You'll see:
```
✅ WhatsApp Authentication successful!
🌾 सही Mandi Bot is LIVE! 🚀
✅ Bot is ready to receive messages!
```

**Your bot is now live!** Send "Hi" to your own WhatsApp number to test it.

---

## 🚀 Free 24/7 Hosting (Render.com)

To keep the bot running without keeping your computer on:

### Deploy on Render (Free)

1. Create account at **https://render.com**
2. Connect your GitHub account
3. Click **"New" → "Web Service"**
4. Select your `mandi-price-bot` repository
5. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add Environment Variables:
   - `GEMINI_API_KEY` = your API key
7. Click **"Deploy"**

> Note: On Render's free tier, the service sleeps after 15 minutes of inactivity. For a WhatsApp bot this is usually fine since incoming messages wake it up.

---

## 🔧 Troubleshooting

### "QR code expired"
- Stop the bot (Ctrl+C)
- Delete the `.wwebjs_auth` folder
- Run `npm start` again

### "Module not found" error
```bash
npm install
```

### "Gemini API error"
- Check your `GEMINI_API_KEY` in `.env`
- Make sure it doesn't have extra spaces
- Try getting a new key from Google AI Studio

### Bot stops responding
- Check if your internet is connected
- Restart the bot: `npm start`
- Check the terminal for error messages

### WhatsApp keeps disconnecting
- Make sure your phone is connected to the internet
- This sometimes happens with free hosting — restart the service

---

## 📱 Share Bot With Farmers

Once your bot is running on your WhatsApp number, share it with farmers:

```
किसान भाइयों! 
अब WhatsApp पर मिलेगा मंडी भाव!
बस इस नंबर पर "Hi" भेजें:
wa.me/91XXXXXXXXXX
(सही Mandi Bot - Free)
```

Replace `XXXXXXXXXX` with your WhatsApp number.

---

## 📂 Project Structure

```
mandi-price-bot/
├── index.js              # Main entry point
├── package.json          # Dependencies
├── .env.example          # Example config (copy to .env)
├── .gitignore
├── src/
│   ├── config.js         # Bot configuration
│   ├── agmarknet.js      # Agmarknet data fetching
│   ├── gemini.js         # Google Gemini AI
│   ├── messageHandler.js # Conversation logic
│   ├── sessionManager.js # User state tracking
│   ├── utils.js          # Helper functions
│   └── data/
│       ├── states.json   # Indian states & districts
│       └── commodities.json # Crop names (Hindi/English)
├── README.md
└── SETUP_HINDI.md        # Setup guide in Hindi
```

---

## 🙏 Credits

- **Developer**: Navneet Patidar
- **Data Source**: [Agmarknet](https://agmarknet.gov.in) (Government of India)
- **WhatsApp**: [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- **AI**: [Google Gemini](https://ai.google.dev)

---

## ⚠️ Disclaimer

This bot is for informational purposes only. Prices are fetched from Agmarknet and may have delays. Always verify prices before making trading decisions.

---

*For Hindi setup guide, see [SETUP_HINDI.md](./SETUP_HINDI.md)* main
