const { model, Schema } = require('mongoose');

const boostMessageSchema = new Schema({
    Guild: {
        type: String,
        required: true,
        unique: true,
    },
    boostMessage: {
        type: String,
        default: '{user:mention} has boosted the server!',
    },
    unboostMessage: {
        type: String,
        default: '{user:mention} has unboosted the server.',
    },
});

module.exports = model('BoostMessage', boostMessageSchema);
