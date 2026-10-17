const express = require('express');
const router = express.Router();
const { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead } = require('../controllers/notificationController');

router.get('/', getUserNotifications);
router.get('/count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

module.exports = router;
