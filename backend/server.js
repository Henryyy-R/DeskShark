require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialize Express
const app = express();

// Middleware
app.use(cors()); // Allows your Bootstrap frontend to communicate with this API
app.use(express.json()); // Automatically parses incoming JSON payloads

// 👉 THE MISSING LINK: Connect the /api/tickets URL to your route file
app.use('/api/tickets', require('./routes/ticketRoutes'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to DeskShark MongoDB');
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err.message);
  });

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'active', message: 'DeskShark API is running' });
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server initialized and running on port ${PORT}`);
});