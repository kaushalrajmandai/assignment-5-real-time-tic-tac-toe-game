const mongoose = require('mongoose');

const gameHistorySchema = new mongoose.Schema({
  playerX: { type: String, required: true },
  playerO: { type: String, required: true },
  winner: { type: String, required: true }, // 'X', 'O', or 'draw'
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GameHistory', gameHistorySchema);