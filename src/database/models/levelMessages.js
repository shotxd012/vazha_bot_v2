const { model, Schema } = require('mongoose');

const levelMessageSchema = new Schema({
    Guild: { type: String, required: true, unique: true },
    Message: { type: String, default: 'GG {user:mention}, you are now level {user:level}!' },
});

module.exports = model('LevelMessage', levelMessageSchema);
