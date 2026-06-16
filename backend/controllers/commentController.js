const Comment = require('../models/Comment');
const Ticket = require('../models/Ticket');
const mongoose = require('mongoose');

// ==========================================
// ADD A COMMENT (FR-08)
// ==========================================
const addComment = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { content, isResolutionNote, visibility } = req.body;

    // TEMPORARY: Since Auth is bypassed, we generate a fake user ID for the author
    const mockAuthorId = new mongoose.Types.ObjectId();

    // 1. Verify the ticket actually exists
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // 2. Build and save the comment
    const newComment = new Comment({
      ticketId,
      authorId: mockAuthorId, // In the future: req.user._id
      content,
      isResolutionNote: isResolutionNote || false,
      visibility: visibility || 'Public'
    });

    const savedComment = await newComment.save();
    res.status(201).json(savedComment);

  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};

// ==========================================
// GET TICKET HISTORY / COMMENTS (FR-08)
// ==========================================
const getTicketComments = async (req, res) => {
  try {
    const ticketId = req.params.id;
    
    // Fetch comments and sort by oldest first to create a natural reading thread
    const comments = await Comment.find({ ticketId }).sort({ createdAt: 1 });
    
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
  }
};

module.exports = {
  addComment,
  getTicketComments
};