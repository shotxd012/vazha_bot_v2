const { model, Schema } = require('mongoose');

const levelChannelSchema = new Schema({
    Guild: { type: String, required: true, unique: true },
    Channel: { type: String, required: true },
});

module.exports = model('LevelChannel', levelChannelSchema);
