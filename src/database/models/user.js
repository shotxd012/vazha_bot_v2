const mongoose = require('mongoose');

/**
 * User Schema for storing user data
 */
const userSchema = new mongoose.Schema({
    // Discord user information
    userId: {
        type: String,
        required: true,
        unique: true
    },
    discordId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    discriminator: {
        type: String,
        default: '0'
    },
    avatar: {
        type: String,
        default: null
    },
    
    // User statistics
    joinDate: {
        type: Date,
        default: Date.now
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    
    // User preferences
    preferences: {
        language: {
            type: String,
            default: 'en'
        },
        timezone: {
            type: String,
            default: 'UTC'
        },
        notifications: {
            type: Boolean,
            default: true
        }
    },
    
    // Command usage statistics
    commandStats: {
        totalCommands: {
            type: Number,
            default: 0
        },
        commandsUsed: {
            type: Map,
            of: Number,
            default: {}
        }
    }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

// Ensure indexes are created
userSchema.index({ discordId: 1 });

module.exports = mongoose.model('User', userSchema);