require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { startTicketMonitor } = require('./jobs/ticketMonitor');
const path = require('path');
const authorizeRole = require('./middleware/authMiddleware');
const { clerkMiddleware, getAuth } = require('@clerk/express');

const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Config route
app.get('/api/config', (req, res) => {
  res.json({ clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY });
});

// Auth guard middleware
const requireLogin = (req, res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    return res.status(401).json({ message: 'Access Denied: No Clerk Token Provided!' });
  }
  next();
};

// Pre-load routes
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const reportRoutes = require('./routes/reportRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const slaRoutes = require('./routes/slaRoutes');

// Routes
app.use('/api/users', (req, res, next) => requireLogin(req, res, next), userRoutes);
app.use('/api/tickets', (req, res, next) => requireLogin(req, res, next), ticketRoutes);
app.use('/api/reports', (req, res, next) => requireLogin(req, res, next), reportRoutes);
app.use('/api/technicians', (req, res, next) => requireLogin(req, res, next), technicianRoutes);
app.use('/api/notifications', (req, res, next) => requireLogin(req, res, next), notificationRoutes);
app.use('/api/uploads', (req, res, next) => requireLogin(req, res, next), uploadRoutes);
app.use('/api/admin', (req, res, next) => requireLogin(req, res, next), adminRoutes);
app.use('/api/sla', (req, res, next) => requireLogin(req, res, next), slaRoutes);

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'active', message: 'DeskShark API is running' });
});

// MongoDB + background jobs
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to DeskShark MongoDB');
    startTicketMonitor();
  })
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server initialized and running on port ${PORT}`);
});
