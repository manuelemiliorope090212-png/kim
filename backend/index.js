const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const connectToDatabase = require('./lib/mongodb');
const { uploadToCloudinary } = require('./lib/cloudinary');
const Memory = require('./models/Memory');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});