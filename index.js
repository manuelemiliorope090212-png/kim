const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const connectToDatabase = require('./backend/lib/mongodb');
const { uploadToCloudinary } = require('./backend/lib/cloudinary');
const Memory = require('./backend/models/Memory');
const ManuelNote = require('./backend/models/ManuelNote');
const Music = require('./backend/models/Music');
const PlaybackState = require('./backend/models/PlaybackState');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true, // Permitir todos los origins por ahora para debugging
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
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

app.put('/api/manuel/music/:id', async (req, res) => {
  try {
    await connectToDatabase();
    const { order } = req.body;
    await Music.findByIdAndUpdate(req.params.id, { order });
    res.status(200).json({ message: 'Music updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update music' });
  }
});

// Update current music state (for manual seeking)
app.post('/api/manuel/music/current', async (req, res) => {
  try {
    await connectToDatabase();
    const { currentSongId, currentTime, isPlaying } = req.body;

    // Update or create the singular playback state
    await PlaybackState.findOneAndUpdate(
      {}, // Empty filter means it will update the first document (we only ever want one)
      {
        currentSongId,
        seekTime: currentTime || 0,
        isPlaying: isPlaying !== undefined ? isPlaying : true,
        serverTimestamp: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Current music state updated' });
  } catch (error) {
    console.error('Error updating current music state:', error);
    res.status(500).json({ error: 'Failed to update current music state' });
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

// Current music state API
app.get('/api/manuel/music/current', async (req, res) => {
  try {
    await connectToDatabase();

    // Try to get the latest playback state
    const state = await PlaybackState.findOne({});
    const musicFiles = await Music.find({}).sort({ order: 1 });

    if (!state) {
      if (musicFiles.length === 0) {
        return res.status(200).json({ currentSong: null, currentTime: 0 });
      }

      // Fallback to UTC calculation if no state exists
      const now = new Date();
      const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const elapsedSeconds = (now.getTime() - startOfDay.getTime()) / 1000;
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
      return res.status(200).json({
        currentSong: {
          _id: currentSong._id,
          name: currentSong.name,
          url: currentSong.url,
          order: currentSong.order
        },
        currentTime: Math.floor(currentSongTime),
        totalSongs: musicFiles.length
      });
    }

    // Use stored state
    const currentSong = musicFiles.find(s => s._id.toString() === state.currentSongId.toString());
    
    if (!currentSong) {
      return res.status(200).json({ currentSong: null, currentTime: 0 });
    }

    // Calculate current time based on elapsed time since serverTimestamp
    let calculatedTime = state.seekTime;
    if (state.isPlaying) {
      const msSinceUpdate = new Date().getTime() - new Date(state.serverTimestamp).getTime();
      calculatedTime += msSinceUpdate / 1000;
    }

    res.status(200).json({
      currentSong: {
        _id: currentSong._id,
        name: currentSong.name,
        url: currentSong.url,
        order: currentSong.order
      },
      currentTime: Math.floor(calculatedTime),
      totalSongs: musicFiles.length,
      isPlaying: state.isPlaying
    });
  } catch (error) {
    console.error('Error getting current music state:', error);
    res.status(500).json({ error: 'Failed to get current music state' });
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