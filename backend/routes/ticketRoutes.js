const express = require('express');
const router = express.Router();

// Import all functions from the ticket controller
const { 
  createTicket, 
  resolveTicket, 
  getTickets, 
  getTicketById 
} = require('../controllers/ticketController');

// Import the comment controller functions
const { addComment, getTicketComments } = require('../controllers/commentController'); // <-- NEW

// --- Standard Ticket Routes ---
router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketById);

// --- Specialized Action Routes ---
router.put('/:id/resolve', resolveTicket);

// --- Communication Layer Routes ---
router.post('/:id/comments', addComment);           // <-- NEW
router.get('/:id/comments', getTicketComments);     // <-- NEW

module.exports = router;