const { model, Schema } = require('mongoose');

const invitedBySchema = new Schema({
    Guild: { type: String, required: true },
    User: { type: String, required: true },
    inviteUser: { type: String, required: true },
});

module.exports = model('InvitedBy', invitedBySchema);
