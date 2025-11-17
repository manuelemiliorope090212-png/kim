const mongoose = require('mongoose');

const ManuelNoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, required: true, enum: ['note', 'image'] },
  imageUrl: { type: String },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.ManuelNote || mongoose.model('ManuelNote', ManuelNoteSchema);