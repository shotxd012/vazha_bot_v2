const { model, Schema } = require('mongoose');

const afkSchema = new Schema({
    Guild: { type: String, required: true },
    User: { type: String, required: true },
    Message: { type: String, required: true },
    Timestamp: { type: Date, default: Date.now },
});

module.exports = model('AFK', afkSchema);
