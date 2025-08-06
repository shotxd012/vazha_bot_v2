const { model, Schema } = require('mongoose');

const messageRewardSchema = new Schema({
    Guild: { type: String, required: true },
    Messages: { type: Number, required: true },
    Role: { type: String, required: true },
});

module.exports = model('MessageReward', messageRewardSchema);
