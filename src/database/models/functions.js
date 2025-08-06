const { model, Schema } = require('mongoose');

const functionsSchema = new Schema({
    Guild: { type: String, required: true, unique: true },
    Levels: { type: Boolean, default: false },
    Chatbot: { type: Boolean, default: false },
    Starboard: { type: Boolean, default: false },
});

module.exports = model('Functions', functionsSchema);
