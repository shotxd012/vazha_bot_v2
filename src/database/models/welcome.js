const { Schema, model } = require('mongoose');

const welcomeSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    enabled: {
        type: Boolean,
        default: false,
    },
    channelId: {
        type: String,
        default: null,
    },
    welcomeType: {
        type: String,
        enum: ['embed', 'text'],
        default: 'embed',
    },
    message: {
        type: String,
        default: 'Welcome {user} to {server}!',
    },
    imageUrl: {
        type: String,
        default: null,
    },
    roleEnabled: {
        type: Boolean,
        default: false,
    },
    roleId: {
        type: String,
        default: null,
    },
    embed: {
        title: {
            type: String,
            default: 'Welcome!',
        },
        description: {
            type: String,
            default: 'Welcome {user} to {server}! We are happy to have you here.',
        },
        color: {
            type: String,
            default: '#00ff00',
        },
        thumbnail: {
            type: Boolean,
            default: true,
        },
        image: {
            type: String,
            default: null,
        },
        footer: {
            text: {
                type: String,
                default: 'Vazha Bot',
            },
            iconURL: {
                type: String,
                default: null,
            },
        },
        fields: [
            {
                name: String,
                value: String,
                inline: Boolean,
            },
        ],
    },
});

module.exports = model('Welcome', welcomeSchema);