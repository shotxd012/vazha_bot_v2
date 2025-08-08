const { model, Schema } = require('mongoose');

const levelRewardSchema = new Schema({
    Guild: { type: String, required: true },
    Level: { type: Number, required: true },
    Role: { type: String, required: true },
});

module.exports = model('LevelReward', levelRewardSchema);
