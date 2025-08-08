const { model, Schema } = require('mongoose');

const inviteRewardSchema = new Schema({
    Guild: { type: String, required: true },
    Invites: { type: Number, required: true },
    Role: { type: String, required: true },
});

module.exports = model('InviteReward', inviteRewardSchema);
