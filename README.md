# Vazha Bot 🤖

A fully modular, production-ready Discord bot built with Discord.js v14 and CommonJS. Designed to run in any Discord server like a global public bot.

## ✨ Features

- **🔄 Modular Architecture**: Highly organized and scalable structure
- **⚡ Slash Commands**: Auto-loading slash commands from nested folders
- **📊 MongoDB Integration**: User data storage with Mongoose
- **🎨 Beautiful Embeds**: Consistent styling with custom embed builder
- **🛡️ Permission System**: Built-in permission and cooldown management
- **📝 Comprehensive Logging**: Custom logger with multiple levels
- **🔧 Error Handling**: Robust error handling and recovery
- **🌐 Public Bot Ready**: Designed for use in any Discord server

## 🚀 Quick Start

### Prerequisites

- Node.js 16.9.0 or higher
- MongoDB database
- Discord Bot Token

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vazha-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Discord Bot Configuration
   DISCORD_TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_client_id_here

   # MongoDB Configuration
   MONGO_URI=mongodb://localhost:27017/vazha_bot

   # Bot Configuration
   OWNER_IDS=123456789,987654321
   DEBUG_MODE=false
   ```

4. **Deploy slash commands**
   ```bash
   npm run deploy
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
new_vazha/
│
├── config/
│   ├── config.js              # Bot configuration
│   └── embed.js               # Embed styling
│
├── src/
│   ├── commands/
│   │   ├── utility/
│   │   │   └── ping.js
│   │   └── moderation/
│   │       └── ban.js
│   │
│   ├── events/
│   │   ├── client/
│   │   │   └── ready.js
│   │   ├── guild/
│   │   │   ├── guildCreate.js
│   │   │   └── guildDelete.js
│   │   └── interaction/
│   │       └── interactionCreate.js
│   │
│   ├── database/
│   │   ├── connect.js
│   │   └── models/
│   │       └── user.js
│   │
│   ├── handlers/
│   │   ├── commandHandler.js
│   │   ├── eventHandler.js
│   │   └── interactionHandler.js
│   │
│   ├── utils/
│   │   ├── embedBuilder.js
│   │   ├── logger.js
│   │   └── errorHandler.js
│   │
│   └── main.js                # Entry point
│
├── .env                       # Environment variables
├── .gitignore
├── package.json
├── deploy-commands.js
└── README.md
```

## 🛠️ Commands

### Utility Commands

- **`/ping`** - Shows bot latency and response time
  - Displays WebSocket and API latency
  - Includes status indicators
  - Interactive test button

### Moderation Commands

- **`/ban`** - Ban a user from the server
  - Permission checks for bot and user
  - Configurable message deletion
  - Database logging of actions
  - Comprehensive error handling

## 🔧 Configuration

### Bot Configuration (`config/config.js`)

```javascript
module.exports = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    prefix: '!',
    defaultCooldown: 3,
    ownerIds: process.env.OWNER_IDS.split(','),
    debug: process.env.DEBUG_MODE === 'true',
    mongoUri: process.env.MONGO_URI,
    // ... more configuration
};
```

### Embed Colors

- **Primary**: Discord dark transparent (`0x2f3136`)
- **Secondary**: Light green (`0x57f287`)
- **Success**: Green (`0x57f287`)
- **Error**: Red (`0xed4245`)
- **Warning**: Orange (`0xfaa61a`)
- **Info**: Blue (`0x5865f2`)

## 📊 Database Models

### User Model

Stores comprehensive user data including:
- Discord user information
- Command usage statistics
- Moderation history
- User preferences
- Experience and leveling system

## 🚀 Deployment

### Local Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Deploy commands
npm run deploy
```

### Production Deployment

```bash
# Install dependencies
npm install --production

# Start the bot
npm start
```

## 🔍 Logging

The bot includes a comprehensive logging system with multiple levels:

- **INFO**: General information
- **SUCCESS**: Successful operations
- **WARN**: Warnings and non-critical issues
- **ERROR**: Error messages
- **DEBUG**: Debug information (only in debug mode)

## 🛡️ Error Handling

- **Unhandled Promise Rejections**: Caught and logged
- **Uncaught Exceptions**: Handled gracefully
- **Command Errors**: User-friendly error messages
- **Database Errors**: Proper error logging
- **Discord API Errors**: Comprehensive error handling

## 🔧 Adding New Commands

1. Create a new file in `src/commands/[category]/[command].js`
2. Follow the command structure:

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('commandname')
        .setDescription('Command description'),
    
    cooldown: 5, // Optional
    permissions: ['PermissionName'], // Optional
    
    async execute(interaction) {
        // Command logic here
    }
};
```

## 🔧 Adding New Events

1. Create a new file in `src/events/[category]/[event].js`
2. Follow the event structure:

```javascript
module.exports = {
    name: 'eventName',
    once: false, // Optional, default false
    
    async execute(...args) {
        // Event logic here
    }
};
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DISCORD_TOKEN` | Discord bot token | Yes |
| `CLIENT_ID` | Discord application client ID | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `OWNER_IDS` | Comma-separated list of owner IDs | No |
| `DEBUG_MODE` | Enable debug logging | No |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you need help or have questions:

1. Check the documentation
2. Look at existing issues
3. Create a new issue with detailed information

## 🎯 Roadmap

- [ ] More moderation commands (kick, timeout, warn)
- [ ] Welcome system
- [ ] Auto-moderation features
- [ ] Music commands
- [ ] Economy system
- [ ] Leveling system
- [ ] Custom prefix support
- [ ] Web dashboard

---

**Vazha Bot** - A powerful, modular Discord bot for the modern era! 🚀 