const { model, Schema } = require('mongoose');

const messagesSchema = new Schema({
    Guild: { type: String, required: true },
    User: { type: String, required: true },
    Messages: { type: Number, default: 0 },
});

module.exports = model('Messages', messagesSchema);
