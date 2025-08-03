const { model, Schema } = require('mongoose');

const guildSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
});

module.exports = model('Guild', guildSchema);