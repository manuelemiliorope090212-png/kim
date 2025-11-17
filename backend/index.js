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