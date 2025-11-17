const mongoose = require('mongoose');

const MusicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Music || mongoose.model('Music', MusicSchema);