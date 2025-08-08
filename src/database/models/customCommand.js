const { model, Schema } = require('mongoose');

const customCommandSchema = new Schema({
    Guild: { type: String, required: true },
    Name: { type: String, required: true },
    Responce: { type: String, required: true },
});

module.exports = model('CustomCommand', customCommandSchema);
