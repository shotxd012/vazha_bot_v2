const { model, Schema } = require('mongoose');

const chatbotChannelSchema = new Schema({
    Guild: { type: String, required: true, unique: true },
    Channel: { type: String, required: true },
});

module.exports = model('ChatbotChannel', chatbotChannelSchema);
