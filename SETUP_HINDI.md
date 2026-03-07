# सही Mandi - WhatsApp मंडी प्राइस बोट 🌾

> **Navneet Patidar द्वारा निर्मित**
>
> किसान भाइयों के लिए एक मुफ्त WhatsApp बोट जो [Agmarknet](https://agmarknet.gov.in) से real-time मंडी भाव बताता है।

---

## 🛠️ Setup Guide (हिंदी में)

> **घबराइए मत!** अगर आपने कभी कोडिंग नहीं की, तो भी यह गाइड आपकी मदद करेगी।

---

### Step 1: Node.js इनस्टॉल करें

Node.js वो software है जो इस बोट को चलाता है।

1. **https://nodejs.org** पर जाएँ
2. **LTS (Recommended)** वाला version download करें
3. Install करें (बस "Next" क्लिक करते रहें)
4. Check करने के लिए **Command Prompt** खोलें और टाइप करें:
   ```
   node --version
   ```
   आपको कुछ ऐसा दिखेगा: `v18.20.0`

---

### Step 2: Bot Download करें

**Git से (Recommended):**
```bash
git clone https://github.com/navneetpatidar422/mandi-price-bot.git
cd mandi-price-bot
```

**या ZIP से:**
1. GitHub page पर जाकर हरे "Code" button पर click करें
2. "Download ZIP" click करें
3. ZIP extract करें
4. उस folder में Command Prompt खोलें

---

### Step 3: Dependencies Install करें

Bot folder में यह command चलाएं:
```bash
npm install
```

यह सभी जरूरी packages download करेगा। 2-5 मिनट लग सकते हैं।

---

### Step 4: Google Gemini API Key लें (मुफ्त)

1. **https://aistudio.google.com/app/apikey** पर जाएँ
2. अपने Google account से sign in करें
3. **"Create API Key"** button click करें
4. Key copy करें (कुछ ऐसी दिखेगी: `AIzaSy...`)

> 💡 Free tier में 60 requests per minute मिलती हैं — बहुत है!

---

### Step 5: .env File बनाएं

1. Bot folder में `.env.example` file ढूंढें
2. उसकी copy बनाएं और उसका नाम `.env` रखें
3. Notepad में `.env` खोलें
4. `your_gemini_api_key_here` की जगह अपनी Gemini API key डालें:

```
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXX
BOT_NAME=सही Mandi
DEVELOPER_NAME=Navneet Patidar
```

5. File save करें

> ⚠️ **ध्यान दें**: `.env` file किसी के साथ share मत करें! इसमें आपकी secret API key है।

---

### Step 6: Bot चलाएं

```bash
npm start
```

Terminal में यह दिखेगा:
```
========================================
🌾 Starting सही Mandi Bot...
========================================

⏳ WhatsApp se connect ho raha hai, please wait...
```

फिर एक **QR code** दिखेगा!

---

### Step 7: WhatsApp से QR Code Scan करें

1. अपने phone पर **WhatsApp** खोलें
2. **Settings** → **Linked Devices** → **Link a Device** पर जाएँ
3. Terminal में दिखे QR code को scan करें
4. कुछ seconds रुकें...

यह दिखेगा:
```
✅ WhatsApp Authentication successful!
🌾 सही Mandi Bot is LIVE! 🚀
✅ Bot is ready to receive messages!
```

**आपका बोट live है!** अपने WhatsApp number पर "नमस्ते" भेजकर test करें।

---

## 🔧 समस्या और समाधान

### "QR code expire हो गया"
- Bot बंद करें (Ctrl+C)
- `.wwebjs_auth` folder delete करें
- `npm start` फिर से चलाएं

### "Module not found" error
```bash
npm install
```

### "Gemini API error"
- `.env` file में `GEMINI_API_KEY` चेक करें
- Extra spaces नहीं होनी चाहिए
- Google AI Studio से नई key बनाएं

### Bot respond नहीं कर रहा
- Internet connection चेक करें
- Bot restart करें: `npm start`
- Terminal में error messages देखें

---

## 📱 किसानों के साथ Share करें

जब आपका बोट आपके WhatsApp number पर चल जाए, किसानों को यह message भेजें:

```
किसान भाइयों! 
अब WhatsApp पर मिलेगा मंडी भाव!
बस इस नंबर पर "नमस्ते" भेजें:
wa.me/91XXXXXXXXXX
(सही Mandi Bot - बिल्कुल मुफ्त)
Developed by Navneet Patidar
```

`XXXXXXXXXX` की जगह अपना WhatsApp number डालें।

---

## 🚀 Free 24/7 Hosting (Render.com)

Bot को हमेशा चालू रखने के लिए (बिना computer on रखे):

1. **https://render.com** पर account बनाएं
2. GitHub account connect करें
3. **"New" → "Web Service"** click करें
4. `mandi-price-bot` repository select करें
5. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Environment Variables add करें:
   - `GEMINI_API_KEY` = आपकी API key
7. **"Deploy"** click करें

---

## 🙏 श्रेय (Credits)

- **Developer**: Navneet Patidar
- **Data**: [Agmarknet](https://agmarknet.gov.in) (भारत सरकार)
- **WhatsApp**: whatsapp-web.js
- **AI**: Google Gemini

---

*For English setup guide, see [README.md](./README.md)*
