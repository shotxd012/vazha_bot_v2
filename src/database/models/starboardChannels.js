const { model, Schema } = require('mongoose');

const starboardChannelSchema = new Schema({
    Guild: { type: String, required: true, unique: true },
    Channel: { type: String, required: true },
});

module.exports = model('StarboardChannel', starboardChannelSchema);
