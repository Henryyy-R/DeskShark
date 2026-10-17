const Notification = require('../models/Notification');

/**
 * Internal utility to create a notification.
 * Called by ticket controller and cron job — not an HTTP handler.
 */
const createNotification = async ({ recipientId, ticketId, type, message }) => {
  try {
    const notification = new Notification({
      recipientId,
      ticketId,
      type,
      message,
      isRead: false
    });
    await notification.save();
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
};

module.exports = { createNotification };
