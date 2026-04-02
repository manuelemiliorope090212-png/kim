const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const connectToDatabase = require('./lib/mongodb');
const { uploadToCloudinary } = require('./lib/cloudinary');
const Memory = require('./models/Memory');
const ManuelNote = require('./models/ManuelNote');
const Music = require('./models/Music');
const PlaybackState = require('./models/PlaybackState');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.get('/api/memories', async (req, res) => {
  try {
    await connectToDatabase();
    const memories = await Memory.find({}).sort({ date: -1 });
    res.status(200).json(memories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

app.post('/api/memories', upload.single('file'), async (req, res) => {
  try {
    await connectToDatabase();

    const { type, title, content, date } = req.body;

    let finalContent = content;

    if ((type === 'photo' || type === 'drawing') && req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'memories');
      finalContent = result.secure_url;
    }

    const memory = new Memory({
      type,
      title,
      content: finalContent,
      date: new Date(date),
    });

    await memory.save();

    res.status(201).json(memory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

// Manuel's Notes API
app.get('/api/manuel/notes', async (req, res) => {
  try {
    await connectToDatabase();
    const notes = await ManuelNote.find({}).sort({ date: -1 });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.post('/api/manuel/notes', upload.single('image'), async (req, res) => {
  try {
    console.log('Received note upload request');
    console.log('Body:', req.body);
    console.log('File:', req.file ? 'Present' : 'Not present');

    await connectToDatabase();

    const { title, content, type } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }

    let imageUrl = null;
    if (type === 'image' && req.file) {
      console.log('Uploading image to Cloudinary...');
      const result = await uploadToCloudinary(req.file.buffer, 'manuel-notes');
      imageUrl = result.secure_url;
      console.log('Image uploaded successfully:', imageUrl);
    }

    const note = new ManuelNote({
      title,
      content: content || '',
      type,
      imageUrl,
      date: new Date(),
    });

    await note.save();
    console.log('Note saved successfully');
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      error: 'Failed to create note',
      details: error.message
    });
  }
});

app.delete('/api/manuel/notes/:id', async (req, res) => {
  try {
    await connectToDatabase();
    await ManuelNote.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Music API
app.get('/api/manuel/music', async (req, res) => {
  try {
    await connectToDatabase();
    const musicFiles = await Music.find({}).sort({ order: 1 }); // Sort by order instead of uploadedAt
    res.status(200).json(musicFiles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch music files' });
  }
});

// Current music state API
app.get('/api/manuel/music/current', async (req, res) => {
  try {
    await connectToDatabase();

    // 1. Try to get the latest PlaybackState
    const state = await PlaybackState.findOne()
      .sort({ serverTimestamp: -1 })
      .populate('currentSongId')
      .populate('queue')
      .populate('originalSongId');

    if (state && state.currentSongId) {
      const now = new Date();
      const elapsedSeconds = state.isPlaying 
        ? (now.getTime() - state.serverTimestamp.getTime()) / 1000 
        : 0;
      
      const currentTime = state.seekTime + elapsedSeconds;

      return res.status(200).json({
        currentSong: {
          _id: state.currentSongId._id,
          name: state.currentSongId.name,
          url: state.currentSongId.url,
          order: state.currentSongId.order
        },
        currentTime: Math.floor(currentTime),
        isPlaying: state.isPlaying,
        queue: state.queue || [],
        originalSongId: state.originalSongId?._id || null,
        isRepeating: state.isRepeating || false,
        isManaged: true
      });
    }

    // 2. Fallback to automatic sequence if no state exists
    const musicFiles = await Music.find({}).sort({ order: 1 });

    if (musicFiles.length === 0) {
      return res.status(200).json({ currentSong: null, currentTime: 0, isPlaying: false });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const elapsedMs = now.getTime() - startOfDay.getTime();
    const elapsedSeconds = elapsedMs / 1000;

    const songDuration = 180;
    const totalPlaylistDuration = musicFiles.length * songDuration;
    const positionInLoop = elapsedSeconds % totalPlaylistDuration;

    let accumulatedTime = 0;
    let currentSongIndex = 0;
    let currentSongTime = 0;

    for (let i = 0; i < musicFiles.length; i++) {
      if (positionInLoop < accumulatedTime + songDuration) {
        currentSongIndex = i;
        currentSongTime = positionInLoop - accumulatedTime;
        break;
      }
      accumulatedTime += songDuration;
    }

    const currentSong = musicFiles[currentSongIndex];

    res.status(200).json({
      currentSong: {
        _id: currentSong._id,
        name: currentSong.name,
        url: currentSong.url,
        order: currentSong.order
      },
      currentTime: Math.floor(currentSongTime),
      isPlaying: true,
      isManaged: false
    });
  } catch (error) {
    console.error('Error getting current music state:', error);
    res.status(500).json({ error: 'Failed to get current music state' });
  }
});

app.post('/api/manuel/music/current', async (req, res) => {
  try {
    await connectToDatabase();
    const { currentSongId, currentTime, isPlaying, queue, originalSongId, isRepeating } = req.body;

    if (!currentSongId) {
      return res.status(400).json({ error: 'currentSongId is required' });
    }

    // Update or create the singleton state
    let state = await PlaybackState.findOne();
    
    if (state) {
      state.currentSongId = currentSongId;
      state.seekTime = currentTime || 0;
      state.isPlaying = isPlaying !== undefined ? isPlaying : true;
      state.queue = queue || state.queue || [];
      state.originalSongId = originalSongId !== undefined ? (originalSongId || null) : state.originalSongId;
      state.isRepeating = isRepeating !== undefined ? isRepeating : state.isRepeating;
      state.serverTimestamp = new Date();
      await state.save();
    } else {
      state = new PlaybackState({
        currentSongId,
        seekTime: currentTime || 0,
        isPlaying: isPlaying !== undefined ? isPlaying : true,
        queue: queue || [],
        originalSongId: originalSongId || null,
        isRepeating: isRepeating || false,
        serverTimestamp: new Date()
      });
      await state.save();
    }

    // Return the updated state fully populated
    const populatedState = await PlaybackState.findById(state._id)
      .populate('currentSongId')
      .populate('queue')
      .populate('originalSongId');

    res.status(200).json(populatedState);
  } catch (error) {
    console.error('Error updating music state:', error);
    res.status(500).json({ error: 'Failed to update music state' });
  }
});

app.post('/api/manuel/music', upload.single('music'), async (req, res) => {
  try {
    await connectToDatabase();

    if (!req.file) {
      return res.status(400).json({ error: 'No music file provided' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'manuel-music');

    // Get the next order number
    const lastMusic = await Music.findOne().sort({ order: -1 });
    const nextOrder = lastMusic ? lastMusic.order + 1 : 1;

    const music = new Music({
      name: req.file.originalname,
      url: result.secure_url,
      order: nextOrder,
    });

    await music.save();
    res.status(201).json(music);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload music' });
  }
});

app.delete('/api/manuel/music/:id', async (req, res) => {
  try {
    await connectToDatabase();
    await Music.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Music deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete music' });
  }
});

app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kimberly's Coffee Corner ☕</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background: linear-gradient(135deg, #d4a574, #f5f5dc);
      color: #4b2e2a;
      text-align: center;
      padding: 50px;
      margin: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.8);
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    h1 {
      font-size: 3em;
      margin-bottom: 20px;
      color: #8b4513;
    }
    p {
      font-size: 1.2em;
      line-height: 1.6;
    }
    .coffee-icon {
      font-size: 4em;
      margin: 20px 0;
    }
    .heart {
      color: #ff69b4;
      font-size: 2em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to Kimberly's Coffee Corner ☕</h1>
    <div class="coffee-icon">🫖</div>
    <p>Enjoy a warm cup of memories and delightful moments. This backend is brewing something special just for you!</p>
    <p>Made with <span class="heart">♥</span> for Kimberly</p>
  </div>
</body>
</html>
  `;
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});