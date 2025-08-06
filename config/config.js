require('dotenv').config();

module.exports = {
    // Discord Bot Configuration
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    
    // Bot Settings
    prefix: '!',
    defaultCooldown: 3,
    
    // Owner Configuration
    ownerIds: process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',') : [],
    
    // Debug Mode
    debug: process.env.DEBUG_MODE === 'true',
    
    // MongoDB Configuration
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/vazha_bot',
    
    // Bot Status Configuration
    status: {
        text: 'Under Construction',
        type: 'PLAYING'
    },
    
    // Embed Colors
    colors: {
        primary: 0x2f3136,    // Discord dark transparent
        secondary: 0x57f287,   // Light green
        success: 0x57f287,     // Green
        error: 0xed4245,       // Red
        warning: 0xfaa61a,     // Orange
        info: 0x5865f2         // Blue
    },
    
    // Command Categories
    categories: {
        utility: '🔧 Utility',
        moderation: '🛡️ Moderation',
        fun: '🎮 Fun',
        admin: '⚙️ Admin'
    },

    // Webhooks
    webhooks: {
        dmLogs: {
            id: process.env.DM_LOGS_ID,
            token: process.env.DM_LOGS_TOKEN,
        }
    },

    // OpenAI API Key
    openaiKey: process.env.OPENAI_API_KEY,
}; 