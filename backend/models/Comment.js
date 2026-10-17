const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true
  },
  authorId: {
    type: String, // Clerk userId (string, not ObjectId)
    required: true
  },
  authorName: {
    type: String,
    default: 'Unknown'
  },
  authorRole: {
    type: String,
    enum: ['employee', 'technician', 'admin'],
    default: 'employee'
  },
  content: {
    type: String,
    required: true
  },
  isResolutionNote: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['Public', 'Internal'],
    default: 'Public'
  }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
