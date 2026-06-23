const express = require('express');
const router = express.Router();

const {
  createTicket,
  resolveTicket,
  getTickets,
  getAllTickets,
  getTicketById,
  updateTicketStatus
} = require('../controllers/ticketController');

const { addComment, getTicketComments } = require('../controllers/commentController');

// Employee: their own tickets
router.get('/', getTickets);
router.post('/', createTicket);

// Technician/Admin: all tickets
router.get('/all', getAllTickets);

// Single ticket
router.get('/:id', getTicketById);

// Actions
router.put('/:id/resolve', resolveTicket);
router.put('/:id/status', updateTicketStatus);   // NEW

// Comments
router.post('/:id/comments', addComment);
router.get('/:id/comments', getTicketComments);

module.exports = router;
