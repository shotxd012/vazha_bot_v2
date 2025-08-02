const mongoose = require('mongoose');

const moderationLogSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    moderatorId: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['Ban', 'Kick', 'Mute', 'Warn', 'Unban', 'Unmute']
    },
    reason: {
        type: String,
        default: 'No reason provided'
    },
    duration: {
        type: Date,
        default: null // For timed punishments like mutes/bans
    },
    caseId: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

// Auto-increment caseId for each guild
moderationLogSchema.pre('save', async function(next) {
    if (this.isNew) {
        const lastCase = await this.constructor.findOne({ guildId: this.guildId }).sort({ createdAt: -1 });
        if (lastCase) {
            this.caseId = lastCase.caseId + 1;
        }
    }
    next();
});

module.exports = mongoose.model('ModerationLog', moderationLogSchema);