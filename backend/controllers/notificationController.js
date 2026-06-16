const Notification = require('../models/Notification'); // Ensure this matches your exact filename
const mongoose = require('mongoose');

// ==========================================
// GET UNREAD NOTIFICATIONS FOR A USER
// ==========================================
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Searching by your schema's 'recipientId'
    const notifications = await Notification.find({ recipientId: userId, isRead: false }).sort({ createdAt: -1 });
    
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

// ==========================================
// MARK NOTIFICATION AS READ
// ==========================================
const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true } // Returns the updated document
    );

    if (!updatedNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json(updatedNotification);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification', error: error.message });
  }
};

// ==========================================
// CREATE A NOTIFICATION (For Testing/Internal Use)
// ==========================================
const createNotification = async (req, res) => {
  try {
    // Using recipientId and ticketId from your schema
    const { recipientId, message, type, ticketId } = req.body;

    const newNotification = new Notification({
      recipientId,
      message,
      type, // Must perfectly match your enum: 'Assignment', 'SLA_Warning', 'Escalation', 'Resolution'
      ticketId,
      isRead: false
    });

    const savedNotification = await newNotification.save();
    res.status(201).json(savedNotification);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create notification', error: error.message });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  createNotification
};