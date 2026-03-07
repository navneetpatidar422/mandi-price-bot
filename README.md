# सही Mandi - WhatsApp Mandi Price Bot 🌾

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