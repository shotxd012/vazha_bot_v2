const { Schema, model } = require('mongoose');

const welcomeSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    welcomeChannel: {
        type: String,
        default: null,
    },
    welcomeEnabled: {
        type: Boolean,
        default: false,
    },
    useEmbed: {
        type: Boolean,
        default: true,
    },
    mentionUser: {
        type: Boolean,
        default: true,
    },
    joinRoleEnabled: {
        type: Boolean,
        default: false,
    },
    joinRoleId: {
        type: String,
        default: null,
    },
    embedSettings: {
        thumbnailType: {
            type: String,
            enum: ['user', 'custom', null],
            default: 'user',
        },
        customThumbnailUrl: String,
        embedImageUrl: String,
        embedFields: [
            {
                name: String,
                value: String,
                inline: Boolean,
            },
        ],
        footerText: String,
    },
    textImageLink: String,
    advanced: {
        delaySeconds: Number,
        channelFallback: Boolean,
        welcomeDm: Boolean,
    },
});

module.exports = model('WelcomeSettings', welcomeSchema);
