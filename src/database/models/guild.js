const { model, Schema } = require('mongoose');

const guildSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    logChannelId: {
        type: String,
        default: null,
    },
});

module.exports = model('Guild', guildSchema);