const mongoose = require('mongoose');

function generateCardId() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += letters[Math.floor(Math.random() * 26)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${code}-${num}`;
}

const cardSchema = new mongoose.Schema({
  cardId:      { type: String },
  name:        { type: String, required: [true, 'El nombre es requerido'] },
  cedula:      { type: String, required: [true, 'La cédula es requerida'] },
  description: { type: String, default: '' },
  logo:        { type: String, default: '' },
  issueDate:   { type: Date, default: Date.now },
  expiryDate:  { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Card', cardSchema);
module.exports.generateCardId = generateCardId;