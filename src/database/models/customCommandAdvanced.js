const { model, Schema } = require('mongoose');

const customCommandAdvancedSchema = new Schema({
    Guild: { type: String, required: true },
    Name: { type: String, required: true },
    Responce: { type: String, required: true },
    Action: { type: String, enum: ['Normal', 'Embed', 'DM'], required: true },
});

module.exports = model('CustomCommandAdvanced', customCommandAdvancedSchema);
