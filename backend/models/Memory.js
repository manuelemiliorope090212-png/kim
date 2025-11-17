const mongoose = require('mongoose');

const MemorySchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['drawing', 'letter', 'photo', 'note'] },
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Memory || mongoose.model('Memory', MemorySchema);