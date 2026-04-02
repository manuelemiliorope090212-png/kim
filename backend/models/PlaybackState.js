const mongoose = require('mongoose');

const PlaybackStateSchema = new mongoose.Schema({
  currentSongId: { type: mongoose.Schema.Types.ObjectId, ref: 'Music', required: true },
  seekTime: { type: Number, default: 0 }, // Seconds
  isPlaying: { type: Boolean, default: false },
  queue: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Music' }],
  originalSongId: { type: mongoose.Schema.Types.ObjectId, ref: 'Music' },
  serverTimestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.models.PlaybackState || mongoose.model('PlaybackState', PlaybackStateSchema);
