const Comment = require('../models/Comment');
const Ticket = require('../models/Ticket');
const { getAuth } = require('@clerk/express');
const { getRequester, canAccessTicket } = require('../utils/ticketAccess');

// ==========================================
// ADD A COMMENT (FR-08)
// ==========================================
const addComment = async (req, res) => {
  try {
    const auth = getAuth(req);
    const ticketId = req.params.id;
    const { content, isResolutionNote, visibility } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Comment content cannot be empty.' });
    }

    const ticket = await Ticket.findById(ticketId);
    const who = await getRequester(req);
    // A ticket the requester may not see is reported as not found, so its existence is not revealed.
    if (!ticket || !canAccessTicket(who, ticket)) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const userRole = who.role;
    const username = auth.sessionClaims?.username || 'Unknown';

    const newComment = new Comment({
      ticketId,
      authorId: auth.userId,
      authorName: username,
      authorRole: userRole,
      content: content.trim(),
      // Only technicians and admins can mark a comment as the resolution note
      isResolutionNote: userRole !== 'employee' && Boolean(isResolutionNote),
      // Employees can only post public comments
      // Technicians/admins can post internal notes
      visibility: userRole === 'employee' ? 'Public' : (visibility || 'Public')
    });

    const savedComment = await newComment.save();
    res.status(201).json(savedComment);

  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};

// ==========================================
// GET TICKET COMMENTS (FR-08)
// ==========================================
const getTicketComments = async (req, res) => {
  try {
    const ticketId = req.params.id;

    const ticket = await Ticket.findById(ticketId);
    const who = await getRequester(req);
    if (!ticket || !canAccessTicket(who, ticket)) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    let query = { ticketId };

    // Employees only see public comments
    if (who.role === 'employee') {
      query.visibility = 'Public';
    }

    const comments = await Comment.find(query).sort({ createdAt: 1 });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
  }
};

module.exports = { addComment, getTicketComments };