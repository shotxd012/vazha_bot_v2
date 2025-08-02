const { model, Schema } = require('mongoose');

const guildSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    welcome: {
        channelId: {
            type: String,
            default: null,
        },
        roleId: {
            type: String,
            default: null,
        },
        enabled: {
            type: Boolean,
            default: false,
        },
        message: {
            type: String,
            default: 'Welcome {user} to {server}!',
        },
        background: {
            type: String,
            default: 'https://i.imgur.com/P9Fnt9y.jpeg',
        },
        embed: {
            type: Boolean,
            default: false,
        },
        mention: {
            type: Boolean,
            default: true,
        },
        color: {
            type: String,
            default: '#FFFFFF',
        }
    },
});

module.exports = model('Guild', guildSchema);