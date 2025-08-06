const { model, Schema } = require('mongoose');

const inviteSchema = new Schema({
    Guild: { type: String, required: true },
    User: { type: String, required: true },
    Invites: { type: Number, default: 0 },
    Total: { type: Number, default: 0 },
    Left: { type: Number, default: 0 },
});

module.exports = model('Invites', inviteSchema);
