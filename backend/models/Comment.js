const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isResolutionNote: {
    type: Boolean,
    default: false // Flags if this comment is the official fix that closed the ticket
  },
  visibility: {
    type: String,
    enum: ['Public', 'Internal'], // Internal for technician-to-technician notes
    default: 'Public'
  }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);