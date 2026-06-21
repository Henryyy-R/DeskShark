require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { startTicketMonitor } = require('./jobs/ticketMonitor');
const startSLAMonitor = require('./cron/slaMonitor');
const path = require('path');

// 🔒 NEW: Import Clerk's security tools
const { clerkMiddleware, getAuth } = require('@clerk/express');

// Initialize Express
const app = express();

// Middleware
app.use(cors()); // Allows your Bootstrap frontend to communicate with this API
app.use(express.json()); // Automatically parses incoming JSON payloads

// 🔒 NEW: Activate Clerk to check ID badges for every incoming request
app.use(clerkMiddleware()); 

// 🛡️ CUSTOM SECURITY GUARD
// This stops the 404 redirect and properly sends a 401 error
const requireLogin = (req, res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    return res.status(401).json({ message: 'Access Denied: No Clerk Token Provided!' });
  }
  next(); // If they have a token, let them through!
};

// 👉 THE MISSING LINK: Connect the /api/tickets URL to your route file
// 🔒 NEW: Add requireAuth() to lock down these routes so ONLY logged-in users can access them
app.use('/api/tickets', requireLogin, require('./routes/ticketRoutes'));
app.use('/api/reports', requireLogin, require('./routes/reportRoutes'));
app.use('/api/technicians', requireLogin, require('./routes/technicianRoutes'));
app.use('/api/notifications', requireLogin, require('./routes/notificationRoutes'));
app.use('/api/uploads', requireLogin, require('./routes/uploadRoutes'));

// Note: We leave the static /uploads folder public so images can actually load on the screen!
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to DeskShark MongoDB');
    startTicketMonitor(); // <-- Boot the background worker
    startSLAMonitor();    // <-- Boot the SLA cron job
  })
  .catch((err) => console.log(err));

// Health Check Route (Left public so you can always check if the server is alive)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'active', message: 'DeskShark API is running' });
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server initialized and running on port ${PORT}`);
});