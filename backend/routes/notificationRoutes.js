const express = require('express');
const router = express.Router();

const { 
  getUserNotifications, 
  markAsRead,
  createNotification
} = require('../controllers/notificationController');

// --- Notification Routes ---

// GET /api/notifications/user/:userId - Fetch alerts for the bell icon
router.get('/user/:userId', getUserNotifications);

// PUT /api/notifications/:id/read - Clear the alert when clicked
router.put('/:id/read', markAsRead);

// POST /api/notifications - Create a manual alert (for Thunder Client testing)
router.post('/', createNotification);

module.exports = router;