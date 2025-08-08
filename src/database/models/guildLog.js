const mongoose = require('mongoose');

const guildLogSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        index: true
    },
    event: {
        type: String,
        required: true,
    },
    executorId: {
        type: String,
        index: true
    },
    targetId: {
        type: String,
        index: true
    },
    changes: {
        type: Object
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('GuildLog', guildLogSchema);
