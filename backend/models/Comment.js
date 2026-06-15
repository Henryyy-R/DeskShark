const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  ticketId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ticket', 
    required: true 
  },
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  },
  attachments: [{ 
    type: String 
  }] 
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);