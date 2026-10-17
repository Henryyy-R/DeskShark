const Notification = require('../models/Notification');
const { getAuth } = require('@clerk/express');

// ==========================================
// GET NOTIFICATIONS (unread or all history)
// ==========================================
const getUserNotifications = async (req, res) => {
  try {
    const auth = getAuth(req);
    const showAll = req.query.all === 'true';

    const query = { recipientId: auth.userId };
    if (!showAll) query.isRead = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(showAll ? 50 : 20);

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

// ==========================================
// GET UNREAD COUNT
// ==========================================
const getUnreadCount = async (req, res) => {
  try {
    const auth = getAuth(req);
    const count = await Notification.countDocuments({
      recipientId: auth.userId,
      isRead: false
    });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get count', error: error.message });
  }
};

// ==========================================
// MARK ONE AS READ
// ==========================================
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as read', error: error.message });
  }
};

// ==========================================
// MARK ALL AS READ
// ==========================================
const markAllAsRead = async (req, res) => {
  try {
    const auth = getAuth(req);
    await Notification.updateMany(
      { recipientId: auth.userId, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all as read', error: error.message });
  }
};

module.exports = { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead };
