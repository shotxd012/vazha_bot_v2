const { model, Schema } = require('mongoose');

const stickyMessageSchema = new Schema({
    Guild: { type: String, required: true },
    Channel: { type: String, required: true },
    Content: { type: String, required: true },
    LastMessage: { type: String },
});

module.exports = model('StickyMessage', stickyMessageSchema);
