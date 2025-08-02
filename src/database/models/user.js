const mongoose = require('mongoose');

/**
 * User Schema for storing user data
 */
const userSchema = new mongoose.Schema({
    // Discord user information
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    discordId: {
        type: String,
        required: true,
        unique: true,
        index: true
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
    
    // User statistics
    stats: {
        commandsUsed: {
            type: Number,
            default: 0
        },
        messagesSent: {
            type: Number,
            default: 0
        },
        level: {
            type: Number,
            default: 1
        },
        experience: {
            type: Number,
            default: 0
        },
        // Usage tracking
        usage: {
            today: {
                type: Number,
                default: 0
            },
            monthly: {
                type: Number,
                default: 0
            },
            total: {
                type: Number,
                default: 0
            },
            lastUsed: {
                type: Date,
                default: Date.now
            }
        }
    },
    
    // Moderation data
    moderation: {
        warnings: [{
            reason: String,
            moderator: String,
            timestamp: {
                type: Date,
                default: Date.now
            }
        }],
        mutes: [{
            reason: String,
            moderator: String,
            duration: Number,
            timestamp: {
                type: Date,
                default: Date.now
            }
        }],
        bans: [{
            reason: String,
            moderator: String,
            timestamp: {
                type: Date,
                default: Date.now
            }
        }]
    },
    
    // Custom user data
    customData: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map()
    }
}, {
    timestamps: true
});

// Indexes for better query performance
userSchema.index({ userId: 1 });
userSchema.index({ 'stats.level': -1 });
userSchema.index({ 'stats.experience': -1 });
userSchema.index({ joinDate: -1 });

/**
 * Update last seen timestamp
 */
userSchema.methods.updateLastSeen = function() {
    this.lastSeen = new Date();
    return this.save();
};

    /**
     * Increment command usage with detailed tracking
     */
    userSchema.methods.incrementCommandUsage = function() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Reset daily usage if it's a new day
        if (this.stats.usage.lastUsed < today) {
            this.stats.usage.today = 0;
        }
        
        // Reset monthly usage if it's a new month
        if (this.stats.usage.lastUsed < monthStart) {
            this.stats.usage.monthly = 0;
        }
        
        // Increment all usage counters
        this.stats.commandsUsed += 1;
        this.stats.usage.today += 1;
        this.stats.usage.monthly += 1;
        this.stats.usage.total += 1;
        this.stats.usage.lastUsed = now;
        
        return this.save();
    };

/**
 * Add experience points
 * @param {number} amount - Amount of experience to add
 */
userSchema.methods.addExperience = function(amount) {
    this.stats.experience += amount;
    
    // Simple level calculation (can be made more complex)
    const newLevel = Math.floor(this.stats.experience / 100) + 1;
    if (newLevel > this.stats.level) {
        this.stats.level = newLevel;
    }
    
    return this.save();
};

/**
 * Add warning to user
 * @param {string} reason - Warning reason
 * @param {string} moderator - Moderator ID
 */
userSchema.methods.addWarning = function(reason, moderator) {
    this.moderation.warnings.push({
        reason,
        moderator,
        timestamp: new Date()
    });
    return this.save();
};

/**
 * Get user's full display name
 */
userSchema.virtual('displayName').get(function() {
    return this.discriminator === '0' ? this.username : `${this.username}#${this.discriminator}`;
});

/**
 * Get user's avatar URL
 */
userSchema.virtual('avatarURL').get(function() {
    if (!this.avatar) {
        return `https://cdn.discordapp.com/embed/avatars/${this.discriminator % 5}.png`;
    }
    return `https://cdn.discordapp.com/avatars/${this.userId}/${this.avatar}.png`;
});

// Ensure virtuals are included in JSON output
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema); 